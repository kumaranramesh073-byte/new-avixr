/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Geospatial Tool
   Invokes the Data Fabric to get location data, then formats it as MapContentData.
   ═══════════════════════════════════════════════════════════════════════════ */

import { fetchFromDataFabric, type DataSourceType } from '../dataFabric/index.js';
import { callClaude } from '../groq.js';
import type { MapContentData } from '../types.js';

export async function generateMap(
    query: string,
    source: DataSourceType
): Promise<MapContentData> {
    console.log(`[Tool] GeospatialTool triggered via ${source}`);

    const rawData = await fetchFromDataFabric(source, query, "Extract geospatial coordinates and risk profiles.");

    const rawMap = await callClaude(
        `You are a geospatial generator for the Qsimutron platform.
Given this raw data, generate a MapContentData JSON object.
Return ONLY valid JSON (no markdown):
{"summary":"1-sentence geospatial finding.","locations":[{"name":"Site","lat":40.7,"lng":-96.7,"info":"Details","risk":"high|medium|low"}]}
Raw Data: ${JSON.stringify(rawData)}
Original Query: ${query}`,
        `Format as MapContentData. Give 3-5 realistic US lat/lng locations. risk must be high, medium, or low.`,
        600
    );

    try {
        return JSON.parse(rawMap.replace(/```json|```/g, '').trim());
    } catch {
        return {
            summary: 'Locations identified.',
            locations: [{ name: 'Site-Alpha', lat: 40.8, lng: -96.7, info: 'Asset health warning', risk: 'high' }],
        };
    }
}
