/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron — Centralized Razorpay LIVE SDK Client & Cryptographic Verification
   - Singleton server-side Razorpay SDK instance
   - Strict LIVE credential check (never silently runs mock payments)
   - Constant-time HMAC-SHA256 verification for Checkout and Webhook signatures
   ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { config, getMissingRazorpayEnvVars } from '../config.js';

export interface RazorpayOrderCreateInput {
    amount: number;
    currency: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface RazorpayOrderEntity {
    id: string;
    amount: number | string;
    currency: string;
    receipt?: string;
    status: string;
}

export interface RazorpayPaymentEntity {
    id: string;
    order_id: string | null;
    amount: number | string;
    currency: string;
    status: string;
    captured?: boolean;
    method?: string;
    error_code?: string | null;
    error_description?: string | null;
}

export interface RazorpayGatewayAdapter {
    readonly keyId: string;
    createOrder(input: RazorpayOrderCreateInput): Promise<RazorpayOrderEntity>;
    fetchPayment(paymentId: string): Promise<RazorpayPaymentEntity>;
    fetchOrder(orderId: string): Promise<RazorpayOrderEntity>;
    verifyCheckoutSignature(params: { orderId: string; paymentId: string; signature: string }): boolean;
    verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
}

let cachedSdk: Razorpay | null = null;
let cachedSdkSignature = '';

function getCredentialsPair(): { keyId: string; keySecret: string } {
    const keyId = (process.env.RAZORPAY_KEY_ID ?? config.razorpayKeyId).trim();
    const keySecret = (process.env.RAZORPAY_KEY_SECRET ?? config.razorpayKeySecret).trim();
    if (!keyId || !keySecret) {
        const missing = getMissingRazorpayEnvVars();
        throw new Error(
            `Razorpay gateway is not configured on the server. Missing: ${missing.join(', ') || 'RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET'}`
        );
    }
    return { keyId, keySecret };
}

function getWebhookSecret(): string {
    const secret = (process.env.RAZORPAY_WEBHOOK_SECRET ?? config.razorpayWebhookSecret).trim();
    if (!secret) {
        throw new Error('Razorpay webhook verification unavailable: missing RAZORPAY_WEBHOOK_SECRET');
    }
    return secret;
}

export function getRazorpaySdkInstance(): { sdk: Razorpay; keyId: string } {
    const { keyId, keySecret } = getCredentialsPair();
    const pairMarker = crypto.createHash('sha256').update(`${keyId}:${keySecret}`).digest('hex');

    // Re-initialize only if credentials were rotated at runtime or not yet initialized
    if (!cachedSdk || cachedSdkSignature !== pairMarker) {
        cachedSdk = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });
        cachedSdkSignature = pairMarker;
    }

    return { sdk: cachedSdk, keyId };
}

function timingSafeHexEquals(expectedHex: string, actualHex: string): boolean {
    const cleanActual = String(actualHex || '').trim();
    if (!/^[0-9a-f]{64}$/i.test(cleanActual)) {
        return false;
    }
    const a = Buffer.from(expectedHex.toLowerCase(), 'utf8');
    const b = Buffer.from(cleanActual.toLowerCase(), 'utf8');
    if (a.length !== b.length) {
        return false;
    }
    return crypto.timingSafeEqual(a, b);
}

export function verifyRazorpayCheckoutHmac(params: {
    orderId: string;
    paymentId: string;
    signature: string;
    keySecret: string;
}): boolean {
    const { orderId, paymentId, signature, keySecret } = params;
    if (!orderId || !paymentId || !signature || !keySecret) {
        return false;
    }
    const expected = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');
    return timingSafeHexEquals(expected, signature);
}

export function verifyRazorpayWebhookHmac(params: {
    rawBody: Buffer | string;
    signature: string;
    webhookSecret: string;
}): boolean {
    const { rawBody, signature, webhookSecret } = params;
    if (!rawBody || !signature || !webhookSecret) {
        return false;
    }
    const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');
    return timingSafeHexEquals(expected, signature);
}

export function createDefaultRazorpayAdapter(): RazorpayGatewayAdapter {
    const { keyId, keySecret } = getCredentialsPair();
    const { sdk } = getRazorpaySdkInstance();

    return {
        keyId,
        async createOrder(input: RazorpayOrderCreateInput): Promise<RazorpayOrderEntity> {
            const created = await sdk.orders.create({
                amount: input.amount,
                currency: input.currency,
                receipt: input.receipt,
                notes: input.notes,
            });
            return created as unknown as RazorpayOrderEntity;
        },
        async fetchPayment(paymentId: string): Promise<RazorpayPaymentEntity> {
            const payment = await sdk.payments.fetch(paymentId);
            return payment as unknown as RazorpayPaymentEntity;
        },
        async fetchOrder(orderId: string): Promise<RazorpayOrderEntity> {
            const order = await sdk.orders.fetch(orderId);
            return order as unknown as RazorpayOrderEntity;
        },
        verifyCheckoutSignature({ orderId, paymentId, signature }): boolean {
            return verifyRazorpayCheckoutHmac({ orderId, paymentId, signature, keySecret });
        },
        verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
            const webhookSecret = getWebhookSecret();
            return verifyRazorpayWebhookHmac({ rawBody, signature, webhookSecret });
        },
    };
}
