/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Simulate Route
   POST /api/sessions/simulate-morning
   Orchestrates: Public Search → Bloomberg → BlackRock → Vanguard → Synthesis
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, type Request, type Response } from 'express';
import { parallelSearch } from '../engines/deepResearch/searchClient.js';
import { runBloombergAgent } from '../agents/bloombergAgent.js';
import { runBlackRockAgent } from '../agents/blackrockAgent.js';
import { runVanguardAgent } from '../agents/vanguardAgent.js';
import { runEcosystemAgent, type EcosystemOutput } from '../agents/ecosystemAgent.js';
import { supabaseAdmin } from '../middleware/auth.js';
import { config } from '../config.js';

export const simulateRouter = Router();

interface UserParams {
    industry: string;
    competitor: string;
    priority: string;
    companySize: string;
    geography: string;
    revenueRange: string;
    businessModel: string;
    growthStage: string;
    riskTolerance: string;
    timeHorizon: string;
    primaryThreat: string;
    companyName?: string;
    companyDescription?: string;
}

interface SimulationResponse {
    market_score: number;
    competitor_threat: number;
    volatility_index: number;
    bloomberg_output: {
        headline: string;
        threats: Array<{ signal: string; severity: string; timestamp: string }>;
        market_velocity: number;
    };
    blackrock_output: {
        rpn: number;
        risk_category: string;
        ripple_effects: string[];
        capital_recommendation: string;
    };
    vanguard_output: {
        stability_score: number;
        actions: Array<{ step: string; rationale: string; timeline: string }>;
        long_term_outlook: string;
    };
    mermaid_graph_code: string;
    ecosystem_output: EcosystemOutput;
    company_name: string;
    generated_at: string;
}

