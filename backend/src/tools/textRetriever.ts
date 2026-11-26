/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Text Retriever Tool
   Invokes Data Fabric for unstructured data and generates a professional summary.
   ═══════════════════════════════════════════════════════════════════════════ */

import { fetchFromDataFabric, type DataSourceType } from '../dataFabric/index.js';
import { callClaude } from '../groq.js';
import type { TextContentData } from '../types.js';

export async function generateTextAnalysis(
    query: string,
    source: DataSourceType
): Promise<TextContentData> {
    console.log(`[Tool] TextRetriever triggered via ${source}`);

    const rawData = await fetchFromDataFabric(source, query, "Extract document excerpts or logs.");

    const responseText = await callClaude(
        `You are an enterprise AI analyst for Qsimutron.
Given this raw unstructured data, provide actionable professional analysis.
Write 2–3 focused paragraphs (no bullet lists, no markdown headers).
Raw Data: ${JSON.stringify(rawData)}
Original Query: ${query}`,
        `Reference specific data findings and give clear executive recommendations.`,
        600
    );

    return { summary: responseText };
}
