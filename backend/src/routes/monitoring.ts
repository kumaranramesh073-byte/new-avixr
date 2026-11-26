import { Router, type Request, type Response } from 'express';
import { supabaseAdmin } from '../middleware/auth.js';

export const monitoringRouter = Router();

// GET /api/monitoring/dashboard
monitoringRouter.get('/dashboard', async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('llm_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Monitoring] Error fetching requests:', error.message);
            return res.status(500).json({ error: 'Database error' });
        }

        const requests = data || [];

        // Aggregate Data for MOCK_STATS / MOCK_DAILY / MOCK_PROVIDER_SPLIT replacements
        let totalTokens = 0;
        let totalCost = 0;
        let errorCount = 0;
        let totalLatency = 0;

        const usersSet = new Set<string>();
        const activeUsersTodaySet = new Set<string>();
        const requestsToday = requests.filter(r => new Date(r.created_at) > new Date(Date.now() - 86400000));
        const requestsYesterday = requests.filter(r => {
            const date = new Date(r.created_at);
            return date <= new Date(Date.now() - 86400000) && date > new Date(Date.now() - 86400000 * 2);
        });

        const dailyMap = new Map<string, { date: string, requests: number, tokens: number, costUsd: number }>();
        const providerMap = new Map<string, { provider: string, costUsd: number, requests: number }>();

        for (const req of requests) {
            totalTokens += req.prompt_tokens + req.completion_tokens;
            totalCost += Number(req.cost_usd);
            if (req.status === 'error') errorCount++;
            totalLatency += req.latency_ms;
            
            usersSet.add(req.user_id);
            if (new Date(req.created_at) > new Date(Date.now() - 86400000)) {
                activeUsersTodaySet.add(req.user_id);
            }

            // Daily Stats
            const dateObj = new Date(req.created_at);
            const dateStr = dateObj.toISOString().slice(0, 10);
            if (!dailyMap.has(dateStr)) {
                dailyMap.set(dateStr, { date: dateStr, requests: 0, tokens: 0, costUsd: 0 });
            }
            const daily = dailyMap.get(dateStr)!;
            daily.requests++;
            daily.tokens += req.prompt_tokens + req.completion_tokens;
            daily.costUsd += Number(req.cost_usd);

            // Provider Stats
            if (!providerMap.has(req.provider)) {
                providerMap.set(req.provider, { provider: req.provider, costUsd: 0, requests: 0 });
            }
            const providerInfo = providerMap.get(req.provider)!;
            providerInfo.requests++;
            providerInfo.costUsd += Number(req.cost_usd);
        }

        const stats = {
            totalUsers: usersSet.size,
            activeToday: activeUsersTodaySet.size,
            requestsToday: requestsToday.length,
            requestsYesterday: requestsYesterday.length,
            tokensToday: requestsToday.reduce((s, r) => s + r.prompt_tokens + r.completion_tokens, 0),
            costToday: requestsToday.reduce((s, r) => s + Number(r.cost_usd), 0),
            costMonth: requests.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 86400000)).reduce((s, r) => s + Number(r.cost_usd), 0),
            totalTokens,
            totalCost,
            errorRate: requests.length > 0 ? (errorCount / requests.length) * 100 : 0,
            avgLatencyMs: requests.length > 0 ? totalLatency / requests.length : 0,
        };

        const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        const providers = Array.from(providerMap.values()).sort((a, b) => b.costUsd - a.costUsd);

        return res.json({
            stats,
            daily,
            providers,
            requests: requests.slice(0, 8), // just return recent 8 for overview
        });
    } catch (err: any) {
        console.error('[Monitoring] Internal Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/monitoring/users
monitoringRouter.get('/users', async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('llm_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Monitoring] Error fetching users requests:', error.message);
            return res.status(500).json({ error: 'Database error' });
        }

        const requests = data || [];
        const userMap = new Map<string, any>();

        for (const req of requests) {
            if (!userMap.has(req.user_id)) {
                userMap.set(req.user_id, {
                    id: req.user_id,
                    name: req.user_id, // we might not have names stored independently, so default to ID or we extract it
                    email: req.user_email,
                    company: req.company || 'Unknown',
                    plan: req.plan || 'Free',
                    requests: 0,
                    tokens: 0,
                    costUsd: 0,
                    lastLogin: req.created_at, // Use latest request timestamp as last activity
                    status: 'active'
                });
            }
            const user = userMap.get(req.user_id);
            user.requests++;
            user.tokens += req.prompt_tokens + req.completion_tokens;
            user.costUsd += Number(req.cost_usd);
            
            // Maintain latest login
            if (new Date(req.created_at) > new Date(user.lastLogin)) {
                user.lastLogin = req.created_at;
            }
        }

        const users = Array.from(userMap.values());
        
        // Update statuses dynamically based on cost limits or last activity
        users.forEach(u => {
            const idleDays = (Date.now() - new Date(u.lastLogin).getTime()) / 86400000;
            if (idleDays > 6) u.status = 'idle';
            else if (u.costUsd > 18) u.status = 'over-limit';
            else u.status = 'active';
        });

        return res.json(users);
    } catch (err: any) {
         console.error('[Monitoring] Internal Error:', err.message);
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

        if (error) {
            console.error('[Monitoring] Error fetching requests:', error.message);
            return res.status(500).json({ error: 'Database error' });
        }

        return res.json(data || []);
    } catch (err: any) {
        console.error('[Monitoring] Internal Error:', err.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
