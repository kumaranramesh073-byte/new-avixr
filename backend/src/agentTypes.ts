/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Types Supplement
   Adds Qsimutron specific agent and tooling types.
   ═══════════════════════════════════════════════════════════════════════════ */

import { type PlanStep } from './types.js';

export type AgentType =
    | 'Orchestrator'
    | 'MLInsight'
    | 'InfoRetrieval'
    | 'Dashboard'
    | 'Optimizer'
    | 'PredictiveAnalysis'
    | 'Finance'
    | 'StrategyOptimization'
    | 'RiskSynthesis'
    | 'Personalization';

export interface OrchestrationStep extends PlanStep {
    stepOrder: number;
    agent: AgentType;
}

export interface OrchestrationPlan {
    steps: OrchestrationStep[];
}

// Qsimutron abstract data return type
export interface ApplicationDataObject {
    type: string;
    id: string;
    properties: Record<string, unknown>;
    data?: any; // Nested tool output (ChartContentData, etc)
}
