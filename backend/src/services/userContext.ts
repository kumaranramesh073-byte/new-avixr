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
    annualRevenue: string;
    teamSize: string;
    goals: string[];
    riskAppetite: string;
    primaryMarkets: string[];
    customerType: string;
    monthlySpend: string;
    monthlyRevenue: string;
    burnRate: string;
    growthRate: string;
    aiPriority: string;
    userRole: string;
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

function parseOptionalMetric(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const cleaned = String(v).replace(/[%$,\s]/g, '').trim();
    if (!cleaned) return null;
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : null;
}

function normalizeWebsite(v: unknown): string | null {
    const raw = asString(v).trim();
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
}

function rowToDNA(row: Record<string, any>): BusinessDNA {
    const meta = (row.metadata && typeof row.metadata === 'object' ? row.metadata : {}) as Record<string, unknown>;
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
        annualRevenue: asString(row.annual_revenue ?? meta.annualRevenue),
        riskAppetite: asString(row.risk_appetite ?? meta.riskAppetite),
        primaryMarkets: asStringArray(
            Array.isArray(row.primary_markets) && row.primary_markets.length > 0
                ? row.primary_markets
                : meta.primaryMarkets
        ),
        customerType: asString(row.customer_type ?? meta.customerType),
        monthlySpend: asString(row.monthly_spend ?? meta.monthlySpend),
        monthlyRevenue: asString(row.monthly_revenue ?? meta.monthlyRevenue),
        burnRate: asString(row.burn_rate ?? meta.burnRate),
        growthRate: asString(row.growth_rate ?? meta.growthRate),
        aiPriority: asString(row.ai_priority ?? meta.aiPriority),
        userRole: asString(row.user_role ?? meta.userRole),
        updatedAt: row.updated_at,
    };
}

export async function loadActiveBusinessDNA(
    userId: string,
    organizationId: string
): Promise<BusinessDNA | null> {
    const { data, error } = await supabaseAdmin
        .from('business_dna_profiles')
        .select('*')
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
    const primaryMarkets = asStringArray(input.primaryMarkets);
    const burnRateNum = parseOptionalMetric(input.burnRate);
    const growthRateNum = parseOptionalMetric(input.growthRate);

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

    const basePayload = {
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

    // Structured payload (requires 001_change1_schema_and_dna.sql columns)
    const structuredPayload = {
        ...basePayload,
        annual_revenue: asString(input.annualRevenue).trim() || null,
        risk_appetite: asString(input.riskAppetite).trim() || null,
        primary_markets: primaryMarkets,
        customer_type: asString(input.customerType).trim() || null,
        monthly_spend: asString(input.monthlySpend).trim() || null,
        monthly_revenue: asString(input.monthlyRevenue).trim() || null,
        burn_rate: burnRateNum,
        growth_rate: growthRateNum,
        ai_priority: asString(input.aiPriority).trim() || null,
        user_role: asString(input.userRole).trim() || null,
        metadata: {},
    };

    const writeQuery = existingActiveId
        ? supabaseAdmin
            .from('business_dna_profiles')
            .update(structuredPayload)
            .eq('id', existingActiveId)
            .eq('organization_id', organizationId)
            .eq('user_id', userId)
            .select('*')
            .single()
        : supabaseAdmin
            .from('business_dna_profiles')
            .insert(structuredPayload)
            .select('*')
            .single();

    const { data, error } = await writeQuery;

    if (!error && data) {
        return rowToDNA(data);
    }

    // If migration 001 has not been applied yet (PostgREST PGRST204 unknown column),
    // store extended fields in metadata temporarily without losing data.
    if (error && (error.code === 'PGRST204' || /column .* does not exist/i.test(error.message))) {
        console.warn('[DNA] Structured DNA columns missing — run backend/migrations/001_change1_schema_and_dna.sql. Falling back to metadata.');
        const fallbackPayload = {
            ...basePayload,
            metadata: {
                annualRevenue: asString(input.annualRevenue).trim(),
                riskAppetite: asString(input.riskAppetite).trim(),
                primaryMarkets,
                customerType: asString(input.customerType).trim(),
                monthlySpend: asString(input.monthlySpend).trim(),
                monthlyRevenue: asString(input.monthlyRevenue).trim(),
                burnRate: asString(input.burnRate).trim(),
                growthRate: asString(input.growthRate).trim(),
                aiPriority: asString(input.aiPriority).trim(),
                userRole: asString(input.userRole).trim(),
            },
        };
        const fbQuery = existingActiveId
            ? supabaseAdmin
                .from('business_dna_profiles')
                .update(fallbackPayload)
                .eq('id', existingActiveId)
                .select('*')
                .single()
            : supabaseAdmin
                .from('business_dna_profiles')
                .insert(fallbackPayload)
                .select('*')
                .single();

        const { data: fbData, error: fbErr } = await fbQuery;

        if (fbErr || !fbData) {
            throw new Error(`Failed to save Business DNA: ${fbErr?.message ?? 'unknown error'}`);
        }
        return rowToDNA(fbData);
    }

    throw new Error(`Failed to save Business DNA: ${error?.message ?? 'unknown error'}`);
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
        dna.userRole ? `Role: ${dna.userRole}` : '',
        dna.companyWebsite ? `Website: ${dna.companyWebsite}` : '',
        dna.companyDescription ? `Description: ${dna.companyDescription}` : '',
        dna.annualRevenue ? `Annual Revenue: ${dna.annualRevenue}` : '',
        dna.monthlyRevenue ? `Monthly Revenue: ${dna.monthlyRevenue}` : '',
        dna.monthlySpend ? `Monthly Spend: ${dna.monthlySpend}` : '',
        dna.burnRate ? `Burn Rate: ${dna.burnRate}` : '',
        dna.growthRate ? `Growth Rate: ${dna.growthRate}` : '',
        dna.teamSize ? `Team Size: ${dna.teamSize}` : '',
        dna.primaryMarkets?.length ? `Markets: ${dna.primaryMarkets.join(', ')}` : '',
        dna.customerType ? `Customer Type: ${dna.customerType}` : '',
        dna.riskAppetite ? `Risk Appetite: ${dna.riskAppetite}` : '',
        dna.aiPriority ? `AI Priority: ${dna.aiPriority}` : '',
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
        revenueRange: dna.annualRevenue,
        riskTolerance: dna.riskAppetite,
        geography: dna.primaryMarkets.join(', ') || 'Global',
        primaryMarkets: dna.primaryMarkets.join(', '),
        businessModel: dna.customerType ? `${dna.customerType} / ${dna.industry}` : dna.industry,
        customerType: dna.customerType,
        priority: dna.goals.join(', ') || 'Growth & Resilience',
        goals: dna.goals.join(', '),
        monthlySpend: dna.monthlySpend,
        monthlyRevenue: dna.monthlyRevenue,
        burnRate: dna.burnRate,
        growthRate: dna.growthRate,
        aiPriority: dna.aiPriority,
        userRole: dna.userRole,
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
