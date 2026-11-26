/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Generic Module Intelligence Agent
   One agent runner that powers EVERY intelligence module (Forecasting, Risk,
   Market, Finance, Sentiment, Competitors, …). Each module supplies a persona;
   this runner returns the Standard Module Intelligence schema so the frontend
   can render them all with ONE reusable dashboard shell.

   The schema deliberately bakes in the mentor's "platform-defining" features:
     · why_it_matters[]  → "Why This Matters" interpretation layer
     · confidence{}      → AI confidence scoring
     · scenarios[]       → multi-scenario / decision-impact simulation
     · recommendations[] → autonomous, priority-ranked recommendations
     · opportunities[]   → opportunity radar
     · executive_summary → narrative engine
     · ripple_mermaid    → ripple-effect visualization
   ═══════════════════════════════════════════════════════════════════════════ */

import { callGroq, parseJSON } from '../groq.js';
import { gatherRealWorldContext } from './groundingAgent.js';
import type { Citation } from '../engines/deepResearch/types.js';

// ─── Standard schema ───────────────────────────────────────────────────────
export interface ModuleKPI { label: string; value: number | string; unit?: string; trend: 'up' | 'down' | 'flat'; delta?: string; confidence?: number; }
export interface WhyItMatters { signal: string; why: string; impact: string; recommended_action: string; }
export interface RootCause { factor: string; pct: number; }
export interface ModuleAlert { severity: 'critical' | 'high' | 'medium' | 'low'; title: string; probability: number; timeline: string; impact: string; }
export interface ModuleOpportunity { title: string; potential: number; note: string; }
export interface ModuleRecommendation { priority: 'high' | 'medium' | 'low'; action: string; impact: string; roi: string; complexity: 'low' | 'medium' | 'high'; }
export interface ModuleScenario { name: string; revenue_impact: string; risk_index: number; market_share?: string; note: string; recommended?: boolean; }
export interface ModuleConfidence { overall: number; data_quality: number; signal_strength: number; scenario_stability: number; }
export interface TimelineEntry { horizon: string; outlook: string; events: string[] }

export interface StandardModuleOutput {
    module: string;
    title: string;
    executive_summary: string;
    kpis: ModuleKPI[];
    why_it_matters: WhyItMatters[];
    root_cause: RootCause[];
    alerts: ModuleAlert[];
    opportunities: ModuleOpportunity[];
    recommendations: ModuleRecommendation[];
    scenarios: ModuleScenario[];
    ripple_mermaid: string;
    confidence: ModuleConfidence;
    timeline?: TimelineEntry[];
    charts?: Record<string, unknown>;
    company_name: string;
    generated_at: string;
    /** Real web sources the analysis was grounded on (when grounding is enabled). */
    sources?: Citation[];
    /** True when the run was grounded on live web search results. */
    grounded?: boolean;
}

// ─── Persona contract ──────────────────────────────────────────────────────
export interface ModulePersona {
    module: string;          // 'forecasting'
    title: string;           // 'Forecasting Engine'
    /** 2-4 sentence system persona describing the agent's role & lens. */
    persona: string;
    /** Extra instructions: what to emphasise + what to put in `charts`. */
    chartsHint: string;
    /** A module-specific fallback used when the LLM is unavailable. */
    fallback: (company: string, industry: string) => StandardModuleOutput;
    /** When set, the module is grounded on live web search for these topics. */
    searchFocus?: string;
}

