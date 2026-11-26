/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Engine Types
   State schema, citations, sub-questions, and depth configuration.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Citation {
    url: string;
    title: string;
    snippet: string;
    relevance_score: number;
}

export interface SubQuestion {
    question: string;
    status: 'pending' | 'searching' | 'answered' | 'gap';
    answer: string | null;
    citations: Citation[];
}

export interface ResearchState {
    // Input
    query: string;
    depth: 'surface' | 'standard' | 'deep' | 'exhaustive';

    // Intake classification
    domain: string;
    intent: string;
    complexity: string;
    core_question: string;
    sub_intents: string[];
    perspectives: string[];

    // Decomposition
    sub_questions: SubQuestion[];
    search_queries: string[];

    // Evidence
    all_citations: Citation[];
    evidence_chunks: string[];

    // Loop control
    iteration: number;
    max_iterations: number;
    coverage_score: number;
    gaps_identified: string[];
    sufficient: boolean;

    // Output
    final_report: string | null;
    confidence_score: number;
    total_sources: number;
    elapsed_searches: number;

    // Internal hint
    _n_questions: number;
}

export interface ResearchProgressEvent {
    event: 'started' | 'node_complete' | 'status' | 'complete' | 'error';
    node?: string;
    iteration?: number;
    coverage_score?: number;
    total_sources?: number;
    sufficient?: boolean;
    report_ready?: boolean;
    final_report?: string | null;
    message?: string;
}

export const DEPTH_CONFIG: Record<string, { max_iter: number; n_questions: number }> = {
    surface:    { max_iter: 1, n_questions: 3 },
    standard:   { max_iter: 2, n_questions: 5 },
    deep:       { max_iter: 4, n_questions: 7 },
    exhaustive: { max_iter: 5, n_questions: 10 },
};

export const COVERAGE_THRESHOLDS: Record<string, number> = {
    surface:    0.50,
    standard:   0.65,
    deep:       0.78,
    exhaustive: 0.88,
};

export const COVERAGE_THRESHOLDS_LITE: Record<string, number> = {
    surface:    0.50,
    standard:   0.55,
    deep:       0.65,
    exhaustive: 0.78,
};

/** Model assignments per node role — all free-tier OpenRouter models */
export const MODELS = {
    decomposer:  'qwen/qwen3-235b-a22b:free',
    gap_eval:    'meta-llama/llama-3.3-70b-instruct:free',
    synthesizer: 'deepseek/deepseek-r1:free',
    classifier:  'mistralai/mistral-7b-instruct:free',
} as const;

export const MODELS_LITE = {
    decomposer:  'stepfun/step-3.5-flash:free',
    gap_eval:    'stepfun/step-3.5-flash:free',
    synthesizer: 'stepfun/step-3.5-flash:free',
    classifier:  'stepfun/step-3.5-flash:free',
} as const;
