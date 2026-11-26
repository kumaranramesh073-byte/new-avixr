/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Shared Types
   Mirrors the frontend's src/types/index.ts for type safety across the stack.
   ═══════════════════════════════════════════════════════════════════════════ */

export type StepType = 'chart' | 'table' | 'map' | 'text';

export type SessionStatus =
    | 'idle'
    | 'planning'
    | 'ready'
    | 'executing'
    | 'done'
    | 'error';

export type StepStatus = 'pending' | 'executing' | 'done' | 'error';

export interface PlanStep {
    id: string; // Changed to string (UUID) to match agent architecture
    title: string;
    description: string;
    type: StepType;
    dataSource: string;
}

export interface ExecutionPlan {
    steps: PlanStep[];
}

// ─── Chart Content ────────────────────────────────────────────────────────

export interface BarConfig {
    key: string;
    color: string;
    name: string;
}

export interface ChartContentData {
    summary: string;
    chartType: 'bar' | 'line';
    data: Record<string, string | number>[];
    xKey: string;
    bars: BarConfig[];
}

// ─── Table Content ────────────────────────────────────────────────────────

export interface TableContentData {
    summary: string;
    columns: string[];
    rows: string[][];
}

// ─── Map Content ──────────────────────────────────────────────────────────

export interface MapLocation {
    name: string;
    lat: number;
    lng: number;
    info: string;
    risk: 'high' | 'medium' | 'low';
}

export interface MapContentData {
    summary: string;
    locations: MapLocation[];
}

// ─── Text Content ─────────────────────────────────────────────────────────

export interface TextContentData {
    summary: string;
}

export type StreamEventType =
    | 'connected'
    | 'plan_ready'
    | 'step_start'
    | 'step_result'
    | 'step_done'
    | 'session_done'
    | 'error'
    | 'research_started'
    | 'research_progress'
    | 'research_complete';

export interface StreamEvent {
    type: StreamEventType;
    sessionId: string;
    data: Record<string, unknown>;
    timestamp: number;
}
