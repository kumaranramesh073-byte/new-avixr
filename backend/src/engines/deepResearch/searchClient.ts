/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Perplexity Sonar-Pro Search Client
   Async parallel web search with citation extraction and ranking.
   ═══════════════════════════════════════════════════════════════════════════ */

import { config } from '../../config.js';
import type { Citation } from './types.js';

const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions';
const PERPLEXITY_MODEL = 'sonar-pro';

/**
 * Execute a single Perplexity sonar-pro search.
 */
async function searchOne(
    query: string,
    focus: string
): Promise<Record<string, any>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    const payload = {
        model: PERPLEXITY_MODEL,
        messages: [
            {
                role: 'system',
                content: `You are Q Simutron's search intelligence layer. `
                    + `Focus on: ${focus}. `
                    + `Return precise factual findings with sources. `
                    + `Prioritize recent data (last 12 months). `
                    + `Flag any conflicting data points you find.`,
            },
            { role: 'user', content: query },
        ],
        return_citations: true,
        search_recency_filter: 'year',
        max_tokens: 1500,
    };

    try {
        const resp = await fetch(PERPLEXITY_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.perplexityApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Perplexity HTTP ${resp.status}: ${errText}`);
        }

        return (await resp.json()) as Record<string, any>;
    } catch (error: any) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Extract and score citations from a Perplexity response.
 */
export function parseCitations(raw: Record<string, any>): Citation[] {
    const citations: Citation[] = [];
    const rawCitations: any[] = raw.citations ?? [];
    const content: string = raw.choices?.[0]?.message?.content ?? '';

    for (let i = 0; i < rawCitations.length; i++) {
        const c = rawCitations[i];
        const url = typeof c === 'string' ? c : c.url ?? '';
        const title = typeof c === 'string' ? c : c.title ?? url;
        const relevance = Math.max(0.3, 1.0 - i * 0.1);

        citations.push({
            url,
            title,
            snippet: i === 0 ? content.slice(0, 300) : '',
            relevance_score: Math.round(relevance * 100) / 100,
        });
    }

    return citations;
}

/**
 * Run all search queries concurrently via Perplexity sonar-pro.
 * Returns an array of result objects with content, citations, and error info.
 */
export async function parallelSearch(
    queries: string[],
    focus = ''
): Promise<Array<{ query: string; content: string; citations: Citation[]; error: string | null }>> {
    const results = await Promise.allSettled(
        queries.map((q) => searchOne(q, focus))
    );

    return results.map((result, i) => {
        if (result.status === 'rejected') {
            console.error(`[Search] Query "${queries[i]}" failed:`, result.reason?.message);
            return {
                query: queries[i],
                content: '',
                citations: [],
                error: result.reason?.message ?? 'Search failed',
            };
        }

        const raw = result.value;
        const content: string = raw.choices?.[0]?.message?.content ?? '';

        return {
            query: queries[i],
            content,
            citations: parseCitations(raw),
            error: null,
        };
    });
}
