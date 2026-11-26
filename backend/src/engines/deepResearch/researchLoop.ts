/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Loop Orchestrator
   Replaces Python LangGraph with a TypeScript while-loop.

   Flow:
       intake → decompose → search → collect → gap_eval
                ↑_________________________________| (loop if gaps)
                                                   ↓ (sufficient)
                                               synthesize → return
   ═══════════════════════════════════════════════════════════════════════════ */

import type { ResearchState, ResearchProgressEvent } from './types.js';
import {
    queryIntake,
    queryDecomposer,
    parallelSearchDispatcher,
    evidenceCollector,
    gapEvaluator,
    deepResearchSynthesizer,
} from './nodes.js';

import {
    queryIntakeLite,
    queryDecomposerLite,
    parallelSearchDispatcherLite,
    evidenceCollectorLite,
    gapEvaluatorLite,
    deepResearchSynthesizerLite,
} from './nodesLite.js';

export type ProgressCallback = (event: ResearchProgressEvent) => void;

/**
 * Run the full Q Simutron deep research pipeline.
 *
 * @param query     - The research question
 * @param depth     - surface | standard | deep | exhaustive
 * @param onProgress - Callback fired after each node completes (for WS streaming)
 * @returns Final research state with report
 */
export async function runDeepResearch(
    query: string,
    depth: 'surface' | 'standard' | 'deep' | 'exhaustive' = 'deep',
    mode: 'pro' | 'lite' = 'pro',
    onProgress?: ProgressCallback
): Promise<ResearchState> {
    // Initialize bare state
    let state: ResearchState = {
        query,
        depth,
        domain: '',
        intent: '',
        complexity: '',
        core_question: query,
        sub_intents: [],
        perspectives: [],
        sub_questions: [],
        search_queries: [],
        all_citations: [],
        evidence_chunks: [],
        iteration: 0,
        max_iterations: 4,
        coverage_score: 0,
        gaps_identified: [],
        sufficient: false,
        final_report: null,
        confidence_score: 0,
        total_sources: 0,
        elapsed_searches: 0,
        _n_questions: 5,
    };

    const emit = (node: string, extra?: Partial<ResearchProgressEvent>) => {
        if (!onProgress) return;
        onProgress({
            event: 'node_complete',
            node,
            iteration: state.iteration,
            coverage_score: state.coverage_score,
            total_sources: state.total_sources,
            sufficient: state.sufficient,
            report_ready: false,
            final_report: null,
            ...extra,
        });
    };

    const emitStatus = (message: string) => {
        onProgress?.({ event: 'status', message });
    };

    try {
        // ── Node 1: Intake ──
        emitStatus('Classifying research scope...');
        const intakeResult = mode === 'lite' ? await queryIntakeLite(state) : await queryIntake(state);
        state = { ...state, ...intakeResult };
        emit('intake');
        console.log(`[ResearchLoop] Intake complete: depth=${state.depth}, n_questions=${state._n_questions}`);

        // ── Iterative Loop ──
        while (!state.sufficient) {
            // Node 2: Decompose
            emitStatus(`Decomposing query into sub-questions (iteration ${state.iteration + 1})...`);
            const decomposeResult = mode === 'lite' ? await queryDecomposerLite(state) : await queryDecomposer(state);
            state = { ...state, ...decomposeResult };
            emit('decompose');
            console.log(`[ResearchLoop] Decomposed into ${state.sub_questions.length} sub-questions`);

            // Node 3: Parallel Search
            const searchEngine = mode === 'lite' ? 'DuckDuckGo' : 'Perplexity';
            emitStatus(`Searching web via ${searchEngine} (iteration ${state.iteration + 1})...`);
            const searchResult = mode === 'lite' ? await parallelSearchDispatcherLite(state) : await parallelSearchDispatcher(state);
            state = { ...state, ...searchResult };
            emit('search');
            console.log(`[ResearchLoop] Search complete: ${state.elapsed_searches} total searches`);

            // Node 4: Evidence Collection
            emitStatus('Collecting and ranking evidence...');
            const collectResult = mode === 'lite' ? await evidenceCollectorLite(state) : await evidenceCollector(state);
            state = { ...state, ...collectResult };
            emit('collect');
            console.log(`[ResearchLoop] Evidence collected: ${state.total_sources} unique sources`);

            // Node 5: Gap Evaluation (drives the loop)
            emitStatus(`Evaluating coverage: ${(state.coverage_score * 100).toFixed(0)}%...`);
            const gapResult = mode === 'lite' ? await gapEvaluatorLite(state) : await gapEvaluator(state);
            state = { ...state, ...gapResult };
            emit('gap_eval');
            console.log(`[ResearchLoop] Gap eval: coverage=${(state.coverage_score * 100).toFixed(0)}%, sufficient=${state.sufficient}`);
        }

        // ── Node 6: Synthesis ──
        const synthModel = mode === 'lite' ? 'StepFun' : 'DeepSeek-R1';
        emitStatus(`Writing final report with ${synthModel}...`);
        const synthesisResult = mode === 'lite' ? await deepResearchSynthesizerLite(state) : await deepResearchSynthesizer(state);
        state = { ...state, ...synthesisResult };
        emit('synthesize', { report_ready: true, final_report: state.final_report });
        console.log(`[ResearchLoop] Synthesis complete: confidence=${state.confidence_score}/10`);

        return state;
    } catch (error: any) {
        console.error('[ResearchLoop] Fatal error:', error.message);
        onProgress?.({ event: 'error', message: error.message });
        throw error;
    }
}
