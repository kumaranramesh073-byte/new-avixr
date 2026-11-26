import { Router, type Request, type Response } from 'express';
import { loadActiveBusinessDNA, getOrganizationPlan } from '../services/userContext.js';
import { supabaseAdmin } from '../middleware/auth.js';

export const authRouter = Router();

// GET /api/auth/me — returns authoritative server-verified identity, role, org, plan, and DNA status
authRouter.get('/me', async (req: Request, res: Response) => {
    try {
        const userId = req.userId!;
        const organizationId = req.organizationId!;

        const [{ data: profile }, dna, plan] = await Promise.all([
            supabaseAdmin
                .from('user_profiles')
                .select('id, email, full_name, role, default_organization_id, created_at')
                .eq('id', userId)
                .maybeSingle(),
            loadActiveBusinessDNA(userId, organizationId),
            getOrganizationPlan(organizationId),
        ]);

        return res.json({
            id: userId,
            email: profile?.email || req.userEmail,
            fullName: profile?.full_name ?? null,
            role: req.userRole,
            organizationId,
            plan,
            onboardingComplete: !!dna,
            dna,
        });
    } catch (err: any) {
        console.error('[AuthRoute] /me failed:', err.message);
        return res.status(500).json({ error: 'Failed to load authenticated user context' });
    }
});
