-- ═══════════════════════════════════════════════════════════════════════════
-- Q-SIMUTRON: Supabase Monitoring Table Schema
-- Execute this SQL in your Supabase SQL Editor.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.llm_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
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
    status TEXT NOT NULL DEFAULT 'success' -- 'success', 'rate-limited', 'error'
);

-- Add indexes for fast aggregation and filtering
CREATE INDEX IF NOT EXISTS idx_llm_requests_created_at ON public.llm_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_requests_user_id ON public.llm_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_provider ON public.llm_requests(provider);

-- Enable RLS (Row Level Security) and allow backend to bypass it (since we use Service Role Key)
ALTER TABLE public.llm_requests ENABLE ROW LEVEL SECURITY;

-- Optional: Create a policy so authenticated users can only view their own requests if using client-side supabase directly.
-- (Since we're using the backend service key, this isn't strictly necessary for the backdoor to work, but it's good practice).
CREATE POLICY "Users can view their own requests" ON public.llm_requests
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id);
