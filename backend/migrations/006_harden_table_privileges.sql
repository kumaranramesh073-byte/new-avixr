-- ═══════════════════════════════════════════════════════════════════════════
-- Q-SIMUTRON / AVIXR — Migration 006: Database Least-Privilege Hardening
--
-- Purpose:
--   1. Fix excessive Supabase default table privileges (SELECT, INSERT, UPDATE,
--      DELETE, TRUNCATE, REFERENCES, TRIGGER) granted to `anon` and
--      `authenticated` across migrations 001-005.
--   2. Enforce strict least-privilege separation:
--      - `anon`: ZERO privileges on all sensitive public tables, sequences,
--        and helper/mutation functions.
--      - `authenticated`: ZERO privileges on server-only payment, quota,
--        webhook, OAuth, audit, and system tables (`free_simulation_usage`,
--        `free_simulation_ledger`, `payment_transactions`,
--        `payment_webhook_events`, `billing_subscriptions`, `oauth_integrations`,
--        etc.); strictly READ-ONLY (`SELECT` gated by existing RLS policies)
--        on authenticated user/org workspace tables. All mutations flow
--        exclusively through the authenticated Express backend (`service_role`).
--      - `service_role`: Retains full backend table/sequence/RPC privileges.
--   3. Lock down TRUNCATE (which bypasses PostgreSQL RLS), REFERENCES,
--      TRIGGER, INSERT, UPDATE, DELETE on all sensitive tables for `anon`
--      and `authenticated`.
--   4. Harden EXECUTE privileges on SECURITY DEFINER payment/quota/session RPCs
--      so ONLY `service_role` can call them.
--   5. Prevent future tables/sequences/functions in `public` from inheriting
--      excessive `anon` / `authenticated` default grants.
--
-- Safety & Compatibility:
--   - 100% additive/privilege-hardening and idempotent.
--   - Does NOT drop tables, drop columns, truncate data, delete rows, or
--     rewrite migrations 001-005.
--   - Wraps table/function targets in existence checks so missing optional
--     tables never abort execution.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ─── 1. Schema-Level Hardening ──────────────────────────────────────────────
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM anon;
REVOKE CREATE ON SCHEMA public FROM authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ─── 2. Tier 1: Server-Only Sensitive Tables (service_role ONLY) ───────────
-- Neither `anon` nor `authenticated` may SELECT, INSERT, UPDATE, DELETE,
-- TRUNCATE, REFERENCES, or TRIGGER these tables directly via PostgREST.
-- All authorized access goes through authenticated Express routes (service_role).
DO $$
DECLARE
    tbl text;
    server_only_tables text[] := ARRAY[
        'free_simulation_usage',
        'free_simulation_ledger',
        'payment_transactions',
        'payment_webhook_events',
        'billing_subscriptions',
        'oauth_integrations',
        'data_consent_audit_log',
        'privacy_deletion_logs',
        'agent_logs',
        'background_news_jobs',
        'notification_delivery_records',
        'legal_consent_records',
        'legal_consent_history',
        'llm_requests',
        'profiles',
        'company_info'
    ];
BEGIN
    FOREACH tbl IN ARRAY server_only_tables LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', tbl);
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', tbl);
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', tbl);
            EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', tbl);
        END IF;
    END LOOP;
END
$$;

-- ─── 3. Tier 2: RLS-Protected Domain Tables (Read-Only SELECT for authenticated)
-- `anon` gets ZERO privileges.
-- `authenticated` loses INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
-- and retains only `SELECT` constrained by existing RLS policies.
-- `service_role` retains full backend privileges.
DO $$
DECLARE
    tbl text;
    readonly_auth_tables text[] := ARRAY[
        'user_profiles',
        'organizations',
        'organization_memberships',
        'business_dna_profiles',
        'sessions',
        'simulation_steps',
        'simulations',
        'agent_outputs',
        'query_history',
        'intelligence_feeds',
        'news_articles',
        'agent_knowledge',
        'alerts_notifications',
        'notifications',
        'notification_preferences',
        'data_source_configs',
        'competitor_intelligence',
        'uploaded_files',
        'data_consent_preferences'
    ];
BEGIN
    FOREACH tbl IN ARRAY readonly_auth_tables LOOP
        IF to_regclass(format('public.%I', tbl)) IS NOT NULL THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC', tbl);
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', tbl);
            EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated', tbl);
            EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', tbl);
            EXECUTE format('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role', tbl);
        END IF;
    END LOOP;
END
$$;

-- ─── 4. Sequence Hardening in `public` ──────────────────────────────────────
DO $$
DECLARE
    seq record;
BEGIN
    FOR seq IN
        SELECT sequence_schema, sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM PUBLIC', seq.sequence_schema, seq.sequence_name);
        EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM anon', seq.sequence_schema, seq.sequence_name);
        EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE %I.%I FROM authenticated', seq.sequence_schema, seq.sequence_name);
        EXECUTE format('GRANT USAGE, SELECT, UPDATE ON SEQUENCE %I.%I TO service_role', seq.sequence_schema, seq.sequence_name);
    END LOOP;
END
$$;

-- ─── 5. Function / RPC EXECUTE Hardening ────────────────────────────────────
-- Payment, quota, and atomic session RPCs MUST be callable ONLY by `service_role`.
-- RLS helper predicates MUST NOT be callable by `PUBLIC` or `anon`.
DO $$
DECLARE
    fn record;
    service_only_rpcs text[] := ARRAY[
        'activate_paid_subscription_atomic',
        'reserve_free_simulation_slot',
        'complete_free_simulation_slot',
        'release_free_simulation_slot',
        'create_atomic_session_with_steps'
    ];
    rls_helper_rpcs text[] := ARRAY[
        'is_platform_admin',
        'is_org_member',
        'is_org_admin'
    ];
BEGIN
    FOR fn IN
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(service_only_rpcs)
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC', fn.proname, fn.args);
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon', fn.proname, fn.args);
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM authenticated', fn.proname, fn.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', fn.proname, fn.args);
    END LOOP;

    FOR fn IN
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = ANY(rls_helper_rpcs)
    LOOP
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC', fn.proname, fn.args);
        EXECUTE format('REVOKE ALL ON FUNCTION public.%I(%s) FROM anon', fn.proname, fn.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', fn.proname, fn.args);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', fn.proname, fn.args);
    END LOOP;
END
$$;

-- ─── 6. Private Storage Bucket Verification ─────────────────────────────────
-- Keep `customer-uploads` strictly private if storage schema exists.
DO $$
BEGIN
    IF to_regclass('storage.buckets') IS NOT NULL THEN
        UPDATE storage.buckets
        SET public = false
        WHERE id = 'customer-uploads' AND public IS DISTINCT FROM false;
    END IF;
END
$$;

-- ─── 7. Default Privilege Guard for Future Objects ──────────────────────────
-- Prevents newly created tables, sequences, or functions by `postgres` in
-- `public` from automatically granting INSERT/UPDATE/DELETE/TRUNCATE to
-- `anon` or `authenticated`.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'postgres') THEN
        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;
        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            GRANT ALL ON TABLES TO service_role;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated;
        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO service_role;

        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated;
        ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
            GRANT EXECUTE ON FUNCTIONS TO service_role;
    END IF;
END
$$;

COMMIT;
