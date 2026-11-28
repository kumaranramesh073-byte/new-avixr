import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import http from 'node:http';
import {
    assertValidPaymentTransition,
    canTransitionPaymentStatus,
    FREE_PLAN_CATALOG_ENTRY,
    getServerPricingPlan,
    type PaymentStatus,
} from '../src/services/paymentCatalog.js';
import {
    verifyRazorpayCheckoutHmac,
    verifyRazorpayWebhookHmac,
    type RazorpayGatewayAdapter,
    type RazorpayPaymentEntity,
} from '../src/services/razorpayClient.js';
import {
    createPaymentService,
    PaymentServiceError,
    type PaymentRepository,
    type PaymentTransactionRecord,
    type WebhookEventRecord,
} from '../src/services/paymentService.js';
import {
    createSimulationEntitlementService,
    FreeLimitReachedError,
    MAX_FREE_SIMULATIONS,
    type EntitlementStore,
} from '../src/services/simulationEntitlementService.js';
import { requireAuth } from '../src/middleware/auth.js';
import { paymentsRouter, razorpayWebhookHandler, createPaymentsRouter } from '../src/routes/payments.js';

const MOCK_KEY_ID = 'rzp_live_mock_unit_key_id';
const MOCK_SECRET = 'mock_unit_secret_only_never_live_12345';
const MOCK_WEBHOOK_SECRET = 'mock_unit_webhook_secret_only_67890';

function signCheckout(orderId: string, paymentId: string, secret = MOCK_SECRET): string {
    return crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
}

