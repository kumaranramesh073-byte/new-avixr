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
    const burnRateNum = input.burnRate !== undefined && input.burnRate !== '' && !Number.isNaN(Number(input.burnRate))
        ? Number(input.burnRate)
        : null;
    const growthRateNum = input.growthRate !== undefined && input.growthRate !== '' && !Number.isNaN(Number(input.growthRate))
        ? Number(input.growthRate)
        : null;

    // Deactivate any previously active DNA profiles for this (org, user) so only ONE active row exists
    const { error: deactErr } = await supabaseAdmin
        .from('business_dna_profiles')
        .update({ is_active: false, updated_at: now })
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('is_active', true);

    if (deactErr) {
        throw new Error(`Failed to deactivate prior DNA profile: ${deactErr.message}`);
    }

    const basePayload = {
        organization_id: organizationId,
        user_id: userId,
        company_name: companyName,
        company_website: asString(input.companyWebsite).trim() || null,
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

    const { data, error } = await supabaseAdmin
        .from('business_dna_profiles')
        .insert(structuredPayload)
        .select('*')
        .single();

    if (!error && data) {
        return rowToDNA(data);
    }

    // If migration 001 has not been applied yet (PostgREST PGRST204 unknown column),
    // store extended fields in metadata temporarily without losing data.
    if (error && (error.code === 'PGRST204' || /column .* does not exist/i.test(error.message))) {
        console.warn('[DNA] Structured DNA columns missing — run backend/migrations/001_change1_schema_and_dna.sql. Falling back to metadata.');
        const { data: fbData, error: fbErr } = await supabaseAdmin
            .from('business_dna_profiles')
            .insert({
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
            })
            .select('*')
            .single();

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
    const payload: Record<string, unknown> = {
        agent_type: params.agentType,
        action: params.action,
        status: params.status,
    };

    const { error } = await supabaseAdmin.from('agent_logs').insert(payload);
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
