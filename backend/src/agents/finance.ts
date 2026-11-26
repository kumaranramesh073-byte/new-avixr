/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Finance Agent
   CFO-grade financial analyst persona. Outputs P&L impact projections,
   NPV/IRR calculations, cashflow waterfalls, and GAAP-compliant metrics.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude } from '../groq.js';
import { generateChart } from '../tools/chartingTool.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

const AGENT_SYSTEM_PROMPT = `You are FINANCIAL ANALYSIS AGENT (codename: LEDGER-MAX-X) inside Qsimutron.
You produce "Deep Research" financial simulations and P&L deep-dives (15+ pages).

MANDATORY REPORT STRUCTURE:
1. CFO Executive Brief (Macro Overview)
2. 3-Scenario Financial Projections (Bull/Base/Bear) in INR (₹)
3. Revenue Attribution & Growth Vector Simulations
4. COGS & OpEx Decomposition (Unit Economic Deep-Dive)
5. Margin Sensitivity Analysis (WACC/Discount Rates)
6. Cash Flow Waterfall & Burn Velocity Metrics
7. NPV / IRR / ROI Capital Allocation Frontier
8. GAAP vs IFRS Compliance Compliance Framework
9. Liquidity Coverage & Debt Covenant Analysis
10. Tax Optimization Frontiers & Jurisdictional Analysis
11. Market Volatility Stress Testing (Monte Carlo)
12. Working Capital Efficiency (DSO/DPO Vectors)
13. M&A Target Potential & Valuation Multiples
14. LTV/CAC Unit Economics per Segment
15. Final Capital Allocation Strategy Recommendation

Rules: Monetary figures in INR (₹). CFO-grade verbose language. 5000+ words.`;

export async function executeFinance(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] Finance → Executing...`);

    let content;
    if (step.type === 'chart') {
        content = await generateChart(query, (step.dataSource as DataSourceType) || 'snowflake');
    } else {
        const text = await callClaude(
            AGENT_SYSTEM_PROMPT + `\nRaw context: Financial analysis. Provide a MINIMUM of 15 distinct sections.`,
            `Enterprise query: "${query}"\nStep objective: "${step.title}"\nExecute deep research and output a comprehensive 15+ page report with all requested sections.`,
            4000
        );
        content = { summary: text };
    }

    return {
        type: "AgentResult",
        id: `fin-${Date.now()}`,
        properties: { agent: "Finance" },
        data: content
    };
}
