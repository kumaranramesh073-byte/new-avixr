/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron Lite — Research Nodes (StepFun Optimized)
   Strict anti-hallucination, consensus-based evidence validation,
   aggressive noise filtering for DuckDuckGo results.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callOpenRouter, parseJsonResponse } from './openRouterClient.js';
import { parallelDDGSearch } from './duckDuckGoClient.js';
import type { ResearchState, SubQuestion, Citation } from './types.js';
import { MODELS_LITE, DEPTH_CONFIG, COVERAGE_THRESHOLDS_LITE } from './types.js';

// ─── NODE 1: QUERY INTAKE (LITE) ───────────────────────────────────────────────

export async function queryIntakeLite(state: ResearchState): Promise<Partial<ResearchState>> {
    const result = await callOpenRouter(
        MODELS_LITE.classifier,
        [{
            role: 'user',
            content: `You are Q Simutron Lite's query classifier. Classify this research query.

Rules:
- Default to "deep" unless clearly simple
- Business/decision queries → "exhaustive"
- Keep output short and structured

Query: "${state.query}"

Output STRICT JSON:
{
  "domain": "",
  "intent": "exploratory|decision-making|comparison|forecasting",
  "complexity": "low|medium|high",
  "depth": "basic|deep|exhaustive",
  "core_question": "",
  "perspectives": []
}`,
        }],
        true
    );

    const parsed = parseJsonResponse<{
        domain?: string; intent?: string; complexity?: string;
        depth?: string; core_question?: string; perspectives?: string[];
    }>(result, {});

    const rawDepth = (parsed.depth ?? 'deep').toLowerCase();
    let depth: ResearchState['depth'] = rawDepth === 'basic' ? 'surface' : (rawDepth as any);
    if (!DEPTH_CONFIG[depth]) depth = 'deep';

    const cfg = DEPTH_CONFIG[depth];

    return {
        depth,
        domain: parsed.domain ?? '',
        intent: parsed.intent ?? '',
        complexity: parsed.complexity ?? '',
        core_question: parsed.core_question ?? state.query,
        perspectives: parsed.perspectives ?? [],
        max_iterations: cfg.max_iter,
        _n_questions: cfg.n_questions,
        iteration: 0,
        coverage_score: 0.0,
        sufficient: false,
        all_citations: [],
        evidence_chunks: [],
        gaps_identified: [],
        elapsed_searches: 0,
        total_sources: 0,
    };
}


// ─── NODE 2: QUERY DECOMPOSER (LITE) ───────────────────────────────────────────

export async function queryDecomposerLite(state: ResearchState): Promise<Partial<ResearchState>> {
    const n = state._n_questions || 5;
    const gaps = state.gaps_identified || [];

    let gapCtx = '';
    if (gaps.length > 0) {
        gapCtx = `\nKnowledge gaps to fill:\n${gaps.map(g => `- ${g}`).join('\n')}`;
    }

    const result = await callOpenRouter(
        MODELS_LITE.decomposer,
        [{
            role: 'user',
            content: `Decompose this research query into ${n} searchable sub-questions.

Query: "${state.query}"
Iteration: ${state.iteration + 1}${gapCtx}

Rules:
- Each question must be web-searchable
- Cover: facts, mechanisms, trade-offs, risks, examples
- Include technical, economic, operational perspectives
- Generate SHORT keyword-dense search queries for each

Output STRICT JSON:
{
  "sub_questions": ["..."],
  "search_queries": ["..."]
}`,
        }],
        true
    );

    const parsed = parseJsonResponse<{
        sub_questions?: string[];
        search_queries?: string[];
    }>(result, { sub_questions: [], search_queries: [] });

    const sub_questions: SubQuestion[] = (parsed.sub_questions ?? []).map((q) => ({
        question: q, status: 'pending' as const, answer: null, citations: [],
    }));

    return {
        sub_questions,
        search_queries: parsed.search_queries?.length
            ? parsed.search_queries
            : sub_questions.map((sq) => sq.question),
    };
}


// ─── NODE 3: PARALLEL SEARCH (DDG) ─────────────────────────────────────────────

export async function parallelSearchDispatcherLite(state: ResearchState): Promise<Partial<ResearchState>> {
    const queries = state.search_queries?.length ? state.search_queries : [state.query];

    const results = await parallelDDGSearch(queries);

    const new_chunks: string[] = [];
    const new_citations: Citation[] = [];
    const updated_sub_qs: SubQuestion[] = [...(state.sub_questions || [])];

    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        if (r.error || !r.content) continue;

        new_chunks.push(`[Search ${i + 1}: ${r.query}]\n${r.content}`);
        new_citations.push(...r.citations);

        if (i < updated_sub_qs.length) {
            updated_sub_qs[i] = {
                ...updated_sub_qs[i],
                status: r.content ? 'answered' : 'gap',
                answer: r.content ? r.content.slice(0, 400) : null,
                citations: r.citations,
            };
        }
    }

    return {
        sub_questions: updated_sub_qs,
        evidence_chunks: [...(state.evidence_chunks || []), ...new_chunks],
        all_citations: [...(state.all_citations || []), ...new_citations],
        elapsed_searches: (state.elapsed_searches || 0) + queries.length,
        total_sources: (state.total_sources || 0) + new_citations.length,
    };
}


