/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron — Subscription Entitlement & Free 3-Simulation Limit Service
   Enforces:
     - New/Free accounts get a hard lifetime maximum of 3 COMPLETED simulations
     - 4th simulation attempt returns HTTP 403 { success: false, code: 'FREE_LIMIT_REACHED', ... }
     - Concurrency-safe (DB row lock + per-user in-process mutex)
     - Retries/duplicate requests do not double-count
     - Failed simulations release their slot without burning quota
     - Deleting sessions/simulations does not reset completed usage
     - Active paid plans (Basic/Plus/Pro/Enterprise, unexpired) lift the free limit
   ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto';
import { supabaseAdmin } from '../middleware/auth.js';

export const MAX_FREE_SIMULATIONS = 3;

export class FreeLimitReachedError extends Error {
    readonly httpStatus = 403;
    readonly code = 'FREE_LIMIT_REACHED';
    readonly completedCount: number;

    constructor(completedCount = MAX_FREE_SIMULATIONS) {
        super('Your free simulation limit has been reached. Please upgrade your plan to continue.');
        this.completedCount = completedCount;
    }
}

export interface OrganizationEntitlement {
    plan: string;
    isPaidPlan: boolean;
    status: string;
    currentPeriodEnd: string | null;
    freeLimit: number;
    freeCompletedCount: number;
    freeRemaining: number;
}

export interface EntitlementStore {
    getActiveSubscription(organizationId: string): Promise<{
        plan: string;
        status: string;
        currentPeriodEnd: string | null;
    } | null>;
    getFreeCompletedCount(userId: string): Promise<number>;
    reserveSlot(params: {
        userId: string;
        organizationId: string;
        requestKey: string;
        sourceEndpoint: string;
    }): Promise<{ allowed: boolean; completedCount: number; alreadyReserved: boolean }>;
    completeSlot(params: { userId: string; organizationId: string; requestKey: string; sourceEndpoint: string }): Promise<void>;
    releaseSlot(params: { userId: string; requestKey: string }): Promise<void>;
}

const PAID_PLAN_NAMES = new Set(['Basic', 'Plus', 'Pro', 'Enterprise']);

function isPaidSubscriptionActive(sub: {
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
} | null): boolean {
    if (!sub) return false;
    if (sub.status !== 'active') return false;
    if (!PAID_PLAN_NAMES.has(sub.plan)) return false;
    if (sub.currentPeriodEnd && new Date(sub.currentPeriodEnd).getTime() <= Date.now()) {
        return false;
    }
    return true;
}

// Per-user async queue lock (guards concurrent requests inside the same Node process)
const userLocks = new Map<string, Promise<unknown>>();
async function withUserMutex<T>(userId: string, work: () => Promise<T>): Promise<T> {
    const prev = userLocks.get(userId) ?? Promise.resolve();
    const run = prev.then(work, work);
    const marker = run.catch(() => {});
    userLocks.set(userId, marker);
    try {
        return await run;
    } finally {
        if (userLocks.get(userId) === marker) {
            userLocks.delete(userId);
        }
    }
}

// Fallback in-flight tracker & idempotency cache when 005 SQL RPC is not yet migrated
const fallbackInFlight = new Map<string, Set<string>>();
const fallbackCompletedKeys = new Set<string>();

function isRpcMissing(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    return error.code === 'PGRST202' || /could not find the function|does not exist/i.test(error.message || '');
}