// ─── Shared base system prompt ─────────────────────────────────────────────
function buildSystem(persona: ModulePersona): string {
    return `You are the ${persona.title} agent for Q-SIMUTRON, a Bloomberg-grade enterprise strategic simulation platform.

${persona.persona}

You do NOT just report numbers — you INTERPRET. For every signal you must explain WHY it is happening, the EXPECTED IMPACT, and the RECOMMENDED ACTION. You think in scenarios (best / base / worst). You attach a confidence level. You write like a McKinsey partner briefing a CEO — precise, quantified, decisive.

When a "LIVE WEB INTELLIGENCE" block is provided below, GROUND your analysis in it: base your figures, competitor names, and events on those real findings rather than inventing them, and reflect any conflicting or thin evidence in a lower confidence score. Never fabricate facts that contradict the provided sources.

Return ONLY valid JSON (no markdown, no prose outside JSON) matching this EXACT schema:
{
  "executive_summary": "One sharp narrative paragraph a CEO would actually read",
  "kpis": [ {"label":"","value":0,"unit":"/100 or % or $","trend":"up|down|flat","delta":"+5pts","confidence":0-100} ],   // 4 KPIs
  "why_it_matters": [ {"signal":"<metric/headline>","why":"<root cause>","impact":"<quantified consequence>","recommended_action":"<what leadership should do>"} ],   // 3-4 items
  "root_cause": [ {"factor":"","pct":0} ],   // 3-4, pct sum ~100
  "alerts": [ {"severity":"critical|high|medium|low","title":"","probability":0-100,"timeline":"e.g. 30 days","impact":""} ],   // 3-5
  "opportunities": [ {"title":"","potential":0-100,"note":""} ],   // 3
  "recommendations": [ {"priority":"high|medium|low","action":"","impact":"","roi":"e.g. +6% margin","complexity":"low|medium|high"} ],   // 3-4
  "scenarios": [ {"name":"Best Case|Base Case|Worst Case","revenue_impact":"+11%","risk_index":0-100,"market_share":"+3% or Stable","note":"","recommended":true|false} ],   // exactly 3
  "ripple_mermaid": ["graph LR","  A[Cause]:::danger --> B[Effect]:::warn","  classDef danger fill:#ef4444,color:#fff","  classDef warn fill:#eab308,color:#000","  classDef safe fill:#22c55e,color:#fff"],   // ARRAY OF STRING LINES, one diagram line each, 6-9 nodes
  "confidence": {"overall":0-100,"data_quality":0-100,"signal_strength":0-100,"scenario_stability":0-100},
  "charts": { ${persona.chartsHint} }
}

${persona.chartsHint ? 'The "charts" object MUST contain exactly the keys described above with realistic, internally-consistent numbers.' : ''}`;
}

// ─── Runner ────────────────────────────────────────────────────────────────
export async function runModuleAgent(
    persona: ModulePersona,
    userParams: Record<string, string>,
    publicDataContext = ''
): Promise<StandardModuleOutput> {
    const company = userParams.companyName || `${userParams.industry} Co.`;
    const industry = userParams.industry || 'the sector';
    console.log(`[Module:${persona.module}] Running for ${company}…`);

    // ── Grounding: when the persona declares a searchFocus, run the multi-step
    // web-search agent FIRST and feed its real evidence into the prompt. ──
    let sources: Citation[] = [];
    let grounded = false;
    if (persona.searchFocus && !publicDataContext) {
        try {
            const g = await gatherRealWorldContext(persona.searchFocus, userParams);
            if (g.ok) {
                publicDataContext = g.context;
                sources = g.citations;
                grounded = true;
            }
        } catch (err: any) {
            console.warn(`[Module:${persona.module}] Grounding failed (${err.message}) — continuing ungrounded.`);
        }
    }

    const userPrompt = `TARGET COMPANY: ${company}
${userParams.companyWebsite ? `Website: ${userParams.companyWebsite}` : ''}
${userParams.companyDescription ? `What they do: ${userParams.companyDescription}` : ''}
Industry: ${industry}
Team Size: ${userParams.teamSize || userParams.companySize || ''}
Strategic Goals: ${userParams.goals || userParams.priority || ''}

PUBLIC MARKET INTELLIGENCE:
${publicDataContext || 'No live feed — use your industry knowledge to produce specific, realistic intelligence for this exact company.'}

Produce your ${persona.title} assessment for ${company}. Return the JSON.`;

    const fallback = persona.fallback(company, industry);

    let raw = '';
    try {
        // 2000 tokens comfortably fits the full StandardModuleSchema JSON.
        // 3500 caused over-generation and compounded reasoning-model latency.
        raw = await callGroq(buildSystem(persona), userPrompt, 2000);
    } catch (err: any) {
        console.warn(`[Module:${persona.module}] LLM failed (${err.message}) — using fallback.`);
        return { ...fallback, sources, grounded };
    }

    const parsed = parseJSON<StandardModuleOutput>(raw, fallback);

    // ── Normalise + harden (never let a bad LLM response break the dashboard) ──
    const out: StandardModuleOutput = { ...fallback, ...parsed };
    out.module = persona.module;
    out.title = persona.title;
    out.company_name = company;
    out.generated_at = new Date().toISOString();

    const arr = <T,>(v: unknown, fb: T[]): T[] => (Array.isArray(v) && v.length ? (v as T[]) : fb);
    out.kpis = arr(parsed.kpis, fallback.kpis);
    out.why_it_matters = arr(parsed.why_it_matters, fallback.why_it_matters);
    out.root_cause = arr(parsed.root_cause, fallback.root_cause);
    out.alerts = arr(parsed.alerts, fallback.alerts);
    out.opportunities = arr(parsed.opportunities, fallback.opportunities);
    out.recommendations = arr(parsed.recommendations, fallback.recommendations);
    out.scenarios = arr(parsed.scenarios, fallback.scenarios);
    out.confidence = (parsed.confidence && typeof parsed.confidence.overall === 'number') ? parsed.confidence : fallback.confidence;
    out.charts = (parsed.charts && typeof parsed.charts === 'object') ? parsed.charts : fallback.charts;
    if (!parsed.executive_summary) out.executive_summary = fallback.executive_summary;

    // Mermaid arrives as an array of lines (safe JSON) — join into one diagram.
    const rawMermaid = parsed.ripple_mermaid as unknown;
    if (Array.isArray(rawMermaid)) out.ripple_mermaid = (rawMermaid as string[]).join('\n');
    else if (typeof rawMermaid === 'string' && rawMermaid.trim()) out.ripple_mermaid = rawMermaid;
    else out.ripple_mermaid = fallback.ripple_mermaid;
    if (out.ripple_mermaid.includes('```')) {
        out.ripple_mermaid = out.ripple_mermaid.replace(/```mermaid\s*/g, '').replace(/```\s*/g, '').trim();
    }

    // Clamp numeric ranges
    const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    out.confidence = {
        overall: clamp(out.confidence.overall),
        data_quality: clamp(out.confidence.data_quality),
        signal_strength: clamp(out.confidence.signal_strength),
        scenario_stability: clamp(out.confidence.scenario_stability),
    };
    out.alerts.forEach(a => { a.probability = clamp(a.probability); });
    out.opportunities.forEach(o => { o.potential = clamp(o.potential); });
    out.scenarios.forEach(s => { s.risk_index = clamp(s.risk_index); });

    // Attach real web sources (proof) gathered by the grounding agent.
    out.sources = sources;
    out.grounded = grounded;

    console.log(`[Module:${persona.module}] Done. KPIs:${out.kpis.length} alerts:${out.alerts.length} conf:${out.confidence.overall} grounded:${grounded} sources:${sources.length}`);
    return out;
}

