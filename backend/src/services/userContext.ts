/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — User Context, Business DNA & Telemetry Service
   Canonical persistence for business_dna_profiles, agent_outputs, agent_logs,
   and subscription plan lookup (never hardcoded).
   ═══════════════════════════════════════════════════════════════════════════ */

import { supabaseAdmin } from '../middleware/auth.js';

export interface BusinessDNA {
    id?: string;
    organizationId?: string;
    userId?: string;
    companyName: string;
    companyWebsite: string;
    companyDescription: string;
    industry: string;
    teamSize: string;
    goals: string[];
    updatedAt?: string;
}

function asStringArray(v: unknown): string[] {
    if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
    return [];
}

function asString(v: unknown, fallback = ''): string {
    if (v === null || v === undefined) return fallback;
    return String(v);
}

function normalizeWebsite(v: unknown): string | null {
    const raw = asString(v).trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
}

function rowToDNA(row: Record<string, any>): BusinessDNA {
    return {
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        companyName: asString(row.company_name),
        companyWebsite: asString(row.company_website),
        companyDescription: asString(row.company_description),
        industry: asString(row.industry),
        teamSize: asString(row.team_size),
        goals: asStringArray(row.goals),
        updatedAt: row.updated_at,
    };
}

export async function loadActiveBusinessDNA(
    userId: string,
    organizationId: string
): Promise<BusinessDNA | null> {
    const { data, error } = await supabaseAdmin
        .from('business_dna_profiles')
        .select('id, organization_id, user_id, company_name, company_website, company_description, industry, team_size, goals, updated_at')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('[DNA] Failed to load active DNA:', error.message);
        throw new Error(`Failed to load Business DNA: ${error.message}`);
    }

    return data ? rowToDNA(data) : null;
}

export async function saveActiveBusinessDNA(
    userId: string,
    organizationId: string,
    input: Partial<BusinessDNA>
): Promise<BusinessDNA> {
    const now = new Date().toISOString();
    const companyName = asString(input.companyName).trim();
    const industry = asString(input.industry).trim();
    if (!companyName || !industry) {
        throw new Error('companyName and industry are required');
    }

    const goals = asStringArray(input.goals);

    // Inspect existing active DNA profile(s) for this (org, user) so saving
    // UPDATES the active profile in place instead of creating duplicate profiles.
    const { data: existingRows, error: listErr } = await supabaseAdmin
        .from('business_dna_profiles')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

    if (listErr) {
        throw new Error(`Failed to inspect existing Business DNA: ${listErr.message}`);
    }

    const activeList = existingRows ?? [];
    const existingActiveId = activeList[0]?.id as string | undefined;

    if (activeList.length > 1) {
        const extraIds = activeList.slice(1).map((r: { id: string }) => r.id);
        const { error: deactErr } = await supabaseAdmin
            .from('business_dna_profiles')
            .update({ is_active: false, updated_at: now })
            .in('id', extraIds);
        if (deactErr) {
            throw new Error(`Failed to deactivate duplicate DNA profiles: ${deactErr.message}`);
        }
    }

    const dnaPayload = {
        organization_id: organizationId,
        user_id: userId,
        company_name: companyName,
        company_website: normalizeWebsite(input.companyWebsite),
        company_description: asString(input.companyDescription).trim() || null,
        industry,
        team_size: asString(input.teamSize).trim() || null,
        goals,
        is_active: true,
        updated_at: now,
    };

    const writeQuery = existingActiveId
        ? supabaseAdmin
            .from('business_dna_profiles')
            .update(dnaPayload)
            .eq('id', existingActiveId)
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .select('id, organization_id, user_id, company_name, company_website, company_description, industry, team_size, goals, updated_at')
            .single()
        : supabaseAdmin
            .from('business_dna_profiles')
            .insert(dnaPayload)
            .select('id, organization_id, user_id, company_name, company_website, company_description, industry, team_size, goals, updated_at')
            .single();

    const { data, error } = await writeQuery;

    if (error || !data) {
        throw new Error(`Failed to save Business DNA: ${error?.message ?? 'unknown error'}`);
    }

    return rowToDNA(data);
}

