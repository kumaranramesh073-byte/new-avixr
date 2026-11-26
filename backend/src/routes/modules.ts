/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Module Intelligence Route
   POST /api/modules/:module/run   → runs the generic module agent for any
   registered persona and returns the Standard Module Intelligence schema.
   New modules are added by dropping a persona into the registry below.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, type Request, type Response } from 'express';
import { runModuleAgent, type ModulePersona } from '../agents/moduleAgent.js';
import { forecastingPersona } from '../agents/personas/forecasting.js';
import { riskPersona } from '../agents/personas/risk.js';
import { marketPersona } from '../agents/personas/market.js';
import { financePersona } from '../agents/personas/finance.js';
import { sentimentPersona } from '../agents/personas/sentiment.js';
import { competitorPersona } from '../agents/personas/competitor.js';
import { twinPersona } from '../agents/personas/twin.js';
import { advisorPersona } from '../agents/personas/advisor.js';
import { supabaseAdmin } from '../middleware/auth.js';
import { config } from '../config.js';

export const modulesRouter = Router();

// ── Persona registry — add new modules here ────────────────────────────────
const REGISTRY: Record<string, ModulePersona> = {
    forecasting: forecastingPersona,
    risk: riskPersona,
    market: marketPersona,
    finance: financePersona,
    sentiment: sentimentPersona,
    competitor: competitorPersona,
    twin: twinPersona,
    advisor: advisorPersona,
};

modulesRouter.get('/', (_req, res) => {
    res.json({ modules: Object.keys(REGISTRY) });
});

modulesRouter.post('/:module/run', async (req: Request, res: Response) => {
    const persona = REGISTRY[req.params.module];
    if (!persona) {
        return res.status(404).json({ error: `Unknown module '${req.params.module}'` });
    }
    const { userParams } = req.body as { userParams?: Record<string, string> };
    if (!userParams || !userParams.industry) {
        return res.status(400).json({ error: 'userParams with at least industry is required' });
    }
    
    const startTime = Date.now();
    try {
        const output = await runModuleAgent(persona, userParams);
        const latencyMs = Date.now() - startTime;

        // Estimate tokens (roughly 1 token per 4 characters of the output + some fixed for prompt)
        const outputString = JSON.stringify(output);
        const estimatedCompletionTokens = Math.round(outputString.length / 4);
        const estimatedPromptTokens = 1200; // Average prompt length across our personas
        
        // Fire-and-forget logging to Supabase
        // req.userId and req.userEmail are populated by the requireAuth middleware
        const userId = (req as any).userId || 'anonymous-id';
        const userEmail = (req as any).userEmail || 'anonymous@qsimutron.com';
        
        supabaseAdmin.from('llm_requests').insert({
            user_id: userId,
            user_email: userEmail,
            company: userParams.companyName || 'Unknown',
            plan: 'Pro', // placeholder
            module: persona.title,
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: estimatedPromptTokens,
            completion_tokens: estimatedCompletionTokens,
            cost_usd: (estimatedPromptTokens / 1_000_000 * 0.15) + (estimatedCompletionTokens / 1_000_000 * 0.60),
            latency_ms: latencyMs,
            status: 'success'
        }).then(({ error }) => {
            if (error) console.error('[ModulesRouter] Failed to log request to Supabase:', error.message);
        });

        return res.json(output);
    } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        
        const userId = (req as any).userId || 'anonymous-id';
        const userEmail = (req as any).userEmail || 'anonymous@qsimutron.com';

        // Log the failure to Supabase
        supabaseAdmin.from('llm_requests').insert({
            user_id: userId,
            user_email: userEmail,
            company: userParams.companyName || 'Unknown',
            plan: 'Pro',
            module: persona.title,
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: 1200,
            completion_tokens: 0,
            cost_usd: 0,
            latency_ms: latencyMs,
            status: 'error'
        }).then(({ error }) => {
            if (error) console.error('[ModulesRouter] Failed to log error:', error.message);
        });
        
        console.error(`[Module:${req.params.module}] Fatal:`, err.message);
        return res.status(500).json({ error: `Module run failed: ${err.message}` });
    }
});
