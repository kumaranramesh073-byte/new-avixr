/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Direct Agent Execution Routes
   POST /api/agents/:name/run → Execute a single agent directly
   Returns the agent's full output without orchestration overhead.
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

import type { OrchestrationStep } from '../agentTypes.js';

export const agentsRouter = Router();

// Default queries per agent — used when no custom query is provided
const DEFAULT_QUERIES: Record<string, string> = {
    RiskSynthesis: 'Provide a comprehensive enterprise risk assessment for Qsimutron operations including operational, financial, strategic, and compliance risks. Include risk priority numbers, cascade failure chains, and mitigation playbooks for all identified risks.',
    PredictiveAnalysis: 'Analyze demand forecasting trends for Qsimutron product portfolio. Provide Bayesian predictive analysis with confidence intervals, trend direction vectors, anomaly detection, and forecast horizons for short-term (30d), mid-term (90d), and long-term (365d).',
    Finance: 'Perform a complete financial analysis for Qsimutron Q1 operations including revenue impact, cost analysis, EBITDA margins, NPV/IRR calculations, cashflow projections, and a 3-scenario financial model (bear/base/bull case) with sensitivity analysis.',
    StrategyOptimization: 'Optimize Qsimutron process operations including resource allocation, scheduling efficiency, constraint satisfaction, and Pareto-optimal scenarios. Provide trade-off matrices and implementation sequences for the top strategies.',
    Personalization: 'Create an executive intelligence brief for Qsimutron C-suite stakeholders. Summarize key findings across risk, finance, operations, and forecasting with priority-ranked action items and decision briefs.',
};

// POST /api/agents/:name/run
agentsRouter.post('/:name/run', async (req: Request, res: Response) => {
    const agentName = req.params.name;
    const { query } = req.body as { query?: string };
    const finalQuery = query?.trim() || DEFAULT_QUERIES[agentName] || `Provide a comprehensive analysis for Qsimutron enterprise operations.`;

    console.log(`[Agent Direct] Executing ${agentName} → "${finalQuery.substring(0, 80)}..."`);

    // Build a synthetic step for the agent executor
    const step: OrchestrationStep = {
        id: uuidv4(),
        stepOrder: 0,
        title: `${agentName} Analysis`,
        description: finalQuery,
        agent: agentName as any,
        type: 'text',
        dataSource: 'c3ai',
    };

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

        res.json({
            agent: agentName,
            query: finalQuery,
            result: result.data,
            timestamp: new Date().toISOString(),
        });
    } catch (err: any) {
        console.error(`[Agent Direct] ${agentName} failed:`, err);
        res.status(500).json({ error: `Agent ${agentName} execution failed`, message: err.message });
    }
});