function signWebhook(rawBody: Buffer | string, secret = MOCK_WEBHOOK_SECRET): string {
    return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

function createInMemoryRepo() {
    const txs: PaymentTransactionRecord[] = [];
    const webhooks = new Map<string, WebhookEventRecord>();
    let fulfillCount = 0;
    let revokeCount = 0;
    let failOnInsert = false;
    let failOnAttach = false;
    let failOnFulfill = false;

    const repo: PaymentRepository = {
        async findByIdempotencyKey(organizationId, key) {
            return txs.find(t => t.organization_id === organizationId && t.idempotency_key === key) || null;
        },
        async findByOrderId(orderId) {
            return txs.find(t => t.order_id === orderId) || null;
        },
        async findByPaymentId(paymentId) {
            return txs.find(t => t.payment_id === paymentId) || null;
        },
        async listByOrganizationAndUser(organizationId, userId) {
            return txs.filter(t => t.organization_id === organizationId && t.user_id === userId);
        },
        async insertTransaction(input) {
            if (failOnInsert) {
                throw new PaymentServiceError(500, 'DB_INSERT_FAILED', 'Simulated DB insert failure');
            }
            const now = new Date().toISOString();
            const row: PaymentTransactionRecord = {
                id: `tx_${crypto.randomUUID()}`,
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
                fulfilled_at: null,
                subscription_id: null,
                idempotency_key: input.idempotencyKey,
                metadata: {
                    ...input.metadata,
                    receipt: input.receipt,
                    amountPaise: input.amountPaise,
                    planCode: input.planCode,
                    billingCycle: input.billingCycle,
                },
                error_message: null,
                created_at: now,
                updated_at: now,
            };
            txs.push(row);
            return row;
        },
        async attachRazorpayOrderId(txId, orderId, extraMeta = {}) {
            if (failOnAttach) {
                throw new PaymentServiceError(500, 'DB_UPDATE_FAILED', 'Simulated DB attach failure');
            }
            const tx = txs.find(t => t.id === txId);
            if (!tx) throw new Error('tx not found');
            tx.order_id = orderId;
            tx.metadata = { ...(tx.metadata || {}), ...extraMeta };
            tx.updated_at = new Date().toISOString();
            return tx;
        },
        async transitionStatus({ txId, expectedCurrentStatuses, nextStatus, paymentId, errorMessage, metadataPatch }) {
            const tx = txs.find(t => t.id === txId);
            if (!tx || !expectedCurrentStatuses.includes(tx.status)) return null;
            assertValidPaymentTransition(tx.status, nextStatus);
            tx.status = nextStatus;
            if (paymentId !== undefined) tx.payment_id = paymentId;
            if (errorMessage !== undefined) tx.error_message = errorMessage;
            if (metadataPatch) tx.metadata = { ...(tx.metadata || {}), ...metadataPatch };
            tx.updated_at = new Date().toISOString();
            return tx;
        },
        async fulfillCapturedOrderAtomic({ txId, paymentId, metadataPatch }) {
            if (failOnFulfill) {
                throw new PaymentServiceError(500, 'FULFILLMENT_FAILED', 'Simulated atomic DB failure');
            }
            const tx = txs.find(t => t.id === txId);
            if (!tx) throw new Error('tx not found');
            if (tx.status === 'captured' && tx.fulfilled_at) {
                return { alreadyFulfilled: true, subscriptionId: tx.subscription_id ?? 'sub_1' };
            }
            assertValidPaymentTransition(tx.status, 'captured');
            tx.status = 'captured';
            tx.payment_id = paymentId;
            tx.fulfilled_at = new Date().toISOString();
            tx.subscription_id = 'sub_org_1';
            tx.metadata = { ...(tx.metadata || {}), ...metadataPatch };
            fulfillCount++;
            return { alreadyFulfilled: false, subscriptionId: 'sub_org_1' };
        },
        async revokeSubscriptionOnRefund() {
            revokeCount++;
        },
        async findWebhookEvent(provider, eventId) {
            return webhooks.get(`${provider}:${eventId}`) || null;
        },
        async recordWebhookEvent(event) {
            const k = `${event.provider}:${event.event_id}`;
            if (webhooks.has(k)) return { inserted: false, record: webhooks.get(k)! };
            const rec: WebhookEventRecord = { id: `wh_${webhooks.size + 1}`, ...event };
            webhooks.set(k, rec);
            return { inserted: true, record: rec };
        },
        async markWebhookProcessed(provider, eventId) {
            const k = `${provider}:${eventId}`;
            const rec = webhooks.get(k);
            if (rec) {
                rec.processed = true;
                rec.processed_at = new Date().toISOString();
            }
        },
    };

    return {
        repo,
        txs,
        getFulfillCount: () => fulfillCount,
        getRevokeCount: () => revokeCount,
        setFailOnInsert: (v: boolean) => { failOnInsert = v; },
        setFailOnAttach: (v: boolean) => { failOnAttach = v; },
        setFailOnFulfill: (v: boolean) => { failOnFulfill = v; },
    };
}

function createMockGateway(opts?: {
    failCreateOrder?: boolean;
    remotePaymentOverrides?: Partial<RazorpayPaymentEntity>;
}) {
    let createCalls = 0;
    let seq = 1;
    const adapter: RazorpayGatewayAdapter = {
        keyId: MOCK_KEY_ID,
        async createOrder(input) {
            createCalls++;
            if (opts?.failCreateOrder) {
                throw new Error(`Razorpay API timeout using secret=${MOCK_SECRET}`);
            }
            return {
                id: `order_mock_${seq++}`,
                amount: input.amount,
                currency: input.currency,
                receipt: input.receipt,
                status: 'created',
            };
        },
        async fetchPayment(paymentId) {
            const plan = getServerPricingPlan('basic_monthly')!;
            return {
                id: paymentId,
                order_id: 'order_mock_1',
                amount: plan.totalAmountPaise,
                currency: 'INR',
                status: 'captured',
                captured: true,
                method: 'upi',
                ...(opts?.remotePaymentOverrides || {}),
            };
        },
        async fetchOrder(orderId) {
            const plan = getServerPricingPlan('basic_monthly')!;
            return { id: orderId, amount: plan.totalAmountPaise, currency: 'INR', status: 'paid' };
        },
        verifyCheckoutSignature({ orderId, paymentId, signature }) {
            return verifyRazorpayCheckoutHmac({ orderId, paymentId, signature, keySecret: MOCK_SECRET });
        },
        verifyWebhookSignature(rawBody, signature) {
            return verifyRazorpayWebhookHmac({ rawBody, signature, webhookSecret: MOCK_WEBHOOK_SECRET });
        },
    };
    return { adapter, getCreateCalls: () => createCalls };
}

test('Pricing Catalog: Exact approved INR prices and paise conversions (zero GST/fee distortion)', () => {
    assert.equal(FREE_PLAN_CATALOG_ENTRY.totalAmountPaise, 0);
    assert.equal(FREE_PLAN_CATALOG_ENTRY.simulationLimit, 3);
    assert.equal(getServerPricingPlan('free'), null, 'Free plan must not be purchasable via checkout');

    const expected: Record<string, { inr: number; paise: number; cycle: 'monthly' | 'yearly' }> = {
        basic_monthly: { inr: 1499, paise: 149900, cycle: 'monthly' },
        plus_monthly: { inr: 1999, paise: 199900, cycle: 'monthly' },
        pro_monthly: { inr: 3999, paise: 399900, cycle: 'monthly' },
        basic_yearly: { inr: 14990, paise: 1499000, cycle: 'yearly' },
        plus_yearly: { inr: 19990, paise: 1999000, cycle: 'yearly' },
        pro_yearly: { inr: 39990, paise: 3999000, cycle: 'yearly' },
    };

    for (const [code, spec] of Object.entries(expected)) {
        const plan = getServerPricingPlan(code);
        assert.ok(plan, `Expected plan ${code} to exist`);
        assert.equal(plan.displayTotalInr, spec.inr);
        assert.equal(plan.totalAmountPaise, spec.paise);
        assert.equal(plan.billingCycle, spec.cycle);
        assert.equal(plan.currency, 'INR');
    }
});

test('1-2,4,18: Valid order creation, idempotent replay, invalid amount/currency rejection, and secret omission', async () => {
    const store = createInMemoryRepo();
    const gw = createMockGateway();
    const svc = createPaymentService({ repo: store.repo, getGateway: () => gw.adapter });
    const plan = getServerPricingPlan('basic_monthly')!;

    // 1. Valid creation
    const res1 = await svc.createOrder({
        requestId: 'req-1',
        organizationId: 'org-1',
        userId: 'user-1',
        planCode: 'basic_monthly',
        currency: 'INR',
        idempotencyKey: 'idem_key_123456',
    });
    assert.equal(res1.idempotentReplay, false);
    assert.equal(res1.order.amountPaise, 149900);
    assert.equal(res1.order.amount, 1499);
    assert.equal(res1.order.currency, 'INR');
    assert.equal(res1.order.status, 'created');
    assert.equal(res1.order.keyId, MOCK_KEY_ID);
    assert.equal(JSON.stringify(res1).includes(MOCK_SECRET), false);
    assert.equal(JSON.stringify(res1).includes(MOCK_WEBHOOK_SECRET), false);

    // 4. Duplicate idempotent replay returns same order, does NOT call SDK twice
    const res2 = await svc.createOrder({
        requestId: 'req-2',
        organizationId: 'org-1',
        userId: 'user-1',
        planCode: 'basic_monthly',
        currency: 'INR',
        idempotencyKey: 'idem_key_123456',
    });
    assert.equal(res2.idempotentReplay, true);
    assert.equal(res2.order.razorpayOrderId, res1.order.razorpayOrderId);
    assert.equal(gw.getCreateCalls(), 1);

    // 2. Client tampered expectedAmountPaise & invalid plan/currency rejected
    assert.equal(plan.totalAmountPaise, 149900);
    await assert.rejects(
        () => svc.createOrder({ requestId: 'r3', organizationId: 'org-1', userId: 'u1', planCode: 'basic_monthly', expectedAmountPaise: 100 }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 400 && e.code === 'AMOUNT_MISMATCH'
    );
    await assert.rejects(
        () => svc.createOrder({ requestId: 'r4', organizationId: 'org-1', userId: 'u1', planCode: 'unknown_plan' }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 400 && e.code === 'INVALID_PLAN'
    );
    await assert.rejects(
        () => svc.createOrder({ requestId: 'r5', organizationId: 'org-1', userId: 'u1', planCode: 'basic_monthly', currency: 'USD' }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 400 && e.code === 'UNSUPPORTED_CURRENCY'
    );
});

test('3,5-9,15,17: Verification checks ownership, signature, order/payment mismatch, replay, concurrency, and authorized state', async () => {
    const store = createInMemoryRepo();
    const gw = createMockGateway();
    const svc = createPaymentService({ repo: store.repo, getGateway: () => gw.adapter });

    const { order } = await svc.createOrder({
        requestId: 'req-v1',
        organizationId: 'org-1',
        userId: 'user-1',
        planCode: 'basic_monthly',
    });
    const orderId = order.razorpayOrderId!;
    const payId = 'pay_mock_capture_1';
    const validSig = signCheckout(orderId, payId);

    // 3. Unauthorized user cannot verify or view another user's order
    await assert.rejects(
        () => svc.verifyCheckoutPayment({
            requestId: 'req-unauth',
            organizationId: 'org-2',
            userId: 'user-2',
            razorpayOrderId: orderId,
            razorpayPaymentId: payId,
            razorpaySignature: validSig,
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 403
    );

    // 6. Invalid signature rejected (400) without marking captured
    const badSig = signCheckout(orderId, payId, 'wrong_secret_xyz');
    await assert.rejects(
        () => svc.verifyCheckoutPayment({
            requestId: 'req-badsig',
            organizationId: 'org-1',
            userId: 'user-1',
            razorpayOrderId: orderId,
            razorpayPaymentId: payId,
            razorpaySignature: badSig,
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 400 && e.code === 'INVALID_SIGNATURE'
    );
    assert.equal(store.txs[0].status, 'created');

    // 7. Wrong / non-existent order ID rejected (404)
    await assert.rejects(
        () => svc.verifyCheckoutPayment({
            requestId: 'req-noord',
            organizationId: 'org-1',
            userId: 'user-1',
            razorpayOrderId: 'order_does_not_exist',
            razorpayPaymentId: payId,
            razorpaySignature: signCheckout('order_does_not_exist', payId),
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 404
    );

    // 5 & 15. Concurrent valid verification fulfills exactly once!
    const [v1, v2] = await Promise.all([
        svc.verifyCheckoutPayment({
            requestId: 'req-ok-1',
            organizationId: 'org-1',
            userId: 'user-1',
            razorpayOrderId: orderId,
            razorpayPaymentId: payId,
            razorpaySignature: validSig,
        }),
        svc.verifyCheckoutPayment({
            requestId: 'req-ok-2',
            organizationId: 'org-1',
            userId: 'user-1',
            razorpayOrderId: orderId,
            razorpayPaymentId: payId,
            razorpaySignature: validSig,
        }),
    ]);
    assert.equal(v1.verified, true);
    assert.equal(v2.verified, true);
    assert.equal(store.getFulfillCount(), 1, 'Subscription must be fulfilled strictly once');

    // 9. Duplicate verification returns idempotently without re-fulfilling
    const v3 = await svc.verifyCheckoutPayment({
        requestId: 'req-ok-3',
        organizationId: 'org-1',
        userId: 'user-1',
        razorpayOrderId: orderId,
        razorpayPaymentId: payId,
        razorpaySignature: validSig,
    });
    assert.equal(v3.alreadyProcessed, true);
    assert.equal(store.getFulfillCount(), 1);

    // 8. Reusing payId on a different order is rejected (409 replay)
    const { order: order2 } = await svc.createOrder({
        requestId: 'req-o2',
        organizationId: 'org-1',
        userId: 'user-1',
        planCode: 'basic_monthly',
    });
    await assert.rejects(
        () => svc.verifyCheckoutPayment({
            requestId: 'req-replay',
            organizationId: 'org-1',
            userId: 'user-1',
            razorpayOrderId: order2.razorpayOrderId!,
            razorpayPaymentId: payId,
            razorpaySignature: signCheckout(order2.razorpayOrderId!, payId),
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 409 && e.code === 'PAYMENT_ID_REPLAY'
    );

    // 17. Authorized-only payment at Razorpay must NOT mark transaction captured
    const gwAuth = createMockGateway({ remotePaymentOverrides: { order_id: order2.razorpayOrderId!, status: 'authorized', captured: false } });
    const svcAuth = createPaymentService({ repo: store.repo, getGateway: () => gwAuth.adapter });
    const authRes = await svcAuth.verifyCheckoutPayment({
        requestId: 'req-auth-only',
        organizationId: 'org-1',
        userId: 'user-1',
        razorpayOrderId: order2.razorpayOrderId!,
        razorpayPaymentId: 'pay_mock_authorized_2',
        razorpaySignature: signCheckout(order2.razorpayOrderId!, 'pay_mock_authorized_2'),
    });
    assert.equal(authRes.verified, false);
    assert.equal(authRes.status, 'authorized');
});

test('10-12,16: Webhook HMAC verification, event idempotency, failure handling, and anti-downgrade state machine', async () => {
    const store = createInMemoryRepo();
    const gw = createMockGateway();
    const svc = createPaymentService({ repo: store.repo, getGateway: () => gw.adapter });
    const plan = getServerPricingPlan('basic_monthly')!;

    const { order } = await svc.createOrder({
        requestId: 'req-wh1',
        organizationId: 'org-1',
        userId: 'user-1',
        planCode: 'basic_monthly',
    });
    const orderId = order.razorpayOrderId!;

    const capturedPayload = Buffer.from(
        JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_wh_1',
                        order_id: orderId,
                        amount: plan.totalAmountPaise,
                        currency: 'INR',
                        status: 'captured',
                    },
                },
            },
        }),
        'utf8'
    );

    // 11. Invalid webhook signature rejected 401
    await assert.rejects(
        () => svc.processWebhook({
            requestId: 'req-wh-bad',
            rawBody: capturedPayload,
            signatureHeader: signWebhook(capturedPayload, 'wrong_wh_secret'),
            eventIdHeader: 'evt_bad_1',
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 401
    );

    // Valid webhook processed
    const wh1 = await svc.processWebhook({
        requestId: 'req-wh-ok1',
        rawBody: capturedPayload,
        signatureHeader: signWebhook(capturedPayload),
        eventIdHeader: 'evt_cap_1',
    });
    assert.equal(wh1.duplicate, false);
    assert.equal(store.txs[0].status, 'captured');
    assert.equal(store.getFulfillCount(), 1);

    // 10. Duplicate webhook event idempotent
    const whDup = await svc.processWebhook({
        requestId: 'req-wh-dup',
        rawBody: capturedPayload,
        signatureHeader: signWebhook(capturedPayload),
        eventIdHeader: 'evt_cap_1',
    });
    assert.equal(whDup.duplicate, true);
    assert.equal(store.getFulfillCount(), 1);

    // 16. Late payment.failed webhook MUST NEVER downgrade captured payment!
    const lateFailPayload = Buffer.from(
        JSON.stringify({
            event: 'payment.failed',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_wh_late_fail',
                        order_id: orderId,
                        status: 'failed',
                        error_description: 'Delayed failure notification',
                    },
                },
            },
        }),
        'utf8'
    );
    await svc.processWebhook({
        requestId: 'req-wh-latefail',
        rawBody: lateFailPayload,
        signatureHeader: signWebhook(lateFailPayload),
        eventIdHeader: 'evt_late_fail_1',
    });
    assert.equal(store.txs[0].status, 'captured', 'Captured order must never be downgraded to failed');
    assert.throws(() => assertValidPaymentTransition('captured', 'failed'), /Invalid payment state transition/);
    assert.equal(canTransitionPaymentStatus('refunded', 'captured'), false);

    // 12. Genuine payment.failed on newly created order transitions cleanly to failed
    const { order: failOrder } = await svc.createOrder({
        requestId: 'req-wh2',
        organizationId: 'org-1',
        userId: 'user-1',
        planCode: 'basic_monthly',
    });
    const failPayload = Buffer.from(
        JSON.stringify({
            event: 'payment.failed',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_wh_fail_2',
                        order_id: failOrder.razorpayOrderId,
                        status: 'failed',
                        error_description: 'Bank declined',
                    },
                },
            },
        }),
        'utf8'
    );
    await svc.processWebhook({
        requestId: 'req-wh-fail2',
        rawBody: failPayload,
        signatureHeader: signWebhook(failPayload),
        eventIdHeader: 'evt_fail_2',
    });
    const failedTx = store.txs.find(t => t.order_id === failOrder.razorpayOrderId);
    assert.equal(failedTx?.status, 'failed');
    const invalid: PaymentStatus = 'captured';
    assert.equal(canTransitionPaymentStatus('failed', invalid), false);
});

test('13-14,18: Database failure, Razorpay API failure, and HTTP route auth/raw-body secret protection', async () => {
    const store = createInMemoryRepo();
    const gwFail = createMockGateway({ failCreateOrder: true });
    const svcFail = createPaymentService({ repo: store.repo, getGateway: () => gwFail.adapter });

    // 14. Razorpay API failure marks tx failed & hides internal secret in client error
    await assert.rejects(
        () => svcFail.createOrder({ requestId: 'r-rzpfail', organizationId: 'org-1', userId: 'u1', planCode: 'basic_monthly' }),
        (e: any) =>
            e instanceof PaymentServiceError &&
            e.httpStatus === 502 &&
            !e.message.includes(MOCK_SECRET)
    );
    assert.equal(store.txs[0].status, 'failed');

    // 13. Database insert failure handled cleanly
    store.setFailOnInsert(true);
    const gwOk = createMockGateway();
    const svcDbFail = createPaymentService({ repo: store.repo, getGateway: () => gwOk.adapter });
    await assert.rejects(
        () => svcDbFail.createOrder({ requestId: 'r-dbfail', organizationId: 'org-1', userId: 'u1', planCode: 'basic_monthly' }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 500
    );

    // Express integration check: unauthenticated /api/payments rejected 401; webhook rejects invalid sig 401
    const app = express();
    app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), razorpayWebhookHandler);
    app.use('/api/payments', requireAuth, paymentsRouter);
    const srv = http.createServer(app);
    await new Promise<void>(r => srv.listen(0, '127.0.0.1', r));
    const port = (srv.address() as any).port;
    try {
        const unauth = await fetch(`http://127.0.0.1:${port}/api/payments/plans`);
        assert.equal(unauth.status, 401);

        const badWh = await fetch(`http://127.0.0.1:${port}/api/payments/webhook`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'x-razorpay-signature': 'deadbeef' },
            body: JSON.stringify({ event: 'payment.captured' }),
        });
        assert.ok(badWh.status === 401 || badWh.status === 503);
    } finally {
        await new Promise<void>(r => srv.close(() => r()));
    }
});

