/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Real-World Grounding Agent
   Turns a module run from "LLM imagines numbers" into a real multi-step agent:
       plan queries → search the web (DuckDuckGo) → retrieve evidence + sources
   The resulting evidence block is injected into the module prompt as
   `publicDataContext`, and the citations are surfaced to the UI as proof.

   Free: DuckDuckGo needs no API key. Degrades gracefully — if search yields
   nothing, returns ok:false and an empty context so the module behaves as before.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callGroq, parseJSON } from '../groq.js';
import { parallelTavilySearch } from '../engines/deepResearch/tavilyClient.js';
import { parallelDDGSearch } from '../engines/deepResearch/duckDuckGoClient.js';
import { xaiWebSearch } from '../engines/deepResearch/xaiSearchClient.js';
import type { Citation } from '../engines/deepResearch/types.js';

type SearchHit = { query: string; content: string; citations: Citation[]; error: string | null };

export interface GroundingResult {
    context: string;        // formatted evidence block for the LLM prompt
    citations: Citation[];  // real source URLs (proof shown in UI)
    searchCount: number;
    ok: boolean;            // false if web search yielded nothing
    provider: 'tavily' | 'duckduckgo' | 'xai' | 'none';  // which source grounded the run
}

const PLAN_QUERIES = 4;       // queries searched per provider attempt
const MAX_SOURCES = 8;        // citations kept for the UI / prompt

// ─── Grounding cache ─────────────────────────────────────────────────────────
// Web facts don't change minute-to-minute, and a single dashboard tour runs all
// 8 modules for the SAME company — each doing live search would burn the Tavily
// free quota (1,000/mo) in ~31 tours. We cache each (company + focus) result for
// a few hours and de-duplicate concurrent identical requests so the 8 modules
// share work instead of multiplying it.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;   // 6 hours
const groundingCache = new Map<string, { result: GroundingResult; ts: number }>();
const inFlight = new Map<string, Promise<GroundingResult>>();

/** Normalise so "Zomato " and "zomato" share one cache entry. */
function cacheKey(company: string, focus: string): string {
    return `${company.trim().toLowerCase()}::${focus.trim().toLowerCase()}`;
}

/** Template queries used when the LLM planner is unavailable or returns junk. */
function templateQueries(company: string, industry: string): string[] {
    const c = `"${company}"`;
    const year = new Date().getFullYear();
    return [
        `${c} ${industry} latest news ${year}`,
        `${c} revenue growth market share`,
        `${c} competitors`,
        `${industry} industry trends outlook ${year}`,
    ];
}

/**
 * Step 1 — Plan: ask the LLM for sharp, web-searchable queries seeded from the
 * company profile + the module's research focus. Falls back to templates.
 */
async function planQueries(focus: string, company: string, industry: string, geography: string): Promise<string[]> {
    try {
        const raw = await callGroq(
            `You generate web-search queries for a market-intelligence agent. Return ONLY valid JSON.`,
            `Company: "${company}"
Industry: ${industry}
Geography: ${geography || 'Global'}
Research focus: ${focus}

Produce exactly ${PLAN_QUERIES} short, keyword-dense, web-searchable queries that will surface
REAL, recent facts about this specific company and its market. Prefer the company's real name.
Return JSON: {"queries":["...","...","...","..."]}`,
            400
        );
        const parsed = parseJSON<{ queries?: string[] }>(raw, {});
        const queries = (parsed.queries ?? [])
            .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
            .map(q => q.trim())
            .slice(0, PLAN_QUERIES);
        if (queries.length >= 2) return queries;
    } catch (err: any) {
        console.warn(`[Grounding] Query planning failed (${err.message}) — using templates.`);
    }
    return templateQueries(company, industry);
}

/**
 * Step 4 — Collect: dedupe citations by URL, rank by relevance, cap, and build
 * the evidence string (numbered snippets + a SOURCES list) for the prompt.
 */
