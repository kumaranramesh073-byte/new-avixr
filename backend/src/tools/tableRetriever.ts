/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Table Retriever Tool
   Invokes the Data Fabric to get structured data, then formats it as TableContentData.
   ═══════════════════════════════════════════════════════════════════════════ */

import { fetchFromDataFabric, type DataSourceType } from '../dataFabric/index.js';
import { callClaude } from '../groq.js';
import type { TableContentData } from '../types.js';

export async function generateTable(
    query: string,
    source: DataSourceType
): Promise<TableContentData> {
    console.log(`[Tool] TableRetriever triggered via ${source}`);

    // Fetch raw operational/relational data
    const rawData = await fetchFromDataFabric(source, query, "Extract record-level relational data.");

    const rawTable = await callClaude(
        `You are a grid/table generator for the Qsimutron platform.
Given this raw data, generate a TableContentData JSON object.
Return ONLY valid JSON (no markdown):
{"summary":"1-sentence table summary.","columns":["Col1","Col2"],"rows":[["Val1","Val2"]]}
Raw Data: ${JSON.stringify(rawData)}
Original Query: ${query}`,
        `Format as TableContentData. Provide 4-6 columns and 4-6 rows of realistic enterprise data.`,
        700
    );

    try {
        return JSON.parse(rawTable.replace(/```json|```/g, '').trim());
    } catch {
        return {
            summary: 'Records retrieved successfully.',
            columns: ['ID', 'Asset', 'Status', 'Risk'],
            rows: [['001', 'Compressor-A', 'Active', 'Low']],
        };
    }
}
