/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Data Fabric Index (Simulated Adapters)
   Clearly labels simulated warehouse outputs so they are never confused with
   live connected warehouse queries.
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
    let result: Record<string, unknown>;
    switch (source) {
        case 'snowflake':
            result = await querySnowflake(query, context);
            break;
        case 'azure':
            result = await queryAzureDataLake(query, context);
            break;
        case 'bigquery':
            result = await queryBigQuery(query, context);
            break;
        case 'deltalake':
            result = await queryDeltaLake(query, context);
            break;
        case 'c3ai':
        default:
            result = await queryC3AIPlatform(query, context);
            break;
    }

    return {
        ...result,
        simulated: true,
        dataClassification: 'SIMULATION_DATA',
        sourceAdapter: source,
    };
}

async function queryC3AIPlatform(query: string, context: string): Promise<Record<string, unknown>> {
    console.log(`[DataFabric] Simulating Qsimutron Type System...`);
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
            type: 'Asset',
            id: 'SIM-AST-001',
            simulated: true,
            properties: { status: 'Simulated Baseline', note: 'No live asset telemetry connected' },
        };
    }
}
