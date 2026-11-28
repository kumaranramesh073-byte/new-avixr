/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron — Production-Grade Razorpay LIVE Payment Service
   - Server-authoritative pricing & currency validation
   - Idempotent order creation & reconciliation
   - Dual verification: HMAC-SHA256 signature + live Razorpay Payments API check
   - Raw-body HMAC webhook processing with event-ID idempotency
   - Atomic subscription fulfillment & strict state machine enforcement
   - Zero secret / signature / PII logging
   ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto';
import { supabaseAdmin } from '../middleware/auth.js';
import { sanitizeErrorMessage } from './credentialVault.js';
import {
    assertValidPaymentTransition,
    canTransitionPaymentStatus,
    getServerPricingPlan,
    isValidPaymentStatus,
    listServerPricingPlans,
    SUPPORTED_CURRENCIES,
    type PaymentStatus,
    type ServerPricingPlan,
} from './paymentCatalog.js';
import {
    createDefaultRazorpayAdapter,
    type RazorpayGatewayAdapter,
} from './razorpayClient.js';

export class PaymentServiceError extends Error {
    readonly httpStatus: number;
    readonly code: string;

    constructor(httpStatus: number, code: string, message: string) {
        super(message);
        this.httpStatus = httpStatus;
        this.code = code;
    }
}

