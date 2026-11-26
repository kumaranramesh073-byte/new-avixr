/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Session Routes (Agent Architecture)
   POST   /api/sessions              → Create session + Orchestrator plans
   GET    /api/sessions              → List all sessions
   GET    /api/sessions/:id          → Get session + step results
   POST   /api/sessions/:id/execute  → Execute plan (Sub-agents stream via WS)
   DELETE /api/sessions/:id          → Delete session
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { broadcast, broadcastError } from '../ws.js';

// Agents — Original
import { generateOrchestrationPlan } from '../agents/orchestrator.js';
import { executeInfoRetrieval } from '../agents/infoRetrieval.js';
import { executeDashboard } from '../agents/dashboard.js';
import { executeMLInsight } from '../agents/mlInsight.js';
import { executeOptimizer } from '../agents/optimizer.js';

// Agents — New Qsimutron Agents
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

import type { OrchestrationPlan, OrchestrationStep } from '../agentTypes.js';

export const sessionsRouter = Router();

// ─── POST /api/sessions ───────────────────────────────────────────────────────

sessionsRouter.post('/', async (req: Request, res: Response) => {
    const { query, agentMode = 'All Agents' } = req.body as { query?: string; agentMode?: string };

    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'query is required' });
    }

    const sessionId = uuidv4();
    await db.createSession(sessionId, query.trim(), agentMode);

    // Respond immediately — orchestrator generates plan async
    res.status(201).json({ sessionId, status: 'planning' });

    // ── Intent Engine → Orchestrator Pipeline ──
    (async () => {
        try {
            console.log(`[Pipeline] Starting orchestration for session ${sessionId}`);

            // Step 1: Classify intent
            console.log(`[Pipeline] Step 1/2: Classifying intent...`);
            const intent = await classifyIntent(query.trim());
            console.log(`[Pipeline] Intent classified: ${intent.primaryIntent} (confidence: ${intent.confidence})`);

            // Step 2: Generate orchestration plan
            console.log(`[Pipeline] Step 2/2: Generating plan...`);
            const plan = await generateOrchestrationPlan(query.trim());
            console.log(`[Pipeline] Plan generated with ${plan.steps.length} steps.`);

            // Re-map the plan to ensure robust IDs and sequence
            plan.steps = plan.steps.map((s, i) => ({
                ...s,
                id: uuidv4(),
                stepOrder: i,
            }));

            await db.updateSessionPlan(sessionId, plan);
            console.log(`[Pipeline] Session ${sessionId} updated with plan. Broadcasting...`);
            broadcast(sessionId, 'plan_ready', { plan, intent });
        } catch (err: any) {
            console.error('[Pipeline] Orchestrator Planning failed:', err);
            await db.markSessionError(sessionId);
            broadcastError(sessionId, `Plan generation failed: ${err.message || 'Unknown error'}`);
        }
    })();
});

// ─── GET /api/sessions ────────────────────────────────────────────────────────

sessionsRouter.get('/', async (_req: Request, res: Response) => {
    res.json(await db.listSessions());
});

// ─── GET /api/sessions/:id ───────────────────────────────────────────────────

sessionsRouter.get('/:id', async (req: Request, res: Response) => {
    const session = await db.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ ...session, steps: await db.getSteps(req.params.id) });
});

// ─── POST /api/sessions/:id/execute ─────────────────────────────────────────

