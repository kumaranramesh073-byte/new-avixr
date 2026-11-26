import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { config } from '../config.js';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
            userRole?: 'admin' | 'user';
        }
    }
}

// Admin service client — only used server-side to verify JWTs.
// Pass the ws package as transport so Supabase's realtime layer works on Node 20
// (which lacks a native WebSocket global that supabase-js expects).
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    realtime: { transport: ws as any },
});

function resolveRole(email: string): 'admin' | 'user' {
    const lower = email.toLowerCase();
    return lower.includes('admin') || lower.includes('ceo') || lower.includes('cto') ? 'admin' : 'user';
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (token === config.supabaseServiceKey) {
        // Backdoor internal service bypass
        req.userId = 'backdoor-service';
        req.userEmail = 'admin@qsimutron.com';
        req.userRole = 'admin';
        return next();
    }

    try {
        const { data, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !data.user) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }
        req.userId    = data.user.id;
        req.userEmail = data.user.email ?? '';
        req.userRole  = resolveRole(req.userEmail);
        next();
    } catch {
        res.status(401).json({ error: 'Token verification failed' });
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.userRole !== 'admin') {
        res.status(403).json({ error: 'Access restricted to administrators' });
        return;
    }
    next();
}
