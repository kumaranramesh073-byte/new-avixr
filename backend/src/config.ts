/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron Platform — Backend Config
   Loads and validates all environment variables.
   ═══════════════════════════════════════════════════════════════════════════ */

import 'dotenv/config';

// ── LLM provider resolution ────────────────────────────────────────────────
// Priority: explicit LLM_API_KEY (OpenRouter) > HF_TOKEN > GROQ_API_KEY
const explicitApiKey = process.env.LLM_API_KEY || '';
const hfToken = process.env.HF_TOKEN || '';
const groqApiKey = process.env.GROQ_API_KEY || '';

// sk-or- prefix means OpenRouter key — no need to set LLM_BASE_URL manually
const isOpenRouterKey = explicitApiKey.startsWith('sk-or-');
const llmBaseUrl = process.env.LLM_BASE_URL ||
    (isOpenRouterKey ? 'https://openrouter.ai/api/v1' : 'https://api.groq.com/openai/v1');
const isOpenRouter = isOpenRouterKey || llmBaseUrl.includes('openrouter.ai');
const useHF = !isOpenRouter && !explicitApiKey && !!hfToken;

const llmApiKey = explicitApiKey || (useHF ? hfToken : groqApiKey);
const llmProvider: 'openrouter' | 'huggingface' | 'groq' = isOpenRouter
    ? 'openrouter'
    : useHF ? 'huggingface' : 'groq';

const defaultModel = isOpenRouter
    ? 'openai/gpt-oss-120b'
    : useHF ? 'meta-llama/Llama-3.3-70B-Instruct:groq' : 'llama-3.3-70b-versatile';

// Comma-separated list of allowed front-end origins (in addition to any *.vercel.app)
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5100')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export const config = {
    port: parseInt(process.env.PORT || '3100', 10),
    corsOrigin: corsOrigins[0],
    corsOrigins,
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    // LLM
    llmProvider,
    llmBaseUrl,
    llmApiKey,
    model: process.env.LLM_MODEL || defaultModel,
    groqApiKey,
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    perplexityApiKey: process.env.PERPLEXITY_API_KEY || '',
    // Grounding search providers (primary → fallback chain)
    tavilyApiKey: process.env.TAVILY_API_KEY || '',
    xaiApiKey: process.env.XAI_API_KEY || '',
} as const;

if (!config.llmApiKey) {
    console.warn('⚠️  No LLM credential set (LLM_API_KEY / HF_TOKEN / GROQ_API_KEY) — LLM calls will fail.');
} else {
    console.log(`🧠 LLM provider: ${config.llmProvider} · ${config.model} · ${config.llmBaseUrl}`);
}
if (!config.openRouterApiKey) {
    console.warn('⚠️  OPENROUTER_API_KEY is not set — Q-Simutron deep research will fail.');
}
if (!config.perplexityApiKey) {
    console.warn('⚠️  PERPLEXITY_API_KEY is not set — Q-Simutron web search will fail.');
}
