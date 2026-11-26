/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON OCT — Simulate Route
   POST /api/sessions/simulate-morning
   Orchestrates: Public Search → Bloomberg → BlackRock → Vanguard → Ecosystem
   Hydrates persisted Business DNA & persists simulation results to Supabase.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, type Request, type Response } from 'express';
import { parallelSearch } from '../engines/deepResearch/searchClient.js';
import { runBloombergAgent } from '../agents/bloombergAgent.js';
import { runBlackRockAgent } from '../agents/blackrockAgent.js';
import { runVanguardAgent } from '../agents/vanguardAgent.js';
import { runEcosystemAgent, type EcosystemOutput } from '../agents/ecosystemAgent.js';
import { supabaseAdmin } from '../middleware/auth.js';
import { config } from '../config.js';
import {
    loadActiveBusinessDNA,
    dnaToUserParams,
    getOrganizationPlan,
    logAgentActivity,
} from '../services/userContext.js';

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
    simulation_id?: string;
    is_simulated: true;
    data_classification: 'AI_SIMULATION';
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
    const userId = req.userId!;
    const organizationId = req.organizationId!;
    const userEmail = req.userEmail || 'unknown@qsimutron.com';

    const rawBodyParams = (req.body as { userParams?: Partial<UserParams> })?.userParams ?? {};
    const persistedDNA = await loadActiveBusinessDNA(userId, organizationId).catch(() => null);
    const mergedParams = dnaToUserParams(persistedDNA, rawBodyParams as Record<string, string>);

    const userParams: UserParams = {
        industry: mergedParams.industry || '',
        competitor: mergedParams.competitor || 'Fast-Growing Challenger',
        priority: mergedParams.priority || 'Growth & Resilience',
        companySize: mergedParams.companySize || '',
        geography: mergedParams.geography || 'Global',
        revenueRange: mergedParams.revenueRange || '',
        businessModel: mergedParams.businessModel || '',
        growthStage: mergedParams.growthStage || mergedParams.riskTolerance || '',
        riskTolerance: mergedParams.riskTolerance || '',
        timeHorizon: mergedParams.timeHorizon || 'Next 12 Months',
        primaryThreat: mergedParams.primaryThreat || 'Market & Technology Disruption',
        companyName: mergedParams.companyName,
        companyDescription: mergedParams.companyDescription,
    };

    if (!userParams.industry) {
        return res.status(400).json({ error: 'Business DNA or userParams.industry is required' });
    }

    console.log(`[Simulate] Morning briefing for: ${userParams.companyName || userParams.industry}`);

    const startTime = Date.now();
    const orgPlan = await getOrganizationPlan(organizationId);

    try {
        const companyTag = userParams.companyName ? `${userParams.companyName} ` : '';
        const searchQueries = [
            `${companyTag}${userParams.industry} market news competitor moves ${userParams.geography}`,
            `${userParams.primaryThreat} ${userParams.industry} industry impact`,
            `${companyTag || userParams.competitor + ' '}strategy news funding suppliers ${userParams.industry}`,
        ];

        let publicDataContext = '';
        if (config.perplexityApiKey) {
            try {
                const searchResults = await parallelSearch(searchQueries, `${userParams.industry} market intelligence`);
                publicDataContext = searchResults
                    .filter(r => !r.error && r.content)
                    .map(r => `[${r.query}]\n${r.content}`)
                    .join('\n\n---\n\n');
            } catch (searchErr: any) {
                console.warn('[Simulate] Search failed, proceeding with LLM synthesis only:', searchErr.message);
            }
        }

        const bloombergOutput = await runBloombergAgent(publicDataContext, mergedParams);
        const blackrockOutput = await runBlackRockAgent(publicDataContext, bloombergOutput, mergedParams);
        const vanguardOutput = await runVanguardAgent(bloombergOutput, blackrockOutput, mergedParams);
        const ecosystemOutput = await runEcosystemAgent(publicDataContext, mergedParams);

        const competitor_threat = Math.min(100, Math.round(
            (bloombergOutput.market_velocity * 0.5) + (blackrockOutput.rpn * 0.5)
        ));
        const volatility_index = Math.min(100, Math.round(
            bloombergOutput.market_velocity * 0.7 + (100 - vanguardOutput.stability_score) * 0.3
        ));
        const market_score = Math.max(0, Math.min(100, Math.round(
            ((100 - blackrockOutput.rpn) * 0.4) +
            (vanguardOutput.stability_score * 0.4) +
            ((100 - bloombergOutput.market_velocity) * 0.2)
        )));

        const companyName = userParams.companyName || `${userParams.industry} Co.`;
        const generatedAt = new Date().toISOString();

        const response: SimulationResponse = {
            is_simulated: true,
            data_classification: 'AI_SIMULATION',
            market_score,
            competitor_threat,
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
            company_name: companyName,
            generated_at: generatedAt,
        };

        // Persist simulation to Supabase `simulations`
        const { data: simRow, error: simErr } = await supabaseAdmin
            .from('simulations')
            .insert({
                organization_id: organizationId,
                user_id: userId,
                simulation_type: 'morning_briefing',
                title: `${companyName} — OCT Simulation`,
                user_params: mergedParams,
                market_score,
                competitor_threat,
                volatility_index,
                system_stability: vanguardOutput.stability_score,
                composite_score: market_score,
                decision_rank: blackrockOutput.risk_category,
                summary: bloombergOutput.headline,
                results: response,
                mermaid_graph_code: blackrockOutput.mermaid_graph_code,
            })
            .select('id')
            .single();

        if (simErr) {
            console.warn('[Simulate] Failed to persist simulation:', simErr.message);
        } else if (simRow?.id) {
            response.simulation_id = simRow.id;
        }

        // Persist alerts for critical/high threats (non-fatal)
        const highThreats = (bloombergOutput.threats ?? []).filter(
            t => t.severity === 'critical' || t.severity === 'high'
        );
        if (highThreats.length > 0) {
            await supabaseAdmin.from('alerts_notifications').insert(
                highThreats.slice(0, 3).map(t => ({
                    organization_id: organizationId,
                    user_id: userId,
                    severity: t.severity,
                    title: `[SIMULATION] ${t.signal.slice(0, 120)}`,
                    message: t.signal,
                    source_module: 'morning_briefing',
                    timeline: t.timestamp,
                    status: 'unread',
                }))
            );
        }

        await logAgentActivity({
            agentType: 'OCT_Simulator',
            action: 'SimulateMorning',
            status: 'success',
            organizationId,
            userId,
        });

        // Log LLM request telemetry
        const latencyMs = Date.now() - startTime;
        const estimatedCompletionTokens = Math.round(JSON.stringify(response).length / 4);
        const estimatedPromptTokens = 4000;

        const llmRow: Record<string, unknown> = {
            user_id: userId,
            user_email: userEmail,
            company: companyName,
            plan: orgPlan,
            module: 'Morning Briefing Simulation',
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

        return res.json(response);
    } catch (err: any) {
        const latencyMs = Date.now() - startTime;
        await logAgentActivity({
            agentType: 'OCT_Simulator',
            action: 'SimulateMorning',
            status: 'error',
            organizationId,
            userId,
        });

        await supabaseAdmin.from('llm_requests').insert({
            user_id: userId,
            user_email: userEmail,
            company: userParams.companyName || userParams.industry || 'Unknown',
            plan: orgPlan,
            module: 'Morning Briefing Simulation',
            provider: config.llmProvider,
            model: config.model,
            prompt_tokens: 4000,
            completion_tokens: 0,
            cost_usd: 0,
            latency_ms: latencyMs,
            status: 'error',
        });

        console.error('[Simulate] Fatal error:', err.message);
        return res.status(500).json({ error: `Simulation failed: ${err.message}` });
    }
});
