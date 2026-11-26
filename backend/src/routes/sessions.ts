/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Session Routes (Agent Architecture)
   POST   /api/sessions                     → Create session + Orchestrator plans
   GET    /api/sessions                     → List user/org sessions
   GET    /api/sessions/simulations/latest  → Latest persisted simulation for user
   GET    /api/sessions/:id                 → Get session + step results
   POST   /api/sessions/:id/execute         → Execute plan (Sub-agents stream via WS)
   DELETE /api/sessions/:id                 → Delete session
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { broadcast, broadcastError } from '../ws.js';
import { supabaseAdmin } from '../middleware/auth.js';
import {
    loadActiveBusinessDNA,
    formatDnaSummary,
    logAgentActivity,
    saveAgentOutput,
} from '../services/userContext.js';

// Agents — Original
import { generateOrchestrationPlan } from '../agents/orchestrator.js';
import { executeInfoRetrieval } from '../agents/infoRetrieval.js';
import { executeDashboard } from '../agents/dashboard.js';
import { executeMLInsight } from '../agents/mlInsight.js';
import { executeOptimizer } from '../agents/optimizer.js';

// Agents — Qsimutron Agents
import { executePredictiveAnalysis } from '../agents/predictiveAnalysis.js';
import { executeFinance } from '../agents/finance.js';
import { executeStrategyOptimization } from '../agents/strategyOptimization.js';
import { executeRiskSynthesis } from '../agents/riskSynthesis.js';
import { executePersonalization } from '../agents/personalization.js';

// Engine Layers
import { classifyIntent } from '../engines/intentEngine.js';
import { runSimulation } from '../engines/simulationEngine.js';
import { scoreDecision } from '../engines/decisionScoring.js';
import { recordFeedback } from '../engines/feedbackLoop.js';

import type { OrchestrationPlan } from '../agentTypes.js';

export const sessionsRouter = Router();

// ─── POST /api/sessions ───────────────────────────────────────────────────────

sessionsRouter.post('/', async (req: Request, res: Response) => {
    const { query, agentMode = 'All Agents' } = req.body as { query?: string; agentMode?: string };

    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'query is required' });
    }

    const userId = req.userId!;
    const organizationId = req.organizationId!;
    const sessionId = uuidv4();

    try {
        await db.createSession(sessionId, query.trim(), agentMode, userId, organizationId);
    } catch (err: any) {
        console.error('[Sessions] Failed to create session in Supabase:', err.message);
        return res.status(500).json({ error: 'Failed to create session' });
    }

    res.status(201).json({ sessionId, status: 'planning' });

    // ── Intent Engine → Orchestrator Pipeline ──
    (async () => {
        try {
            const dna = await loadActiveBusinessDNA(userId, organizationId).catch(() => null);
            const dnaCtx = formatDnaSummary(dna);
            const enrichedQuery = dnaCtx ? `${query.trim()}\n[Business DNA Context: ${dnaCtx}]` : query.trim();

            const intent = await classifyIntent(enrichedQuery);
            const plan = await generateOrchestrationPlan(enrichedQuery);

            plan.steps = plan.steps.map((s, i) => ({
                ...s,
                id: uuidv4(),
                stepOrder: i,
            }));

            await db.updateSessionPlan(sessionId, plan);
            await logAgentActivity({
                agentType: 'Orchestrator',
                action: 'GeneratePlan',
                status: 'success',
                organizationId,
                userId,
                sessionId,
            });

            broadcast(sessionId, 'plan_ready', { plan, intent });
        } catch (err: any) {
            console.error('[Pipeline] Orchestrator Planning failed:', err);
            await db.markSessionError(sessionId);
            await logAgentActivity({
                agentType: 'Orchestrator',
                action: 'GeneratePlan',
                status: 'error',
                organizationId,
                userId,
                sessionId,
            });
            broadcastError(sessionId, `Plan generation failed: ${err.message || 'Unknown error'}`);
        }
    })();
});

// ─── GET /api/sessions ────────────────────────────────────────────────────────

