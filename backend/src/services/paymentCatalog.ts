/* ═══════════════════════════════════════════════════════════════════════════
   Q-Simutron — Server-Authoritative Pricing Catalog & Payment State Machine
   Exact approved INR pricing (no unapproved GST/fee markup, zero client trust).
   Monthly: Free = ₹0, Basic = ₹1,499, Plus = ₹1,999, Pro = ₹3,999
   Yearly:  Basic = ₹14,990, Plus = ₹19,990, Pro = ₹39,990
   ═══════════════════════════════════════════════════════════════════════════ */

export type PaymentStatus =
    | 'created'
    | 'pending'
    | 'authorized'
    | 'captured'
    | 'failed'
    | 'refunded';

export type SubscriptionPlanName = 'Free' | 'Basic' | 'Plus' | 'Pro' | 'Enterprise';
export type TransactionTier = 'free' | 'basic' | 'plus' | 'pro' | 'enterprise';

export interface ServerPricingPlan {
    code:
        | 'basic_monthly'
        | 'plus_monthly'
        | 'pro_monthly'
        | 'basic_yearly'
        | 'plus_yearly'
        | 'pro_yearly';
    name: string;
    tier: TransactionTier;
    subscriptionPlan: SubscriptionPlanName;
    billingCycle: 'monthly' | 'yearly';
    periodDays: number;
    currency: 'INR';
    totalAmountPaise: number;
    displayTotalInr: number;
    maxSeats: number;
    monthlyTokenQuota: number;
    simulationLimit: number | null; // null = paid plan (subject to token/fair-use limits, not 3-free cap)
    active: boolean;
}

export const FREE_PLAN_CATALOG_ENTRY = {
    code: 'free' as const,
    name: 'Q-Simutron Free',
    tier: 'free' as TransactionTier,
    subscriptionPlan: 'Free' as SubscriptionPlanName,
    billingCycle: 'free' as const,
    currency: 'INR' as const,
    totalAmountPaise: 0,
    displayTotalInr: 0,
    maxSeats: 1,
    monthlyTokenQuota: 1_000_000,
    simulationLimit: 3,
    active: true,
};

function buildPaidPlan(
    code: ServerPricingPlan['code'],
    name: string,
    tier: TransactionTier,
    subscriptionPlan: SubscriptionPlanName,
    billingCycle: 'monthly' | 'yearly',
    amountInrWholeRupees: number,
    maxSeats: number,
    monthlyTokenQuota: number
): ServerPricingPlan {
    const totalAmountPaise = Math.round(amountInrWholeRupees * 100);
    return {
        code,
        name,
        tier,
        subscriptionPlan,
        billingCycle,
        periodDays: billingCycle === 'yearly' ? 365 : 30,
        currency: 'INR',
        totalAmountPaise,
        displayTotalInr: amountInrWholeRupees,
        maxSeats,
        monthlyTokenQuota,
        simulationLimit: null,
        active: true,
    };
}

export const SERVER_PRICING_PLANS: Record<ServerPricingPlan['code'], ServerPricingPlan> = {
    basic_monthly: buildPaidPlan('basic_monthly', 'Q-Simutron Basic (Monthly)', 'basic', 'Basic', 'monthly', 1499, 5, 25_000_000),
    plus_monthly: buildPaidPlan('plus_monthly', 'Q-Simutron Plus (Monthly)', 'plus', 'Plus', 'monthly', 1999, 10, 50_000_000),
    pro_monthly: buildPaidPlan('pro_monthly', 'Q-Simutron Pro (Monthly)', 'pro', 'Pro', 'monthly', 3999, 25, 150_000_000),
    basic_yearly: buildPaidPlan('basic_yearly', 'Q-Simutron Basic (Yearly)', 'basic', 'Basic', 'yearly', 14990, 5, 25_000_000),
    plus_yearly: buildPaidPlan('plus_yearly', 'Q-Simutron Plus (Yearly)', 'plus', 'Plus', 'yearly', 19990, 10, 50_000_000),
    pro_yearly: buildPaidPlan('pro_yearly', 'Q-Simutron Pro (Yearly)', 'pro', 'Pro', 'yearly', 39990, 25, 150_000_000),
};

export const SUPPORTED_CURRENCIES = new Set(['INR']);

export function getServerPricingPlan(planCode: string): ServerPricingPlan | null {
    const clean = String(planCode || '').trim() as ServerPricingPlan['code'];
    const plan = SERVER_PRICING_PLANS[clean];
    return plan && plan.active ? plan : null;
}

export function listServerPricingPlans() {
    return Object.values(SERVER_PRICING_PLANS).filter(p => p.active);
}

/**
 * Valid payment state machine transitions aligned with Supabase
 * `payment_transactions_status_check` and Razorpay capture lifecycle.
 */
const ALLOWED_TRANSITIONS: Record<PaymentStatus, Set<PaymentStatus>> = {
    created: new Set(['created', 'pending', 'authorized', 'captured', 'failed']),
    pending: new Set(['pending', 'authorized', 'captured', 'failed']),
    authorized: new Set(['authorized', 'captured', 'failed']),
    captured: new Set(['captured', 'refunded']), // Never downgrade captured to failed/pending/created
    failed: new Set(['failed']),
    refunded: new Set(['refunded']),
};

export function isValidPaymentStatus(status: string): status is PaymentStatus {
    return status in ALLOWED_TRANSITIONS;
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[from];
    return Boolean(allowed && allowed.has(to));
}

export function assertValidPaymentTransition(from: PaymentStatus, to: PaymentStatus): void {
    if (!canTransitionPaymentStatus(from, to)) {
        throw new Error(`Invalid payment state transition: ${from} -> ${to}`);
    }
}
