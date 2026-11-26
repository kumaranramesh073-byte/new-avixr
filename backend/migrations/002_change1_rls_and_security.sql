-- ═══════════════════════════════════════════════════════════════════════════
-- AVIXR / Q-SIMUTRON — Change 1 Migration: Strict Row Level Security (RLS)
-- Enables RLS on all 29 tables and defines least-privilege policies.
-- Uses `TO authenticated` + `(select auth.uid())` + org helpers.
-- Never uses deprecated `auth.role()` or editable `user_metadata`.
-- Execute in Supabase SQL Editor AFTER 001_change1_schema_and_dna.sql.
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper: check if current authenticated user is a platform admin in user_profiles
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = (select auth.uid())
          AND up.role IN ('admin', 'superadmin')
    );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

-- ── Enable RLS on ALL 29 public tables ──────────────────────────────────────
ALTER TABLE public.agent_knowledge              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_outputs                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts_notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_news_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_dna_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_intelligence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_configs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intelligence_feeds           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consent_history        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_consent_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_requests                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_history                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_steps             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploaded_files               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles                ENABLE ROW LEVEL SECURITY;

-- ── 1. user_profiles (self read; self update WITHOUT role escalation; admin read) ──
DROP POLICY IF EXISTS "user_profiles_select_self_or_admin" ON public.user_profiles;
CREATE POLICY "user_profiles_select_self_or_admin" ON public.user_profiles
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = id OR public.is_platform_admin());

DROP POLICY IF EXISTS "user_profiles_update_self" ON public.user_profiles;
CREATE POLICY "user_profiles_update_self" ON public.user_profiles
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK (
        (select auth.uid()) = id
        AND role = (SELECT up.role FROM public.user_profiles up WHERE up.id = (select auth.uid()))
    );

-- ── 2. organizations & organization_memberships ─────────────────────────────
DROP POLICY IF EXISTS "organizations_select_member_or_admin" ON public.organizations;
CREATE POLICY "organizations_select_member_or_admin" ON public.organizations
    FOR SELECT TO authenticated
    USING (public.is_org_member(id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "org_memberships_select_self_or_org_admin" ON public.organization_memberships;
CREATE POLICY "org_memberships_select_self_or_org_admin" ON public.organization_memberships
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_org_admin(organization_id) OR public.is_platform_admin());

-- ── 3. business_dna_profiles (strictly owner/org-member isolated) ───────────
DROP POLICY IF EXISTS "dna_select_org_member" ON public.business_dna_profiles;
CREATE POLICY "dna_select_org_member" ON public.business_dna_profiles
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_org_admin(organization_id)
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "dna_insert_owner" ON public.business_dna_profiles;
CREATE POLICY "dna_insert_owner" ON public.business_dna_profiles
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id AND public.is_org_member(organization_id));

DROP POLICY IF EXISTS "dna_update_owner" ON public.business_dna_profiles;
CREATE POLICY "dna_update_owner" ON public.business_dna_profiles
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
    WITH CHECK ((select auth.uid()) = user_id AND public.is_org_member(organization_id));

-- ── 4. Sessions, Simulation Steps, Simulations, Agent Outputs, Query History, Intelligence Feeds ──
DROP POLICY IF EXISTS "sessions_select_owner_or_admin" ON public.sessions;
CREATE POLICY "sessions_select_owner_or_admin" ON public.sessions
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "simulation_steps_select_owner_or_admin" ON public.simulation_steps;
CREATE POLICY "simulation_steps_select_owner_or_admin" ON public.simulation_steps
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.sessions s
            WHERE s.id = simulation_steps.session_id
              AND s.user_id = (select auth.uid())
              AND public.is_org_member(s.organization_id)
        )
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "simulations_select_owner_or_admin" ON public.simulations;
CREATE POLICY "simulations_select_owner_or_admin" ON public.simulations
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "agent_outputs_select_owner_or_admin" ON public.agent_outputs;
CREATE POLICY "agent_outputs_select_owner_or_admin" ON public.agent_outputs
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "query_history_select_owner_or_admin" ON public.query_history;
CREATE POLICY "query_history_select_owner_or_admin" ON public.query_history
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "intelligence_feeds_select_owner_or_admin" ON public.intelligence_feeds;
CREATE POLICY "intelligence_feeds_select_owner_or_admin" ON public.intelligence_feeds
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

