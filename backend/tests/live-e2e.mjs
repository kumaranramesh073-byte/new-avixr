/**
 * AVIXR / Q-Simutron Change 1 — Live End-to-End Integration & RLS Verification Script
 *
 * Requires live environment variables (never hardcoded):
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   BACKEND_URL (default: http://127.0.0.1:3100)
 *   ADMIN_EMAIL / ADMIN_PASSWORD (optional if verifying password grant login)
 *   USER_EMAIL / USER_PASSWORD (optional if testing secondary normal user)
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import ws from 'ws';
import { createClient } from '@supabase/supabase-js';

// Load local gitignored env files when present (never log secrets)
for (const envPath of [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../backdoor/.env.local'),
    path.resolve(process.cwd(), '../frontend/.env.local'),
]) {
    if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: false });
    }
}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:3100').replace(/\/+$/, '');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('MISSING REQUIRED ENV VARS: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(2);
}

const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: ws },
});

async function apiFetch(path, options = {}, token) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BACKEND_URL}${path}`, { ...options, headers });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* non-json */ }
    return { status: res.status, ok: res.ok, json, text };
}

async function run() {
    const results = [];
    const record = (name, ok, detail) => {
        results.push({ name, ok, detail });
        console.log(`${ok ? 'PASS' : 'FAIL'} | ${name} — ${detail}`);
    };

    // 1. Backend Health
    const health = await apiFetch('/api/health');
    assert.equal(health.status, 200, 'Backend /api/health must return 200');
    record('Backend Health', true, JSON.stringify(health.json));

    // 2. Unauthenticated & Service-Role Rejection
    const unauth = await apiFetch('/api/monitoring/dashboard');
    assert.equal(unauth.status, 401);
    record('Unauth Monitoring Rejected (401)', true, `HTTP ${unauth.status}`);

    const svcAsBearer = await apiFetch('/api/monitoring/dashboard', {}, SUPABASE_SERVICE_ROLE_KEY);
    assert.equal(svcAsBearer.status, 403);
    record('Service Role As Bearer Rejected (403)', true, `HTTP ${svcAsBearer.status}`);

    // 3. Create isolated test user (non-admin) & verify Auth + RLS + Normal User Denial
    const ts = Date.now();
    const testUserEmail = `avixr.e2e.user.${ts}@avixr-test.local`;
    const testUserPass = `TestPass!${ts}`;
    const { data: createdUser, error: cuErr } = await sbAdmin.auth.admin.createUser({
        email: testUserEmail,
        password: testUserPass,
        email_confirm: true,
        user_metadata: { full_name: 'E2E Standard User' },
    });
    if (cuErr || !createdUser.user) throw new Error(`Failed creating test user: ${cuErr?.message}`);
    const testUserId = createdUser.user.id;

    let testOrgId = null;
    try {
        const sbAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
            realtime: { transport: ws },
        });
        const { data: signInData, error: siErr } = await sbAnon.auth.signInWithPassword({
            email: testUserEmail,
            password: testUserPass,
        });
        if (siErr || !signInData.session) throw new Error(`Test user sign-in failed: ${siErr?.message}`);
        const userToken = signInData.session.access_token;

        // Verify /api/auth/me creates user_profile + org + membership with role='user'
        const me = await apiFetch('/api/auth/me', {}, userToken);
        assert.equal(me.status, 200);
        assert.equal(me.json.role, 'user');
        testOrgId = me.json.organizationId;
        assert.ok(testOrgId, 'Default organizationId must be provisioned');
        record('Standard User /api/auth/me & Org Provisioning', true, `role=${me.json.role}, org=${testOrgId}`);

        // Normal user must get 403 on all admin monitoring endpoints
        for (const adminPath of ['/api/monitoring/dashboard', '/api/monitoring/users', '/api/monitoring/requests', '/api/monitoring/organizations']) {
            const r = await apiFetch(adminPath, {}, userToken);
            assert.equal(r.status, 403, `Expected 403 for standard user on ${adminPath}, got ${r.status}`);
        }
        record('Normal User Denied Admin Endpoints (403)', true, '4/4 endpoints returned 403');

        // 4. Business DNA Persistence (Create -> Retrieve -> Update in place -> Verify 1 active row)
        const dnaInput = {
            companyName: 'E2E Verification Corp',
            companyWebsite: 'https://avixr-e2e.example.org',
            companyDescription: 'Automated Change 1 verification profile',
            industry: 'SaaS',
            teamSize: '10–50',
            goals: ['Revenue Growth', 'Risk Reduction'],
        };
        const putDna1 = await apiFetch('/api/dna', { method: 'PUT', body: JSON.stringify(dnaInput) }, userToken);
        assert.equal(putDna1.status, 200);
        const dnaId1 = putDna1.json.dna.id;

        const putDna2 = await apiFetch('/api/dna', {
            method: 'PUT',
            body: JSON.stringify({ ...dnaInput, teamSize: '50–500', goals: ['Revenue Growth', 'Cost Reduction'] }),
        }, userToken);
        assert.equal(putDna2.status, 200);
        assert.equal(putDna2.json.dna.id, dnaId1, 'Updating DNA must update existing active row in place without duplicates');
        assert.equal(putDna2.json.dna.teamSize, '50–500');

        const { data: dnaRows } = await sbAdmin
            .from('business_dna_profiles')
            .select('id, is_active')
            .eq('user_id', testUserId);
        assert.equal(dnaRows?.length, 1, 'Expected exactly 1 DNA row after create+update');
        assert.equal(dnaRows?.[0]?.is_active, true);
        record('DNA Create/Update/No-Duplicates in Supabase', true, `id=${dnaId1}, activeRows=1`);

        // 5. Sessions Persistence (Create -> Get -> Patch -> Delete -> Confirm Only Intended Row Deleted)
        const sessCreate = await apiFetch('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({ query: 'E2E Change 1 persistence test query', agentMode: 'All Agents' }),
        }, userToken);
        assert.equal(sessCreate.status, 201);
        const sessionId = sessCreate.json.sessionId;

        const sessGet = await apiFetch(`/api/sessions/${sessionId}`, {}, userToken);
        assert.equal(sessGet.status, 200);
        assert.equal(sessGet.json.id, sessionId);

        const sessPatch = await apiFetch(`/api/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify({ query: 'E2E Updated Session Query' }),
        }, userToken);
        assert.equal(sessPatch.status, 200);
        assert.equal(sessPatch.json.query, 'E2E Updated Session Query');

        const sessDel = await apiFetch(`/api/sessions/${sessionId}`, { method: 'DELETE' }, userToken);
        assert.equal(sessDel.status, 200, `Expected 200 on DELETE /api/sessions/${sessionId}, got ${sessDel.status}: ${sessDel.text}`);

        const sessAfterDel = await apiFetch(`/api/sessions/${sessionId}`, {}, userToken);
        assert.equal(sessAfterDel.status, 404);
        record('Sessions Create/Retrieve/Update/Delete Lifecycle', true, `sessionId=${sessionId}`);

        // 6. Data Source Config Persistence (Create -> List -> Delete)
        const dsCreate = await apiFetch('/api/data-sources', {
            method: 'POST',
            body: JSON.stringify({ name: 'E2E Test Warehouse', type: 'Data Warehouse', region: 'ap-south-1' }),
        }, userToken);
        assert.equal(dsCreate.status, 201);
        const dsId = dsCreate.json.id;
        const dsList = await apiFetch('/api/data-sources', {}, userToken);
        assert.ok(dsList.json.some(d => d.id === dsId));
        const dsDel = await apiFetch(`/api/data-sources/${dsId}`, { method: 'DELETE' }, userToken);
        assert.equal(dsDel.status, 200);
        record('Data Source Config Create/List/Delete', true, `id=${dsId}`);

        // 7. Direct RLS Verification using authenticated user client (anon key + user JWT)
        const sbUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${userToken}` } },
            auth: { autoRefreshToken: false, persistSession: false },
            realtime: { transport: ws },
        });
        const { data: logsAsUser, error: logsErr } = await sbUser.from('agent_logs').select('id').limit(5);
        assert.equal((logsAsUser ?? []).length, 0, `Standard user must see 0 rows in agent_logs (got ${logsAsUser?.length}, err=${logsErr?.message})`);

        const { data: jobsAsUser } = await sbUser.from('background_news_jobs').select('id').limit(5);
        assert.equal((jobsAsUser ?? []).length, 0, 'Standard user must see 0 rows in background_news_jobs');

        const { data: webhooksAsUser } = await sbUser.from('payment_webhook_events').select('id').limit(5);
        assert.equal((webhooksAsUser ?? []).length, 0, 'Standard user must see 0 rows in payment_webhook_events');

        const { data: unverifiedNewsAsUser } = await sbUser.from('news_articles').select('id').eq('is_verified', false).limit(5);
        assert.equal((unverifiedNewsAsUser ?? []).length, 0, 'Standard user must not read unverified news via direct RLS');

        // Anon client must see 0 rows on protected tables
        const sbPureAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
            realtime: { transport: ws },
        });
        const { data: anonProfiles } = await sbPureAnon.from('user_profiles').select('id').limit(5);
        assert.equal((anonProfiles ?? []).length, 0, 'Anonymous user must see 0 rows in user_profiles');
        record('RLS Isolation Verified (User vs Admin & Anon)', true, 'All sensitive/admin tables blocked for standard user & anon');

        // 8. Admin Login + Monitoring + News Validation tests (if ADMIN_EMAIL & ADMIN_PASSWORD provided)
        if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
            const { data: admSignIn, error: admErr } = await sbAnon.auth.signInWithPassword({
                email: process.env.ADMIN_EMAIL,
                password: process.env.ADMIN_PASSWORD,
            });
            if (admErr || !admSignIn.session) throw new Error(`Admin login failed: ${admErr?.message}`);
            const admToken = admSignIn.session.access_token;

            for (const path of ['/api/monitoring/dashboard', '/api/monitoring/users', '/api/monitoring/requests', '/api/monitoring/organizations', '/api/monitoring/activity', '/api/monitoring/news']) {
                const res = await apiFetch(path, {}, admToken);
                assert.equal(res.status, 200, `Admin expected 200 on ${path}, got ${res.status}`);
            }

            // Test placeholder URL rejection on POST /api/news/ingest
            const badNews = await apiFetch('/api/news/ingest', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'Placeholder Example News Headline Should Reject',
                    url: 'https://news.example.com/fake-article',
                    source: 'Example',
                    published_at: new Date().toISOString(),
                }),
            }, admToken);
            assert.equal(badNews.status, 400, 'Placeholder URL must return 400');
            record('Admin Monitoring & News Placeholder Rejection', true, 'All monitoring endpoints 200; placeholder rejected 400');
        } else {
            record('Admin Monitoring & News Validation Live Check', false, 'SKIPPED: ADMIN_EMAIL / ADMIN_PASSWORD not set');
        }
    } finally {
        // Cleanup ONLY the temporary E2E test user & org created by this script
        await sbAdmin.from('agent_logs').delete().eq('user_id', testUserId);
        await sbAdmin.from('business_dna_profiles').delete().eq('user_id', testUserId);
        await sbAdmin.from('sessions').delete().eq('user_id', testUserId);
        await sbAdmin.from('user_profiles').delete().eq('id', testUserId);
        if (testOrgId) {
            await sbAdmin.from('organization_memberships').delete().eq('organization_id', testOrgId);
            await sbAdmin.from('organizations').delete().eq('id', testOrgId);
        }
        await sbAdmin.auth.admin.deleteUser(testUserId);
    }

    const failed = results.filter(r => !r.ok);
    console.log(`\nSummary: ${results.length - failed.length}/${results.length} passed.`);
    process.exit(failed.length > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error('E2E script error:', err);
    process.exit(1);
});
