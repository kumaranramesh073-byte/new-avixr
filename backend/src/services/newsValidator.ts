/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — News Source & URL Validation Service
   Prevents fabricated URLs (e.g. example.com), raw HTML RSS fragments,
   duplicate articles, and invalid publication dates from appearing as real news.
   ═══════════════════════════════════════════════════════════════════════════ */

import crypto from 'crypto';

export type VerificationStatus = 'verified' | 'unverified' | 'rejected' | 'ai_summary';

export interface RawNewsArticle {
    id?: string;
    title?: string | null;
    summary?: string | null;
    content?: string | null;
    url?: string | null;
    url_hash?: string | null;
    source?: string | null;
    category?: string | null;
    topics?: unknown;
    published_at?: string | null;
    retrieved_at?: string | null;
    verification_status?: string | null;
    is_verified?: boolean | null;
}

export interface ValidatedNewsResult {
    isValid: boolean;
    verificationStatus: VerificationStatus;
    isVerified: boolean;
    sourceDomain: string | null;
    normalizedUrl: string | null;
    urlHash: string | null;
    cleanTitle: string;
    cleanSummary: string | null;
    isExpired: boolean;
    reasons: string[];
}

const BLOCKED_DOMAINS = new Set([
    'example.com',
    'example.org',
    'example.net',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    'test.com',
    'invalid',
]);

const KNOWN_TRUSTED_SOURCES = new Set([
    'reuters.com',
    'bloomberg.com',
    'ft.com',
    'wsj.com',
    'cnbc.com',
    'bbc.com',
    'bbc.co.uk',
    'techcrunch.com',
    'theverge.com',
    'economist.com',
    'business-standard.com',
    'livemint.com',
    'economictimes.indiatimes.com',
    'news.ycombinator.com',
    'news.google.com',
    'apnews.com',
    'nytimes.com',
    'forbes.com',
    'hbr.org',
    'arxiv.org',
    'github.com',
]);

const MAX_ARTICLE_AGE_DAYS = 90;

export function decodeHtmlEntitiesAndStripTags(input: string | null | undefined): string {
    if (!input) return '';
    let text = input
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;|&rsquo;|&lsquo;/gi, "'")
        .replace(/&ldquo;|&rdquo;/gi, '"')
        .replace(/&mdash;/gi, '—')
        .replace(/&ndash;/gi, '–')
        .replace(/&hellip;/gi, '...')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#(\d+);/g, (_m, dec) => {
            const code = Number(dec);
            return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
        })
        .replace(/&#x([0-9a-f]+);/gi, (_m, hex) => {
            const code = parseInt(hex, 16);
            return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : '';
        });
    text = text.replace(/<[^>]*>/g, ' ');
    return text.replace(/\s+/g, ' ').trim();
}