export function createSupabaseEntitlementStore(): EntitlementStore {
    return {
        async getActiveSubscription(organizationId) {
            const { data, error } = await supabaseAdmin
                .from('billing_subscriptions')
                .select('plan, status, current_period_end')
                .eq('organization_id', organizationId)
                .eq('status', 'active')
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error || !data) return null;
            return {
                plan: String(data.plan || 'Free'),
                status: String(data.status || 'active'),
                currentPeriodEnd: data.current_period_end ?? null,
            };
        },

        async getFreeCompletedCount(userId) {
            // Try dedicated table from 005 migration first
            const { data: usageRow, error: usageErr } = await supabaseAdmin
                .from('free_simulation_usage')
                .select('completed_count')
                .eq('user_id', userId)
                .maybeSingle();

            if (!usageErr && usageRow) {
                return Number(usageRow.completed_count || 0);
            }

            // Fallback when 005 migration hasn't been executed yet:
            // Count persistent deletion-proof EntitlementQuota logs AND simulations rows, take MAX
            const [simsRes, logsRes] = await Promise.all([
                supabaseAdmin
                    .from('simulations')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId),
                supabaseAdmin
                    .from('agent_logs')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('agent_type', 'EntitlementQuota')
                    .eq('action', 'CompletedSimulation')
                    .eq('status', 'success'),
            ]);
            return Math.max(simsRes.count ?? 0, logsRes.count ?? 0);
        },

        async reserveSlot({ userId, organizationId, requestKey, sourceEndpoint }) {
            const { data, error } = await supabaseAdmin.rpc('reserve_free_simulation_slot', {
                p_user_id: userId,
                p_organization_id: organizationId,
                p_request_key: requestKey,
                p_source_endpoint: sourceEndpoint,
                p_max_free: MAX_FREE_SIMULATIONS,
            });

            if (!error && Array.isArray(data) && data[0]) {
                return {
                    allowed: Boolean(data[0].allowed),
                    completedCount: Number(data[0].completed_count || 0),
                    alreadyReserved: Boolean(data[0].already_reserved),
                };
            }

            if (!isRpcMissing(error)) {
                throw new Error(`Failed to reserve simulation quota: ${error?.message || 'unknown error'}`);
            }

            // Fallback serialized path (protected by per-user mutex)
            const completed = await this.getFreeCompletedCount(userId);
            const activeSet = fallbackInFlight.get(userId) || new Set<string>();

            if (activeSet.has(requestKey) || fallbackCompletedKeys.has(requestKey)) {
                return { allowed: true, completedCount: completed, alreadyReserved: true };
            }

            if (completed + activeSet.size >= MAX_FREE_SIMULATIONS) {
                return { allowed: false, completedCount: completed, alreadyReserved: false };
            }

            activeSet.add(requestKey);
            fallbackInFlight.set(userId, activeSet);
            return { allowed: true, completedCount: completed, alreadyReserved: false };
        },

        async completeSlot({ userId, organizationId, requestKey, sourceEndpoint }) {
            const { error } = await supabaseAdmin.rpc('complete_free_simulation_slot', {
                p_user_id: userId,
                p_request_key: requestKey,
            });

            if (!error) return;
            if (!isRpcMissing(error)) {
                console.warn('[Entitlement] complete_free_simulation_slot error:', error.message);
                return;
            }

            // Fallback: release in-flight and append immutable EntitlementQuota marker (idempotent per requestKey)
            const activeSet = fallbackInFlight.get(userId);
            activeSet?.delete(requestKey);

            if (!fallbackCompletedKeys.has(requestKey)) {
                fallbackCompletedKeys.add(requestKey);
                await supabaseAdmin.from('agent_logs').insert({
                    agent_type: 'EntitlementQuota',
                    action: 'CompletedSimulation',
                    status: 'success',
                    organization_id: organizationId,
                    user_id: userId,
                    metadata: { requestKey, sourceEndpoint },
                });
            }
        },

        async releaseSlot({ userId, requestKey }) {
            const { error } = await supabaseAdmin.rpc('release_free_simulation_slot', {
                p_user_id: userId,
                p_request_key: requestKey,
            });
            if (error && !isRpcMissing(error)) {
                console.warn('[Entitlement] release_free_simulation_slot error:', error.message);
            }
            const activeSet = fallbackInFlight.get(userId);
            activeSet?.delete(requestKey);
        },
    };
}

export function createSimulationEntitlementService(store: EntitlementStore = createSupabaseEntitlementStore()) {
    return {
        async getEntitlement(organizationId: string, userId: string): Promise<OrganizationEntitlement> {
            const [sub, completed] = await Promise.all([
                store.getActiveSubscription(organizationId),
                store.getFreeCompletedCount(userId),
            ]);
            const paid = isPaidSubscriptionActive(sub);
            const effectivePlan = paid && sub ? sub.plan : 'Free';
            return {
                plan: effectivePlan,
                isPaidPlan: paid,
                status: paid && sub ? sub.status : (sub?.status === 'active' ? 'active' : 'free'),
                currentPeriodEnd: paid && sub ? sub.currentPeriodEnd : null,
                freeLimit: MAX_FREE_SIMULATIONS,
                freeCompletedCount: completed,
                freeRemaining: paid ? MAX_FREE_SIMULATIONS : Math.max(0, MAX_FREE_SIMULATIONS - completed),
            };
        },

        async assertAndReserveFreeSlot(params: {
            organizationId: string;
            userId: string;
            requestKey?: string;
            sourceEndpoint: string;
        }): Promise<{
            isPaidPlan: boolean;
            requestKey: string;
            complete: () => Promise<void>;
            release: () => Promise<void>;
        }> {
            const { organizationId, userId, sourceEndpoint } = params;
            const requestKey = params.requestKey?.trim() || `sim_${crypto.randomUUID()}`;

            return withUserMutex(userId, async () => {
                const sub = await store.getActiveSubscription(organizationId);
                if (isPaidSubscriptionActive(sub)) {
                    return {
                        isPaidPlan: true,
                        requestKey,
                        complete: async () => {},
                        release: async () => {},
                    };
                }

                const reservation = await store.reserveSlot({
                    userId,
                    organizationId,
                    requestKey,
                    sourceEndpoint,
                });

                if (!reservation.allowed) {
                    throw new FreeLimitReachedError(reservation.completedCount);
                }

                let settled = false;
                return {
                    isPaidPlan: false,
                    requestKey,
                    complete: async () => {
                        if (settled) return;
                        settled = true;
                        await store.completeSlot({ userId, organizationId, requestKey, sourceEndpoint });
                    },
                    release: async () => {
                        if (settled) return;
                        settled = true;
                        await store.releaseSlot({ userId, requestKey });
                    },
                };
            });
        },

        async assertCanStartSimulation(organizationId: string, userId: string): Promise<void> {
            const ent = await this.getEntitlement(organizationId, userId);
            if (!ent.isPaidPlan && ent.freeCompletedCount >= MAX_FREE_SIMULATIONS) {
                throw new FreeLimitReachedError(ent.freeCompletedCount);
            }
        },
    };
}

export const defaultEntitlementService = createSimulationEntitlementService();
