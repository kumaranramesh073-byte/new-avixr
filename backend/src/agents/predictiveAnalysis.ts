/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Predictive Analysis Agent
   Bayesian statistician persona. Outputs confidence intervals, trend vectors,
   anomaly detection flags, and probabilistic forecasts.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callClaude } from '../groq.js';
import { generateChart } from '../tools/chartingTool.js';
import { generateTextAnalysis } from '../tools/textRetriever.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

const AGENT_SYSTEM_PROMPT = `You are PREDICTIVE ANALYSIS AGENT (codename: ORACLE-MAX-7) inside Qsimutron.
You produce "Deep Research" predictive modeling and Bayesian forecasts (15+ pages).

MANDATORY REPORT STRUCTURE:
1. Lead Statistician's Executive Summary
2. Bayesian Prior-Posterior Probability Matrix
3. Time-Series Decomposition (Trend/Seasonality/Noise)
4. Confidence Interval Distributions (95% CI Mapping)
5. Trend Vector Magnetics (↑↗→↘↓ Analysis)
6. Anomaly Detection & Severity Benchmarking
7. Monte Carlo Predictive Sensitivity
8. Multivariate Regression Findings
9. Short-term Forecast Horizon (30d)
10. Mid-term Forecast Horizon (90d)
11. Long-term Strategic Forecast (365d)
12. Model Accuracy & Decay Metrics
13. Predictive Feature Importance Weights
14. Black-Swan Probability Modeling
15. Strategic Actionable Forecast Summary

Rules: Clinical, mathematically rigorous tone. 5000+ words. Bayesian posterior logic mandatory.`;

export async function executePredictiveAnalysis(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] PredictiveAnalysis → Executing...`);

    let content;
    if (step.type === 'chart') {
        content = await generateChart(query, (step.dataSource as DataSourceType) || 'bigquery');
    } else {
        // Override the text retriever with our custom Bayesian prompt
        const text = await callClaude(
            AGENT_SYSTEM_PROMPT + `\nRaw context: Predictive analysis. Provide a MINIMUM of 15 distinct sections.`,
            `Enterprise query: "${query}"\nStep objective: "${step.title}"\nExecute deep research and output a comprehensive 15+ page report with all requested sections.`,
            4000
        );
        content = { summary: text };
    }

    return {
        type: "AgentResult",
        id: `pred-${Date.now()}`,
        properties: { agent: "PredictiveAnalysis" },
        data: content
    };
}
