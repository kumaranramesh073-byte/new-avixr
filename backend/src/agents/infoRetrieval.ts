/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Information Retrieval Agent
   Retrieves structured or unstructured data via specific tools.
   ═══════════════════════════════════════════════════════════════════════════ */

import { generateTable } from '../tools/tableRetriever.js';
import { generateTextAnalysis } from '../tools/textRetriever.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

export async function executeInfoRetrieval(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] InfoRetrieval → Tooling...`);

    let content;
    if (step.type === 'table') {
        content = await generateTable(query, (step.dataSource as DataSourceType) || 'snowflake');
    } else {
        content = await generateTextAnalysis(query, (step.dataSource as DataSourceType) || 'azure');
    }

    return {
        type: "AgentResult",
        id: `ir-${Date.now()}`,
        properties: { agent: "InfoRetrieval" },
        data: content
    };
}
