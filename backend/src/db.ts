/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — Supabase PostgreSQL Session Store
   Persistent store for sessions and simulation_steps using Supabase.
   All queries are scoped by userId & organizationId.
   ═══════════════════════════════════════════════════════════════════════════ */

import { supabaseAdmin } from './middleware/auth.js';
import type { ExecutionPlan, SessionStatus, StepStatus } from './types.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionRow {
    id: string;
    organizationId: string;
    userId: string;
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
    organizationId: string;
    stepOrder: number;
    title: string;
    description: string;
    type: string;
    dataSource: string;
    agentName?: string;
    status: StepStatus;
    content: Record<string, unknown> | null;
    createdAt: number;
}

function mapSession(row: Record<string, any>): SessionRow {
    return {
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        query: row.query,
        agentMode: row.agent_mode,
        status: row.status as SessionStatus,
        progress: row.progress ?? 0,
        currentStep: row.current_step ?? -1,
        plan: (row.plan as ExecutionPlan) ?? null,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
    };
}

function mapStep(row: Record<string, any>): StepRow {
    return {
        id: row.id,
        sessionId: row.session_id,
        organizationId: row.organization_id,
        stepOrder: row.step_order ?? 0,
        title: row.title,
        description: row.description ?? '',
        type: row.type ?? 'text',
        dataSource: row.data_source ?? '',
        agentName: row.agent_name ?? undefined,
        status: row.status as StepStatus,
        content: (row.content as Record<string, unknown>) ?? null,
        createdAt: new Date(row.created_at).getTime(),
    };
}

// ─── DB Operations (Supabase Persistent Store) ────────────────────────────────

export const db = {
    async createSession(
        id: string,
        query: string,
        agentMode: string,
        userId: string,
        organizationId: string
    ): Promise<SessionRow> {
        const nowIso = new Date().toISOString();
        const { data, error } = await supabaseAdmin
            .from('sessions')
            .insert({
                id,
                organization_id: organizationId,
                user_id: userId,
                query,
                agent_mode: agentMode,
                status: 'planning',
                progress: 0,
                current_step: -1,
                plan: null,
                created_at: nowIso,
                updated_at: nowIso,
            })
            .select('*')
            .single();

        if (error || !data) {
            throw new Error(`Failed to persist session: ${error?.message ?? 'unknown error'}`);
        }
        return mapSession(data);
    },

    async updateSessionPlan(id: string, plan: ExecutionPlan): Promise<void> {
        const { error } = await supabaseAdmin
            .from('sessions')
            .update({
                plan,
                status: 'ready',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to update session plan: ${error.message}`);
        }
    },

    async updateSessionStatus(id: string, status: SessionStatus, progress: number, currentStep: number): Promise<void> {
        const { error } = await supabaseAdmin
            .from('sessions')
            .update({
                status,
                progress,
                current_step: currentStep,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('[DB] updateSessionStatus failed:', error.message);
        }
    },

    async completeSession(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('sessions')
            .update({
                status: 'done',
                progress: 100,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('[DB] completeSession failed:', error.message);
        }
    },

    async markSessionError(id: string): Promise<void> {
        const { error } = await supabaseAdmin
            .from('sessions')
            .update({
                status: 'error',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('[DB] markSessionError failed:', error.message);
        }
    },

    async getSession(id: string, userId?: string, organizationId?: string): Promise<SessionRow | undefined> {
        let query = supabaseAdmin.from('sessions').select('*').eq('id', id);
        if (userId) query = query.eq('user_id', userId);
        if (organizationId) query = query.eq('organization_id', organizationId);

        const { data, error } = await query.maybeSingle();
        if (error) {
            throw new Error(`Failed to fetch session: ${error.message}`);
        }
        return data ? mapSession(data) : undefined;
    },

    async listSessions(userId: string, organizationId: string): Promise<SessionRow[]> {
        const { data, error } = await supabaseAdmin
            .from('sessions')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            throw new Error(`Failed to list sessions: ${error.message}`);
        }
        return (data ?? []).map(mapSession);
    },

    async updateSession(
        id: string,
        userId: string,
        organizationId: string,
        patch: { query?: string; agentMode?: string; status?: SessionStatus }
    ): Promise<SessionRow | undefined> {
        const updatePayload: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };
        if (typeof patch.query === 'string' && patch.query.trim()) {
            updatePayload.query = patch.query.trim();
        }
        if (typeof patch.agentMode === 'string' && patch.agentMode.trim()) {
            updatePayload.agent_mode = patch.agentMode.trim();
        }
        if (patch.status) {
            updatePayload.status = patch.status;
        }

        const { data, error } = await supabaseAdmin
            .from('sessions')
            .update(updatePayload)
            .eq('id', id)
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .select('*')
            .maybeSingle();

        if (error) {
            throw new Error(`Failed to update session: ${error.message}`);
        }
        return data ? mapSession(data) : undefined;
    },

    async deleteSession(id: string, userId: string, organizationId: string): Promise<boolean> {
        // Delete child steps first to respect FK constraints
        await supabaseAdmin
            .from('simulation_steps')
            .delete()
            .eq('session_id', id)
            .eq('organization_id', organizationId);

        const { data, error } = await supabaseAdmin
            .from('sessions')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .eq('organization_id', organizationId)
            .select('id');

        if (error) {
            throw new Error(`Failed to delete session: ${error.message}`);
        }
        return Array.isArray(data) && data.length > 0;
    },

    // ─── Step Queries ────────────────────────────────────────────────────────

    async insertStep(step: StepRow): Promise<void> {
        const nowIso = new Date(step.createdAt || Date.now()).toISOString();
        const { error } = await supabaseAdmin
            .from('simulation_steps')
            .insert({
                id: step.id,
                session_id: step.sessionId,
                organization_id: step.organizationId,
                step_order: step.stepOrder,
                title: step.title,
                description: step.description,
                type: step.type,
                data_source: step.dataSource,
                agent_name: step.agentName ?? null,
                status: step.status,
                content: step.content,
                created_at: nowIso,
                updated_at: nowIso,
            });

        if (error) {
            console.error('[DB] insertStep failed:', error.message);
        }
    },

    async updateStep(id: string, sessionId: string, status: StepStatus, content: Record<string, unknown> | null): Promise<void> {
        const { error } = await supabaseAdmin
            .from('simulation_steps')
            .update({
                status,
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('session_id', sessionId);

        if (error) {
            console.error('[DB] updateStep failed:', error.message);
        }
    },

    async getSteps(sessionId: string): Promise<StepRow[]> {
        const { data, error } = await supabaseAdmin
            .from('simulation_steps')
            .select('*')
            .eq('session_id', sessionId)
            .order('step_order', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch simulation steps: ${error.message}`);
        }
        return (data ?? []).map(mapStep);
    },
};