// POST /api/sessions/simulate-morning
simulateRouter.post('/simulate-morning', async (req: Request, res: Response) => {
    const { userParams } = req.body as { userParams?: UserParams };

    if (!userParams || !userParams.industry) {
        return res.status(400).json({ error: 'userParams with at least industry is required' });
    }

    console.log(`[Simulate] Morning briefing for: ${userParams.industry} / ${userParams.competitor}`);

    const startTime = Date.now();
    try {
        // ── Step 1: Gather public market data via Perplexity ──────────────────
        const companyTag = userParams.companyName ? `${userParams.companyName} ` : '';
        const searchQueries = [
            `${companyTag}${userParams.industry} market news competitor moves last 24 hours ${userParams.geography}`,
            `${userParams.primaryThreat} ${userParams.industry} industry impact 2025`,
            `${companyTag || userParams.competitor + ' type '}company strategy news funding suppliers ${userParams.industry}`,
        ];

        console.log('[Simulate] Step 1: Fetching public market intelligence...');
        let publicDataContext = '';
        try {
            const searchResults = await parallelSearch(searchQueries, `${userParams.industry} market intelligence`);
            publicDataContext = searchResults
                .filter(r => !r.error && r.content)
                .map(r => `[${r.query}]\n${r.content}`)
                .join('\n\n---\n\n');
        } catch (searchErr: any) {
            console.warn('[Simulate] Search failed, proceeding with LLM synthesis only:', searchErr.message);
            publicDataContext = '';
        }

        // ── Step 2: Bloomberg Agent ───────────────────────────────────────────
        console.log('[Simulate] Step 2: Running Bloomberg agent...');
        const bloombergOutput = await runBloombergAgent(publicDataContext, userParams as unknown as Record<string, string>);

        // ── Step 3: BlackRock Agent ───────────────────────────────────────────
        console.log('[Simulate] Step 3: Running BlackRock Aladdin agent...');
        const blackrockOutput = await runBlackRockAgent(
            publicDataContext,
            bloombergOutput,
            userParams as unknown as Record<string, string>
        );

        // ── Step 4: Vanguard Agent ────────────────────────────────────────────
        console.log('[Simulate] Step 4: Running Vanguard stability agent...');
        const vanguardOutput = await runVanguardAgent(
            bloombergOutput,
            blackrockOutput,
            userParams as unknown as Record<string, string>
        );

        // ── Step 5: Ecosystem map (sequential to stay under Groq TPM limit) ───
        console.log('[Simulate] Step 5: Running Ecosystem agent...');
        const ecosystemOutput = await runEcosystemAgent(publicDataContext, userParams as unknown as Record<string, string>);

        // ── Step 5: Synthesize composite scores ──────────────────────────────
        const competitor_threat = Math.round(
            (bloombergOutput.market_velocity * 0.5) +
            (blackrockOutput.rpn * 0.5)
        );
        const volatility_index = Math.min(100, Math.round(bloombergOutput.market_velocity * 0.7 + (100 - vanguardOutput.stability_score) * 0.3));
        const market_score = Math.max(0, Math.min(100, Math.round(
            ((100 - blackrockOutput.rpn) * 0.4) +
            (vanguardOutput.stability_score * 0.4) +
            ((100 - bloombergOutput.market_velocity) * 0.2)
        )));

        const response: SimulationResponse = {
            market_score,
            competitor_threat: Math.min(100, competitor_threat),
            volatility_index,
            bloomberg_output: {
                headline: bloombergOutput.headline,
                threats: bloombergOutput.threats,
                market_velocity: bloombergOutput.market_velocity,
            },
            blackrock_output: {
                rpn: blackrockOutput.rpn,
                risk_category: blackrockOutput.risk_category,
                ripple_effects: blackrockOutput.ripple_effects,
                capital_recommendation: blackrockOutput.capital_recommendation,
            },
            vanguard_output: {
                stability_score: vanguardOutput.stability_score,
                actions: vanguardOutput.actions,
                long_term_outlook: vanguardOutput.long_term_outlook,
            },
            mermaid_graph_code: blackrockOutput.mermaid_graph_code,
            ecosystem_output: ecosystemOutput,
            company_name: userParams.companyName || `${userParams.industry} Co.`,
            generated_at: new Date().toISOString(),
        };

        console.log(`[Simulate] Complete. Market score: ${market_score}, Competitor threat: ${competitor_threat}`);
        
        // Log the simulation to Supabase
        const latencyMs = Date.now() - startTime;
        const outputString = JSON.stringify(response);
        const estimatedCompletionTokens = Math.round(outputString.length / 4);
        const estimatedPromptTokens = 4000; // 4 agents * ~1000 tokens
        
        const userId = (req as any).userId || 'anonymous-id';
        const userEmail = (req as any).userEmail || 'anonymous@qsimutron.com';

        supabaseAdmin.from('llm_requests').insert({
            user_id: userId,
            user_email: userEmail,
            company: userParams.companyName || userParams.industry,
            plan: 'Enterprise',
            module: 'Morning Briefing Simulation',
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: estimatedPromptTokens,
            completion_tokens: estimatedCompletionTokens,
            cost_usd: (estimatedPromptTokens / 1_000_000 * 0.15) + (estimatedCompletionTokens / 1_000_000 * 0.60),
            latency_ms: latencyMs,
            status: 'success'
        }).then(({ error }) => {
            if (error) console.error('[SimulateRouter] Failed to log request to Supabase:', error.message);
        });

        return res.json(response);

    } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        const userId = (req as any).userId || 'anonymous-id';
        const userEmail = (req as any).userEmail || 'anonymous@qsimutron.com';

        supabaseAdmin.from('llm_requests').insert({
            user_id: userId,
            user_email: userEmail,
            company: userParams?.companyName || 'Unknown',
            plan: 'Enterprise',
            module: 'Morning Briefing Simulation',
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: 4000,
            completion_tokens: 0,
            cost_usd: 0,
            latency_ms: latencyMs,
            status: 'error'
        }).then(({ error }) => {
            if (error) console.error('[SimulateRouter] Failed to log error:', error.message);
        });

        console.error('[Simulate] Fatal error:', err.message);
        return res.status(500).json({ error: `Simulation failed: ${err.message}` });
    }
});