export interface PaymentTransactionRecord {
    id: string;
    organization_id: string;
    user_id: string;
    provider: string;
    order_id: string | null;
    payment_id: string | null;
    amount: number;
    currency: string;
    status: PaymentStatus;
    tier: string;
    plan_code?: string | null;
    billing_cycle?: string | null;
    fulfilled_at?: string | null;
    subscription_id?: string | null;
    idempotency_key: string | null;
    metadata: Record<string, any> | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

export interface WebhookEventRecord {
    id?: string;
    provider: string;
    event_id: string;
    event_type: string;
    payload: Record<string, unknown>;
    processed: boolean;
    processed_at?: string | null;
}

export interface PaymentRepository {
    findByIdempotencyKey(organizationId: string, key: string): Promise<PaymentTransactionRecord | null>;
    findByOrderId(orderId: string): Promise<PaymentTransactionRecord | null>;
    findByPaymentId(paymentId: string): Promise<PaymentTransactionRecord | null>;
    listByOrganizationAndUser(organizationId: string, userId: string): Promise<PaymentTransactionRecord[]>;
    insertTransaction(input: {
        organizationId: string;
        userId: string;
        amountInr: number;
        amountPaise: number;
        currency: string;
        tier: string;
        planCode: string;
        billingCycle: string;
        idempotencyKey: string;
        receipt: string;
        receiptEmail?: string | null;
        metadata: Record<string, unknown>;
    }): Promise<PaymentTransactionRecord>;
    attachRazorpayOrderId(txId: string, orderId: string, extraMeta?: Record<string, unknown>): Promise<PaymentTransactionRecord>;
    transitionStatus(params: {
        txId: string;
        expectedCurrentStatuses: PaymentStatus[];
        nextStatus: PaymentStatus;
        paymentId?: string | null;
        errorMessage?: string | null;
        metadataPatch?: Record<string, unknown>;
    }): Promise<PaymentTransactionRecord | null>;
    fulfillCapturedOrderAtomic(params: {
        txId: string;
        paymentId: string;
        plan: ServerPricingPlan;
        metadataPatch: Record<string, unknown>;
    }): Promise<{ alreadyFulfilled: boolean; subscriptionId: string | null }>;
    revokeSubscriptionOnRefund?(params: {
        organizationId: string;
        txId: string;
        refundEventId: string;
    }): Promise<void>;
    findWebhookEvent(provider: string, eventId: string): Promise<WebhookEventRecord | null>;
    recordWebhookEvent(event: Omit<WebhookEventRecord, 'id'>): Promise<{ inserted: boolean; record: WebhookEventRecord | null }>;
    markWebhookProcessed(provider: string, eventId: string): Promise<void>;
}

function logPaymentEvent(
    level: 'info' | 'warn' | 'error',
    event: string,
    fields: Record<string, unknown>
): void {
    const safeFields = {
        ts: new Date().toISOString(),
        subsystem: 'payments.razorpay',
        event,
        ...fields,
    };
    const serialized = JSON.stringify(safeFields);
    if (level === 'error') console.error(serialized);
    else if (level === 'warn') console.warn(serialized);
    else console.log(serialized);
}

export function createSupabasePaymentRepository(): PaymentRepository {
    return {
        async findByIdempotencyKey(organizationId, key) {
            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('idempotency_key', key)
                .maybeSingle();
            if (error) throw new PaymentServiceError(500, 'DB_READ_FAILED', 'Database error reading order');
            return (data as PaymentTransactionRecord) || null;
        },

        async findByOrderId(orderId) {
            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('provider', 'razorpay')
                .eq('order_id', orderId)
                .maybeSingle();
            if (error) throw new PaymentServiceError(500, 'DB_READ_FAILED', 'Database error reading order');
            return (data as PaymentTransactionRecord) || null;
        },

        async findByPaymentId(paymentId) {
            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('provider', 'razorpay')
                .eq('payment_id', paymentId)
                .maybeSingle();
            if (error) throw new PaymentServiceError(500, 'DB_READ_FAILED', 'Database error reading payment');
            return (data as PaymentTransactionRecord) || null;
        },

        async listByOrganizationAndUser(organizationId, userId) {
            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);
            if (error) throw new PaymentServiceError(500, 'DB_READ_FAILED', 'Database error listing orders');
            return (data as PaymentTransactionRecord[]) || [];
        },

        async insertTransaction(input) {
            const fullInsert: Record<string, unknown> = {
                organization_id: input.organizationId,
                user_id: input.userId,
                provider: 'razorpay',
                order_id: null,
                payment_id: null,
                amount: input.amountInr,
                currency: input.currency,
                status: 'created',
                tier: input.tier,
                plan_code: input.planCode,
                billing_cycle: input.billingCycle,
                idempotency_key: input.idempotencyKey,
                receipt_email: input.receiptEmail ?? null,
                metadata: {
                    ...input.metadata,
                    receipt: input.receipt,
                    amountPaise: input.amountPaise,
                    planCode: input.planCode,
                    billingCycle: input.billingCycle,
                },
            };

            let { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .insert(fullInsert)
                .select('*')
                .single();

            // Compatibility if 005 additive columns haven't been migrated yet
            if (error && (error.code === 'PGRST204' || /column .* does not exist/i.test(error.message))) {
                const { plan_code: _p, billing_cycle: _b, ...legacyInsert } = fullInsert;
                ({ data, error } = await supabaseAdmin
                    .from('payment_transactions')
                    .insert(legacyInsert)
                    .select('*')
                    .single());
            }

            if (error || !data) {
                throw new PaymentServiceError(500, 'DB_INSERT_FAILED', `Failed to persist payment order: ${error?.message || 'unknown'}`);
            }
            return data as PaymentTransactionRecord;
        },

        async attachRazorpayOrderId(txId, orderId, extraMeta = {}) {
            const { data: existing } = await supabaseAdmin
                .from('payment_transactions')
                .select('metadata')
                .eq('id', txId)
                .single();
            const mergedMeta = {
                ...((existing?.metadata as Record<string, unknown>) || {}),
                ...extraMeta,
            };
            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .update({
                    order_id: orderId,
                    metadata: mergedMeta,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', txId)
                .select('*')
                .single();
            if (error || !data) {
                throw new PaymentServiceError(500, 'DB_UPDATE_FAILED', 'Failed to bind Razorpay order ID to transaction');
            }
            return data as PaymentTransactionRecord;
        },

        async transitionStatus({ txId, expectedCurrentStatuses, nextStatus, paymentId, errorMessage, metadataPatch }) {
            const { data: currentRow } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('id', txId)
                .single();
            if (!currentRow) return null;

            const curStatus = String(currentRow.status) as PaymentStatus;
            if (!expectedCurrentStatuses.includes(curStatus)) {
                return null;
            }
            assertValidPaymentTransition(curStatus, nextStatus);

            const mergedMeta = {
                ...((currentRow.metadata as Record<string, unknown>) || {}),
                ...(metadataPatch || {}),
            };
            const updatePayload: Record<string, unknown> = {
                status: nextStatus,
                metadata: mergedMeta,
                updated_at: new Date().toISOString(),
            };
            if (paymentId !== undefined) updatePayload.payment_id = paymentId;
            if (errorMessage !== undefined) updatePayload.error_message = errorMessage;

            const { data, error } = await supabaseAdmin
                .from('payment_transactions')
                .update(updatePayload)
                .eq('id', txId)
                .eq('status', curStatus)
                .select('*')
                .maybeSingle();

            if (error) {
                throw new PaymentServiceError(500, 'DB_UPDATE_FAILED', `Failed updating payment status: ${error.message}`);
            }
            return (data as PaymentTransactionRecord) || null;
        },

        async fulfillCapturedOrderAtomic({ txId, paymentId, plan, metadataPatch }) {
            // Try atomic PL/pgSQL RPC (from 005_razorpay_payments.sql) first
            const { data: rpcData, error: rpcErr } = await supabaseAdmin.rpc('activate_paid_subscription_atomic', {
                p_tx_id: txId,
                p_payment_id: paymentId,
                p_plan: plan.subscriptionPlan,
                p_max_seats: plan.maxSeats,
                p_monthly_token_quota: plan.monthlyTokenQuota,
                p_period_days: plan.periodDays,
                p_metadata: metadataPatch,
            });

            if (!rpcErr && Array.isArray(rpcData) && rpcData[0]) {
                return {
                    alreadyFulfilled: Boolean(rpcData[0].already_fulfilled),
                    subscriptionId: rpcData[0].subscription_id ?? null,
                };
            }

            // Fallback conditional update when RPC is not yet deployed in DB
            if (rpcErr && rpcErr.code !== 'PGRST202' && !/could not find the function/i.test(rpcErr.message)) {
                throw new PaymentServiceError(500, 'FULFILLMENT_FAILED', `Atomic fulfillment failed: ${rpcErr.message}`);
            }

            const { data: tx } = await supabaseAdmin
                .from('payment_transactions')
                .select('*')
                .eq('id', txId)
                .single();
            if (!tx) throw new PaymentServiceError(404, 'ORDER_NOT_FOUND', 'Transaction missing during fulfillment');
            if (tx.status === 'captured') {
                return { alreadyFulfilled: true, subscriptionId: tx.subscription_id ?? null };
            }
            assertValidPaymentTransition(tx.status as PaymentStatus, 'captured');

            const now = new Date();
            const periodEnd = new Date(now.getTime() + plan.periodDays * 86_400_000).toISOString();

            const { data: existingSub } = await supabaseAdmin
                .from('billing_subscriptions')
                .select('id')
                .eq('organization_id', tx.organization_id)
                .limit(1)
                .maybeSingle();

            let subscriptionId: string | null = existingSub?.id ?? null;
            if (subscriptionId) {
                const { error: subUpdErr } = await supabaseAdmin
                    .from('billing_subscriptions')
                    .update({
                        plan: plan.subscriptionPlan,
                        status: 'active',
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd,
                        cancel_at_period_end: false,
                        max_seats: plan.maxSeats,
                        monthly_token_quota: plan.monthlyTokenQuota,
                        updated_at: now.toISOString(),
                    })
                    .eq('id', subscriptionId);
                if (subUpdErr) throw new PaymentServiceError(500, 'SUBSCRIPTION_UPDATE_FAILED', subUpdErr.message);
            } else {
                const { data: newSub, error: subInsErr } = await supabaseAdmin
                    .from('billing_subscriptions')
                    .insert({
                        organization_id: tx.organization_id,
                        plan: plan.subscriptionPlan,
                        status: 'active',
                        current_period_start: now.toISOString(),
                        current_period_end: periodEnd,
                        cancel_at_period_end: false,
                        max_seats: plan.maxSeats,
                        monthly_token_quota: plan.monthlyTokenQuota,
                    })
                    .select('id')
                    .single();
                if (subInsErr || !newSub) {
                    throw new PaymentServiceError(500, 'SUBSCRIPTION_CREATE_FAILED', subInsErr?.message || 'unknown');
                }
                subscriptionId = newSub.id;
            }

            const { data: updatedTx, error: txErr } = await supabaseAdmin
                .from('payment_transactions')
                .update({
                    status: 'captured',
                    payment_id: paymentId,
                    error_message: null,
                    metadata: { ...((tx.metadata as Record<string, unknown>) || {}), ...metadataPatch },
                    updated_at: now.toISOString(),
                })
                .eq('id', txId)
                .neq('status', 'captured')
                .select('id')
                .maybeSingle();

            if (txErr) throw new PaymentServiceError(500, 'TX_UPDATE_FAILED', txErr.message);
            if (!updatedTx) {
                return { alreadyFulfilled: true, subscriptionId };
            }
            return { alreadyFulfilled: false, subscriptionId };
        },

        async revokeSubscriptionOnRefund({ organizationId, txId }) {
            const { data: txRow } = await supabaseAdmin
                .from('payment_transactions')
                .select('created_at')
                .eq('id', txId)
                .maybeSingle();

            if (txRow?.created_at) {
                const { data: newerCaptured } = await supabaseAdmin
                    .from('payment_transactions')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .eq('status', 'captured')
                    .neq('id', txId)
                    .gt('created_at', txRow.created_at)
                    .limit(1)
                    .maybeSingle();

                if (newerCaptured) {
                    return;
                }
            }

            const nowIso = new Date().toISOString();
            const { error } = await supabaseAdmin
                .from('billing_subscriptions')
                .update({
                    plan: 'Free',
                    max_seats: 1,
                    monthly_token_quota: 1_000_000,
                    current_period_end: nowIso,
                    updated_at: nowIso,
                })
                .eq('organization_id', organizationId);

            if (error) {
                throw new PaymentServiceError(500, 'SUBSCRIPTION_REVOKE_FAILED', `Failed downgrading refunded subscription: ${error.message}`);
            }
        },

        async findWebhookEvent(provider, eventId) {
            const { data, error } = await supabaseAdmin
                .from('payment_webhook_events')
                .select('*')
                .eq('provider', provider)
                .eq('event_id', eventId)
                .maybeSingle();
            if (error) throw new PaymentServiceError(500, 'WEBHOOK_DB_ERROR', error.message);
            return (data as WebhookEventRecord) || null;
        },

        async recordWebhookEvent(event) {
            const existing = await this.findWebhookEvent(event.provider, event.event_id);
            if (existing) {
                return { inserted: false, record: existing };
            }
            const { data, error } = await supabaseAdmin
                .from('payment_webhook_events')
                .insert({
                    provider: event.provider,
                    event_id: event.event_id,
                    event_type: event.event_type,
                    payload: event.payload,
                    processed: false,
                })
                .select('*')
                .single();

            if (error) {
                // Handle concurrent duplicate race via unique index if present
                if (error.code === '23505') {
                    const raced = await this.findWebhookEvent(event.provider, event.event_id);
                    return { inserted: false, record: raced };
                }
                throw new PaymentServiceError(500, 'WEBHOOK_DB_ERROR', error.message);
            }
            return { inserted: true, record: data as WebhookEventRecord };
        },

        async markWebhookProcessed(provider, eventId) {
            const { error } = await supabaseAdmin
                .from('payment_webhook_events')
                .update({
                    processed: true,
                    processed_at: new Date().toISOString(),
                })
                .eq('provider', provider)
                .eq('event_id', eventId);
            if (error) {
                throw new PaymentServiceError(500, 'WEBHOOK_DB_ERROR', error.message);
            }
        },
    };
}

export interface PaymentServiceDeps {
    repo?: PaymentRepository;
    getGateway?: () => RazorpayGatewayAdapter;
}

function getExpectedPaise(tx: PaymentTransactionRecord): number {
    const metaPaise = Number(tx.metadata?.amountPaise);
    if (Number.isInteger(metaPaise) && metaPaise > 0) return metaPaise;
    return Math.round(Number(tx.amount) * 100);
}

function resolvePlanFromTx(tx: PaymentTransactionRecord): ServerPricingPlan | null {
    const code = tx.plan_code || (typeof tx.metadata?.planCode === 'string' ? tx.metadata.planCode : '');
    return getServerPricingPlan(code);
}

function toSafeOrderSummary(tx: PaymentTransactionRecord, keyId?: string) {
    return {
        internalOrderId: tx.id,
        razorpayOrderId: tx.order_id,
        razorpayPaymentId: tx.payment_id,
        amountPaise: getExpectedPaise(tx),
        amount: tx.amount,
        currency: tx.currency,
        status: tx.status,
        planCode: tx.plan_code || tx.metadata?.planCode || null,
        tier: tx.tier,
        idempotencyKey: tx.idempotency_key,
        createdAt: tx.created_at,
        updatedAt: tx.updated_at,
        ...(keyId ? { keyId } : {}),
    };
}

export function createPaymentService(deps: PaymentServiceDeps = {}) {
    const repo = deps.repo ?? createSupabasePaymentRepository();
    const resolveGateway = deps.getGateway ?? createDefaultRazorpayAdapter;

    return {
        listPlans() {
            return listServerPricingPlans();
        },

        async listUserOrders(organizationId: string, userId: string) {
            const rows = await repo.listByOrganizationAndUser(organizationId, userId);
            return rows.map(r => toSafeOrderSummary(r));
        },

        async getUserOrder(organizationId: string, userId: string, orderId: string) {
            const cleanOrderId = String(orderId || '').trim();
            if (!cleanOrderId) {
                throw new PaymentServiceError(400, 'INVALID_ORDER_ID', 'orderId is required');
            }
            const tx = await repo.findByOrderId(cleanOrderId);
            if (!tx || tx.organization_id !== organizationId || tx.user_id !== userId) {
                throw new PaymentServiceError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
            }
            return toSafeOrderSummary(tx);
        },

        async createOrder(params: {
            requestId: string;
            organizationId: string;
            userId: string;
            userEmail?: string;
            planCode: string;
            currency?: string;
            expectedAmountPaise?: unknown;
            idempotencyKey?: string;
        }) {
            const { requestId, organizationId, userId, userEmail, planCode, currency = 'INR', expectedAmountPaise } = params;

            const plan = getServerPricingPlan(planCode);
            if (!plan) {
                throw new PaymentServiceError(400, 'INVALID_PLAN', `Unknown or inactive pricing plan '${planCode}'`);
            }

            const cleanCurrency = String(currency || 'INR').trim().toUpperCase();
            if (!SUPPORTED_CURRENCIES.has(cleanCurrency) || cleanCurrency !== plan.currency) {
                throw new PaymentServiceError(400, 'UNSUPPORTED_CURRENCY', `Currency '${cleanCurrency}' is not supported for this plan`);
            }

            // If frontend sent an expected amount, reject mismatches instead of trusting client math
            if (expectedAmountPaise !== undefined && expectedAmountPaise !== null && expectedAmountPaise !== '') {
                const numericClientAmt = Number(expectedAmountPaise);
                if (!Number.isInteger(numericClientAmt) || numericClientAmt <= 0 || numericClientAmt !== plan.totalAmountPaise) {
                    logPaymentEvent('warn', 'order_amount_mismatch_rejected', {
                        requestId,
                        organizationId,
                        planCode: plan.code,
                        expectedPaise: plan.totalAmountPaise,
                    });
                    throw new PaymentServiceError(
                        400,
                        'AMOUNT_MISMATCH',
                        'Provided amount does not match server-calculated authoritative pricing.'
                    );
                }
            }

            // Validate Razorpay LIVE gateway config before persisting new orders
            let gateway: RazorpayGatewayAdapter;
            try {
                gateway = resolveGateway();
            } catch (err) {
                logPaymentEvent('error', 'gateway_not_configured', {
                    requestId,
                    error: sanitizeErrorMessage(err),
                });
                throw new PaymentServiceError(503, 'GATEWAY_UNAVAILABLE', sanitizeErrorMessage(err));
            }

            const rawIdem = String(params.idempotencyKey || '').trim();
            if (rawIdem && (rawIdem.length < 8 || rawIdem.length > 120 || !/^[a-zA-Z0-9._:-]+$/.test(rawIdem))) {
                throw new PaymentServiceError(400, 'INVALID_IDEMPOTENCY_KEY', 'Invalid Idempotency-Key format');
            }
            const idempotencyKey = rawIdem || `idem_${crypto.randomUUID()}`;

            // Idempotent replay check
            const existing = await repo.findByIdempotencyKey(organizationId, idempotencyKey);
            if (existing) {
                if (existing.user_id !== userId) {
                    throw new PaymentServiceError(403, 'FORBIDDEN_ORDER', 'Idempotency key belongs to another user');
                }
                if ((existing.plan_code || existing.metadata?.planCode) !== plan.code) {
                    throw new PaymentServiceError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency key already used for a different plan');
                }
                if (existing.order_id && existing.status !== 'failed') {
                    logPaymentEvent('info', 'order_idempotent_replay', {
                        requestId,
                        txId: existing.id,
                        orderId: existing.order_id,
                    });
                    return {
                        idempotentReplay: true,
                        order: toSafeOrderSummary(existing, gateway.keyId),
                    };
                }
            }

            // Razorpay receipt max length is 40 chars
            const receipt = `qs_${crypto.randomUUID().replace(/-/g, '').slice(0, 28)}`;

            const tx = await repo.insertTransaction({
                organizationId,
                userId,
                amountInr: plan.displayTotalInr,
                amountPaise: plan.totalAmountPaise,
                currency: plan.currency,
                tier: plan.tier,
                planCode: plan.code,
                billingCycle: plan.billingCycle,
                idempotencyKey,
                receipt,
                receiptEmail: userEmail ?? null,
                metadata: {
                    requestId,
                    authoritativeAmountPaise: plan.totalAmountPaise,
                    authoritativeAmountInr: plan.displayTotalInr,
                },
            });

            try {
                const rzpOrder = await gateway.createOrder({
                    amount: plan.totalAmountPaise,
                    currency: plan.currency,
                    receipt,
                    notes: {
                        internal_tx_id: tx.id,
                        organization_id: organizationId,
                        plan_code: plan.code,
                    },
                });

                if (!rzpOrder?.id) {
                    throw new Error('Razorpay returned empty order id');
                }

                const bound = await repo.attachRazorpayOrderId(tx.id, rzpOrder.id, {
                    razorpayOrderStatus: rzpOrder.status,
                });

                logPaymentEvent('info', 'order_created', {
                    requestId,
                    txId: bound.id,
                    orderId: rzpOrder.id,
                    organizationId,
                    planCode: plan.code,
                    amountPaise: plan.totalAmountPaise,
                });

                return {
                    idempotentReplay: false,
                    order: toSafeOrderSummary(bound, gateway.keyId),
                };
            } catch (err) {
                const safeMsg = sanitizeErrorMessage(err);
                await repo.transitionStatus({
                    txId: tx.id,
                    expectedCurrentStatuses: ['created'],
                    nextStatus: 'failed',
                    errorMessage: safeMsg,
                }).catch(() => {});

                logPaymentEvent('error', 'order_creation_failed', {
                    requestId,
                    txId: tx.id,
                    organizationId,
                    error: safeMsg,
                });

                if (err instanceof PaymentServiceError) throw err;
                throw new PaymentServiceError(502, 'RAZORPAY_ORDER_FAILED', 'Unable to create Razorpay payment order right now.');
            }
        },

        async verifyCheckoutPayment(params: {
            requestId: string;
            organizationId: string;
            userId: string;
            razorpayOrderId: string;
            razorpayPaymentId: string;
            razorpaySignature: string;
        }) {
            const { requestId, organizationId, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
            const cleanOrderId = String(razorpayOrderId || '').trim();
            const cleanPaymentId = String(razorpayPaymentId || '').trim();
            const cleanSig = String(razorpaySignature || '').trim();

            if (!/^order_[A-Za-z0-9_]{6,40}$/.test(cleanOrderId)) {
                throw new PaymentServiceError(400, 'INVALID_ORDER_ID', 'Malformed razorpay_order_id');
            }
            if (!/^pay_[A-Za-z0-9_]{6,40}$/.test(cleanPaymentId)) {
                throw new PaymentServiceError(400, 'INVALID_PAYMENT_ID', 'Malformed razorpay_payment_id');
            }
            if (!/^[0-9a-f]{64}$/i.test(cleanSig)) {
                throw new PaymentServiceError(400, 'INVALID_SIGNATURE_FORMAT', 'Invalid razorpay_signature format');
            }

            let gateway: RazorpayGatewayAdapter;
            try {
                gateway = resolveGateway();
            } catch (err) {
                throw new PaymentServiceError(503, 'GATEWAY_UNAVAILABLE', sanitizeErrorMessage(err));
            }

            const tx = await repo.findByOrderId(cleanOrderId);
            if (!tx) {
                throw new PaymentServiceError(404, 'ORDER_NOT_FOUND', 'Payment order not found');
            }
            if (tx.organization_id !== organizationId || tx.user_id !== userId) {
                logPaymentEvent('warn', 'unauthorized_verify_attempt', {
                    requestId,
                    orderId: cleanOrderId,
                    organizationId,
                });
                throw new PaymentServiceError(403, 'FORBIDDEN_ORDER', 'You are not authorized to verify this order');
            }

            // Prevent payment_id reuse across different orders (replay attack prevention)
            const existingByPay = await repo.findByPaymentId(cleanPaymentId);
            if (existingByPay && existingByPay.id !== tx.id) {
                throw new PaymentServiceError(409, 'PAYMENT_ID_REPLAY', 'Payment ID is already bound to another order');
            }

            // 1. Cryptographic signature verification (never reveal expected signature)
            const sigOk = gateway.verifyCheckoutSignature({
                orderId: cleanOrderId,
                paymentId: cleanPaymentId,
                signature: cleanSig,
            });
            if (!sigOk) {
                logPaymentEvent('warn', 'invalid_checkout_signature', {
                    requestId,
                    txId: tx.id,
                    orderId: cleanOrderId,
                });
                throw new PaymentServiceError(400, 'INVALID_SIGNATURE', 'Payment signature verification failed');
            }

            // Idempotent return if already captured
            if (tx.status === 'captured') {
                return {
                    verified: true,
                    alreadyProcessed: true,
                    status: tx.status,
                    order: toSafeOrderSummary(tx),
                };
            }

            if (tx.status === 'refunded' || tx.status === 'failed') {
                throw new PaymentServiceError(409, 'INVALID_ORDER_STATE', `Order is in terminal state '${tx.status}' and cannot be verified`);
            }

            // 2. Authoritative live fetch from Razorpay Payments API (never trust frontend alone)
            let remotePayment;
            try {
                remotePayment = await gateway.fetchPayment(cleanPaymentId);
            } catch (err) {
                const msg = sanitizeErrorMessage(err);
                logPaymentEvent('error', 'razorpay_fetch_payment_failed', {
                    requestId,
                    txId: tx.id,
                    orderId: cleanOrderId,
                    paymentId: cleanPaymentId,
                    error: msg,
                });
                throw new PaymentServiceError(502, 'GATEWAY_VERIFY_ERROR', 'Failed to confirm payment with Razorpay API');
            }

            if (remotePayment.order_id !== cleanOrderId) {
                logPaymentEvent('warn', 'order_payment_mismatch', {
                    requestId,
                    txId: tx.id,
                    expectedOrderId: cleanOrderId,
                    actualOrderId: remotePayment.order_id,
                });
                throw new PaymentServiceError(400, 'ORDER_MISMATCH', 'Payment does not belong to the specified order');
            }

            const expectedPaise = getExpectedPaise(tx);
            if (Number(remotePayment.amount) !== expectedPaise || String(remotePayment.currency).toUpperCase() !== tx.currency.toUpperCase()) {
                logPaymentEvent('warn', 'payment_amount_currency_mismatch', {
                    requestId,
                    txId: tx.id,
                    expectedPaise,
                    remoteAmount: remotePayment.amount,
                });
                throw new PaymentServiceError(400, 'AMOUNT_OR_CURRENCY_MISMATCH', 'Payment amount or currency does not match order');
            }

            const plan = resolvePlanFromTx(tx);
            if (!plan) {
                throw new PaymentServiceError(500, 'PLAN_RESOLUTION_ERROR', 'Order references an unknown pricing plan');
            }

            if (remotePayment.status === 'authorized') {
                await repo.transitionStatus({
                    txId: tx.id,
                    expectedCurrentStatuses: ['created', 'pending'],
                    nextStatus: 'authorized',
                    paymentId: cleanPaymentId,
                    metadataPatch: { method: remotePayment.method || null, verifiedVia: 'checkout_verify' },
                });
                return {
                    verified: false,
                    alreadyProcessed: false,
                    status: 'authorized',
                    message: 'Payment is authorized and awaiting capture.',
                };
            }

            if (remotePayment.status === 'failed') {
                await repo.transitionStatus({
                    txId: tx.id,
                    expectedCurrentStatuses: ['created', 'pending', 'authorized'],
                    nextStatus: 'failed',
                    paymentId: cleanPaymentId,
                    errorMessage: remotePayment.error_description || 'Payment failed at Razorpay',
                });
                throw new PaymentServiceError(402, 'PAYMENT_FAILED', remotePayment.error_description || 'Payment failed');
            }

            if (remotePayment.status !== 'captured') {
                await repo.transitionStatus({
                    txId: tx.id,
                    expectedCurrentStatuses: ['created'],
                    nextStatus: 'pending',
                    paymentId: cleanPaymentId,
                });
                return {
                    verified: false,
                    alreadyProcessed: false,
                    status: 'pending',
                    message: `Payment status is '${remotePayment.status}'; awaiting capture.`,
                };
            }

            // 3. Payment is CAPTURED -> Atomic fulfillment
            const fulfillment = await repo.fulfillCapturedOrderAtomic({
                txId: tx.id,
                paymentId: cleanPaymentId,
                plan,
                metadataPatch: {
                    verifiedVia: 'checkout_verify',
                    method: remotePayment.method || null,
                    verifiedAt: new Date().toISOString(),
                },
            });

            const refreshed = await repo.findByOrderId(cleanOrderId);
            logPaymentEvent('info', 'payment_verified_and_captured', {
                requestId,
                txId: tx.id,
                orderId: cleanOrderId,
                paymentId: cleanPaymentId,
                alreadyFulfilled: fulfillment.alreadyFulfilled,
            });

            return {
                verified: true,
                alreadyProcessed: fulfillment.alreadyFulfilled,
                status: 'captured',
                subscriptionId: fulfillment.subscriptionId,
                order: refreshed ? toSafeOrderSummary(refreshed) : null,
            };
        },

        async processWebhook(params: {
            requestId: string;
            rawBody: Buffer;
            signatureHeader: string;
            eventIdHeader?: string;
        }) {
            const { requestId, rawBody, signatureHeader, eventIdHeader } = params;
            if (!rawBody || rawBody.length === 0) {
                throw new PaymentServiceError(400, 'EMPTY_WEBHOOK_BODY', 'Webhook body is empty');
            }
            if (!signatureHeader) {
                throw new PaymentServiceError(401, 'MISSING_WEBHOOK_SIGNATURE', 'Missing X-Razorpay-Signature header');
            }

            let gateway: RazorpayGatewayAdapter;
            try {
                gateway = resolveGateway();
            } catch (err) {
                throw new PaymentServiceError(503, 'GATEWAY_UNAVAILABLE', sanitizeErrorMessage(err));
            }

            const validSig = gateway.verifyWebhookSignature(rawBody, signatureHeader);
            if (!validSig) {
                logPaymentEvent('warn', 'webhook_invalid_signature', { requestId });
                throw new PaymentServiceError(401, 'INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed');
            }

            let eventPayload: Record<string, any>;
            try {
                eventPayload = JSON.parse(rawBody.toString('utf8'));
            } catch {
                throw new PaymentServiceError(400, 'INVALID_WEBHOOK_JSON', 'Malformed JSON webhook payload');
            }

            const eventType = String(eventPayload?.event || '').trim();
            if (!eventType) {
                throw new PaymentServiceError(400, 'INVALID_WEBHOOK_EVENT', 'Missing event type in webhook payload');
            }

            const paymentEntity = eventPayload?.payload?.payment?.entity;
            const orderEntity = eventPayload?.payload?.order?.entity;
            const refundEntity = eventPayload?.payload?.refund?.entity;

            const derivedEventId =
                String(eventIdHeader || '').trim() ||
                `${eventType}:${paymentEntity?.id || orderEntity?.id || refundEntity?.id || crypto.createHash('sha256').update(rawBody).digest('hex').slice(0, 24)}`;

            const { inserted, record } = await repo.recordWebhookEvent({
                provider: 'razorpay',
                event_id: derivedEventId,
                event_type: eventType,
                payload: {
                    event: eventType,
                    order_id: orderEntity?.id || paymentEntity?.order_id || null,
                    payment_id: paymentEntity?.id || refundEntity?.payment_id || null,
                    status: paymentEntity?.status || orderEntity?.status || null,
                    amount: paymentEntity?.amount ?? orderEntity?.amount ?? null,
                    currency: paymentEntity?.currency ?? orderEntity?.currency ?? null,
                },
                processed: false,
            });

            if (!inserted && record?.processed) {
                logPaymentEvent('info', 'webhook_duplicate_ignored', {
                    requestId,
                    eventId: derivedEventId,
                    eventType,
                });
                return { received: true, duplicate: true, eventId: derivedEventId, eventType };
            }

            const targetOrderId = String(orderEntity?.id || paymentEntity?.order_id || '').trim();
            const targetPaymentId = String(paymentEntity?.id || refundEntity?.payment_id || '').trim();

            let tx: PaymentTransactionRecord | null = null;
            if (targetOrderId) tx = await repo.findByOrderId(targetOrderId);
            if (!tx && targetPaymentId) tx = await repo.findByPaymentId(targetPaymentId);

            if (tx) {
                const currentStatus = isValidPaymentStatus(tx.status) ? tx.status : 'created';
                const plan = resolvePlanFromTx(tx);

                if (eventType === 'payment.captured' || eventType === 'order.paid') {
                    const expectedPaise = getExpectedPaise(tx);
                    const rawReportedAmt = paymentEntity?.amount ?? orderEntity?.amount_paid ?? orderEntity?.amount;
                    const reportedAmt = rawReportedAmt === undefined || rawReportedAmt === null ? NaN : Number(rawReportedAmt);
                    if (!Number.isFinite(reportedAmt) || reportedAmt !== expectedPaise) {
                        logPaymentEvent('error', 'webhook_amount_mismatch', {
                            requestId,
                            txId: tx.id,
                            expectedPaise,
                            reportedAmt: Number.isFinite(reportedAmt) ? reportedAmt : null,
                        });
                        throw new PaymentServiceError(400, 'WEBHOOK_AMOUNT_MISMATCH', 'Webhook payment amount does not match order');
                    }

                    const reportedCurrency = paymentEntity?.currency ?? orderEntity?.currency;
                    if (reportedCurrency && String(reportedCurrency).toUpperCase() !== tx.currency.toUpperCase()) {
                        logPaymentEvent('error', 'webhook_currency_mismatch', {
                            requestId,
                            txId: tx.id,
                            expectedCurrency: tx.currency,
                            reportedCurrency: String(reportedCurrency),
                        });
                        throw new PaymentServiceError(400, 'WEBHOOK_CURRENCY_MISMATCH', 'Webhook payment currency does not match order');
                    }

                    if (currentStatus === 'captured') {
                        // Already captured -> idempotent
                    } else if (canTransitionPaymentStatus(currentStatus, 'captured') && plan) {
                        await repo.fulfillCapturedOrderAtomic({
                            txId: tx.id,
                            paymentId: targetPaymentId || tx.payment_id || '',
                            plan,
                            metadataPatch: {
                                webhookEventId: derivedEventId,
                                webhookEventType: eventType,
                                webhookProcessedAt: new Date().toISOString(),
                            },
                        });
                    }
                } else if (eventType === 'payment.authorized') {
                    if (canTransitionPaymentStatus(currentStatus, 'authorized')) {
                        await repo.transitionStatus({
                            txId: tx.id,
                            expectedCurrentStatuses: ['created', 'pending'],
                            nextStatus: 'authorized',
                            paymentId: targetPaymentId || tx.payment_id,
                            metadataPatch: { webhookEventId: derivedEventId },
                        });
                    }
                } else if (eventType === 'payment.failed') {
                    // NEVER downgrade captured or refunded orders on a late failed webhook!
                    if (currentStatus !== 'captured' && currentStatus !== 'refunded' && canTransitionPaymentStatus(currentStatus, 'failed')) {
                        await repo.transitionStatus({
                            txId: tx.id,
                            expectedCurrentStatuses: ['created', 'pending', 'authorized'],
                            nextStatus: 'failed',
                            paymentId: targetPaymentId || tx.payment_id,
                            errorMessage: sanitizeErrorMessage(
                                paymentEntity?.error_description || paymentEntity?.error_reason || 'Payment failed'
                            ),
                            metadataPatch: { webhookEventId: derivedEventId },
                        });
                    } else {
                        logPaymentEvent('warn', 'webhook_late_failure_ignored', {
                            requestId,
                            txId: tx.id,
                            currentStatus,
                            eventId: derivedEventId,
                        });
                    }
                } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
                    const expectedPaise = getExpectedPaise(tx);
                    const rawRefundAmt = refundEntity?.amount;
                    const isFullRefund =
                        rawRefundAmt === undefined ||
                        rawRefundAmt === null ||
                        (Number.isFinite(Number(rawRefundAmt)) && Number(rawRefundAmt) >= expectedPaise);

                    if (isFullRefund && canTransitionPaymentStatus(currentStatus, 'refunded')) {
                        const updated = await repo.transitionStatus({
                            txId: tx.id,
                            expectedCurrentStatuses: ['captured'],
                            nextStatus: 'refunded',
                            metadataPatch: {
                                refundWebhookEventId: derivedEventId,
                                refundedAt: new Date().toISOString(),
                            },
                        });
                        if (updated && repo.revokeSubscriptionOnRefund) {
                            await repo.revokeSubscriptionOnRefund({
                                organizationId: tx.organization_id,
                                txId: tx.id,
                                refundEventId: derivedEventId,
                            });
                        }
                    } else if (!isFullRefund) {
                        logPaymentEvent('warn', 'webhook_partial_refund_recorded', {
                            requestId,
                            txId: tx.id,
                            refundAmount: Number(rawRefundAmt),
                            expectedPaise,
                            eventId: derivedEventId,
                        });
                    }
                }
            }

            await repo.markWebhookProcessed('razorpay', derivedEventId);
            logPaymentEvent('info', 'webhook_processed', {
                requestId,
                eventId: derivedEventId,
                eventType,
                txId: tx?.id || null,
            });

            return { received: true, duplicate: false, eventId: derivedEventId, eventType };
        },
    };
}
