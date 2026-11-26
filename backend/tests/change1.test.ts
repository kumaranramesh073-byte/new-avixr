import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import http from 'node:http';
import {
    validateNewsArticle,
    decodeHtmlEntitiesAndStripTags,
    normalizeArticleUrl,
    computeUrlHash,
} from '../src/services/newsValidator.js';
// Set harmless local defaults before importing auth/supabase modules if backend/.env is absent on test runner
process.env.SUPABASE_URL ||= 'https://unit-test-placeholder.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'unit-test-service-key-placeholder-000000000000';

const { formatDnaSummary, dnaToUserParams } = await import('../src/services/userContext.js');
type BusinessDNA = import('../src/services/userContext.js').BusinessDNA;
const { requireAdmin, verifyBearerToken } = await import('../src/middleware/auth.js');
const { config } = await import('../src/config.js');

// ── 1. News Validator Tests ──────────────────────────────────────────────────

test('validateNewsArticle accepts valid HTTPS article from reputable public domain', () => {
    const res = validateNewsArticle({
        title: 'Global Chipmakers Expand Wafer Fabrication Capacity in 2026',
        summary: '<p>Foundries announced &ldquo;major expansions&rdquo; across APAC &amp; US.</p>',
        url: 'https://www.reuters.com/technology/global-chipmakers-expand-2026-11-01/?utm_source=feed',
        source: 'Reuters',
        published_at: new Date(Date.now() - 2 * 86400_000).toISOString(),
    });

    assert.equal(res.verificationStatus, 'verified');
    assert.equal(res.isVerified, true);
    assert.equal(res.sourceDomain, 'reuters.com');
    assert.equal(res.normalizedUrl, 'https://www.reuters.com/technology/global-chipmakers-expand-2026-11-01');
    assert.equal(res.cleanSummary, 'Foundries announced "major expansions" across APAC & US.');
    assert.equal(res.reasons.length, 0);
});

test('validateNewsArticle rejects placeholder domains like news.example.com and example.com', () => {
    for (const badUrl of [
        'https://news.example.com/fabricated-headline',
        'https://example.com/article-123',
        'http://localhost:3000/fake-news',
        'http://127.0.0.1/internal',
    ]) {
        const res = validateNewsArticle({
            title: 'Placeholder Semiconductor Supply Chain Headline',
            summary: 'Synthetic placeholder article',
            url: badUrl,
            source: 'Example Press',
            published_at: new Date().toISOString(),
        });
        assert.equal(res.verificationStatus, 'rejected', `Expected ${badUrl} to be rejected`);
        assert.equal(res.isVerified, false);
    }
});

test('validateNewsArticle rejects malformed URLs, missing source, synthetic source, and future dates', () => {
    const malformed = validateNewsArticle({
        title: 'Valid Looking Headline Too Bad URL Is Broken',
        url: 'javascript:alert(1)',
        source: 'Reuters',
        published_at: new Date().toISOString(),
    });
    assert.equal(malformed.verificationStatus, 'rejected');
    assert.equal(malformed.isVerified, false);

    const missingSource = validateNewsArticle({
        title: 'Headline Missing Authentic Source Attribution',
        url: 'https://www.reuters.com/business/test-story',
        source: 'synthetic',
        published_at: new Date().toISOString(),
    });
    assert.equal(missingSource.verificationStatus, 'rejected');
    assert.equal(missingSource.isVerified, false);

    const futureDated = validateNewsArticle({
        title: 'Headline From Far Future Date Must Be Rejected',
        url: 'https://www.reuters.com/business/future-story',
        source: 'Reuters',
        published_at: new Date(Date.now() + 5 * 86400_000).toISOString(),
    });
    assert.equal(futureDated.verificationStatus, 'rejected');
    assert.equal(futureDated.isVerified, false);
});