function buildContext(
    results: Array<{ query: string; content: string; citations: Citation[]; error: string | null }>,
): { context: string; citations: Citation[] } {
    const seen = new Set<string>();
    const citations: Citation[] = [];
    for (const r of results) {
        for (const c of r.citations) {
            if (c.url && !seen.has(c.url)) {
                seen.add(c.url);
                citations.push(c);
            }
        }
    }
    citations.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));
    const top = citations.slice(0, MAX_SOURCES);

    const evidence = results
        .filter(r => !r.error && r.content)
        .map(r => `▸ ${r.query}\n${r.content}`)
        .join('\n\n');

    const sourceList = top
        .map((c, i) => `[${i + 1}] ${c.title || c.url} — ${c.url}`)
        .join('\n');

    const date = new Date().toISOString().slice(0, 10);
    const context = evidence
        ? `LIVE WEB INTELLIGENCE (real web search, retrieved ${date}):\n\n${evidence}\n\nSOURCES:\n${sourceList}`
        : '';

    return { context, citations: top };
}

const hasContent = (results: SearchHit[]) => results.some(r => !r.error && r.content);

/**
 * Public entry point. Caches each (company + focus) grounding result for
 * CACHE_TTL_MS and de-duplicates concurrent identical requests, so a dashboard
 * tour of 8 modules for one company does NOT fan out into 8× the web searches.
 * Only successful (ok:true) results are cached — failures are retried next time.
 */
export async function gatherRealWorldContext(
    focus: string,
    userParams: Record<string, string>,
): Promise<GroundingResult> {
    const company = userParams.companyName || `${userParams.industry || 'the'} company`;
    const key = cacheKey(company, focus);

    // 1) Fresh cache hit → no network, no LLM.
    const cached = groundingCache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        console.log(`[Grounding] CACHE HIT for "${company}" (0 searches).`);
        return cached.result;
    }

    // 2) An identical request is already running → await it instead of duplicating.
    const pending = inFlight.get(key);
    if (pending) {
        console.log(`[Grounding] Joining in-flight request for "${company}".`);
        return pending;
    }

    // 3) Cold path — run, store on success, always clear the in-flight marker.
    const promise = runGrounding(focus, userParams)
        .then(result => {
            if (result.ok) groundingCache.set(key, { result, ts: Date.now() });
            return result;
        })
        .finally(() => { inFlight.delete(key); });

    inFlight.set(key, promise);
    return promise;
}

/**
 * Run the grounding agent: plan queries, then search via a cost-aware provider
 * chain — Tavily (free, reliable) → DuckDuckGo (free) → xAI Grok (PAID, 1 call,
 * last resort) → graceful degrade. Returns evidence context + real citations.
 */
async function runGrounding(
    focus: string,
    userParams: Record<string, string>,
): Promise<GroundingResult> {
    const company = userParams.companyName || `${userParams.industry || 'the'} company`;
    const industry = userParams.industry || 'the sector';
    const geography = userParams.geography || 'Global';

    console.log(`[Grounding] Researching "${company}" (${industry})…`);

    // Step 1 — plan search queries
    const queries = (await planQueries(focus, company, industry, geography)).slice(0, PLAN_QUERIES);

    // Step 2 — provider chain (stop at the first that returns real content)
    let results: SearchHit[] = [];
    let searchCount = 0;
    let provider: GroundingResult['provider'] = 'none';

    // (a) Tavily — primary, free, AI-optimized, no IP throttling
    results = await parallelTavilySearch(queries);
    searchCount += queries.length;
    if (hasContent(results)) {
        provider = 'tavily';
    } else {
        // (b) DuckDuckGo — free fallback (self-retries throttled queries)
        console.warn('[Grounding] Tavily empty — falling back to DuckDuckGo.');
        results = await parallelDDGSearch(queries);
        searchCount += queries.length;
        if (hasContent(results)) {
            provider = 'duckduckgo';
        } else {
            // (c) xAI Grok — PAID last resort, exactly ONE combined search call
            console.warn('[Grounding] DuckDuckGo empty — engaging paid xAI fallback (1 call).');
            const combinedQuery = `${company} (${industry}, ${geography}): ${focus}. Summarize the latest real facts with sources.`;
            const xai = await xaiWebSearch(combinedQuery);
            searchCount += 1;
            if (xai && xai.content) {
                results = [{ query: combinedQuery, content: xai.content, citations: xai.citations, error: null }];
                provider = 'xai';
            }
        }
    }

    // Step 3 — collect evidence + citations from whichever provider succeeded
    const { context, citations } = buildContext(results);
    const ok = context.length > 0;

    console.log(`[Grounding] ${ok ? 'OK' : 'EMPTY'} via ${provider} — ${searchCount} searches, ${citations.length} sources.`);

    return { context, citations, searchCount, ok, provider };
}
