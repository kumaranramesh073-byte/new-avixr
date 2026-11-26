-- ═══════════════════════════════════════════════════════════════════════════
-- AVIXR / Q-SIMUTRON — Strictly Minimal business_dna_profiles Migration
-- Preserves all existing rows; removes redundant columns and redundant
-- organization_id ownership key.
-- Keeps ONLY:
--   - id (single record primary key)
--   - user_id (required for Supabase Auth/RLS per-user ownership isolation)
--   - 6 essential AI business fields: company_name, company_website,
--     company_description, industry, team_size, goals
--   - unavoidable system fields: is_active, created_at, updated_at
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Drop policies & indexes that reference organization_id before removing column
DROP POLICY IF EXISTS "dna_select_org_member" ON public.business_dna_profiles;
DROP POLICY IF EXISTS "dna_insert_owner" ON public.business_dna_profiles;
DROP POLICY IF EXISTS "dna_update_owner" ON public.business_dna_profiles;

DROP INDEX IF EXISTS public.uq_business_dna_active_org_user;
DROP INDEX IF EXISTS public.idx_business_dna_org_user;
DROP INDEX IF EXISTS public.idx_business_dna_org;

-- 2. Deduplicate active rows by user_id before enforcing 1 active row per user
WITH ranked_dna AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id
               ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM public.business_dna_profiles
    WHERE is_active = true
      AND user_id IS NOT NULL
)
UPDATE public.business_dna_profiles b
SET is_active = false,
    updated_at = now()
FROM ranked_dna r
WHERE b.id = r.id
  AND r.rn > 1;

-- 3. Drop redundant ownership & non-essential business columns (preserves all rows)
ALTER TABLE public.business_dna_profiles
    DROP CONSTRAINT IF EXISTS business_dna_profiles_organization_id_fkey,
    DROP COLUMN IF EXISTS organization_id,
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

-- 4. Enforce at most 1 active DNA profile per user_id
CREATE UNIQUE INDEX IF NOT EXISTS uq_business_dna_active_user
    ON public.business_dna_profiles (user_id)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_business_dna_user
    ON public.business_dna_profiles (user_id);

-- 5. Recreate minimal least-privilege RLS policies using user_id
DROP POLICY IF EXISTS "dna_select_owner_or_admin" ON public.business_dna_profiles;
CREATE POLICY "dna_select_owner_or_admin" ON public.business_dna_profiles
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id OR public.is_platform_admin());

CREATE POLICY "dna_insert_owner" ON public.business_dna_profiles
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "dna_update_owner" ON public.business_dna_profiles
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

COMMENT ON TABLE public.business_dna_profiles IS 'Strictly minimal Business DNA table: id, user_id (auth/RLS), company_name, company_website, company_description, industry, team_size, goals, is_active, created_at, updated_at.';

-- 6. Ensure agent_logs.session_id sets NULL cleanly when a session is deleted
ALTER TABLE public.agent_logs
    DROP CONSTRAINT IF EXISTS agent_logs_session_id_fkey;
ALTER TABLE public.agent_logs
    ADD CONSTRAINT agent_logs_session_id_fkey
    FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
