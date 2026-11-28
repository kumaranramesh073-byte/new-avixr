/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron — Razorpay LIVE Payment Routes & Raw-Body Webhook Handler
   ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { sanitizeErrorMessage } from '../services/credentialVault.js';
import { FREE_PLAN_CATALOG_ENTRY } from '../services/paymentCatalog.js';
import {
    createPaymentService,
    PaymentServiceError,
} from '../services/paymentService.js';
import { defaultEntitlementService } from '../services/simulationEntitlementService.js';

const defaultPaymentService = createPaymentService();

// Per-user and per-IP sliding-window rate limiters
const rateBuckets = new Map<string, number[]>();
function allowRate(key: string, maxRequests: number, windowMs = 60_000): boolean {
    const now = Date.now();
    const hits = (rateBuckets.get(key) || []).filter(ts => now - ts < windowMs);
    if (hits.length >= maxRequests) {
        rateBuckets.set(key, hits);
        return false;
    }
    hits.push(now);
    rateBuckets.set(key, hits);
    return true;
}

function getRequestId(req: Request): string {
    const hdr = req.header('x-request-id');
    return hdr && hdr.length <= 64 ? hdr : `pay_${crypto.randomUUID().slice(0, 12)}`;
}

function handleError(res: Response, requestId: string, err: unknown) {
    if (err instanceof PaymentServiceError) {
        return res.status(err.httpStatus).json({
            error: err.message,
            code: err.code,
            requestId,
        });
    }
    return res.status(500).json({
        error: 'Internal payment processing error',
        code: 'INTERNAL_ERROR',
        requestId,
        detail: process.env.NODE_ENV === 'production' ? undefined : sanitizeErrorMessage(err),
    });
}

export function createPaymentsRouter(
    paymentService = defaultPaymentService,
    entitlementService = defaultEntitlementService
): Router {
    const router = Router();

// GET /api/payments/plans — Server-authoritative pricing catalog (authenticated)
router.get('/plans', (_req: Request, res: Response) => {
    return res.json({
        freePlan: FREE_PLAN_CATALOG_ENTRY,
        plans: paymentService.listPlans(),
    });
});

// GET /api/payments/entitlement — Current plan & Free 3-simulation usage status
router.get('/entitlement', async (req: Request, res: Response) => {
    const requestId = getRequestId(req);
    try {
        const entitlement = await entitlementService.getEntitlement(
            req.organizationId!,
            req.userId!
        );
        return res.json({ entitlement, requestId });
    } catch (err) {
        return handleError(res, requestId, err);
    }
});

// GET /api/payments/orders — List current user/organization payment orders
router.get('/orders', async (req: Request, res: Response) => {
    const requestId = getRequestId(req);
    try {
        const orders = await paymentService.listUserOrders(req.organizationId!, req.userId!);
        return res.json({ orders, requestId });
    } catch (err) {
        return handleError(res, requestId, err);
    }
});

// GET /api/payments/orders/:orderId — Retrieve single order status (ownership enforced)
router.get('/orders/:orderId', async (req: Request, res: Response) => {
    const requestId = getRequestId(req);
    try {
        const order = await paymentService.getUserOrder(
            req.organizationId!,
            req.userId!,
            req.params.orderId
        );
        return res.json({ order, requestId });
    } catch (err) {
        return handleError(res, requestId, err);
    }
});

// POST /api/payments/create-order — Create Razorpay LIVE order using server pricing
router.post('/create-order', async (req: Request, res: Response) => {
    const requestId = getRequestId(req);
    const userId = req.userId!;
    const organizationId = req.organizationId!;

    if (!allowRate(`create:${userId}`, 10, 60_000)) {
        return res.status(429).json({
            error: 'Too many payment order requests. Please wait a minute before retrying.',
            code: 'RATE_LIMIT_EXCEEDED',
            requestId,
        });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const rawPlan = typeof body.planCode === 'string'
        ? body.planCode
        : typeof body.plan === 'string'
            ? body.plan
            : '';
    const planCode = rawPlan.trim();
    const currency = typeof body.currency === 'string' ? body.currency.trim() : 'INR';
    const expectedAmountPaise = body.expectedAmountPaise;
    const idempotencyKey =
        req.header('idempotency-key') ||
        (typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : undefined);

    if (!planCode) {
        return res.status(400).json({
            error: 'planCode is required.',
            code: 'MISSING_PLAN_CODE',
            requestId,
        });
    }

    // Reject obviously malformed/negative client `amount` fields; ignore any positive client
    // `amount` override so server-authoritative pricing is strictly used.
    if (body.amount !== undefined && body.amount !== null && body.amount !== '') {
        const numAmt = Number(body.amount);
        if (!Number.isFinite(numAmt) || numAmt <= 0 || numAmt > 100_000_000) {
            return res.status(400).json({
                error: 'Invalid payment amount supplied.',
                code: 'INVALID_AMOUNT',
                requestId,
            });
        }
    }

    try {
        const result = await paymentService.createOrder({
            requestId,
            organizationId,
            userId,
            userEmail: req.userEmail,
            planCode,
            currency,
            expectedAmountPaise,
            idempotencyKey,
        });
        return res.status(result.idempotentReplay ? 200 : 201).json({
            ...result,
            requestId,
        });
    } catch (err) {
        return handleError(res, requestId, err);
    }
});

// POST /api/payments/verify — Cryptographic + Razorpay API verification
router.post('/verify', async (req: Request, res: Response) => {
    const requestId = getRequestId(req);
    const userId = req.userId!;
    const organizationId = req.organizationId!;

    if (!allowRate(`verify:${userId}`, 15, 60_000)) {
        return res.status(429).json({
            error: 'Too many payment verification attempts. Please wait a minute.',
            code: 'RATE_LIMIT_EXCEEDED',
            requestId,
        });
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const razorpayOrderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
    const razorpayPaymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
    const razorpaySignature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({
            error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
            code: 'MISSING_VERIFICATION_FIELDS',
            requestId,
        });
    }

    try {
        const result = await paymentService.verifyCheckoutPayment({
            requestId,
            organizationId,
            userId,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
        });
        return res.json({
            ...result,
            requestId,
        });
    } catch (err) {
        return handleError(res, requestId, err);
    }
});

    return router;
}

export const paymentsRouter = createPaymentsRouter();

export function createRazorpayWebhookHandler(paymentService = defaultPaymentService) {
    return async function razorpayWebhookHandlerInner(req: Request, res: Response) {
        const requestId = getRequestId(req);
        const clientIp = req.ip || 'unknown';
        if (!allowRate(`wh:${clientIp}`, 120, 60_000)) {
            return res.status(429).json({
                error: 'Webhook rate limit exceeded.',
                code: 'RATE_LIMIT_EXCEEDED',
                requestId,
            });
        }

        const signatureHeader = req.header('x-razorpay-signature') || '';
        const eventIdHeader = req.header('x-razorpay-event-id') || undefined;
        const rawBody = Buffer.isBuffer(req.body)
            ? req.body
            : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}), 'utf8');

        try {
            const result = await paymentService.processWebhook({
                requestId,
                rawBody,
                signatureHeader,
                eventIdHeader,
            });
            return res.status(200).json({ ...result, requestId });
        } catch (err) {
            return handleError(res, requestId, err);
        }
    };
}

// POST /api/payments/webhook — Raw-body HMAC verified Razorpay webhook endpoint
export const razorpayWebhookHandler = createRazorpayWebhookHandler();