sessionsRouter.post('/:id/execute', async (req: Request, res: Response) => {
    const session = await db.getSession(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.plan) return res.status(400).json({ error: 'No plan available yet. Wait for plan_ready event.' });
    if (session.status === 'executing') return res.status(409).json({ error: 'Already executing' });
    if (session.status === 'done') return res.status(409).json({ error: 'Session already completed' });

    const steps = (session.plan as OrchestrationPlan).steps;

    await db.updateSessionStatus(session.id, 'executing', 5, 0);
    res.json({ message: 'Execution started', sessionId: session.id });

    // Execute steps sequentially via specialized agents
    (async () => {
        const agentOutputs: Record<string, unknown>[] = [];
        const agentsUsed: string[] = [];

        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            const stepId = step.id;

            await db.insertStep({
                id: stepId,
                sessionId: session.id,
                stepOrder: i,
                title: step.title,
                description: step.description,
                type: step.type,
                dataSource: step.dataSource ?? '',
                status: 'executing',
                content: null,
                createdAt: Date.now(),
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
                // Route to the correct Specialized Agent
                let agentResult;
                switch (step.agent) {
                    // ── New Qsimutron Agents ──
                    case 'PredictiveAnalysis':
                        agentResult = await executePredictiveAnalysis(session.query, step);
                        break;
                    case 'Finance':
                        agentResult = await executeFinance(session.query, step);
                        break;
                    case 'StrategyOptimization':
                        agentResult = await executeStrategyOptimization(session.query, step);
                        break;
                    case 'RiskSynthesis':
                        agentResult = await executeRiskSynthesis(session.query, step);
                        break;
                    case 'Personalization':
                        agentResult = await executePersonalization(session.query, step);
                        break;
                    // ── Original Agents ──
                    case 'MLInsight':
                        agentResult = await executeMLInsight(session.query, step);
                        break;
                    case 'Dashboard':
                        agentResult = await executeDashboard(session.query, step);
                        break;
                    case 'Optimizer':
                        agentResult = await executeOptimizer(session.query, step);
                        break;
                    case 'InfoRetrieval':
                    case 'Orchestrator':
                    default:
                        agentResult = await executeInfoRetrieval(session.query, step);
                        break;
                }

                agentOutputs.push(agentResult.data ?? {});
                agentsUsed.push(step.agent);

                await db.updateStep(stepId, session.id, 'done', agentResult.data);

                const progress = Math.round(((i + 1) / steps.length) * 100);
                await db.updateSessionStatus(session.id, 'executing', progress, i + 1);

                broadcast(session.id, 'step_result', {
                    stepIndex: i, stepId,
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
                broadcastError(session.id, `Agent ${step.agent} failed to complete step "${step.title}".`);
            }

            await new Promise((r) => setTimeout(r, 200));
        }

        // ── Post-Execution Engine Layers ──
        try {
            // Simulation Engine: Causal graph + ripple effects
            const simulationResult = await runSimulation(session.query, agentOutputs);
            console.log(`[Pipeline] Simulation complete: stability=${simulationResult.systemStability}`);

            // Decision Scoring Engine
            const decisionScore = await scoreDecision(session.query, agentOutputs, simulationResult.summary);
            console.log(`[Pipeline] Decision scored: ${decisionScore.compositeScore}/100 → ${decisionScore.rank}`);

            // Broadcast enriched results
            broadcast(session.id, 'session_done', {
                totalSteps: steps.length,
                simulation: simulationResult,
                decisionScore: decisionScore,
            });

            // Feedback Loop: Record outcome
            recordFeedback({
                sessionId: session.id,
                query: session.query,
                intent: 'general',
                agentsUsed,
                compositeScore: decisionScore.compositeScore,
                rank: decisionScore.rank,
                timestamp: Date.now(),
            });

        } catch (engineErr) {
            console.error('[Pipeline] Engine post-processing failed:', engineErr);
            // Still mark session as done even if engines fail
            broadcast(session.id, 'session_done', { totalSteps: steps.length });
        }

        await db.completeSession(session.id);

    })().catch(async (err) => {
        console.error('[Execute] Fatal execution error:', err);
        await db.markSessionError(session.id);
        broadcastError(session.id, 'Orchestration execution failed unexpectedly.');
    });
});

// ─── DELETE /api/sessions/:id ────────────────────────────────────────────────

sessionsRouter.delete('/:id', async (req: Request, res: Response) => {
    const existed = await db.deleteSession(req.params.id);
    if (!existed) return res.status(404).json({ error: 'Session not found' });
    res.json({ message: 'Session deleted' });
});
