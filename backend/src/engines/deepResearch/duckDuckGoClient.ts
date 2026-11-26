/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron Lite — DuckDuckGo Search Client
   Free web search via DuckDuckGo HTML endpoint.
   Noisy results are expected — aggressive filtering happens in nodes.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { Citation } from './types.js';

const DDG_URL = 'https://html.duckduckgo.com/html/';

interface DDGResult {
    title: string;
    url: string;
    snippet: string;
}

/**
 * Parse DuckDuckGo HTML search results into structured results.
 * DDG returns HTML — we extract result blocks from the page.
 */
function parseHTMLResults(html: string): DDGResult[] {
    const results: DDGResult[] = [];

    // Extract result blocks: <a class="result__a" href="...">Title</a>
    // and <a class="result__snippet">Snippet</a>
    const linkRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;

    const links: Array<{ url: string; title: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(html)) !== null) {
        const rawUrl = match[1];
        const title = match[2].replace(/<[^>]*>/g, '').trim();

        // DDG wraps URLs — extract the actual URL from redirect
        let url = rawUrl;
        const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
        if (uddgMatch) {
            url = decodeURIComponent(uddgMatch[1]);
        }

        if (url && title) {
            links.push({ url, title });
        }
    }

    const snippets: string[] = [];
    while ((match = snippetRegex.exec(html)) !== null) {
        const snippet = match[1].replace(/<[^>]*>/g, '').trim();
        snippets.push(snippet);
    }

    for (let i = 0; i < links.length && i < 10; i++) {
        results.push({
            title: links[i].title,
            url: links[i].url,
            snippet: snippets[i] || '',
        });
    }

    return results;
}

// A realistic desktop-browser User-Agent. DuckDuckGo's HTML endpoint blocks
// obvious bot signatures (and returns an empty page), so we present as Chrome.
const BROWSER_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Issue one POST to the DuckDuckGo HTML endpoint and parse the results.
 */
async function fetchDDGOnce(query: string): Promise<DDGResult[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15_000);

    try {
        const body = new URLSearchParams({ q: query, kl: 'us-en' });

        const resp = await fetch(DDG_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': BROWSER_UA,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://duckduckgo.com/',
            },
            body: body.toString(),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!resp.ok) {
            throw new Error(`DDG HTTP ${resp.status}`);
        }
        return parseHTMLResults(await resp.text());
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`[DDG] Search timed out: "${query}"`);
        } else {
            console.error(`[DDG] Search failed for "${query}":`, error.message);
        }
        return [];
    }
}

/**
 * Perform a single DuckDuckGo search, retrying once with backoff when the
 * endpoint throttles us (empty page) — DDG is noisy about rapid requests.
 */
async function searchDDG(query: string): Promise<DDGResult[]> {
    let results = await fetchDDGOnce(query);
    if (results.length === 0) {
        await sleep(800 + Math.floor(Math.random() * 700));
        results = await fetchDDGOnce(query);
    }
    return results;
}

/**
 * Convert DDG results to Citation format with relevance scoring.
 */
function resultsToCitations(results: DDGResult[], queryIndex: number): Citation[] {
    return results.map((r, i) => ({
        url: r.url,
        title: r.title,
        snippet: r.snippet,
        relevance_score: Math.round(Math.max(0.2, 1.0 - i * 0.12) * 100) / 100,
    }));
}

/**
 * Run parallel DuckDuckGo searches for all queries.
 * Returns structured results compatible with the research pipeline.
 */
export async function parallelDDGSearch(
    queries: string[]
): Promise<Array<{ query: string; content: string; citations: Citation[]; error: string | null }>> {
    const results = await Promise.allSettled(
        queries.map((q) => searchDDG(q))
    );

    return results.map((result, i) => {
        if (result.status === 'rejected') {
            return {
                query: queries[i],
                content: '',
                citations: [],
                error: result.reason?.message ?? 'DDG search failed',
            };
        }

        const ddgResults = result.value;

        if (ddgResults.length === 0) {
            return {
                query: queries[i],
                content: '',
                citations: [],
                error: 'No results found',
            };
        }

        // Combine snippets into content
        const content = ddgResults
            .map((r, j) => `[${j + 1}] ${r.title}\n${r.snippet}`)
            .join('\n\n');

        return {
            query: queries[i],
            content,
            citations: resultsToCitations(ddgResults, i),
            error: null,
        };
    });
}
