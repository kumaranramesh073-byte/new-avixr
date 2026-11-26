/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Groq API Module
   Server-side proxy for all Groq LLM calls. API key stays server-side.
   Uses Groq's OpenAI-compatible endpoint via the `openai` SDK.
   ═══════════════════════════════════════════════════════════════════════════ */

// import OpenAI from 'openai'; // Removed OpenAI sdk to fix hanging issue
import { config } from './config.js';
import type { ExecutionPlan, PlanStep, StepType } from './types.js';

// ─── Base Call ────────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function callGroq(
    system: string,
    user: string,
    maxTokens: number = 1200,
    attempt: number = 0
): Promise<string> {
    const MAX_RETRIES = 2;
    const controller = new AbortController();
    // Reasoning models (gpt-oss-120b etc.) burn thinking tokens before output —
    // 30s is too tight; 55s gives enough headroom without hanging the request.
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    console.log(`[LLM] Requesting ${config.model} via ${config.llmProvider}...`);
    try {
        const startTime = Date.now();
        const headers: Record<string, string> = {
            'Authorization': `Bearer ${config.llmApiKey}`,
            'Content-Type': 'application/json',
        };
        if (config.llmProvider === 'openrouter') {
            headers['HTTP-Referer'] = 'https://qsimutron.app';
            headers['X-Title'] = 'Q Simutron';
        }

        const body: Record<string, unknown> = {
            model: config.model,
            max_tokens: maxTokens > 4000 ? 4000 : maxTokens,
            messages: [
                { role: 'system', content: system },
                { role: 'user', content: user }
            ],
        };
        // For reasoning models on OpenRouter, cap thinking tokens to "low" effort.
        // JSON generation doesn't benefit from deep chain-of-thought; this cuts
        // latency from ~40s to ~10s without affecting output quality.
        if (config.llmProvider === 'openrouter') {
            body.reasoning = { effort: 'low' };
        }

        const response = await fetch(`${config.llmBaseUrl}/chat/completions`, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify(body),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errText = await response.text();
            // ── 429 rate-limit handling ──────────────────────────────────────
            // Only retry short per-minute (TPM) waits. A daily (TPD) limit or a
            // long suggested wait won't clear in seconds — fail fast so callers
            // can degrade to their fallback instead of stalling the request.
            if (response.status === 429) {
                const secMatch = errText.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
                const suggestedSec = secMatch
                    ? (parseInt(secMatch[1] || '0', 10) * 60) + parseFloat(secMatch[2])
                    : 5;
                const isDaily = /per day|TPD/i.test(errText);
                if (!isDaily && suggestedSec <= 10 && attempt < MAX_RETRIES) {
                    const waitMs = Math.round(suggestedSec * 1000) + 800;
                    console.warn(`[LLM] Rate limited (TPM). Retry ${attempt + 1}/${MAX_RETRIES} in ${waitMs}ms...`);
                    await sleep(waitMs);
                    return callGroq(system, user, maxTokens, attempt + 1);
                }
                console.error(`[LLM] Rate limited (${isDaily ? 'daily quota' : `wait ${suggestedSec}s`}) — not retrying.`);
            }
            console.error(`[LLM] HTTP Error ${response.status}:`, errText.slice(0, 200));
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const data = await response.json() as any;
        const duration = Date.now() - startTime;
        console.log(`[Groq] Received response from ${config.model} in ${duration}ms`);
        return data.choices?.[0]?.message?.content ?? '';
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error('[Groq] API Error: Request timed out after 55s');
            throw new Error('LLM call timed out after 55 seconds');
        }
        console.error('[Groq] API Error:', error.message);
        throw new Error(`Groq API call failed: ${error.message}`);
    }
}

// Re-export with legacy name so existing imports still work
export { callGroq as callClaude };

export function parseJSON<T>(raw: string, fallback: T): T {
    try {
        // Strip <think>...</think> blocks common in reasoning models
        const cleanedRaw = raw.replace(/<think>[\s\S]*?<\/think>/g, '');
        // Extract JSON specifically if it's buried in text
        const jsonMatch = cleanedRaw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim()) as T;
        }
        return JSON.parse(cleanedRaw.replace(/```json|```/g, '').trim()) as T;
    } catch {
        return fallback;
    }
}

// ─── Plan Generation ─────────────────────────────────────────────────────────

