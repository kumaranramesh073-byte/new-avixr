/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Dashboard Agent
   Handles visualization-heavy tasks via charting tool and geospatial tool.
   ═══════════════════════════════════════════════════════════════════════════ */

import { generateChart } from '../tools/chartingTool.js';
import { generateMap } from '../tools/geospatialTool.js';
import type { OrchestrationStep, ApplicationDataObject } from '../agentTypes.js';
import type { DataSourceType } from '../dataFabric/index.js';

export async function executeDashboard(
    query: string,
    step: OrchestrationStep
): Promise<ApplicationDataObject> {
    console.log(`[Agent] Dashboard → Tooling...`);

    let content;
    if (step.type === 'map') {
        content = await generateMap(query, (step.dataSource as DataSourceType) || 'bigquery');
    } else {
        // Default to chart for dashboard agent
        content = await generateChart(query, (step.dataSource as DataSourceType) || 'snowflake');
    }

    return {
        type: "AgentResult",
        id: `db-${Date.now()}`,
        properties: { agent: "Dashboard" },
        data: content
    };
}
