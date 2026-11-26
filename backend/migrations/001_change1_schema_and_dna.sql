-- ═══════════════════════════════════════════════════════════════════════════
-- AVIXR / Q-SIMUTRON — Change 1 Migration: Schema Cleanup, DNA & News Validation
-- Safe, idempotent, NON-DESTRUCTIVE migration.
-- Preserves all existing tables, columns, and historical data.
-- Execute in Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Business DNA Profiles (canonical company & AI DNA table) ─────────────
ALTER TABLE public.business_dna_profiles
    ADD COLUMN IF NOT EXISTS annual_revenue   TEXT,
    ADD COLUMN IF NOT EXISTS risk_appetite    TEXT,
    ADD COLUMN IF NOT EXISTS primary_markets  TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS customer_type    TEXT,
    ADD COLUMN IF NOT EXISTS monthly_spend    TEXT,
    ADD COLUMN IF NOT EXISTS monthly_revenue  TEXT,
    ADD COLUMN IF NOT EXISTS burn_rate        NUMERIC,
    ADD COLUMN IF NOT EXISTS growth_rate      NUMERIC,
    ADD COLUMN IF NOT EXISTS ai_priority      TEXT,
    ADD COLUMN IF NOT EXISTS user_role        TEXT;

-- Safely deactivate older duplicate active DNA rows (keeps only newest active per org+user)
WITH ranked_dna AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY organization_id, user_id
               ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id DESC
           ) AS rn
    FROM public.business_dna_profiles
    WHERE is_active = true
      AND organization_id IS NOT NULL
      AND user_id IS NOT NULL
)
UPDATE public.business_dna_profiles b
SET is_active = false,
    updated_at = now()
FROM ranked_dna r
WHERE b.id = r.id
  AND r.rn > 1;

-- Enforce at most ONE active DNA profile per (organization_id, user_id)
CREATE UNIQUE INDEX IF NOT EXISTS uq_business_dna_active_org_user
    ON public.business_dna_profiles (organization_id, user_id)
    WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_business_dna_org_user
    ON public.business_dna_profiles (organization_id, user_id);

-- ── 2. Sessions & Simulation Steps ──────────────────────────────────────────
ALTER TABLE public.sessions
    ALTER COLUMN current_step SET DEFAULT -1;

CREATE INDEX IF NOT EXISTS idx_sessions_org_user_created
    ON public.sessions (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_simulation_steps_session_order
    ON public.simulation_steps (session_id, step_order);

-- ── 3. Simulations (explicitly distinguish simulated data from live feeds) ──
ALTER TABLE public.simulations
    ADD COLUMN IF NOT EXISTS is_simulated        BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS data_classification TEXT    NOT NULL DEFAULT 'AI_SIMULATION';

CREATE INDEX IF NOT EXISTS idx_simulations_org_user_created
    ON public.simulations (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_outputs_org_session
    ON public.agent_outputs (organization_id, session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_history_org_user_created
    ON public.query_history (organization_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intelligence_feeds_org_user_created
    ON public.intelligence_feeds (organization_id, user_id, created_at DESC);

-- ── 4. LLM Requests (org-scoped telemetry) ──────────────────────────────────
ALTER TABLE public.llm_requests
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

CREATE INDEX IF NOT EXISTS idx_llm_requests_org_created
    ON public.llm_requests (organization_id, created_at DESC);

-- ── 5. News Articles (URL & source verification, no silent fake news) ───────
ALTER TABLE public.news_articles
    ADD COLUMN IF NOT EXISTS verification_status TEXT    NOT NULL DEFAULT 'unverified',
    ADD COLUMN IF NOT EXISTS source_domain       TEXT,
    ADD COLUMN IF NOT EXISTS is_verified         BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_duplicate        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS validation_notes    TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_news_articles_verification_status'
    ) THEN
        ALTER TABLE public.news_articles
            ADD CONSTRAINT chk_news_articles_verification_status
            CHECK (verification_status IN ('verified', 'unverified', 'rejected', 'ai_summary'));
    END IF;
END $$;

-- Non-destructively flag existing duplicate url_hash rows BEFORE creating unique index
-- so pre-existing duplicates never fail migration and zero rows are deleted automatically.
WITH ranked_news AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY url_hash
               ORDER BY published_at DESC NULLS LAST, retrieved_at DESC NULLS LAST, id ASC
           ) AS rn
    FROM public.news_articles
    WHERE url_hash IS NOT NULL
)
UPDATE public.news_articles n
SET is_duplicate = true,
    is_verified = false,
    verification_status = CASE
        WHEN n.verification_status = 'rejected' THEN 'rejected'
        ELSE 'unverified'
    END,
    validation_notes = COALESCE(NULLIF(n.validation_notes, ''), 'Flagged non-destructively as duplicate url_hash during migration')
FROM ranked_news r
WHERE n.id = r.id
  AND r.rn > 1;

-- Enforce unique url_hash for all non-duplicate rows going forward
CREATE UNIQUE INDEX IF NOT EXISTS uq_news_articles_url_hash
    ON public.news_articles (url_hash)
    WHERE is_duplicate = false AND url_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_news_articles_verified_published
    ON public.news_articles (verification_status, published_at DESC);

-- Non-destructively flag known placeholder/fabricated example.com rows as rejected
UPDATE public.news_articles
SET verification_status = 'rejected',
    is_verified = false,
    source_domain = COALESCE(source_domain, substring(url from '^[a-zA-Z]+://([^/]+)')),
    validation_notes = 'Rejected: placeholder/fabricated domain (example.com)'
WHERE url ~* '^https?://([^/]+\.)?example\.(com|org|net)(/|$)'
  AND verification_status <> 'rejected';

-- Populate source_domain for existing rows where missing
UPDATE public.news_articles
SET source_domain = substring(url from '^[a-zA-Z]+://([^/:]+)')
WHERE source_domain IS NULL
  AND url ~* '^https?://';

-- ── 6. Agent Knowledge & Logs (tenant scoping + test flag) ──────────────────
ALTER TABLE public.agent_knowledge
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
    ADD COLUMN IF NOT EXISTS is_test         BOOLEAN NOT NULL DEFAULT false;

UPDATE public.agent_knowledge
SET is_test = true
WHERE source = 'security_test_harness'
  AND is_test = false;

ALTER TABLE public.agent_logs
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
    ADD COLUMN IF NOT EXISTS user_id         UUID,
    ADD COLUMN IF NOT EXISTS session_id      UUID REFERENCES public.sessions(id),
    ADD COLUMN IF NOT EXISTS metadata        JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ── 7. User Profiles (canonical role & org binding) ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_default_org
    ON public.user_profiles (default_organization_id);

CREATE INDEX IF NOT EXISTS idx_org_memberships_user_org
    ON public.organization_memberships (user_id, organization_id);

-- Documentation comments for canonical vs legacy duplicate tables
COMMENT ON TABLE public.business_dna_profiles IS 'Canonical AI Agent Business DNA & company profile table (replaces legacy company_info).';
COMMENT ON TABLE public.company_info IS 'LEGACY DUPLICATE of business_dna_profiles. Retained read-only pending explicit approval to deprecate.';
COMMENT ON TABLE public.user_profiles IS 'Canonical user profile, platform role, and default organization table (replaces legacy profiles).';
COMMENT ON TABLE public.profiles IS 'LEGACY DUPLICATE of user_profiles. Retained read-only pending explicit approval to deprecate.';
