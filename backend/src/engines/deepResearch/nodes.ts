/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Agent Nodes
   All 6 research loop nodes ported from Python to TypeScript.
   Each node uses rich, structured prompts for high-quality reasoning.
   ═══════════════════════════════════════════════════════════════════════════ */

import { callOpenRouter, parseJsonResponse } from './openRouterClient.js';
import { parallelSearch } from './searchClient.js';
import type { ResearchState, SubQuestion, Citation } from './types.js';
import { MODELS, DEPTH_CONFIG, COVERAGE_THRESHOLDS } from './types.js';

// ─── NODE 1: QUERY INTAKE ──────────────────────────────────────────────────────

/**
 * Classify the query domain, intent, complexity, and depth.
 * Sets iteration params and initializes state.
 */
export async function queryIntake(state: ResearchState): Promise<Partial<ResearchState>> {
    let depth = state.depth;
    let domain = '';
    let intent = '';
    let complexity = '';
    let core_question = state.query;
    let sub_intents: string[] = [];
    let perspectives: string[] = [];

    // Auto-classify if depth not firmly set
    if (!depth || depth === 'deep') {
        const result = await callOpenRouter(
            MODELS.classifier,
            [{
                role: 'user',
                content: `You are the Query Intake Analyzer for Q Simutron.

Your job is to analyze the user query and classify:

🎯 Tasks:
Identify:
  - Domain (e.g., AI, finance, healthcare, engineering)
  - Intent (exploratory, decision-making, comparison, forecasting)
  - Complexity (low / medium / high)
Assign research depth:
  - basic → simple factual queries
  - deep → analytical / multi-step reasoning
  - exhaustive → strategic / high-stakes / ambiguous problems
Extract:
  - Core question
  - Hidden sub-intents
  - Required perspectives (technical, financial, operational, risk)

📤 Output (STRICT JSON)
{
  "domain": "",
  "intent": "",
  "complexity": "",
  "depth": "basic | deep | exhaustive",
  "core_question": "",
  "sub_intents": [],
  "perspectives": []
}

⚠️ Rules:
- Default to deep unless clearly simple
- If business or decision-heavy → exhaustive
- Always infer hidden intent (don't be literal)

Be precise and structured.

Query: "${state.query}"`,
            }],
            true
        );

        const parsed = parseJsonResponse<{
            domain?: string;
            intent?: string;
            complexity?: string;
            depth?: string;
            core_question?: string;
            sub_intents?: string[];
            perspectives?: string[];
        }>(result, {});

        // Map 'basic' to 'surface' for compatibility
        const rawDepth = (parsed.depth ?? 'deep').toLowerCase();
        depth = rawDepth === 'basic' ? 'surface' : (rawDepth as ResearchState['depth']);
        if (!DEPTH_CONFIG[depth]) depth = 'deep';

        domain = parsed.domain ?? '';
        intent = parsed.intent ?? '';
        complexity = parsed.complexity ?? '';
        core_question = parsed.core_question ?? state.query;
        sub_intents = parsed.sub_intents ?? [];
        perspectives = parsed.perspectives ?? [];
    }

    const cfg = DEPTH_CONFIG[depth];

    return {
        depth,
        domain,
        intent,
        complexity,
        core_question,
        sub_intents,
        perspectives,
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


// ─── NODE 2: QUERY DECOMPOSER ──────────────────────────────────────────────────

/**
 * Break the main query into focused, searchable sub-questions.
 * On iteration > 0, incorporates identified gaps.
 */
export async function queryDecomposer(state: ResearchState): Promise<Partial<ResearchState>> {
    const n = state._n_questions || 5;
    const gaps = state.gaps_identified || [];

    let gapContext = '';
    if (gaps.length > 0) {
        gapContext = `\n\nPrevious search identified these knowledge gaps to fill:\n${gaps.map(g => `- ${g}`).join('\n')}`;
    }

    const prompt = `You are the Query Decomposer in Q Simutron.

Your job is to convert a user query into high-quality sub-questions.

Main research query: "${state.query}"
Research depth: ${state.depth}
Current iteration: ${state.iteration + 1}${gapContext}

🎯 Tasks:
Generate exactly ${n} sub-questions.
Ensure:
  - Full coverage of the topic
  - Depth + breadth
  - Inclusion of:
    - Core facts
    - Mechanisms (how it works)
    - Trade-offs
    - Risks
    - Real-world examples
  - Include multiple perspectives:
    - Technical
    - Economic
    - Operational
    - Strategic

📤 Output (STRICT JSON)
{
  "sub_questions": ["question 1", "question 2", ...],
  "search_queries": ["optimized search query 1", "optimized search query 2", ...]
}

search_queries are web-optimized versions of the sub_questions (shorter, keyword-dense).

⚠️ Rules:
- Each question must be searchable
- Avoid redundancy
- Avoid vague questions
- Prefer specific, answerable queries

Think like a research planner.`;

    const result = await callOpenRouter(
        MODELS.decomposer,
        [{ role: 'user', content: prompt }],
        true
    );

    const parsed = parseJsonResponse<{
        sub_questions?: string[];
        search_queries?: string[];
    }>(result, { sub_questions: [], search_queries: [] });

    const sub_questions: SubQuestion[] = (parsed.sub_questions ?? []).map((q) => ({
        question: q,
        status: 'pending' as const,
        answer: null,
        citations: [],
    }));

    const search_queries = parsed.search_queries?.length
        ? parsed.search_queries
        : sub_questions.map((sq) => sq.question);

    return { sub_questions, search_queries };
}


// ─── NODE 3: PARALLEL SEARCH DISPATCHER ───────────────────────────────────────

/**
 * Fire all search queries simultaneously via Perplexity sonar-pro.
 */
export async function parallelSearchDispatcher(state: ResearchState): Promise<Partial<ResearchState>> {
    const queries = state.search_queries?.length ? state.search_queries : [state.query];
    const focus = `business analytics, ${state.query.slice(0, 60)}`;

    const results = await parallelSearch(queries, focus);

    const new_chunks: string[] = [];
    const new_citations: Citation[] = [];
    const updated_sub_qs: SubQuestion[] = [...(state.sub_questions || [])];

    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.error) continue;

        if (result.content) {
            new_chunks.push(`[Search ${i + 1}: ${result.query}]\n${result.content}`);
        }
        new_citations.push(...result.citations);

        // Mark corresponding sub-question
        if (i < updated_sub_qs.length) {
            updated_sub_qs[i] = {
                ...updated_sub_qs[i],
                status: result.content ? 'answered' : 'gap',
                answer: result.content ? result.content.slice(0, 500) : null,
                citations: result.citations,
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


// ─── NODE 4: EVIDENCE COLLECTOR ───────────────────────────────────────────────

/**
 * Deduplicate citations, rank by relevance, prune to top 30.
 * Pure logic — no LLM call needed.
 */
export async function evidenceCollector(state: ResearchState): Promise<Partial<ResearchState>> {
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

    // Sort by relevance descending
    uniqueCites.sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0));

    // Keep top 30
    const topCites = uniqueCites.slice(0, 30);

    return {
        all_citations: topCites,
        total_sources: topCites.length,
    };
}


// ─── NODE 5: GAP EVALUATOR (🔥 THE CORE) ────────────────────────────────────

/**
 * THE BRAIN OF THE DEEP RESEARCH LOOP.
 * Scores coverage 0.0–1.0 and identifies what's still missing.
 * Drives the loop: if coverage < threshold, routes back to search.
 */
export async function gapEvaluator(state: ResearchState): Promise<Partial<ResearchState>> {
    const evidenceSummary = (state.evidence_chunks || []).slice(0, 8).join('\n\n');
    const sub_qs = state.sub_questions || [];
    const answered = sub_qs.filter((q) => q.status === 'answered');
    const threshold = COVERAGE_THRESHOLDS[state.depth] ?? 0.78;

    const prompt = `You are the Gap Evaluator — the core intelligence loop of Q Simutron.

Your job is to determine how complete the research is and what is missing.

Original query: "${state.query}"
Research iteration: ${state.iteration + 1} of ${state.max_iterations}
Sub-questions answered: ${answered.length} / ${sub_qs.length}

Evidence collected so far:
${evidenceSummary.slice(0, 3000)}

🎯 Tasks:
Evaluate coverage:
  - Are all sub-questions answered?
  - Is depth sufficient?
  - Are multiple perspectives covered?
Identify gaps:
  - Missing data
  - Weak evidence
  - Missing viewpoints
  - Shallow explanations
Generate:
  - Targeted follow-up queries

📊 Coverage Scoring:
Score from 0.0 to 1.0 based on:
  - Breadth (30%)
  - Depth (30%)
  - Evidence quality (20%)
  - Perspective diversity (20%)

📤 Output (STRICT JSON)
{
  "coverage_score": 0.0,
  "gaps": [""],
  "new_queries": [""],
  "reasoning": ""
}

⚠️ Rules:
- Be critical — assume it's incomplete unless proven
- Never inflate score
- If any major dimension is missing → score < 0.75
- Ensure queries are gap-specific

🔥 Special Rule:
Check coverage across:
  - Technical
  - Financial
  - Operational
  - Risk

If any is missing → MUST generate new queries.

You are the gatekeeper of quality.`;

    const result = await callOpenRouter(
        MODELS.gap_eval,
        [{ role: 'user', content: prompt }],
        true
    );

    const parsed = parseJsonResponse<{
        coverage_score?: number;
        gaps?: string[];
        new_queries?: string[];
        reasoning?: string;
    }>(result, {});

    const coverage = Math.min(1, Math.max(0, parsed.coverage_score ?? 0.5));
    const gaps = parsed.gaps ?? ['Unable to evaluate gaps'];
    const new_queries = parsed.new_queries ?? [state.query];

    const iteration = (state.iteration || 0) + 1;
    const sufficient = coverage >= threshold || iteration >= state.max_iterations;

    console.log(`[GapEval] Iteration ${iteration}: coverage=${(coverage * 100).toFixed(0)}% threshold=${(threshold * 100).toFixed(0)}% sufficient=${sufficient}`);

    return {
        coverage_score: Math.round(coverage * 1000) / 1000,
        gaps_identified: gaps,
        search_queries: new_queries,
        iteration,
        sufficient,
    };
}


// ─── NODE 6: DEEP RESEARCH SYNTHESIZER ────────────────────────────────────────

/**
 * Uses DeepSeek-R1's chain-of-thought reasoning to write the final report.
 * Produces a decision-grade intelligence report with inline citations.
 */
export async function deepResearchSynthesizer(state: ResearchState): Promise<Partial<ResearchState>> {
    const evidence = (state.evidence_chunks || []).join('\n\n');
    const citations = state.all_citations || [];
    const citationList = citations
        .slice(0, 20)
        .map((c, i) => `[${i + 1}] ${c.title || c.url} — ${c.url}`)
        .join('\n');

    const prompt = `You are the Deep Research Synthesizer for Q Simutron.

You generate the final intelligence report from collected evidence.

Research query: "${state.query}"
Depth level: ${state.depth}
Coverage achieved: ${(state.coverage_score * 100).toFixed(0)}%
Total sources: ${state.total_sources}
Search iterations: ${state.iteration}

EVIDENCE BASE:
${evidence.slice(0, 6000)}

AVAILABLE CITATIONS:
${citationList}

🎯 Tasks:
Produce a decision-grade report.

📄 Structure:
1. Executive Summary
   - Clear, high-level insight
   - Key conclusion
2. Key Findings
   - Bullet points with inline citations like [1]
   - Evidence-backed
3. Detailed Analysis
   - Deep explanation
   - Multi-perspective reasoning
4. Risks & Limitations
   - Uncertainty
   - Contradictions
5. Recommendations
   - Actionable
   - Prioritized
6. Final Verdict
   - Clear answer to query
7. Citations
   - List all sources

⚠️ Rules:
- Do NOT hallucinate
- Only use available evidence
- Highlight uncertainty
- Cite sources inline using [N] notation
- Use specific data, numbers, percentages where available
- Flag low-confidence claims with (low confidence)
- Be analytical, not descriptive
- End with a confidence score: X/10
- Write like a senior analyst

Format as clean markdown.
Be structured, precise, and insightful.`;

    const report = await callOpenRouter(
        MODELS.synthesizer,
        [{ role: 'user', content: prompt }],
        false,
        4000
    );

    // Extract confidence score from report
    let confidence = 7.5;
    for (const line of report.split('\n')) {
        if (line.toLowerCase().includes('confidence') && line.includes('/')) {
            try {
                const parts = line.split(/\s+/).filter((p) => p.includes('/'));
                if (parts.length > 0) {
                    const num = parseFloat(parts[0].split('/')[0].replace(/\*/g, '').trim());
                    if (!isNaN(num)) {
                        confidence = Math.min(10, Math.max(0, num));
                        break;
                    }
                }
            } catch { /* ignore */ }
        }
    }

    return {
        final_report: report,
        confidence_score: Math.round(confidence * 10) / 10,
    };
}
