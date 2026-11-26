/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Tavily Search Client
   Reliable, AI-optimized web search (free tier: 1,000 req/month, no IP throttle).
   Returns the SAME shape as parallelDDGSearch so it's a drop-in replacement.
   ═══════════════════════════════════════════════════════════════════════════ */

import { config } from '../../config.js';
import type { Citation } from './types.js';

const TAVILY_URL = 'https://api.tavily.com/search';

interface TavilyResult { title: string; url: string; content: string; score: number; }
interface TavilyResponse { answer?: string; results?: TavilyResult[]; }

/** One Tavily search. Returns null on failure so callers can fall back. */
async function searchOne(query: string): Promise<{ content: string; citations: Citation[] } | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);
    try {
        const resp = await fetch(TAVILY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: config.tavilyApiKey,
                query,
                search_depth: 'basic',
                max_results: 5,
                include_answer: true,
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!resp.ok) throw new Error(`Tavily HTTP ${resp.status}`);

        const data = (await resp.json()) as TavilyResponse;
        const results = data.results ?? [];
        if (!results.length && !data.answer) return null;

        const citations: Citation[] = results.map((r, i) => ({
            url: r.url,
            title: r.title,
            snippet: r.content?.slice(0, 300) ?? '',
            relevance_score: typeof r.score === 'number' ? Math.round(r.score * 100) / 100 : Math.max(0.2, 1 - i * 0.12),
        }));

        // Lead with Tavily's synthesized answer, then the supporting snippets.
        const parts: string[] = [];
        if (data.answer) parts.push(`Answer: ${data.answer}`);
        results.forEach((r, i) => parts.push(`[${i + 1}] ${r.title}\n${r.content}`));

        return { content: parts.join('\n\n'), citations };
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') console.error(`[Tavily] Timed out: "${query}"`);
        else console.error(`[Tavily] Failed "${query}":`, error.message);
        return null;
    }
}

/**
 * Run parallel Tavily searches. Same return shape as parallelDDGSearch:
 * Array<{ query, content, citations, error }>.
 */
export async function parallelTavilySearch(
    queries: string[],
): Promise<Array<{ query: string; content: string; citations: Citation[]; error: string | null }>> {
    if (!config.tavilyApiKey) {
        return queries.map(q => ({ query: q, content: '', citations: [], error: 'TAVILY_API_KEY not set' }));
    }
    const settled = await Promise.allSettled(queries.map(q => searchOne(q)));
    return settled.map((s, i) => {
        if (s.status === 'fulfilled' && s.value) {
            return { query: queries[i], content: s.value.content, citations: s.value.citations, error: null };
        }
        return { query: queries[i], content: '', citations: [], error: 'No results' };
    });
}
