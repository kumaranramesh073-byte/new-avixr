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
    const record = (name, statusOrOk, detail) => {
        const status = typeof statusOrOk === 'boolean' ? (statusOrOk ? 'pass' : 'fail') : statusOrOk;
        results.push({ name, status, detail });
        const label = status === 'pass' ? 'PASS' : status === 'skip' ? 'SKIP' : 'FAIL';
        console.log(`${label} | ${name} — ${detail}`);
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

        // 4. Business DNA Persistence (Empty GET -> Create -> GET Retrieve -> Update in place -> Schema Check -> Soft Deactivate)
        const getDnaInitial = await apiFetch('/api/dna', {}, userToken);
        assert.equal(getDnaInitial.status, 200);
        assert.equal(getDnaInitial.json.dna, null);
        assert.equal(getDnaInitial.json.onboardingComplete, false);

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
        assert.equal(putDna1.json.onboardingComplete, true);
        const dnaId1 = putDna1.json.dna.id;

        const getDnaCreated = await apiFetch('/api/dna', {}, userToken);
        assert.equal(getDnaCreated.status, 200);
        assert.equal(getDnaCreated.json.onboardingComplete, true);
        assert.equal(getDnaCreated.json.dna.id, dnaId1);
        assert.equal(getDnaCreated.json.dna.companyName, dnaInput.companyName);
        assert.equal(getDnaCreated.json.dna.companyWebsite, dnaInput.companyWebsite);
        assert.equal(getDnaCreated.json.dna.companyDescription, dnaInput.companyDescription);
        assert.equal(getDnaCreated.json.dna.industry, dnaInput.industry);
        assert.equal(getDnaCreated.json.dna.teamSize, dnaInput.teamSize);
        assert.deepEqual(getDnaCreated.json.dna.goals, dnaInput.goals);
        assert.equal('organizationId' in getDnaCreated.json.dna, false, 'Minimal DNA response must not expose organizationId');

        const putDna2 = await apiFetch('/api/dna', {
            method: 'PUT',
            body: JSON.stringify({ ...dnaInput, teamSize: '50–500', goals: ['Revenue Growth', 'Cost Reduction'] }),
        }, userToken);
        assert.equal(putDna2.status, 200);
        assert.equal(putDna2.json.dna.id, dnaId1, 'Updating DNA must update existing active row in place without duplicates');
        assert.equal(putDna2.json.dna.teamSize, '50–500');

        const getDnaUpdated = await apiFetch('/api/dna', {}, userToken);
        assert.equal(getDnaUpdated.status, 200);
        assert.equal(getDnaUpdated.json.dna.id, dnaId1);
        assert.equal(getDnaUpdated.json.dna.teamSize, '50–500');
        assert.deepEqual(getDnaUpdated.json.dna.goals, ['Revenue Growth', 'Cost Reduction']);

        const { data: dnaRows } = await sbAdmin
            .from('business_dna_profiles')
            .select('*')
            .eq('user_id', testUserId);
        assert.equal(dnaRows?.length, 1, 'Expected exactly 1 DNA row after create+update');
        assert.equal(dnaRows?.[0]?.is_active, true);
        assert.deepEqual(
            Object.keys(dnaRows[0]).sort(),
            ['company_description', 'company_name', 'company_website', 'created_at', 'goals', 'id', 'industry', 'is_active', 'team_size', 'updated_at', 'user_id'],
            'Live business_dna_profiles row must have strictly the 11 minimal columns'
        );
        record('DNA Create/Retrieve/Update/Minimal-Schema in Supabase', true, `id=${dnaId1}, cols=11, activeRows=1`);

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

        // 7a. business_dna_profiles RLS isolation for primary user
        const { data: userVisibleDna, error: userDnaErr } = await sbUser
            .from('business_dna_profiles')
            .select('id, user_id, company_name');
        assert.ifError(userDnaErr);
        assert.equal(userVisibleDna?.length, 1, `User must see ONLY their 1 own DNA row via RLS (got ${userVisibleDna?.length})`);
        assert.equal(userVisibleDna?.[0]?.user_id, testUserId);

        const { error: spoofDnaErr } = await sbUser
            .from('business_dna_profiles')
            .insert({
                user_id: 'f90de9d1-1bcc-4e1f-8924-36558bfa18a2',
                company_name: 'RLS Spoof Attempt',
                industry: 'SaaS',
                goals: [],
            });
        assert.ok(spoofDnaErr, 'Authenticated user must be blocked by RLS from inserting DNA with another user_id');

        const { data: logsAsUser, error: logsErr } = await sbUser.from('agent_logs').select('id').limit(5);
        assert.equal((logsAsUser ?? []).length, 0, `Standard user must see 0 rows in agent_logs (got ${logsAsUser?.length}, err=${logsErr?.message})`);

        const { data: jobsAsUser } = await sbUser.from('background_news_jobs').select('id').limit(5);
        assert.equal((jobsAsUser ?? []).length, 0, 'Standard user must see 0 rows in background_news_jobs');

        const { data: webhooksAsUser } = await sbUser.from('payment_webhook_events').select('id').limit(5);
        assert.equal((webhooksAsUser ?? []).length, 0, 'Standard user must see 0 rows in payment_webhook_events');

        const { data: unverifiedNewsAsUser } = await sbUser.from('news_articles').select('id').eq('is_verified', false).limit(5);
        assert.equal((unverifiedNewsAsUser ?? []).length, 0, 'Standard user must not read unverified news via direct RLS');

        // Anon client must see 0 rows on protected tables including business_dna_profiles
        const sbPureAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { autoRefreshToken: false, persistSession: false },
            realtime: { transport: ws },
        });
        const { data: anonDna } = await sbPureAnon.from('business_dna_profiles').select('id').limit(5);
        assert.equal((anonDna ?? []).length, 0, 'Anonymous user must see 0 rows in business_dna_profiles');
        const { data: anonProfiles } = await sbPureAnon.from('user_profiles').select('id').limit(5);
        assert.equal((anonProfiles ?? []).length, 0, 'Anonymous user must see 0 rows in user_profiles');

        // Cross-user isolation check with a secondary temporary user
        const testUser2Email = `avixr.e2e.user2.${ts}@avixr-test.local`;
        const { data: createdUser2, error: cu2Err } = await sbAdmin.auth.admin.createUser({
            email: testUser2Email,
            password: testUserPass,
            email_confirm: true,
            user_metadata: { full_name: 'E2E Secondary User' },
        });
        if (cu2Err || !createdUser2.user) throw new Error(`Failed creating secondary test user: ${cu2Err?.message}`);
        const testUser2Id = createdUser2.user.id;
        try {
            const { data: u2SignIn, error: u2Err } = await sbAnon.auth.signInWithPassword({
                email: testUser2Email,
                password: testUserPass,
            });
            if (u2Err || !u2SignIn.session) throw new Error(`Secondary user sign-in failed: ${u2Err?.message}`);
            const sbUser2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                global: { headers: { Authorization: `Bearer ${u2SignIn.session.access_token}` } },
                auth: { autoRefreshToken: false, persistSession: false },
                realtime: { transport: ws },
            });
            const { data: u2CrossRead } = await sbUser2.from('business_dna_profiles').select('id').eq('id', dnaId1);
            assert.equal((u2CrossRead ?? []).length, 0, 'Secondary user must NOT read primary user DNA via RLS');
            const { data: u2CrossUpd } = await sbUser2.from('business_dna_profiles').update({ company_name: 'Hacked' }).eq('id', dnaId1).select('id');
            assert.equal((u2CrossUpd ?? []).length, 0, 'Secondary user must NOT update primary user DNA via RLS');
        } finally {
            await sbAdmin.from('business_dna_profiles').delete().eq('user_id', testUser2Id);
            await sbAdmin.from('user_profiles').delete().eq('id', testUser2Id);
            await sbAdmin.auth.admin.deleteUser(testUser2Id);
        }
        record('RLS Isolation Verified (DNA Cross-User + Spoof + Anon + Admin Tables)', true, 'All DNA & admin tables isolated');

        // 7b. DNA Soft-Deactivation via DELETE /api/dna (non-destructive)
        const delDna = await apiFetch('/api/dna', { method: 'DELETE' }, userToken);
        assert.equal(delDna.status, 200);
        assert.equal(delDna.json.onboardingComplete, false);
        const getDnaAfterDel = await apiFetch('/api/dna', {}, userToken);
        assert.equal(getDnaAfterDel.status, 200);
        assert.equal(getDnaAfterDel.json.dna, null);
        const { data: dnaAfterDelRow } = await sbAdmin
            .from('business_dna_profiles')
            .select('id, is_active')
            .eq('id', dnaId1)
            .single();
        assert.equal(dnaAfterDelRow?.is_active, false, 'DELETE /api/dna must deactivate without deleting row');
        record('DNA Soft Deactivation (DELETE /api/dna Preserves Row)', true, `id=${dnaId1}, is_active=false`);

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
            const requireAdmin = process.env.REQUIRE_ADMIN_E2E === 'true';
            record('Admin Monitoring & News Validation Live Check', requireAdmin ? 'fail' : 'skip', 'SKIPPED: ADMIN_EMAIL / ADMIN_PASSWORD not set');
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

    const passed = results.filter(r => r.status === 'pass').length;
    const skipped = results.filter(r => r.status === 'skip').length;
    const failed = results.filter(r => r.status === 'fail').length;
    console.log(`\nSummary: ${passed}/${results.length} passed, ${skipped} skipped, ${failed} failed.`);
    process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
    console.error('E2E script error:', err);
    process.exit(1);
});