function isPrivateOrReservedHost(hostname: string): boolean {
    const h = hostname.toLowerCase();
    if (BLOCKED_DOMAINS.has(h)) return true;
    if (
        h.endsWith('.example.com') ||
        h.endsWith('.example.org') ||
        h.endsWith('.example.net') ||
        h.endsWith('.test') ||
        h.endsWith('.invalid') ||
        h.endsWith('.local') ||
        h.endsWith('.localhost')
    ) {
        return true;
    }
    if (/^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return true;
    if (h === '::1' || h === '[::1]') return true;
    return false;
}

export function normalizeArticleUrl(rawUrl: string): { normalized: string; domain: string } | null {
    try {
        const parsed = new URL(rawUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            return null;
        }
        if (!parsed.hostname || !parsed.hostname.includes('.')) {
            return null;
        }
        // Strip common tracking query params for duplicate detection
        const toDelete: string[] = [];
        parsed.searchParams.forEach((_v, k) => {
            if (/^(utm_|fbclid|gclid|ocid|ref_src)/i.test(k)) toDelete.push(k);
        });
        toDelete.forEach(k => parsed.searchParams.delete(k));
        parsed.hash = '';
        const normalized = parsed.toString().replace(/\/+$/, '');
        return { normalized, domain: parsed.hostname.toLowerCase().replace(/^www\./, '') };
    } catch {
        return null;
    }
}

export function computeUrlHash(normalizedUrl: string): string {
    return crypto.createHash('sha256').update(normalizedUrl).digest('hex');
}

export function validateNewsArticle(article: RawNewsArticle): ValidatedNewsResult {
    const reasons: string[] = [];
    const cleanTitle = decodeHtmlEntitiesAndStripTags(article.title);
    const rawSummary = decodeHtmlEntitiesAndStripTags(article.summary);
    const cleanSummary = rawSummary ? rawSummary.slice(0, 1000) : null;

    if (!cleanTitle || cleanTitle.length < 8) {
        reasons.push('Missing or too-short headline');
    }

    const source = (article.source || '').trim();
    if (!source || /^(unknown|ai|synthetic|mock|test)$/i.test(source)) {
        reasons.push('Missing or non-authentic source attribution');
    }

    let sourceDomain: string | null = null;
    let normalizedUrl: string | null = null;
    let urlHash: string | null = null;

    if (!article.url || typeof article.url !== 'string') {
        reasons.push('Missing source URL');
    } else {
        const norm = normalizeArticleUrl(article.url);
        if (!norm) {
            reasons.push('Malformed or non-HTTP(S) URL');
        } else {
            normalizedUrl = norm.normalized;
            sourceDomain = norm.domain;
            urlHash = computeUrlHash(normalizedUrl);
            if (isPrivateOrReservedHost(sourceDomain)) {
                reasons.push(`Placeholder or non-public domain (${sourceDomain})`);
            }
        }
    }

    // Publication date validation
    let isExpired = false;
    if (!article.published_at) {
        reasons.push('Missing publication timestamp');
    } else {
        const pubMs = Date.parse(article.published_at);
        if (Number.isNaN(pubMs)) {
            reasons.push('Invalid publication timestamp');
        } else {
            const now = Date.now();
            if (pubMs > now + 24 * 60 * 60 * 1000) {
                reasons.push('Publication date is in the future');
            }
            const ageDays = (now - pubMs) / (24 * 60 * 60 * 1000);
            if (ageDays > MAX_ARTICLE_AGE_DAYS) {
                isExpired = true;
            }
        }
    }

    // Determine classification
    let verificationStatus: VerificationStatus;
    let isVerified = false;

    const hasCriticalFailure = reasons.some(r =>
        r.includes('Placeholder') ||
        r.includes('Malformed') ||
        r.includes('Missing source URL') ||
        r.includes('non-authentic') ||
        r.includes('future') ||
        r.includes('Invalid publication')
    );

    if (hasCriticalFailure) {
        verificationStatus = 'rejected';
    } else if (reasons.length === 0 && sourceDomain && (KNOWN_TRUSTED_SOURCES.has(sourceDomain) || sourceDomain.split('.').length >= 2)) {
        // Real public domain + valid HTTP(S) URL + valid source + valid date
        verificationStatus = 'verified';
        isVerified = true;
    } else {
        verificationStatus = 'unverified';
    }

    return {
        isValid: verificationStatus === 'verified',
        verificationStatus,
        isVerified,
        sourceDomain,
        normalizedUrl,
        urlHash,
        cleanTitle,
        cleanSummary,
        isExpired,
        reasons,
    };
}

/**
 * Performs an optional live HTTP HEAD/GET check for newly ingested URLs
 * (with timeout & redirect check) so fabricated 404/NXDOMAIN links are caught.
 */
export async function verifyUrlReachable(url: string): Promise<{ reachable: boolean; status?: number; reason?: string }> {
    const norm = normalizeArticleUrl(url);
    if (!norm || isPrivateOrReservedHost(norm.domain)) {
        return { reachable: false, reason: 'Invalid or blocked domain' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
        const res = await fetch(norm.normalized, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: { 'User-Agent': 'Q-Simutron-NewsValidator/1.0' },
        });
        clearTimeout(timer);
        if (res.status === 405) {
            // Some servers reject HEAD — try lightweight GET
            const c2 = new AbortController();
            const t2 = setTimeout(() => c2.abort(), 5000);
            const g = await fetch(norm.normalized, { method: 'GET', redirect: 'follow', signal: c2.signal });
            clearTimeout(t2);
            return { reachable: g.ok, status: g.status, reason: g.ok ? undefined : `HTTP ${g.status}` };
        }
        return { reachable: res.ok, status: res.status, reason: res.ok ? undefined : `HTTP ${res.status}` };
    } catch (err: any) {
        clearTimeout(timer);
        return { reachable: false, reason: err?.message || 'Network check failed' };
    }
}