// ─── Fallback helper (keeps persona fallbacks terse) ───────────────────────
export function baseFallback(
    module: string, title: string, company: string,
    over: Partial<StandardModuleOutput>
): StandardModuleOutput {
    return {
        module, title, company_name: company,
        executive_summary: `${title} analysis for ${company} is operating on synthesized intelligence while the live model is unavailable. Core signals remain within expected ranges; review the recommendations below and re-run for a live read.`,
        kpis: [
            { label: 'Composite Score', value: 62, unit: '/100', trend: 'up', delta: '+4pts', confidence: 70 },
            { label: 'Risk Level', value: 48, unit: '/100', trend: 'flat', delta: 'Stable', confidence: 65 },
            { label: 'Momentum', value: 55, unit: '/100', trend: 'up', delta: '+6pts', confidence: 68 },
            { label: 'Confidence', value: 72, unit: '/100', trend: 'up', delta: '+2pts', confidence: 72 },
        ],
        why_it_matters: [
            { signal: 'Composite Score 62', why: 'Mixed signals across the sector', impact: 'Stable but watch for downside', recommended_action: 'Re-run with live data for precision' },
        ],
        root_cause: [{ factor: 'Market conditions', pct: 50 }, { factor: 'Internal execution', pct: 30 }, { factor: 'Competitive pressure', pct: 20 }],
        alerts: [{ severity: 'medium', title: 'Live model temporarily unavailable', probability: 100, timeline: 'now', impact: 'Showing synthesized baseline' }],
        opportunities: [{ title: 'Re-run for live intelligence', potential: 80, note: 'Live model produces company-specific, real-named insights' }],
        recommendations: [{ priority: 'medium', action: 'Re-run the simulation', impact: 'Live, specific analysis', roi: 'n/a', complexity: 'low' }],
        scenarios: [
            { name: 'Best Case', revenue_impact: '+10%', risk_index: 35, market_share: '+3%', note: 'Favourable conditions hold', recommended: false },
            { name: 'Base Case', revenue_impact: '+4%', risk_index: 50, market_share: 'Stable', note: 'Expected trajectory', recommended: true },
            { name: 'Worst Case', revenue_impact: '-8%', risk_index: 72, market_share: '-4%', note: 'Downside materialises', recommended: false },
        ],
        ripple_mermaid: `graph LR\n  A[Market Signal]:::warn --> B[${company}]\n  B --> C[Outcome]:::safe\n  classDef warn fill:#eab308,color:#000\n  classDef safe fill:#22c55e,color:#fff`,
        confidence: { overall: 70, data_quality: 65, signal_strength: 60, scenario_stability: 68 },
        charts: {},
        generated_at: new Date().toISOString(),
        ...over,
    };
}