sessionsRouter.get('/', async (req: Request, res: Response) => {
    try {
        const sessions = await db.listSessions(req.userId!, req.organizationId!);
        res.json(sessions);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/sessions/simulations/latest ────────────────────────────────────
// Placed BEFORE /:id so Express does not treat "simulations" as a session ID.

sessionsRouter.get('/simulations/latest', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('simulations')
            .select('id, simulation_type, title, market_score, competitor_threat, volatility_index, system_stability, composite_score, decision_rank, summary, results, mermaid_graph_code, created_at')
            .eq('organization_id', req.organizationId!)
            .eq('user_id', req.userId!)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.json({
            simulation: data ?? null,
            isSimulated: true,
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── GET /api/sessions/:id ───────────────────────────────────────────────────

sessionsRouter.get('/:id', async (req: Request, res: Response) => {
    try {
        const session = await db.getSession(req.params.id, req.userId!, req.organizationId!);
        if (!session) return res.status(404).json({ error: 'Session not found' });
        res.json({ ...session, steps: await db.getSteps(req.params.id) });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/sessions/:id/execute ─────────────────────────────────────────

sessionsRouter.post('/:id/execute', async (req: Request, res: Response) => {
    const userId = req.userId!;
    const organizationId = req.organizationId!;

    let session;
    try {
        session = await db.getSession(req.params.id, userId, organizationId);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.plan) return res.status(400).json({ error: 'No plan available yet. Wait for plan_ready event.' });
    if (session.status === 'executing') return res.status(409).json({ error: 'Already executing' });
    if (session.status === 'done') return res.status(409).json({ error: 'Session already completed' });

    const steps = (session.plan as OrchestrationPlan).steps;

    await db.updateSessionStatus(session.id, 'executing', 5, 0);
    res.json({ message: 'Execution started', sessionId: session.id });

    (async () => {
        const dna = await loadActiveBusinessDNA(userId, organizationId).catch(() => null);
        const dnaCtx = formatDnaSummary(dna);
        const agentQuery = dnaCtx ? `${session.query}\n[Business DNA: ${dnaCtx}]` : session.query;

        const agentOutputs: Record<string, unknown>[] = [];
        const agentsUsed: string[] = [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepId = step.id || uuidv4();
            const stepStart = Date.now();

            await db.insertStep({
                id: stepId,
                sessionId: session.id,
                organizationId,
                stepOrder: i,
                title: step.title,
                description: step.description,
                type: step.type,
                dataSource: step.dataSource ?? '',
                agentName: step.agent,
                status: 'executing',
                content: null,
                createdAt: stepStart,
            });

            broadcast(session.id, 'step_start', {
                stepIndex: i,
                stepId,
                title: step.title,
                type: step.type,
                dataSource: step.dataSource,
                agentName: step.agent,
            });

            await db.updateSessionStatus(
                session.id,
                'executing',
                Math.round(((i + 0.5) / steps.length) * 100),
                i
            );

            try {
                let agentResult;
                switch (step.agent) {
                    case 'PredictiveAnalysis':
                        agentResult = await executePredictiveAnalysis(agentQuery, step);
                        break;
                    case 'Finance':
                        agentResult = await executeFinance(agentQuery, step);
                        break;
                    case 'StrategyOptimization':
                        agentResult = await executeStrategyOptimization(agentQuery, step);
                        break;
                    case 'RiskSynthesis':
                        agentResult = await executeRiskSynthesis(agentQuery, step);
                        break;
                    case 'Personalization':
                        agentResult = await executePersonalization(agentQuery, step);
                        break;
                    case 'MLInsight':
                        agentResult = await executeMLInsight(agentQuery, step);
                        break;
                    case 'Dashboard':
                        agentResult = await executeDashboard(agentQuery, step);
                        break;
                    case 'Optimizer':
                        agentResult = await executeOptimizer(agentQuery, step);
                        break;
                    case 'InfoRetrieval':
                    case 'Orchestrator':
                    default:
                        agentResult = await executeInfoRetrieval(agentQuery, step);
                        break;
                }

                agentOutputs.push(agentResult.data ?? {});
                agentsUsed.push(step.agent);

                await db.updateStep(stepId, session.id, 'done', agentResult.data);
                await saveAgentOutput({
                    organizationId,
                    userId,
                    sessionId: session.id,
                    agentName: step.agent,
                    query: session.query,
                    outputData: agentResult.data ?? {},
                    executionTimeMs: Date.now() - stepStart,
                });
                await logAgentActivity({
                    agentType: step.agent,
                    action: 'ExecuteStep',
                    status: 'success',
                    organizationId,
                    userId,
                    sessionId: session.id,
                });

                const progress = Math.round(((i + 1) / steps.length) * 100);
                await db.updateSessionStatus(session.id, 'executing', progress, i + 1);

                broadcast(session.id, 'step_result', {
                    stepIndex: i,
                    stepId,
                    title: step.title,
                    type: step.type,
                    dataSource: step.dataSource,
                    agentName: agentResult.properties.agent,
                    content: agentResult.data,
                    progress,
                });

                broadcast(session.id, 'step_done', { stepIndex: i, stepId });
            } catch (err) {
                console.error(`[Execute] Step ${i} failed via Agent ${step.agent}:`, err);
                await db.updateStep(stepId, session.id, 'error', null);
                await logAgentActivity({
                    agentType: step.agent,
                    action: 'ExecuteStep',
                    status: 'error',
                    organizationId,
                    userId,
                    sessionId: session.id,
                });
                broadcastError(session.id, `Agent ${step.agent} failed to complete step "${step.title}".`);
            }

            await new Promise((r) => setTimeout(r, 200));
        }

        // ── Post-Execution Engine Layers ──
        try {
            const simulationResult = await runSimulation(session.query, agentOutputs);
            const decisionScore = await scoreDecision(session.query, agentOutputs, simulationResult.summary);

            // Persist orchestrated simulation record
            const simInsert: Record<string, unknown> = {
                organization_id: organizationId,
                user_id: userId,
                session_id: session.id,
                simulation_type: 'orchestrated_session',
                title: session.query.slice(0, 120),
                user_params: dna ? { companyName: dna.companyName, industry: dna.industry, userRole: dna.userRole } : {},
                system_stability: simulationResult.systemStability,
                composite_score: decisionScore.compositeScore,
                decision_rank: decisionScore.rank,
                summary: simulationResult.summary,
                results: {
                    simulation: simulationResult,
                    decisionScore,
                    is_simulated: true,
                },
            };
            const { error: simErr } = await supabaseAdmin.from('simulations').insert({
                ...simInsert,
                is_simulated: true,
                data_classification: 'AI_SIMULATION',
            });
            if (simErr && (simErr.code === 'PGRST204' || /column .* does not exist/i.test(simErr.message))) {
                await supabaseAdmin.from('simulations').insert(simInsert);
            } else if (simErr) {
                console.error('[Sessions] Failed to persist orchestrated simulation:', simErr.message);
            }

            broadcast(session.id, 'session_done', {
                totalSteps: steps.length,
                simulation: simulationResult,
                decisionScore,
                isSimulated: true,
            });

            await recordFeedback({
                sessionId: session.id,
                organizationId,
                userId,
                query: session.query,
                intent: 'general',
                agentsUsed,
                compositeScore: decisionScore.compositeScore,
                rank: decisionScore.rank,
                timestamp: Date.now(),
            });
        } catch (engineErr) {
            console.error('[Pipeline] Engine post-processing failed:', engineErr);
            broadcast(session.id, 'session_done', { totalSteps: steps.length });
        }

        await db.completeSession(session.id);
    })().catch(async (err) => {
        console.error('[Execute] Fatal execution error:', err);
        await db.markSessionError(session.id);
        broadcastError(session.id, 'Orchestration execution failed unexpectedly.');
    });
});

// ─── PATCH /api/sessions/:id ─────────────────────────────────────────────────

sessionsRouter.patch('/:id', async (req: Request, res: Response) => {
    try {
        const { query, agentMode, status } = req.body as {
            query?: string;
            agentMode?: string;
            status?: 'planning' | 'ready' | 'executing' | 'done' | 'error';
        };
        if (query === undefined && agentMode === undefined && status === undefined) {
            return res.status(400).json({ error: 'Provide at least one field to update (query, agentMode, status)' });
        }

        const updated = await db.updateSession(req.params.id, req.userId!, req.organizationId!, {
            query,
            agentMode,
            status,
        });
        if (!updated) return res.status(404).json({ error: 'Session not found' });
        return res.json(updated);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── DELETE /api/sessions/:id ────────────────────────────────────────────────

sessionsRouter.delete('/:id', async (req: Request, res: Response) => {
    try {
        const existed = await db.deleteSession(req.params.id, req.userId!, req.organizationId!);
        if (!existed) return res.status(404).json({ error: 'Session not found' });
        res.json({ message: 'Session deleted' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});
