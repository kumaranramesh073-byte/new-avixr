/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Module Intelligence Route
   POST /api/modules/:module/run   → hydrates Business DNA from Supabase, runs
   the module agent, persists output to agent_outputs, and logs telemetry.
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
import {
    loadActiveBusinessDNA,
    dnaToUserParams,
    getOrganizationPlan,
    logAgentActivity,
    saveAgentOutput,
} from '../services/userContext.js';

export const modulesRouter = Router();

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

    const userId = req.userId!;
    const organizationId = req.organizationId!;
    const userEmail = req.userEmail || 'unknown@qsimutron.com';

    const bodyParams = (req.body as { userParams?: Record<string, string> })?.userParams ?? {};
    const persistedDNA = await loadActiveBusinessDNA(userId, organizationId).catch(() => null);
    const mergedParams = dnaToUserParams(persistedDNA, bodyParams);

    if (!mergedParams.industry) {
        return res.status(400).json({ error: 'Business DNA or userParams.industry is required' });
    }

    const startTime = Date.now();
    const orgPlan = await getOrganizationPlan(organizationId);

    try {
        const output = await runModuleAgent(persona, mergedParams);
        const latencyMs = Date.now() - startTime;

        const outputString = JSON.stringify(output);
        const estimatedCompletionTokens = Math.round(outputString.length / 4);
        const estimatedPromptTokens = 1200;

        await saveAgentOutput({
            organizationId,
            userId,
            agentName: persona.title,
            moduleName: persona.module,
            query: `${persona.title} for ${mergedParams.companyName || mergedParams.industry}`,
            outputData: output as unknown as Record<string, unknown>,
            kpis: output.kpis,
            confidenceScore: output.confidence?.overall ?? null,
            executionTimeMs: latencyMs,
        });

        await logAgentActivity({
            agentType: persona.title,
            action: 'RunModule',
            status: 'success',
            organizationId,
            userId,
        });

        const llmRow: Record<string, unknown> = {
            user_id: userId,
            user_email: userEmail,
            company: mergedParams.companyName || mergedParams.industry || 'Unknown',
            plan: orgPlan,
            module: persona.title,
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: estimatedPromptTokens,
            completion_tokens: estimatedCompletionTokens,
            cost_usd: (estimatedPromptTokens / 1_000_000 * 0.15) + (estimatedCompletionTokens / 1_000_000 * 0.60),
            latency_ms: latencyMs,
            status: 'success',
        };

        const { error: logErr } = await supabaseAdmin.from('llm_requests').insert({
            ...llmRow,
            organization_id: organizationId,
        });
        if (logErr && (logErr.code === 'PGRST204' || /column .* does not exist/i.test(logErr.message))) {
            await supabaseAdmin.from('llm_requests').insert(llmRow);
        }

        return res.json({
            ...output,
            is_simulated: true,
            data_classification: output.grounded ? 'GROUNDED_AI_ANALYSIS' : 'AI_SIMULATION',
        });
    } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        await logAgentActivity({
            agentType: persona.title,
            action: 'RunModule',
            status: 'error',
            organizationId,
            userId,
        });

        await supabaseAdmin.from('llm_requests').insert({
            organization_id: organizationId,
            user_id: userId,
            user_email: userEmail,
            company: mergedParams.companyName || 'Unknown',
            plan: orgPlan,
            module: persona.title,
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: 1200,
            completion_tokens: 0,
            cost_usd: 0,
            latency_ms: latencyMs,
            status: 'error',
        });

        console.error(`[Module:${req.params.module}] Fatal:`, err.message);
        return res.status(500).json({ error: `Module run failed: ${err.message}` });
    }
});