-- ── 5. Org-scoped workspace resources ───────────────────────────────────────
DROP POLICY IF EXISTS "alerts_select_org_member" ON public.alerts_notifications;
CREATE POLICY "alerts_select_org_member" ON public.alerts_notifications
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "competitor_intel_select_org_member" ON public.competitor_intelligence;
CREATE POLICY "competitor_intel_select_org_member" ON public.competitor_intelligence
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "data_source_configs_select_org_member" ON public.data_source_configs;
CREATE POLICY "data_source_configs_select_org_member" ON public.data_source_configs
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "uploaded_files_select_org_member" ON public.uploaded_files;
CREATE POLICY "uploaded_files_select_org_member" ON public.uploaded_files
    FOR SELECT TO authenticated
    USING (
        ((select auth.uid()) = user_id AND public.is_org_member(organization_id))
        OR public.is_platform_admin()
    );

-- ── 6. Notifications & Legal Consent (user-scoped; admin read) ──────────────
DROP POLICY IF EXISTS "notif_prefs_select_self" ON public.notification_preferences;
CREATE POLICY "notif_prefs_select_self" ON public.notification_preferences
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "notifications_select_self_or_admin" ON public.notifications;
CREATE POLICY "notifications_select_self_or_admin" ON public.notifications
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "notif_delivery_select_admin" ON public.notification_delivery_records;
CREATE POLICY "notif_delivery_select_admin" ON public.notification_delivery_records
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());

DROP POLICY IF EXISTS "legal_consent_select_self_or_admin" ON public.legal_consent_records;
CREATE POLICY "legal_consent_select_self_or_admin" ON public.legal_consent_records
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "legal_history_select_self_or_admin" ON public.legal_consent_history;
CREATE POLICY "legal_history_select_self_or_admin" ON public.legal_consent_history
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

-- ── 7. News, Knowledge, Logs & Admin Telemetry ──────────────────────────────
DROP POLICY IF EXISTS "news_articles_select_verified_or_admin" ON public.news_articles;
CREATE POLICY "news_articles_select_verified_or_admin" ON public.news_articles
    FOR SELECT TO authenticated
    USING (is_verified = true OR public.is_platform_admin());

DROP POLICY IF EXISTS "agent_knowledge_select_scoped" ON public.agent_knowledge;
CREATE POLICY "agent_knowledge_select_scoped" ON public.agent_knowledge
    FOR SELECT TO authenticated
    USING (
        (is_test = false AND (organization_id IS NULL OR public.is_org_member(organization_id)))
        OR public.is_platform_admin()
    );

DROP POLICY IF EXISTS "agent_logs_select_admin" ON public.agent_logs;
CREATE POLICY "agent_logs_select_admin" ON public.agent_logs
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());

DROP POLICY IF EXISTS "background_news_jobs_select_admin" ON public.background_news_jobs;
CREATE POLICY "background_news_jobs_select_admin" ON public.background_news_jobs
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());

DROP POLICY IF EXISTS "llm_requests_select_self_or_admin" ON public.llm_requests;
CREATE POLICY "llm_requests_select_self_or_admin" ON public.llm_requests
    FOR SELECT TO authenticated
    USING ((select auth.uid())::text = user_id OR public.is_platform_admin());

-- ── 8. Billing & Payment tables (locked down; org admin / platform admin read only) ──
DROP POLICY IF EXISTS "billing_subs_select_org_or_admin" ON public.billing_subscriptions;
CREATE POLICY "billing_subs_select_org_or_admin" ON public.billing_subscriptions
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_platform_admin());

DROP POLICY IF EXISTS "payment_tx_select_owner_or_admin" ON public.payment_transactions;
CREATE POLICY "payment_tx_select_owner_or_admin" ON public.payment_transactions
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

DROP POLICY IF EXISTS "payment_webhooks_select_admin" ON public.payment_webhook_events;
CREATE POLICY "payment_webhooks_select_admin" ON public.payment_webhook_events
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());

-- ── 9. Legacy duplicate tables (admin read only) ────────────────────────────
DROP POLICY IF EXISTS "profiles_legacy_select_self_or_admin" ON public.profiles;
CREATE POLICY "profiles_legacy_select_self_or_admin" ON public.profiles
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = id OR public.is_platform_admin());

DROP POLICY IF EXISTS "company_info_legacy_select_admin" ON public.company_info;
CREATE POLICY "company_info_legacy_select_admin" ON public.company_info
    FOR SELECT TO authenticated
    USING (public.is_platform_admin());
