/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Data Fabric Index
   Unified interface for agents to fetch data from various enterprise systems.
   ═══════════════════════════════════════════════════════════════════════════ */

import { querySnowflake } from './snowflake.js';
import { queryAzureDataLake } from './azureDatalake.js';
import { queryBigQuery } from './bigquery.js';
import { queryDeltaLake } from './deltalake.js';
import { callClaude } from '../groq.js';

export type DataSourceType = 'snowflake' | 'azure' | 'bigquery' | 'deltalake' | 'c3ai';

export async function fetchFromDataFabric(
    source: DataSourceType,
    query: string,
    context: string
): Promise<Record<string, unknown>> {
    switch (source) {
        case 'snowflake':
            return await querySnowflake(query, context);
        case 'azure':
            return await queryAzureDataLake(query, context);
        case 'bigquery':
            return await queryBigQuery(query, context);
        case 'deltalake':
            return await queryDeltaLake(query, context);
        case 'c3ai':
        default:
            return await queryC3AIPlatform(query, context);
    }
}

// Fallback simulator for generic Qsimutron Platform Type System objects
async function queryC3AIPlatform(query: string, context: string): Promise<Record<string, unknown>> {
    console.log(`[DataFabric] Querying Qsimutron Type System...`);
    const raw = await callClaude(
        `You are the Qsimutron Type System simulator.
Given a query for an enterprise object (e.g., Turbine, SmartMeter, Patient), return valid JSON.
Include "type", "id", and "properties".`,
        `Context: ${context}\nType Query: ${query}`,
        400
    );

    try {
        return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
        return {
            type: "Asset",
            id: "AST-901",
            properties: { status: "Active", healthScore: 92 }
        };
    }
}