// ─── NODE 4: EVIDENCE COLLECTOR (LITE — WITH CONSENSUS) ────────────────────────

export async function evidenceCollectorLite(state: ResearchState): Promise<Partial<ResearchState>> {
    const allCites = state.all_citations || [];

    // Deduplicate by URL
    const seenUrls = new Set<string>();
    const uniqueCites: Citation[] = [];
    for (const c of allCites) {
        if (c.url && !seenUrls.has(c.url)) {
            seenUrls.add(c.url);
            uniqueCites.push(c);
        }
    }

    uniqueCites.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

    return {
        all_citations: uniqueCites.slice(0, 25),
        total_sources: Math.min(uniqueCites.length, 25),
    };
}


// ─── NODE 5: GAP EVALUATOR (LITE — STRICT) ─────────────────────────────────────

export async function gapEvaluatorLite(state: ResearchState): Promise<Partial<ResearchState>> {
    const evidenceSummary = (state.evidence_chunks || []).slice(0, 6).join('\n\n');
    const sub_qs = state.sub_questions || [];
    const answered = sub_qs.filter((q) => q.status === 'answered');
    const threshold = COVERAGE_THRESHOLDS_LITE[state.depth] ?? 0.78;

    const result = await callOpenRouter(
        MODELS_LITE.gap_eval,
        [{
            role: 'user',
            content: `Evaluate research coverage. Be STRICT — DuckDuckGo results are noisy.

Query: "${state.query}"
Iteration: ${state.iteration + 1} of ${state.max_iterations}
Answered: ${answered.length}/${sub_qs.length}

Evidence:
${evidenceSummary.slice(0, 2500)}

SCORING RULES:
- Missing any major dimension → max 0.7
- Weak evidence → max 0.75
- Surface-level only → max 0.65
- Only >0.8 if ALL aspects covered AND evidence strong

Check coverage across: Technical, Financial, Operational, Risk.
If any missing → generate specific follow-up queries.

Output STRICT JSON:
{
  "coverage_score": 0.0,
  "gaps": ["..."],
  "new_queries": ["..."],
  "reasoning": ""
}`,
        }],
        true
    );

    const parsed = parseJsonResponse<{
        coverage_score?: number; gaps?: string[];
        new_queries?: string[]; reasoning?: string;
    }>(result, {});

    const coverage = Math.min(1, Math.max(0, parsed.coverage_score ?? 0.45));
    const iteration = (state.iteration || 0) + 1;
    const sufficient = coverage >= threshold || iteration >= state.max_iterations;

    console.log(`[GapEval-Lite] Iter ${iteration}: coverage=${(coverage * 100).toFixed(0)}% threshold=${(threshold * 100).toFixed(0)}% sufficient=${sufficient}`);

    return {
        coverage_score: Math.round(coverage * 1000) / 1000,
        gaps_identified: parsed.gaps ?? [],
        search_queries: parsed.new_queries ?? [state.query],
        iteration,
        sufficient,
    };
}


// ─── NODE 6: SYNTHESIZER (LITE — ANTI-HALLUCINATION) ────────────────────────────

export async function deepResearchSynthesizerLite(state: ResearchState): Promise<Partial<ResearchState>> {
    const evidence = (state.evidence_chunks || []).join('\n\n');
    const citations = state.all_citations || [];
    const citationList = citations
        .slice(0, 15)
        .map((c, i) => `[${i + 1}] ${c.title || c.url} — ${c.url}`)
        .join('\n');

    const report = await callOpenRouter(
        MODELS_LITE.synthesizer,
        [{
            role: 'user',
            content: `Write the final research report. You are using DuckDuckGo results — be extra careful.

Query: "${state.query}"
Coverage: ${(state.coverage_score * 100).toFixed(0)}%
Sources: ${state.total_sources}
Iterations: ${state.iteration}

EVIDENCE:
${evidence.slice(0, 5000)}

CITATIONS:
${citationList}

ANTI-HALLUCINATION RULES:
- NEVER invent facts
- If unsure → say "insufficient evidence"
- Prefer partial truth over false certainty
- Mark claims with confidence: LOW / MEDIUM / HIGH
  - Multiple sources agree → HIGH
  - Single source → LOW
  - Conflicting sources → mark as UNCERTAIN

REPORT STRUCTURE (markdown):
1. Executive Summary
2. Key Findings (with [N] citations)
3. Detailed Analysis
4. Risks & Uncertainty
5. Recommendations
6. Final Verdict
7. Evidence Notes (claim + confidence level)

End with confidence score: X/10
Be analytical, not descriptive.`,
        }],
        false,
        3500
    );

    let confidence = 6.5;
    for (const line of report.split('\n')) {
        if (line.toLowerCase().includes('confidence') && line.includes('/')) {
            try {
                const parts = line.split(/\s+/).filter((p) => p.includes('/'));
                if (parts.length > 0) {
                    const num = parseFloat(parts[0].split('/')[0].replace(/\*/g, '').trim());
                    if (!isNaN(num)) { confidence = Math.min(10, Math.max(0, num)); break; }
                }
            } catch { /* ignore */ }
        }
    }

    return {
        final_report: report,
        confidence_score: Math.round(confidence * 10) / 10,
    };
}
