/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — OpenRouter LLM Client
   Multi-model async caller for research node reasoning tasks.
   ═══════════════════════════════════════════════════════════════════════════ */

import { config } from '../../config.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Call an OpenRouter model and return the response text.
 * Handles timeout, error logging, and JSON mode.
 */
export async function callOpenRouter(
    model: string,
    messages: ChatMessage[],
    jsonMode = false,
    maxTokens = 2000
): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    const payload: Record<string, unknown> = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
    };

    if (jsonMode) {
        payload.response_format = { type: 'json_object' };
    }

    try {
        const startTime = Date.now();
        console.log(`[OpenRouter] Requesting ${model}...`);

        const resp = await fetch(OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.openRouterApiKey}`,
                'HTTP-Referer': 'https://qsimutron.app',
                'X-Title': 'Q Simutron',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
            const errText = await resp.text();
            console.error(`[OpenRouter] HTTP ${resp.status}:`, errText);
            throw new Error(`OpenRouter HTTP ${resp.status}: ${errText}`);
        }

        const data = (await resp.json()) as any;
        const duration = Date.now() - startTime;
        const content = data.choices?.[0]?.message?.content ?? '';
        console.log(`[OpenRouter] ${model} responded in ${duration}ms (${content.length} chars)`);
        return content;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error(`OpenRouter call to ${model} timed out after 60s`);
        }
        throw error;
    }
}

/**
 * Parse JSON from an LLM response, stripping <think> blocks and markdown fences.
 */
export function parseJsonResponse<T>(raw: string, fallback: T): T {
    try {
        const cleaned = raw
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/```json|```/g, '')
            .trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]) as T;
        }
        return JSON.parse(cleaned) as T;
    } catch {
        return fallback;
    }
}
