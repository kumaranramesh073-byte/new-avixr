/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — xAI (Grok) Agent-Tools Web Search — LAST-RESORT fallback
   Only used when BOTH free providers (Tavily, DuckDuckGo) return nothing.
   This is PAID (~$0.02/call: grok tokens + 2 internal web_search calls), so it
   is hard-capped to ONE call per grounding run via the caller.
   Uses the Agent Tools API (/v1/responses) — Live Search is deprecated.
   ═══════════════════════════════════════════════════════════════════════════ */

import { config } from '../../config.js';
import type { Citation } from './types.js';

const XAI_URL = 'https://api.x.ai/v1/responses';
const XAI_MODEL = 'grok-4.3';

interface XaiAnnotation { type?: string; url?: string; title?: string; }
interface XaiContent { type?: string; text?: string; annotations?: XaiAnnotation[]; }
interface XaiOutputItem { type?: string; content?: XaiContent[]; }
interface XaiResponse { output?: XaiOutputItem[]; usage?: { cost_in_usd_ticks?: number }; }

/**
 * Single Grok web-search-grounded call. Returns combined text + citations,
 * or null on any failure (caller degrades gracefully).
 */
export async function xaiWebSearch(query: string): Promise<{ content: string; citations: Citation[] } | null> {
    if (!config.xaiApiKey) {
        console.warn('[xAI] XAI_API_KEY not set — skipping paid fallback.');
        return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
        console.warn('[xAI] PAID fallback engaged (Tavily + DDG both empty) — 1 call.');
        const resp = await fetch(XAI_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.xaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: XAI_MODEL,
                input: [{ role: 'user', content: query }],
                tools: [{ type: 'web_search' }],
            }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!resp.ok) throw new Error(`xAI HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);

        const data = (await resp.json()) as XaiResponse;

        // The final answer lives in the output item of type "message".
        const message = (data.output ?? []).find(o => o.type === 'message');
        const block = message?.content?.find(c => c.type === 'output_text' || typeof c.text === 'string');
        const text = block?.text ?? '';

        const citations: Citation[] = (block?.annotations ?? [])
            .filter(a => a.type === 'url_citation' && a.url)
            .map((a, i) => ({
                url: a.url!,
                title: a.title || a.url!,
                snippet: '',
                relevance_score: Math.max(0.3, 1 - i * 0.1),
            }));

        if (!text) return null;
        const cost = data.usage?.cost_in_usd_ticks;
        console.warn(`[xAI] fallback done — ${citations.length} citations${cost ? ` (cost ticks: ${cost})` : ''}.`);
        return { content: text, citations };
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') console.error('[xAI] fallback timed out');
        else console.error('[xAI] fallback failed:', error.message);
        return null;
    }
}
