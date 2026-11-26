/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Orchestrator Agent (Planning)
   The brain of the Qsimutron multi-agent architecture. Receives a user query,
   analyzes intent, and routes tasks to specialized sub-agents.
   Now integrates with Intent Engine for intelligent routing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude, parseJSON } from '../groq.js';
import type { OrchestrationPlan } from '../agentTypes.js';

export async function generateOrchestrationPlan(query: string): Promise<OrchestrationPlan> {
    console.log(`[Agent] Orchestrator: Generating plan for query → "${query}"`);

    const raw = await callClaude(
        `You are the AUTONOMOUS AGENTIC ORCHESTRATOR for the Qsimutron platform.
Given a user request, create a multi-step execution plan using our specialized agents.

Available Agents (each has UNIQUE capabilities — choose the right ones):
  - "PredictiveAnalysis": Bayesian forecasting, trend analysis, anomaly detection. (Output: chart or text)
  - "Finance": NPV/IRR calculation, P&L analysis, cashflow projections, 3-scenario models. (Output: chart or text)
  - "StrategyOptimization": Pareto-optimal scenarios, trade-off matrices, constraint satisfaction. (Output: table or text)
  - "RiskSynthesis": Risk taxonomy, cascade failure chains, RPN scoring, mitigation playbooks. (Output: map or text)
  - "Personalization": Stakeholder-adaptive output, priority matrices, decision briefs. (Output: text)
  - "MLInsight": ML model training, time-series forecasting, deep analytics. (Output: chart or text)
  - "InfoRetrieval": Structured/unstructured record lookup and retrieval. (Output: table or text)
  - "Dashboard": Visualization-heavy tasks, geospatial mapping. (Output: chart or map)
  - "Optimizer": Supply chain, scheduling, resource optimization. (Output: text)

Available Data Sources: 'snowflake', 'azure', 'bigquery', 'deltalake', 'c3ai'.

ROUTING RULES:
1. Select 3-5 agents per query
2. Always include "Personalization" as the LAST step for executive output adaptation
3. For financial queries → always include "Finance"
4. For risk/compliance queries → always include "RiskSynthesis"
5. For prediction/forecasting queries → always include "PredictiveAnalysis"
6. For optimization/strategy queries → always include "StrategyOptimization"
7. Order: data retrieval → analysis → synthesis → personalization

Return ONLY valid JSON:
{"steps":[{"stepOrder":0,"title":"Brief Title","description":"Action","agent":"AgentName","type":"chart|table|map|text","dataSource":"sourceName"}]}
- Create 3 to 5 steps.
- Make them logical and sequential.`,
        query,
        1000
    );

    return parseJSON<OrchestrationPlan>(raw, {
        steps: [
            { id: '', stepOrder: 0, title: 'Analyze Query', description: query, agent: 'PredictiveAnalysis', type: 'text', dataSource: 'bigquery' },
            { id: '', stepOrder: 1, title: 'Synthesize Insights', description: 'Consolidate findings', agent: 'Personalization', type: 'text', dataSource: 'c3ai' },
        ]
    });
}
