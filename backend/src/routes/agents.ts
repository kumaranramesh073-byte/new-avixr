/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Direct Agent Execution Routes
   POST /api/agents/:name/run → Hydrates Business DNA, runs agent, persists
   output to agent_outputs & agent_logs.
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

import { executePredictiveAnalysis } from '../agents/predictiveAnalysis.js';
import { executeFinance } from '../agents/finance.js';
import { executeStrategyOptimization } from '../agents/strategyOptimization.js';
import { executeRiskSynthesis } from '../agents/riskSynthesis.js';
import { executePersonalization } from '../agents/personalization.js';
import { executeMLInsight } from '../agents/mlInsight.js';
import { executeDashboard } from '../agents/dashboard.js';
import { executeOptimizer } from '../agents/optimizer.js';
import { executeInfoRetrieval } from '../agents/infoRetrieval.js';
import {
    loadActiveBusinessDNA,
    formatDnaSummary,
    logAgentActivity,
    saveAgentOutput,
} from '../services/userContext.js';

import type { OrchestrationStep } from '../agentTypes.js';

export const agentsRouter = Router();

const DEFAULT_QUERIES: Record<string, string> = {
    RiskSynthesis: 'Provide a comprehensive enterprise risk assessment including operational, financial, strategic, and compliance risks, RPN scores, cascade failure chains, and mitigation playbooks.',
    PredictiveAnalysis: 'Analyze demand forecasting trends with Bayesian predictive analysis, confidence intervals, trend direction vectors, anomaly detection, and 30d/90d/365d horizons.',
    Finance: 'Perform a financial analysis including revenue impact, cost analysis, EBITDA margins, NPV/IRR, cashflow projections, and 3-scenario bear/base/bull models.',
    StrategyOptimization: 'Optimize process operations including resource allocation, scheduling efficiency, constraint satisfaction, and Pareto-optimal scenarios.',
    Personalization: 'Create an executive intelligence brief for C-suite stakeholders summarizing risk, finance, operations, and forecasting with priority-ranked action items.',
};

// POST /api/agents/:name/run
agentsRouter.post('/:name/run', async (req: Request, res: Response) => {
    const agentName = req.params.name;
    const { query } = req.body as { query?: string };
    const userId = req.userId!;
    const organizationId = req.organizationId!;

    const baseQuery = query?.trim() || DEFAULT_QUERIES[agentName] || 'Provide a comprehensive enterprise intelligence analysis.';
    const dna = await loadActiveBusinessDNA(userId).catch(() => null);
    const dnaCtx = formatDnaSummary(dna);
    const finalQuery = dnaCtx
        ? `${baseQuery}\n[Business DNA: ${dnaCtx}]`
        : baseQuery;

    const step: OrchestrationStep = {
        id: uuidv4(),
        stepOrder: 0,
        title: `${agentName} Analysis`,
        description: finalQuery,
        agent: agentName as any,
        type: 'text',
        dataSource: 'c3ai',
    };

    const startTime = Date.now();
    try {
        let result;
        switch (agentName) {
            case 'PredictiveAnalysis':
                result = await executePredictiveAnalysis(finalQuery, step);
                break;
            case 'Finance':
                result = await executeFinance(finalQuery, step);
                break;
            case 'StrategyOptimization':
                result = await executeStrategyOptimization(finalQuery, step);
                break;
            case 'RiskSynthesis':
                result = await executeRiskSynthesis(finalQuery, step);
                break;
            case 'Personalization':
                result = await executePersonalization(finalQuery, step);
                break;
            case 'MLInsight':
                result = await executeMLInsight(finalQuery, step);
                break;
            case 'Dashboard':
                result = await executeDashboard(finalQuery, step);
                break;
            case 'Optimizer':
                result = await executeOptimizer(finalQuery, step);
                break;
            case 'InfoRetrieval':
                result = await executeInfoRetrieval(finalQuery, step);
                break;
            default:
                return res.status(400).json({ error: `Unknown agent: ${agentName}` });
        }

        await saveAgentOutput({
            organizationId,
            userId,
            agentName,
            query: baseQuery,
            outputData: result.data ?? {},
            executionTimeMs: Date.now() - startTime,
        });
        await logAgentActivity({
            agentType: agentName,
            action: 'DirectAgentRun',
            status: 'success',
            organizationId,
            userId,
        });

        return res.json({
            agent: agentName,
            query: baseQuery,
            result: result.data,
            isSimulated: true,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        await logAgentActivity({
            agentType: agentName,
            action: 'DirectAgentRun',
            status: 'error',
            organizationId,
            userId,
        });
        console.error(`[Agent Direct] ${agentName} failed:`, err);
        return res.status(500).json({ error: `Agent ${agentName} execution failed`, message: err.message });
    }
});
