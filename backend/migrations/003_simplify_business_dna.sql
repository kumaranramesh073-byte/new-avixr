-- ═══════════════════════════════════════════════════════════════════════════
-- AVIXR / Q-SIMUTRON — Simplify business_dna_profiles (Minimal AI-Relevant DNA)
-- Non-destructive to rows/records: drops only redundant/unnecessary columns
-- while preserving id, organization_id, user_id, company_name, company_website,
-- company_description, industry, team_size, goals, is_active, created_at, updated_at.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.business_dna_profiles
    DROP COLUMN IF EXISTS metadata,
    DROP COLUMN IF EXISTS annual_revenue,
    DROP COLUMN IF EXISTS risk_appetite,
    DROP COLUMN IF EXISTS primary_markets,
    DROP COLUMN IF EXISTS customer_type,
    DROP COLUMN IF EXISTS monthly_spend,
    DROP COLUMN IF EXISTS monthly_revenue,
    DROP COLUMN IF EXISTS burn_rate,
    DROP COLUMN IF EXISTS growth_rate,
    DROP COLUMN IF EXISTS ai_priority,
    DROP COLUMN IF EXISTS user_role;

COMMENT ON TABLE public.business_dna_profiles IS 'Minimal canonical Business DNA table: id, organization_id, user_id, company_name, company_website, company_description, industry, team_size, goals, is_active, created_at, updated_at.';

-- Ensure agent_logs.session_id sets NULL cleanly when a session is deleted
ALTER TABLE public.agent_logs
    DROP CONSTRAINT IF EXISTS agent_logs_session_id_fkey;
ALTER TABLE public.agent_logs
    ADD CONSTRAINT agent_logs_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
