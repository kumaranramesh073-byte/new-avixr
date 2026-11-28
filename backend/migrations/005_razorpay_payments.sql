-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 005: Razorpay LIVE Payment Hardening, Plan Constraints,
-- Atomic Subscription Fulfillment & Free 3-Simulation Limit Ledger
-- Idempotent, NON-DESTRUCTIVE, preserves existing tables and rows.
-- Review before executing in Supabase SQL Editor AFTER 001, 002, and 003.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Allow Basic & Plus plans alongside Free, Pro, Enterprise ───────────────
DO $$
DECLARE
    con RECORD;
BEGIN
    FOR con IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.billing_subscriptions'::regclass
          AND contype = 'c'
          AND (
              conname = 'billing_subscriptions_plan_check'
              OR pg_get_constraintdef(oid) ~* '\yplan\y'
          )
    LOOP
        EXECUTE format('ALTER TABLE public.billing_subscriptions DROP CONSTRAINT IF EXISTS %I', con.conname);
    END LOOP;

    ALTER TABLE public.billing_subscriptions
        ADD CONSTRAINT billing_subscriptions_plan_check
        CHECK (plan IN ('Free', 'Basic', 'Plus', 'Pro', 'Enterprise'));
END $$;

-- ── 2. Additive columns & unique indexes on public.payment_transactions ───────
ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS plan_code text,
    ADD COLUMN IF NOT EXISTS billing_cycle text,
    ADD COLUMN IF NOT EXISTS fulfilled_at timestamptz,
    ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_provider_order
    ON public.payment_transactions (provider, order_id)
    WHERE order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_provider_payment
    ON public.payment_transactions (provider, payment_id)
    WHERE payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_org_idempotency
    ON public.payment_transactions (organization_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_tx_org_user_created
    ON public.payment_transactions (organization_id, user_id, created_at DESC);

-- ── 3. Webhook event idempotency unique index ─────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_webhook_provider_event
    ON public.payment_webhook_events (provider, event_id)
    WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_webhook_created
    ON public.payment_webhook_events (created_at DESC);

-- ── 4. One active subscription record per organization ────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_sub_org
    ON public.billing_subscriptions (organization_id);

-- ── 5. Persistent Free-Tier Simulation Entitlement Counter & Ledger ───────────
-- Users can ONLY read their own counter; mutations happen strictly server-side
-- via service_role / SECURITY DEFINER functions (never writable by users directly).
CREATE TABLE IF NOT EXISTS public.free_simulation_usage (
    user_id uuid PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    completed_count integer NOT NULL DEFAULT 0 CHECK (completed_count >= 0),
    in_flight_count integer NOT NULL DEFAULT 0 CHECK (in_flight_count >= 0),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.free_simulation_ledger (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
    request_key text NOT NULL UNIQUE,
    source_endpoint text NOT NULL,
    status text NOT NULL CHECK (status IN ('in_flight', 'completed', 'released')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_free_sim_ledger_user_status
    ON public.free_simulation_ledger (user_id, status);

ALTER TABLE public.free_simulation_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.free_simulation_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS free_sim_usage_select_self ON public.free_simulation_usage;
CREATE POLICY free_sim_usage_select_self ON public.free_simulation_usage
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS free_sim_ledger_select_self ON public.free_simulation_ledger;
CREATE POLICY free_sim_ledger_select_self ON public.free_simulation_ledger
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

-- Non-destructive backfill of pre-existing simulations & EntitlementQuota logs
-- so existing Free users cannot regain extra free simulations after migration 005.
WITH sim_counts AS (
    SELECT user_id, organization_id, COUNT(*)::integer AS cnt
    FROM public.simulations
    WHERE user_id IS NOT NULL
    GROUP BY user_id, organization_id
),
quota_log_counts AS (
    SELECT user_id, organization_id, COUNT(*)::integer AS cnt
    FROM public.agent_logs
    WHERE user_id IS NOT NULL
      AND agent_type = 'EntitlementQuota'
      AND action = 'CompletedSimulation'
      AND status = 'success'
    GROUP BY user_id, organization_id
),
combined AS (
    SELECT
        COALESCE(s.user_id, q.user_id) AS user_id,
        COALESCE(s.organization_id, q.organization_id) AS organization_id,
        GREATEST(COALESCE(s.cnt, 0), COALESCE(q.cnt, 0)) AS total_cnt
    FROM sim_counts s
    FULL OUTER JOIN quota_log_counts q ON s.user_id = q.user_id
)
INSERT INTO public.free_simulation_usage (user_id, organization_id, completed_count, in_flight_count)
SELECT user_id, organization_id, MAX(total_cnt), 0
FROM combined
WHERE total_cnt > 0
GROUP BY user_id, organization_id
ON CONFLICT (user_id) DO UPDATE SET
    completed_count = GREATEST(public.free_simulation_usage.completed_count, EXCLUDED.completed_count),
    updated_at = now();

-- Atomic Free Simulation Slot Reservation (concurrency & retry safe)
CREATE OR REPLACE FUNCTION public.reserve_free_simulation_slot(
    p_user_id uuid,
    p_organization_id uuid,
    p_request_key text,
    p_source_endpoint text,
    p_max_free integer DEFAULT 3
)
RETURNS TABLE (
    allowed boolean,
    completed_count integer,
    in_flight_count integer,
    already_reserved boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usage public.free_simulation_usage%ROWTYPE;
    v_existing public.free_simulation_ledger%ROWTYPE;
BEGIN
    SELECT * INTO v_existing
    FROM public.free_simulation_ledger
    WHERE request_key = p_request_key;

    IF FOUND THEN
        SELECT * INTO v_usage FROM public.free_simulation_usage WHERE user_id = p_user_id;
        RETURN QUERY SELECT (v_existing.status IN ('in_flight', 'completed')),
            COALESCE(v_usage.completed_count, 0),
            COALESCE(v_usage.in_flight_count, 0),
            true;
        RETURN;
    END IF;

    INSERT INTO public.free_simulation_usage (user_id, organization_id, completed_count, in_flight_count)
    VALUES (p_user_id, p_organization_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_usage
    FROM public.free_simulation_usage
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF (v_usage.completed_count + v_usage.in_flight_count) >= p_max_free THEN
        RETURN QUERY SELECT false, v_usage.completed_count, v_usage.in_flight_count, false;
        RETURN;
    END IF;

    INSERT INTO public.free_simulation_ledger (user_id, organization_id, request_key, source_endpoint, status)
    VALUES (p_user_id, p_organization_id, p_request_key, p_source_endpoint, 'in_flight');

    UPDATE public.free_simulation_usage
    SET in_flight_count = in_flight_count + 1,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_usage;

    RETURN QUERY SELECT true, v_usage.completed_count, v_usage.in_flight_count, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_free_simulation_slot(
    p_user_id uuid,
    p_request_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ledger public.free_simulation_ledger%ROWTYPE;
BEGIN
    SELECT * INTO v_ledger
    FROM public.free_simulation_ledger
    WHERE request_key = p_request_key AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND OR v_ledger.status <> 'in_flight' THEN
        RETURN;
    END IF;

    UPDATE public.free_simulation_ledger
    SET status = 'completed', updated_at = now()
    WHERE id = v_ledger.id;

    UPDATE public.free_simulation_usage
    SET completed_count = completed_count + 1,
        in_flight_count = GREATEST(0, in_flight_count - 1),
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_free_simulation_slot(
    p_user_id uuid,
    p_request_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_ledger public.free_simulation_ledger%ROWTYPE;
BEGIN
    SELECT * INTO v_ledger
    FROM public.free_simulation_ledger
    WHERE request_key = p_request_key AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND OR v_ledger.status <> 'in_flight' THEN
        RETURN;
    END IF;

    UPDATE public.free_simulation_ledger
    SET status = 'released', updated_at = now()
    WHERE id = v_ledger.id;

    UPDATE public.free_simulation_usage
    SET in_flight_count = GREATEST(0, in_flight_count - 1),
        updated_at = now()
    WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_free_simulation_slot(uuid, uuid, text, text, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_free_simulation_slot(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_free_simulation_slot(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_free_simulation_slot(uuid, uuid, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_free_simulation_slot(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_free_simulation_slot(uuid, text) TO service_role;

-- ── 6. Atomic payment capture + subscription upgrade function (idempotent) ─────
CREATE OR REPLACE FUNCTION public.activate_paid_subscription_atomic(
    p_tx_id uuid,
    p_payment_id text,
    p_plan text,
    p_max_seats integer,
    p_monthly_token_quota bigint,
    p_period_days integer,
    p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    transaction_id uuid,
    transaction_status text,
    subscription_id uuid,
    already_fulfilled boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tx public.payment_transactions%ROWTYPE;
    v_sub_id uuid;
    v_now timestamptz := now();
    v_period_end timestamptz := v_now + make_interval(days => GREATEST(1, COALESCE(p_period_days, 30)));
BEGIN
    SELECT * INTO v_tx
    FROM public.payment_transactions
    WHERE id = p_tx_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment transaction % not found', p_tx_id;
    END IF;

    IF v_tx.status = 'captured' AND v_tx.fulfilled_at IS NOT NULL THEN
        RETURN QUERY SELECT v_tx.id, v_tx.status, v_tx.subscription_id, true;
        RETURN;
    END IF;

    IF v_tx.status IN ('refunded', 'failed') THEN
        RAISE EXCEPTION 'Cannot capture a terminal (%) transaction %', v_tx.status, p_tx_id;
    END IF;

    INSERT INTO public.billing_subscriptions (
        organization_id,
        plan,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        max_seats,
        monthly_token_quota,
        updated_at
    )
    VALUES (
        v_tx.organization_id,
        p_plan,
        'active',
        v_now,
        v_period_end,
        false,
        p_max_seats,
        p_monthly_token_quota,
        v_now
    )
    ON CONFLICT (organization_id) DO UPDATE SET
        plan = EXCLUDED.plan,
        status = 'active',
        current_period_start = v_now,
        current_period_end = v_period_end,
        cancel_at_period_end = false,
        max_seats = EXCLUDED.max_seats,
        monthly_token_quota = EXCLUDED.monthly_token_quota,
        updated_at = v_now
    RETURNING id INTO v_sub_id;

    UPDATE public.payment_transactions
    SET
        status = 'captured',
        payment_id = COALESCE(NULLIF(p_payment_id, ''), payment_id),
        subscription_id = v_sub_id,
        fulfilled_at = COALESCE(fulfilled_at, v_now),
        error_message = NULL,
        metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb),
        updated_at = v_now
    WHERE id = p_tx_id;

    RETURN QUERY SELECT p_tx_id, 'captured'::text, v_sub_id, false;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_paid_subscription_atomic(uuid, text, text, integer, bigint, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_paid_subscription_atomic(uuid, text, text, integer, bigint, integer, jsonb) TO service_role;