export async function deactivateActiveBusinessDNA(userId: string, organizationId: string): Promise<void> {
    const { error } = await supabaseAdmin
        .from('business_dna_profiles')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true);

    if (error) {
        throw new Error(`Failed to reset Business DNA: ${error.message}`);
    }
}

export function formatDnaSummary(dna: BusinessDNA | null): string {
    if (!dna) return '';
    return [
        `Company: ${dna.companyName} (${dna.industry})`,
        dna.companyWebsite ? `Website: ${dna.companyWebsite}` : '',
        dna.companyDescription ? `Description: ${dna.companyDescription}` : '',
        dna.teamSize ? `Team Size: ${dna.teamSize}` : '',
        dna.goals?.length ? `Goals: ${dna.goals.join(', ')}` : '',
    ].filter(Boolean).join(' | ');
}

/**
 * Formats persisted Business DNA into clean agent prompt parameters.
 */
export function dnaToUserParams(dna: BusinessDNA | null, overrides?: Record<string, string>): Record<string, string> {
    const base: Record<string, string> = dna ? {
        companyName: dna.companyName,
        companyWebsite: dna.companyWebsite,
        companyDescription: dna.companyDescription,
        industry: dna.industry,
        companySize: dna.teamSize,
        teamSize: dna.teamSize,
        geography: 'Global',
        priority: dna.goals[0] || 'Growth & Resilience',
        goals: dna.goals.join(', '),
    } : {};

    return { ...base, ...(overrides ?? {}) };
}

export async function getOrganizationPlan(organizationId?: string): Promise<string> {
    if (!organizationId) return 'Free';
    const { data, error } = await supabaseAdmin
        .from('billing_subscriptions')
        .select('plan, status')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.warn('[Billing] Failed to read billing_subscriptions:', error.message);
        return 'Free';
    }
    return data?.plan || 'Free';
}

export async function logAgentActivity(params: {
    agentType: string;
    action: string;
    status: 'success' | 'error' | 'started';
    organizationId?: string;
    userId?: string;
    sessionId?: string;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    const basePayload: Record<string, unknown> = {
        agent_type: params.agentType,
        action: params.action,
        status: params.status,
    };

    const fullPayload: Record<string, unknown> = {
        ...basePayload,
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.userId ? { user_id: params.userId } : {}),
        ...(params.sessionId ? { session_id: params.sessionId } : {}),
        ...(params.metadata ? { metadata: params.metadata } : {}),
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert(fullPayload);
    if (error && (error.code === 'PGRST204' || /column .* does not exist/i.test(error.message))) {
        const { error: fbErr } = await supabaseAdmin.from('agent_logs').insert(basePayload);
        if (fbErr) {
            console.warn('[AgentLogs] Failed to insert log:', fbErr.message);
        }
        return;
    }
    if (error) {
        console.warn('[AgentLogs] Failed to insert log:', error.message);
    }
}

export async function saveAgentOutput(params: {
    organizationId: string;
    userId: string;
    sessionId?: string | null;
    agentName: string;
    moduleName?: string | null;
    query: string;
    outputData: Record<string, unknown>;
    kpis?: unknown;
    confidenceScore?: number | null;
    executionTimeMs?: number;
}): Promise<void> {
    const { error } = await supabaseAdmin.from('agent_outputs').insert({
        organization_id: params.organizationId,
        user_id: params.userId,
        session_id: params.sessionId ?? null,
        agent_name: params.agentName,
        module_name: params.moduleName ?? null,
        query: params.query,
        output_data: params.outputData,
        kpis: params.kpis ?? null,
        confidence_score: params.confidenceScore ?? null,
        execution_time_ms: params.executionTimeMs ?? 0,
    });

    if (error) {
        console.warn('[AgentOutputs] Failed to persist output:', error.message);
    }
}
