/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Supabase PostgreSQL Session Store
   Persistent store for sessions and step results using Supabase PostgreSQL.
   Tables are auto-created on startup if they don't exist.
   ═══════════════════════════════════════════════════════════════════════════ */

import type { ExecutionPlan, SessionStatus, StepStatus } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionRow {
    id: string;
    query: string;
    agentMode: string;
    status: SessionStatus;
    progress: number;
    currentStep: number;
    plan: ExecutionPlan | null;
    createdAt: number;
    updatedAt: number;
}

export interface StepRow {
    id: string;
    sessionId: string;
    stepOrder: number;
    title: string;
    description: string;
    type: string;
    dataSource: string;
    status: StepStatus;
    content: Record<string, unknown> | null;
    createdAt: number;
}

// ─── In-Memory Storage ────────────────────────────────────────────────────────

const localSessions = new Map<string, SessionRow>();
const localSteps = new Map<string, StepRow[]>();

// ─── DB Operations (Pure In-Memory) ───────────────────────────────────────────

export const db = {
    async createSession(id: string, query: string, agentMode: string): Promise<SessionRow> {
        const now = Date.now();
        const row: SessionRow = {
            id, query, agentMode,
            status: 'planning',
            progress: 0,
            currentStep: -1,
            plan: null,
            createdAt: now,
            updatedAt: now,
        };
        localSessions.set(id, row);
        localSteps.set(id, []);
        return row;
    },

    async updateSessionPlan(id: string, plan: ExecutionPlan): Promise<void> {
        const session = localSessions.get(id);
        if (session) {
            session.plan = plan;
            session.status = 'ready';
            session.updatedAt = Date.now();
        }
    },

    async updateSessionStatus(id: string, status: SessionStatus, progress: number, currentStep: number): Promise<void> {
        const session = localSessions.get(id);
        if (session) {
            session.status = status;
            session.progress = progress;
            session.currentStep = currentStep;
            session.updatedAt = Date.now();
        }
    },

    async completeSession(id: string): Promise<void> {
        const session = localSessions.get(id);
        if (session) {
            session.status = 'done';
            session.progress = 100;
            session.updatedAt = Date.now();
        }
    },

    async markSessionError(id: string): Promise<void> {
        const session = localSessions.get(id);
        if (session) {
            session.status = 'error';
            session.updatedAt = Date.now();
        }
    },

    async getSession(id: string): Promise<SessionRow | undefined> {
        return localSessions.get(id);
    },

    async listSessions(): Promise<SessionRow[]> {
        return Array.from(localSessions.values())
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50);
    },

    async deleteSession(id: string): Promise<boolean> {
        const had = localSessions.has(id);
        localSessions.delete(id);
        localSteps.delete(id);
        return had;
    },

    // ─── Step Queries ────────────────────────────────────────────────────────

    async insertStep(step: StepRow): Promise<void> {
        const steps = localSteps.get(step.sessionId) || [];
        steps.push(step);
        localSteps.set(step.sessionId, steps);
    },

    async updateStep(id: string, sessionId: string, status: StepStatus, content: Record<string, unknown> | null): Promise<void> {
        const steps = localSteps.get(sessionId) || [];
        const step = steps.find(s => s.id === id);
        if (step) {
            step.status = status;
            step.content = content;
        }
    },

    async getSteps(sessionId: string): Promise<StepRow[]> {
        const steps = localSteps.get(sessionId) || [];
        return [...steps].sort((a, b) => a.stepOrder - b.stepOrder);
    },
};
