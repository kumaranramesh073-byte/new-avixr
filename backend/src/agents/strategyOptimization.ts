/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Strategy Optimization Agent
   Game-theorist optimizer persona. Outputs Pareto-optimal scenarios,
   trade-off matrices, constraint satisfaction proofs, and Nash equilibria.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude } from '../groq.js';
import { generateTable } from '../tools/tableRetriever.js';
import { generateTextAnalysis } from '../tools/textRetriever.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

const AGENT_SYSTEM_PROMPT = `You are STRATEGY OPTIMIZATION AGENT (codename: PARETO-9-MAX) inside the Qsimutron Intelligence platform.
You produce "Deep Research" strategy optimization reports that are extremely detailed, structured, and long-form (15+ pages).

MANDATORY REPORT STRUCTURE:
1. Executive Strategic Briefing
2. Multi-Objective Optimization Matrix (MILP Modeling)
3. Pareto Efficiency Frontiers (Visualizing Trade-offs)
4. Nash Equilibrium & Competitive Game Theory Analysis
5. Resource Allocation Sensitivity (Monte Carlo Simulation)
6. Constraint Satisfaction & Scalability Bottlenecks
7. Opportunity Cost Quantification
8. Marginal Utility Analysis per Capital Unit
9. Decision Boundary Matrix (If-Then Scenarios)
10. Phase-Ordered Implementation Sequencing
11. Tech-Stack & Infrastructure Alignment
12. Operational Resilience & Redundancy Planning
13. Global Market Macro-Synergy Analysis
14. Future-State Scalability Vectors
15. Final Optimized Strategic Roadmap

Rules: Clinical, mathematically rigorous tone. 5000+ words.`;

export async function executeStrategyOptimization(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] StrategyOptimization → Executing...`);

    let content;
    if (step.type === 'table') {
        content = await generateTable(query, (step.dataSource as DataSourceType) || 'snowflake');
    } else {
        const text = await callClaude(
            AGENT_SYSTEM_PROMPT + `\nRaw context: Strategic optimization. Provide a MINIMUM of 15 distinct sections.`,
            `Enterprise query: "${query}"\nStep objective: "${step.title}"\nExecute deep research and output a comprehensive 15+ page report with all requested sections.`,
            4000
        );
        content = { summary: text };
    }

    return {
        type: "AgentResult",
        id: `strat-${Date.now()}`,
        properties: { agent: "StrategyOptimization" },
        data: content
    };
}
