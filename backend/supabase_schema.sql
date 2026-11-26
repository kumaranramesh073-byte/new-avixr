-- ═══════════════════════════════════════════════════════════════════════════
-- Q-SIMUTRON / AVIXR — Canonical Supabase Schema Reference
-- See backend/migrations/001_change1_schema_and_dna.sql
-- and backend/migrations/002_change1_rls_and_security.sql
-- for idempotent live migrations & strict RLS policies.
-- ═══════════════════════════════════════════════════════════════════════════

-- Core canonical tables used by Change 1:
--   - public.user_profiles (id, email, full_name, role, default_organization_id)
--   - public.organizations (id, name, slug)
--   - public.organization_memberships (id, organization_id, user_id, role)
--   - public.business_dna_profiles (minimal AI-relevant DNA: id, organization_id, user_id, company_name, company_website, company_description, industry, team_size, goals, is_active, created_at, updated_at)
--   - public.sessions & public.simulation_steps
--   - public.simulations (is_simulated, data_classification)
--   - public.agent_outputs & public.agent_logs & public.query_history
--   - public.intelligence_feeds
--   - public.news_articles (verification_status, source_domain, is_verified, url_hash)
--   - public.data_source_configs
--   - public.notifications & public.alerts_notifications
--   - public.llm_requests (with organization_id)

CREATE TABLE IF NOT EXISTS public.llm_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    organization_id UUID REFERENCES public.organizations(id),
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    company TEXT,
    plan TEXT DEFAULT 'Free',
    module TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10, 6) NOT NULL DEFAULT 0.0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success'
);

CREATE INDEX IF NOT EXISTS idx_llm_requests_created_at ON public.llm_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_requests_user_id ON public.llm_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_provider ON public.llm_requests(provider);
CREATE INDEX IF NOT EXISTS idx_llm_requests_org_created ON public.llm_requests(organization_id, created_at DESC);

ALTER TABLE public.llm_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own requests" ON public.llm_requests;
CREATE POLICY "llm_requests_select_self_or_admin" ON public.llm_requests
    FOR SELECT
    TO authenticated
    USING ((select auth.uid())::text = user_id OR public.is_platform_admin());