test('Free 3-Simulation Limit: allows 3, blocks 4th (403 FREE_LIMIT_REACHED), handles concurrency, retries, failures & paid/expired plans', async () => {
    const completed = new Map<string, number>();
    const inFlight = new Map<string, Set<string>>();
    const completedKeys = new Set<string>();
    let sub: { plan: string; status: string; currentPeriodEnd: string | null } | null = null;

    const store: EntitlementStore = {
        async getActiveSubscription() {
            return sub;
        },
        async getFreeCompletedCount(userId) {
            return completed.get(userId) ?? 0;
        },
        async reserveSlot({ userId, requestKey }) {
            const c = completed.get(userId) ?? 0;
            const set = inFlight.get(userId) ?? new Set<string>();
            if (set.has(requestKey) || completedKeys.has(requestKey)) {
                return { allowed: true, completedCount: c, alreadyReserved: true };
            }
            if (c + set.size >= MAX_FREE_SIMULATIONS) {
                return { allowed: false, completedCount: c, alreadyReserved: false };
            }
            set.add(requestKey);
            inFlight.set(userId, set);
            return { allowed: true, completedCount: c, alreadyReserved: false };
        },
        async completeSlot({ userId, requestKey }) {
            inFlight.get(userId)?.delete(requestKey);
            if (!completedKeys.has(requestKey)) {
                completedKeys.add(requestKey);
                completed.set(userId, (completed.get(userId) ?? 0) + 1);
            }
        },
        async releaseSlot({ userId, requestKey }) {
            inFlight.get(userId)?.delete(requestKey);
        },
    };

    const entSvc = createSimulationEntitlementService(store);
    const org = 'org-free';
    const user = 'user-free';

    // Simulation 1 succeeds
    const s1 = await entSvc.assertAndReserveFreeSlot({ organizationId: org, userId: user, requestKey: 'k1', sourceEndpoint: 'test' });
    await s1.complete();
    await s1.complete(); // duplicate completion must NOT double-count

    // Failed simulation releases slot without burning quota
    const sFail = await entSvc.assertAndReserveFreeSlot({ organizationId: org, userId: user, requestKey: 'kfail', sourceEndpoint: 'test' });
    await sFail.release();
    assert.equal((await entSvc.getEntitlement(org, user)).freeCompletedCount, 1);

    // Concurrency test: 5 parallel requests when 1 of 3 used -> strictly 2 succeed, 3 blocked with 403 FREE_LIMIT_REACHED
    const concurrent = await Promise.allSettled(
        ['c1', 'c2', 'c3', 'c4', 'c5'].map(async (k) => {
            const slot = await entSvc.assertAndReserveFreeSlot({ organizationId: org, userId: user, requestKey: k, sourceEndpoint: 'test' });
            await slot.complete();
            return slot.requestKey;
        })
    );
    const fulfilled = concurrent.filter(r => r.status === 'fulfilled');
    const rejected = concurrent.filter(r => r.status === 'rejected');
    assert.equal(fulfilled.length, 2);
    assert.equal(rejected.length, 3);
    for (const r of rejected) {
        const reason = (r as PromiseRejectedResult).reason;
        assert.ok(reason instanceof FreeLimitReachedError);
        assert.equal(reason.httpStatus, 403);
        assert.equal(reason.code, 'FREE_LIMIT_REACHED');
    }
    assert.equal((await entSvc.getEntitlement(org, user)).freeRemaining, 0);

    // Active paid Basic subscription lifts limit
    sub = { plan: 'Basic', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400_000).toISOString() };
    const sPaid = await entSvc.assertAndReserveFreeSlot({ organizationId: org, userId: user, requestKey: 'kpaid', sourceEndpoint: 'test' });
    assert.equal(sPaid.isPaidPlan, true);
    await sPaid.complete();

    // Expired Basic subscription falls back to Free and enforces 3-simulation block again
    sub = { plan: 'Basic', status: 'active', currentPeriodEnd: new Date(Date.now() - 60_000).toISOString() };
    await assert.rejects(
        () => entSvc.assertAndReserveFreeSlot({ organizationId: org, userId: user, requestKey: 'kexp', sourceEndpoint: 'test' }),
        (e: any) => e instanceof FreeLimitReachedError && e.httpStatus === 403
    );
});

