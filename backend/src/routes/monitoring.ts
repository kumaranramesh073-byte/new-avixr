/* ═══════════════════════════════════════════════════════════════════════════
   Q-SIMUTRON — Admin Monitoring Routes (Strict Admin-Only via requireAdmin)
   Serves real Supabase telemetry for:
     - Dashboard overview & LLM usage
     - Users (user_profiles + organization_memberships + llm_requests)
     - Organizations (organizations + memberships + DNA counts)
     - Sessions, Simulations, Agent Outputs & Logs
     - News Articles & Background News Jobs (with URL validation audit)
     - Notifications & Alert feed (READ-ONLY; SMS sending excluded)
     - Data Source Configurations
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../middleware/auth.js';
import { validateNewsArticle, type RawNewsArticle } from '../services/newsValidator.js';

export const monitoringRouter = Router();

// GET /api/monitoring/dashboard
monitoringRouter.get('/dashboard', async (_req: Request, res: Response) => {
    try {
        const [
            reqRes,
            usersCountRes,
            orgsCountRes,
            sessionsCountRes,
            simsCountRes,
            newsCountRes,
            notifCountRes,
            sourcesCountRes,
        ] = await Promise.all([
            supabaseAdmin.from('llm_requests').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('organizations').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('sessions').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('simulations').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('news_articles').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('notifications').select('id', { count: 'exact', head: true }),
            supabaseAdmin.from('data_source_configs').select('id', { count: 'exact', head: true }),
        ]);

        if (reqRes.error) {
            console.error('[Monitoring] Error fetching requests:', reqRes.error.message);
            return res.status(500).json({ error: 'Database error' });
        }

        const requests = reqRes.data || [];

        let totalTokens = 0;
        let totalCost = 0;
        let errorCount = 0;
        let totalLatency = 0;

        const usersSet = new Set<string>();
        const activeUsersTodaySet = new Set<string>();
        const now = Date.now();
        const requestsToday = requests.filter(r => new Date(r.created_at).getTime() > now - 86400000);
        const requestsYesterday = requests.filter(r => {
            const ts = new Date(r.created_at).getTime();
            return ts <= now - 86400000 && ts > now - 86400000 * 2;
        });

        const dailyMap = new Map<string, { date: string; requests: number; tokens: number; costUsd: number }>();
        const providerMap = new Map<string, { provider: string; costUsd: number; requests: number }>();

        for (const req of requests) {
            totalTokens += (req.prompt_tokens || 0) + (req.completion_tokens || 0);
            totalCost += Number(req.cost_usd || 0);
            if (req.status === 'error') errorCount++;
            totalLatency += req.latency_ms || 0;

            usersSet.add(req.user_id);
            if (new Date(req.created_at).getTime() > now - 86400000) {
                activeUsersTodaySet.add(req.user_id);
            }

            const dateStr = new Date(req.created_at).toISOString().slice(0, 10);
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, { date: dateStr, requests: 0, tokens: 0, costUsd: 0 });
            }
            const daily = dailyMap.get(dateStr)!;
            daily.requests++;
            daily.tokens += (req.prompt_tokens || 0) + (req.completion_tokens || 0);
            daily.costUsd += Number(req.cost_usd || 0);

            if (!providerMap.has(req.provider)) {
                providerMap.set(req.provider, { provider: req.provider, costUsd: 0, requests: 0 });
            }
            const providerInfo = providerMap.get(req.provider)!;
            providerInfo.requests++;
            providerInfo.costUsd += Number(req.cost_usd || 0);
        }

        const stats = {
            totalUsers: usersCountRes.count ?? usersSet.size,
            activeUsersWithRequests: usersSet.size,
            activeToday: activeUsersTodaySet.size,
            requestsToday: requestsToday.length,
            requestsYesterday: requestsYesterday.length,
            tokensToday: requestsToday.reduce((s, r) => s + (r.prompt_tokens || 0) + (r.completion_tokens || 0), 0),
            costToday: requestsToday.reduce((s, r) => s + Number(r.cost_usd || 0), 0),
            costMonth: requests.filter(r => new Date(r.created_at).getTime() > now - 30 * 86400000).reduce((s, r) => s + Number(r.cost_usd || 0), 0),
            totalTokens,
            totalCost,
            errorRate: requests.length > 0 ? (errorCount / requests.length) * 100 : 0,
            avgLatencyMs: requests.length > 0 ? totalLatency / requests.length : 0,
            totalOrganizations: orgsCountRes.count ?? 0,
            totalSessions: sessionsCountRes.count ?? 0,
            totalSimulations: simsCountRes.count ?? 0,
            totalNewsArticles: newsCountRes.count ?? 0,
            totalNotifications: notifCountRes.count ?? 0,
            totalDataSources: sourcesCountRes.count ?? 0,
        };

        const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        const providers = Array.from(providerMap.values()).sort((a, b) => b.costUsd - a.costUsd);

        return res.json({
            stats,
            daily,
            providers,
            requests: requests.slice(0, 8),
        });
    } catch (err: any) {
        console.error('[Monitoring] Internal Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/monitoring/users — real user_profiles + org + billing + LLM usage
monitoringRouter.get('/users', async (_req: Request, res: Response) => {
    try {
        const [profilesRes, requestsRes, subsRes, dnaRes] = await Promise.all([
            supabaseAdmin.from('user_profiles').select('id, email, full_name, role, default_organization_id, created_at'),
            supabaseAdmin.from('llm_requests').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('billing_subscriptions').select('organization_id, plan, status'),
            supabaseAdmin.from('business_dna_profiles').select('user_id, company_name, is_active').eq('is_active', true),
        ]);

        if (profilesRes.error || requestsRes.error) {
            return res.status(500).json({ error: 'Database error fetching users' });
        }

        const planByOrg = new Map<string, string>();
        for (const s of subsRes.data ?? []) {
            if (s.status === 'active') planByOrg.set(s.organization_id, s.plan);
        }

        const companyByUser = new Map<string, string>();
        for (const d of dnaRes.data ?? []) {
            if (d.company_name) companyByUser.set(d.user_id, d.company_name);
        }

        const userMap = new Map<string, any>();

        for (const p of profilesRes.data ?? []) {
            userMap.set(p.id, {
                id: p.id,
                name: p.full_name || p.email?.split('@')[0] || p.id,
                email: p.email,
                role: p.role || 'user',
                organizationId: p.default_organization_id,
                company: companyByUser.get(p.id) || 'Unconfigured',
                plan: (p.default_organization_id && planByOrg.get(p.default_organization_id)) || 'Free',
                requests: 0,
                tokens: 0,
                costUsd: 0,
                lastLogin: p.created_at,
                status: 'idle',
            });
        }

        for (const req of requestsRes.data ?? []) {
            if (!userMap.has(req.user_id)) {
                userMap.set(req.user_id, {
                    id: req.user_id,
                    name: req.user_email?.split('@')[0] || req.user_id,
                    email: req.user_email,
                    role: 'user',
                    organizationId: req.organization_id ?? null,
                    company: req.company || 'Unknown',
                    plan: req.plan || 'Free',
                    requests: 0,
                    tokens: 0,
                    costUsd: 0,
                    lastLogin: req.created_at,
                    status: 'active',
                });
            }
            const u = userMap.get(req.user_id);
            u.requests++;
            u.tokens += (req.prompt_tokens || 0) + (req.completion_tokens || 0);
            u.costUsd += Number(req.cost_usd || 0);
            if (u.company === 'Unconfigured' && req.company) u.company = req.company;
            if (new Date(req.created_at) > new Date(u.lastLogin)) {
                u.lastLogin = req.created_at;
            }
        }

        const users = Array.from(userMap.values()).map(u => {
            const idleDays = (Date.now() - new Date(u.lastLogin).getTime()) / 86400000;
            let status: 'active' | 'idle' | 'over-limit' = 'active';
            if (u.costUsd > 18) status = 'over-limit';
            else if (u.requests === 0 || idleDays > 6) status = 'idle';
            return { ...u, status };
        });

        return res.json(users);
    } catch (err: any) {
        console.error('[Monitoring] Users Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/monitoring/requests
monitoringRouter.get('/requests', async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('llm_requests')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) return res.status(500).json({ error: 'Database error' });
        return res.json(data || []);
    } catch (err: any) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/monitoring/organizations
monitoringRouter.get('/organizations', async (_req: Request, res: Response) => {
    try {
        const [orgsRes, memsRes, dnaRes] = await Promise.all([
            supabaseAdmin.from('organizations').select('*').order('created_at', { ascending: false }),
            supabaseAdmin.from('organization_memberships').select('organization_id, user_id, role'),
            supabaseAdmin.from('business_dna_profiles').select('organization_id, company_name, industry, is_active').eq('is_active', true),
        ]);

        if (orgsRes.error) return res.status(500).json({ error: orgsRes.error.message });

        const membersByOrg = new Map<string, number>();
        for (const m of memsRes.data ?? []) {
            membersByOrg.set(m.organization_id, (membersByOrg.get(m.organization_id) || 0) + 1);
        }

        const dnaByOrg = new Map<string, { companyName: string; industry: string }>();
        for (const d of dnaRes.data ?? []) {
            dnaByOrg.set(d.organization_id, { companyName: d.company_name, industry: d.industry });
        }

        const rows = (orgsRes.data ?? []).map(o => ({
            id: o.id,
            name: o.name,
            slug: o.slug,
            memberCount: membersByOrg.get(o.id) ?? 0,
            activeCompany: dnaByOrg.get(o.id)?.companyName ?? null,
            industry: dnaByOrg.get(o.id)?.industry ?? null,
            createdAt: o.created_at,
        }));

        return res.json(rows);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/monitoring/activity — sessions, simulations, agent_logs, agent_outputs
monitoringRouter.get('/activity', async (_req: Request, res: Response) => {
    try {
        const [sessionsRes, simsRes, logsRes, outputsRes] = await Promise.all([
            supabaseAdmin.from('sessions').select('id, organization_id, user_id, query, agent_mode, status, progress, created_at').order('created_at', { ascending: false }).limit(50),
            supabaseAdmin.from('simulations').select('id, organization_id, user_id, simulation_type, title, market_score, competitor_threat, volatility_index, composite_score, decision_rank, created_at').order('created_at', { ascending: false }).limit(50),
            supabaseAdmin.from('agent_logs').select('*').order('created_at', { ascending: false }).limit(100),
            supabaseAdmin.from('agent_outputs').select('id, organization_id, user_id, session_id, agent_name, module_name, query, confidence_score, execution_time_ms, created_at').order('created_at', { ascending: false }).limit(50),
        ]);

        return res.json({
            sessions: sessionsRes.data ?? [],
            simulations: simsRes.data ?? [],
            agentLogs: logsRes.data ?? [],
            agentOutputs: outputsRes.data ?? [],
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/monitoring/news — all articles with URL & source verification flags + background jobs
monitoringRouter.get('/news', async (_req: Request, res: Response) => {
    try {
        const [articlesRes, jobsRes] = await Promise.all([
            supabaseAdmin.from('news_articles').select('*').order('published_at', { ascending: false }).limit(200),
            supabaseAdmin.from('background_news_jobs').select('*').order('started_at', { ascending: false }).limit(30),
        ]);

        if (articlesRes.error) return res.status(500).json({ error: articlesRes.error.message });

        const seenHashes = new Set<string>();
        const articles = (articlesRes.data ?? []).map((row: RawNewsArticle) => {
            const v = validateNewsArticle(row);
            const isDup = !!(v.urlHash && seenHashes.has(v.urlHash));
            if (v.urlHash) seenHashes.add(v.urlHash);
            return {
                id: row.id,
                title: v.cleanTitle || row.title,
                summary: v.cleanSummary,
                url: row.url,
                source: row.source,
                sourceDomain: v.sourceDomain,
                category: row.category,
                publishedAt: row.published_at,
                verificationStatus: isDup && v.verificationStatus === 'verified' ? 'unverified' : v.verificationStatus,
                isVerified: !isDup && v.isVerified,
                isDuplicate: isDup,
                isExpired: v.isExpired,
                reasons: isDup ? [...v.reasons, 'Duplicate url_hash'] : v.reasons,
            };
        });

        return res.json({
            articles,
            jobs: jobsRes.data ?? [],
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/monitoring/notifications — READ-ONLY view (SMS sending excluded)
monitoringRouter.get('/notifications', async (_req: Request, res: Response) => {
    try {
        const [notifRes, alertsRes] = await Promise.all([
            supabaseAdmin
                .from('notifications')
                .select('id, organization_id, user_id, channel, status, provider, error_message, retry_count, created_at')
                .order('created_at', { ascending: false })
                .limit(100),
            supabaseAdmin
                .from('alerts_notifications')
                .select('id, organization_id, severity, title, source_module, status, created_at')
                .order('created_at', { ascending: false })
                .limit(100),
        ]);

        return res.json({
            notifications: notifRes.data ?? [],
            alerts: alertsRes.data ?? [],
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// GET /api/monitoring/data-sources — configured data_source_configs across orgs
monitoringRouter.get('/data-sources', async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('data_source_configs')
            .select('id, organization_id, name, source_type, status, sync_interval_mins, last_sync_at, record_count, error_message, created_at')
            .order('created_at', { ascending: false });

        if (error) return res.status(500).json({ error: error.message });
        return res.json(data ?? []);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});
