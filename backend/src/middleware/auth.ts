import type { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import { config } from '../config.js';

export type PlatformRole = 'admin' | 'superadmin' | 'user';

declare global {
    namespace Express {
        interface Request {
            userId?: string;
            userEmail?: string;
            userRole?: PlatformRole;
            organizationId?: string;
        }
    }
}

// Admin service client — strictly server-side.
// Pass the ws package as transport so Supabase's realtime layer works on Node 20.
export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    realtime: { transport: ws as any },
});

export interface VerifiedUserContext {
    userId: string;
    email: string;
    role: PlatformRole;
    organizationId: string;
    fullName?: string | null;
}

function normalizeRole(raw: unknown): PlatformRole {
    if (raw === 'superadmin') return 'superadmin';
    if (raw === 'admin') return 'admin';
    return 'user';
}

async function ensureUserProfileAndOrg(
    userId: string,
    email: string,
    fullName?: string | null
): Promise<VerifiedUserContext> {
    const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, full_name, role, default_organization_id')
        .eq('id', userId)
        .maybeSingle();

    if (fetchErr) {
        throw new Error(`Failed to load user profile: ${fetchErr.message}`);
    }

    if (existing && existing.default_organization_id) {
        return {
            userId,
            email: existing.email || email,
            role: normalizeRole(existing.role),
            organizationId: existing.default_organization_id,
            fullName: existing.full_name,
        };
    }

    // Determine or create a default organization if missing
    let orgId: string | null = existing?.default_organization_id ?? null;

    if (!orgId) {
        const { data: mem } = await supabaseAdmin
            .from('organization_memberships')
            .select('organization_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (mem?.organization_id) {
            orgId = mem.organization_id;
        }
    }

    if (!orgId) {
        const slugBase = userId.replace(/-/g, '').slice(0, 12);
        const workspaceName = fullName?.trim()
            ? `${fullName.trim()} Workspace`
            : `${(email.split('@')[0] || 'User').slice(0, 24)} Workspace`;

        const { data: org, error: orgErr } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: workspaceName,
                slug: `org-${slugBase}-${Date.now().toString(36)}`,
            })
            .select('id')
            .single();

        if (orgErr || !org) {
            throw new Error(`Failed to provision default organization: ${orgErr?.message ?? 'unknown error'}`);
        }
        orgId = org.id;

        const { error: memErr } = await supabaseAdmin
            .from('organization_memberships')
            .insert({
                organization_id: orgId,
                user_id: userId,
                role: 'owner',
            });

        if (memErr) {
            throw new Error(`Failed to provision organization membership: ${memErr.message}`);
        }
    }

    if (!existing) {
        // NEVER auto-assign admin/superadmin on registration — always 'user'
        const { error: insertErr } = await supabaseAdmin
            .from('user_profiles')
            .insert({
                id: userId,
                email,
                full_name: fullName ?? null,
                role: 'user',
                default_organization_id: orgId,
            });

        if (insertErr) {
            throw new Error(`Failed to provision user profile: ${insertErr.message}`);
        }

        return {
            userId,
            email,
            role: 'user',
            organizationId: orgId!,
            fullName: fullName ?? null,
        };
    }

    const { error: updateErr } = await supabaseAdmin
        .from('user_profiles')
        .update({ default_organization_id: orgId, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (updateErr) {
        throw new Error(`Failed to update default organization: ${updateErr.message}`);
    }

    return {
        userId,
        email: existing.email || email,
        role: normalizeRole(existing.role),
        organizationId: orgId!,
        fullName: existing.full_name,
    };
}

/**
 * Verifies a Supabase JWT and loads authoritative role + org from user_profiles.
 * Rejects any forged, expired, or non-user tokens (including service_role bypass attempts).
 */
export async function verifyBearerToken(token: string): Promise<VerifiedUserContext> {
    if (!token || token.length < 20) {
        throw new Error('Missing or malformed bearer token');
    }

    // Explicitly reject service_role token being presented as a user bearer token
    if (config.supabaseServiceKey && token === config.supabaseServiceKey) {
        throw new Error('Service key is not permitted as a user session token');
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
        throw new Error('Invalid or expired token');
    }

    const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
    const fullName = typeof meta.full_name === 'string'
        ? meta.full_name
        : typeof meta.name === 'string'
            ? meta.name
            : null;

    return await ensureUserProfileAndOrg(data.user.id, data.user.email ?? '', fullName);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid Authorization header' });
        return;
    }

    const token = authHeader.slice(7).trim();
    try {
        const ctx = await verifyBearerToken(token);
        req.userId = ctx.userId;
        req.userEmail = ctx.email;
        req.userRole = ctx.role;
        req.organizationId = ctx.organizationId;
        next();
    } catch (err: any) {
        const status = err.message?.includes('Service key') ? 403 : 401;
        res.status(status).json({ error: err.message || 'Authentication failed' });
    }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (req.userRole !== 'admin' && req.userRole !== 'superadmin') {
        res.status(403).json({ error: 'Access restricted to verified administrators' });
        return;
    }
    next();
}