test('HTTP Route: POST /api/payments/create-order ignores client amount manipulation { plan: basic_monthly, amount: 1 } and rejects negative amount', async () => {
    const store = createInMemoryRepo();
    const gw = createMockGateway();
    const svc = createPaymentService({ repo: store.repo, getGateway: () => gw.adapter });

    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        req.userId = 'user-http-1';
        req.organizationId = 'org-http-1';
        req.userEmail = 'buyer@example.com';
        next();
    });
    app.use('/api/payments', createPaymentsRouter(svc));

    const srv = http.createServer(app);
    await new Promise<void>(r => srv.listen(0, '127.0.0.1', r));
    const port = (srv.address() as any).port;

    try {
        const tampered = await fetch(`http://127.0.0.1:${port}/api/payments/create-order`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ plan: 'basic_monthly', amount: 1 }),
        });
        assert.equal(tampered.status, 201);
        const body = await tampered.json();
        assert.equal(body.order.amountPaise, 149900, 'Server must ignore client amount=1 and charge 149900 paise');
        assert.equal(body.order.amount, 1499);

        const neg = await fetch(`http://127.0.0.1:${port}/api/payments/create-order`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ plan: 'basic_monthly', amount: -50 }),
        });
        assert.equal(neg.status, 400);
        const negBody = await neg.json();
        assert.equal(negBody.code, 'INVALID_AMOUNT');
    } finally {
        await new Promise<void>(r => srv.close(() => r()));
    }
});