export async function generatePlan(query: string): Promise<ExecutionPlan> {
    const raw = await callGroq(
        `You are an enterprise AI orchestration planning agent for the Qsimutron platform.
Given a user query about enterprise operations, create a concise multi-step execution plan.
Return ONLY valid JSON, no markdown, no backticks:
{"steps":[{"id":1,"title":"Short action title","description":"What this retrieves/analyzes","type":"chart","dataSource":"Source system"}]}
Rules:
- Exactly 3–5 steps
- type must be one of: chart, table, map, text
- Use chart for KPIs/metrics, table for structured records, map for geospatial, text for analysis/recommendations
- dataSource: realistic enterprise system (Snowflake, SAP S4HANA, Azure Data Lake, Salesforce, OSI PI, IBM Maximo, etc.)
- Steps must be logically sequential`,
        query,
        800
    );

    return parseJSON<ExecutionPlan>(raw, {
        steps: [
            {
                id: '1',
                title: 'Analyze & Synthesize',
                description: query,
                type: 'text' as StepType,
                dataSource: 'Enterprise Knowledge Base',
            },
        ],
    });
}

// ─── Step Execution ───────────────────────────────────────────────────────────

export async function executeChartStep(
    query: string,
    step: PlanStep
): Promise<Record<string, unknown>> {
    const raw = await callGroq(
        `Return ONLY valid JSON (no markdown) for an enterprise metrics bar chart:
{"summary":"1-sentence finding from data.","chartType":"bar","data":[{"name":"Label","value":number}],"xKey":"name","bars":[{"key":"value","color":"#2563FF","name":"Metric Name"}]}
- 4–6 realistic data points
- Values should be realistic for enterprise metrics (scores 0-1, counts, percentages, etc.)
- Summary should reference the specific metric name`,
        `Query: "${query}"\nStep: "${step.title}" – ${step.description}`,
        600
    );
    return parseJSON(raw, {
        summary: 'Data retrieved successfully.',
        chartType: 'bar',
        data: [{ name: 'A', value: 0.9 }, { name: 'B', value: 0.5 }, { name: 'C', value: 0.3 }],
        xKey: 'name',
        bars: [{ key: 'value', color: '#2563FF', name: 'Score' }],
    });
}

export async function executeTableStep(
    query: string,
    step: PlanStep
): Promise<Record<string, unknown>> {
    const raw = await callGroq(
        `Return ONLY valid JSON (no markdown) for an enterprise data table:
{"summary":"1-sentence finding.","columns":["Col1","Col2","Col3","Col4"],"rows":[["v1","v2","v3","v4"]]}
- 4–6 columns with realistic enterprise field names
- 4–6 rows of realistic data
- Include status/category columns and date fields where appropriate`,
        `Query: "${query}"\nStep: "${step.title}" – ${step.description}`,
        700
    );
    return parseJSON(raw, {
        summary: 'Records retrieved.',
        columns: ['ID', 'Name', 'Status', 'Value', 'Date'],
        rows: [['001', 'Item A', 'Active', '95%', '2025-01-21']],
    });
}

export async function executeMapStep(
    query: string,
    step: PlanStep
): Promise<Record<string, unknown>> {
    const raw = await callGroq(
        `Return ONLY valid JSON (no markdown) for geospatial location data:
{"summary":"1-sentence finding about the locations.","locations":[{"name":"Location Name","lat":40.7,"lng":-96.7,"info":"Brief info","risk":"high"}]}
- 3–5 locations with realistic US or global coordinates
- risk: "high", "medium", or "low"
- Names should be realistic site/asset identifiers`,
        `Query: "${query}"\nStep: "${step.title}" – ${step.description}`,
        500
    );
    return parseJSON(raw, {
        summary: 'Locations identified.',
        locations: [{ name: 'Site-1', lat: 40.8, lng: -96.7, info: 'High priority', risk: 'high' }],
    });
}

export async function executeTextStep(
    query: string,
    step: PlanStep
): Promise<Record<string, unknown>> {
    const text = await callGroq(
        `You are an enterprise AI analyst for Qsimutron. Provide concise, actionable professional analysis.
Write 2–3 focused paragraphs (no bullet lists, no markdown headers).
Reference specific data findings and provide clear recommendations.`,
        `Original query: "${query}"\nStep being analyzed: "${step.title}" – ${step.description}`,
        600
    );
    return { summary: text };
}

export async function executeStep(
    query: string,
    step: PlanStep
): Promise<Record<string, unknown>> {
    switch (step.type) {
        case 'chart': return executeChartStep(query, step);
        case 'table': return executeTableStep(query, step);
        case 'map': return executeMapStep(query, step);
        case 'text':
        default: return executeTextStep(query, step);
    }
}
