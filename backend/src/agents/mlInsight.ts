/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — ML Insight Agent
   Handles timeseries, predictive analytics, and heavy ML inference summaries.
   ═══════════════════════════════════════════════════════════════════════════ */

import { generateChart } from '../tools/chartingTool.js';
import { generateTextAnalysis } from '../tools/textRetriever.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

export async function executeMLInsight(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] ML Insight → Tooling...`);

    let content;
    // An ML Insight might need to produce a chart (e.g., forecast graph) or a text summary.
    if (step.type === 'chart') {
        content = await generateChart(query, (step.dataSource as DataSourceType) || 'bigquery');
    } else {
        content = await generateTextAnalysis(query, (step.dataSource as DataSourceType) || 'deltalake');
    }

    return {
        type: "AgentResult",
        id: `ml-${Date.now()}`,
        properties: { agent: "MLInsight" },
        data: content
    };
}