test('Webhook Hardening: missing amount, currency mismatch, partial refund vs full refund subscription revocation', async () => {
    const store = createInMemoryRepo();
    const gw = createMockGateway();
    const svc = createPaymentService({ repo: store.repo, getGateway: () => gw.adapter });
    const plan = getServerPricingPlan('pro_monthly')!;

    const { order } = await svc.createOrder({
        requestId: 'req-sec-1',
        organizationId: 'org-sec-1',
        userId: 'user-sec-1',
        planCode: 'pro_monthly',
    });
    const orderId = order.razorpayOrderId!;

    // 1. Captured webhook WITHOUT amount must be rejected (no fallback to expectedPaise)
    const missingAmtPayload = Buffer.from(
        JSON.stringify({
            event: 'payment.captured',
            payload: { payment: { entity: { id: 'pay_sec_noamt', order_id: orderId, currency: 'INR', status: 'captured' } } },
        }),
        'utf8'
    );
    await assert.rejects(
        () => svc.processWebhook({
            requestId: 'req-sec-noamt',
            rawBody: missingAmtPayload,
            signatureHeader: signWebhook(missingAmtPayload),
            eventIdHeader: 'evt_sec_noamt',
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 400 && e.code === 'WEBHOOK_AMOUNT_MISMATCH'
    );

    // 2. Captured webhook with wrong currency must be rejected
    const badCurrencyPayload = Buffer.from(
        JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_sec_usd',
                        order_id: orderId,
                        amount: plan.totalAmountPaise,
                        currency: 'USD',
                        status: 'captured',
                    },
                },
            },
        }),
        'utf8'
    );
    await assert.rejects(
        () => svc.processWebhook({
            requestId: 'req-sec-usd',
            rawBody: badCurrencyPayload,
            signatureHeader: signWebhook(badCurrencyPayload),
            eventIdHeader: 'evt_sec_usd',
        }),
        (e: any) => e instanceof PaymentServiceError && e.httpStatus === 400 && e.code === 'WEBHOOK_CURRENCY_MISMATCH'
    );

    // 3. Valid capture
    const okCap = Buffer.from(
        JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_sec_ok',
                        order_id: orderId,
                        amount: plan.totalAmountPaise,
                        currency: 'INR',
                        status: 'captured',
                    },
                },
            },
        }),
        'utf8'
    );
    await svc.processWebhook({
        requestId: 'req-sec-ok',
        rawBody: okCap,
        signatureHeader: signWebhook(okCap),
        eventIdHeader: 'evt_sec_ok',
    });
    assert.equal(store.txs[0].status, 'captured');
    assert.equal(store.getFulfillCount(), 1);
    assert.equal(store.getRevokeCount(), 0);

    // 4. Partial refund must NOT mark transaction fully refunded or revoke subscription
    const partialRefund = Buffer.from(
        JSON.stringify({
            event: 'refund.processed',
            payload: {
                refund: {
                    entity: {
                        id: 'rfnd_partial_1',
                        payment_id: 'pay_sec_ok',
                        amount: 50000,
                    },
                },
            },
        }),
        'utf8'
    );
    await svc.processWebhook({
        requestId: 'req-sec-partrefund',
        rawBody: partialRefund,
        signatureHeader: signWebhook(partialRefund),
        eventIdHeader: 'evt_part_refund',
    });
    assert.equal(store.txs[0].status, 'captured');
    assert.equal(store.getRevokeCount(), 0);

    // 5. Full refund transitions to 'refunded' and revokes subscription
    const fullRefund = Buffer.from(
        JSON.stringify({
            event: 'refund.processed',
            payload: {
                refund: {
                    entity: {
                        id: 'rfnd_full_1',
                        payment_id: 'pay_sec_ok',
                        amount: plan.totalAmountPaise,
                    },
                },
            },
        }),
        'utf8'
    );
    await svc.processWebhook({
        requestId: 'req-sec-fullrefund',
        rawBody: fullRefund,
        signatureHeader: signWebhook(fullRefund),
        eventIdHeader: 'evt_full_refund',
    });
    assert.equal(store.txs[0].status, 'refunded');
    assert.equal(store.getRevokeCount(), 1);
});