test('normalizeArticleUrl & computeUrlHash catch duplicate URLs differing only by utm params or trailing slash', () => {
    const a = normalizeArticleUrl('https://www.ft.com/content/abc-123/?utm_source=x&fbclid=y');
    const b = normalizeArticleUrl('https://www.ft.com/content/abc-123');
    assert.ok(a && b);
    assert.equal(computeUrlHash(a.normalized), computeUrlHash(b.normalized));
});

test('decodeHtmlEntitiesAndStripTags decodes numeric and named HTML entities cleanly', () => {
    const decoded = decodeHtmlEntitiesAndStripTags(
        '&lt;ol&gt;&lt;li&gt;Chipmaker&#39;s Q3 &mdash; revenue rose &#8220;18%&#8221;&lt;/li&gt;&lt;/ol&gt;'
    );
    assert.equal(decoded, 'Chipmaker\'s Q3 — revenue rose “18%”');
});

// ── 2. Business DNA Context Formatting Tests ─────────────────────────────────

test('formatDnaSummary & dnaToUserParams preserve all required DNA attributes for agents', () => {
    const sampleDna: BusinessDNA = {
        companyName: 'Avixr Test Corp',
        companyWebsite: 'https://avixr.example.net',
        companyDescription: 'Enterprise decision intelligence platform',
        industry: 'SaaS',
        annualRevenue: '$1M – $10M',
        teamSize: '10–50',
        goals: ['Revenue Growth', 'Risk Reduction'],
        riskAppetite: 'Balanced',
        primaryMarkets: ['India', 'United States'],
        customerType: 'B2B',
        monthlySpend: '$40K',
        monthlyRevenue: '$150K',
        burnRate: '20',
        growthRate: '35',
        aiPriority: 'Profitability',
        userRole: 'Founder',
    };

    const summary = formatDnaSummary(sampleDna);
    assert.match(summary, /Avixr Test Corp/);
    assert.match(summary, /Role: Founder/);
    assert.match(summary, /Burn Rate: 20/);
    assert.match(summary, /Growth Rate: 35/);

    const params = dnaToUserParams(sampleDna);
    assert.equal(params.companyName, 'Avixr Test Corp');
    assert.equal(params.userRole, 'Founder');
    assert.equal(params.burnRate, '20');
    assert.equal(params.growthRate, '35');
    assert.equal(params.primaryMarkets, 'India, United States');
});

// ── 3. Auth & Admin Middleware Security Tests ────────────────────────────────

test('verifyBearerToken rejects malformed tokens and service_role keys', async () => {
    await assert.rejects(() => verifyBearerToken('short'), /Missing or malformed/);

    if (config.supabaseServiceKey) {
        await assert.rejects(
            () => verifyBearerToken(config.supabaseServiceKey),
            /Service key is not permitted/
        );
    }
});

test('requireAuth and requireAdmin enforce 401/403 correctly on protected Express routes', async () => {
    const { requireAuth } = await import('../src/middleware/auth.js');
    const app = express();
    app.get('/protected', requireAuth, (_req, res) => res.json({ ok: true }));
    app.get('/admin-user', (req, _res, next) => {
        req.userId = 'u1';
        req.userRole = 'user';
        next();
    }, requireAdmin, (_req, res) => res.json({ ok: true }));
    app.get('/admin-ok', (req, _res, next) => {
        req.userId = 'u2';
        req.userRole = 'superadmin';
        next();
    }, requireAdmin, (_req, res) => res.json({ ok: true }));

    const server = http.createServer(app);
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;

    try {
        const noAuth = await fetch(`http://127.0.0.1:${port}/protected`);
        assert.equal(noAuth.status, 401);

        const normalUser = await fetch(`http://127.0.0.1:${port}/admin-user`);
        assert.equal(normalUser.status, 403);

        const superAdmin = await fetch(`http://127.0.0.1:${port}/admin-ok`);
        assert.equal(superAdmin.status, 200);
    } finally {
        await new Promise<void>(resolve => server.close(() => resolve()));
    }
});