test('Migration 006 Least-Privilege & Non-Destructive SQL Security Verification', () => {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const migPath = path.resolve(here, '../migrations/006_harden_table_privileges.sql');
    const sql = fs.readFileSync(migPath, 'utf8');
    const nonCommentSql = sql
        .split('\n')
        .filter(line => !line.trimStart().startsWith('--'))
        .join('\n');

    // Must never contain destructive DDL/DML
    assert.equal(/\bDROP\s+TABLE\b/i.test(nonCommentSql), false, 'Must not drop tables');
    assert.equal(/\bDROP\s+COLUMN\b/i.test(nonCommentSql), false, 'Must not drop columns');
    assert.equal(/\bTRUNCATE\s+(TABLE\s+)?public\./i.test(nonCommentSql), false, 'Must not execute TRUNCATE');
    assert.equal(/\bDELETE\s+FROM\s+/i.test(nonCommentSql), false, 'Must not delete rows');

    // Sensitive payment/quota/webhook/OAuth tables must be server-only (revoked from PUBLIC, anon, authenticated)
    for (const tbl of [
        'free_simulation_usage',
        'free_simulation_ledger',
        'payment_transactions',
        'payment_webhook_events',
        'billing_subscriptions',
        'oauth_integrations',
        'data_consent_audit_log',
        'privacy_deletion_logs',
        'agent_logs',
        'background_news_jobs',
    ]) {
        assert.ok(sql.includes(`'${tbl}'`), `Migration 006 must harden ${tbl}`);
    }

    assert.ok(nonCommentSql.includes('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC'));
    assert.ok(nonCommentSql.includes('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon'));
    assert.ok(nonCommentSql.includes('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM authenticated'));
    assert.ok(nonCommentSql.includes('GRANT ALL PRIVILEGES ON TABLE public.%I TO service_role'));

    // Never grant ANY table privilege to anon anywhere in 006
    assert.equal(/\bGRANT\b[\s\S]{0,80}\bON\s+TABLE\b[\s\S]{0,80}\bTO\s+anon\b/i.test(nonCommentSql), false);

    // Sensitive SECURITY DEFINER RPCs locked to service_role only
    for (const fn of [
        'activate_paid_subscription_atomic',
        'reserve_free_simulation_slot',
        'complete_free_simulation_slot',
        'release_free_simulation_slot',
        'create_atomic_session_with_steps',
    ]) {
        assert.ok(sql.includes(`'${fn}'`), `Migration 006 must lock down RPC ${fn}`);
    }
    assert.ok(nonCommentSql.includes('REVOKE ALL ON FUNCTION public.%I(%s) FROM authenticated'));
    assert.ok(nonCommentSql.includes('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role'));

    // Future tables/sequences/functions protected via ALTER DEFAULT PRIVILEGES
    assert.ok(nonCommentSql.includes('ALTER DEFAULT PRIVILEGES'));
});
