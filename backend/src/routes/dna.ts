import { Router, type Request, type Response } from 'express';
import {
    loadActiveBusinessDNA,
    saveActiveBusinessDNA,
    deactivateActiveBusinessDNA,
    type BusinessDNA,
} from '../services/userContext.js';

export const dnaRouter = Router();

// GET /api/dna — returns active Business DNA profile for current user & organization
dnaRouter.get('/', async (req: Request, res: Response) => {
    try {
        const dna = await loadActiveBusinessDNA(req.userId!, req.organizationId!);
        return res.json({
            dna,
            onboardingComplete: !!dna,
            organizationId: req.organizationId,
        });
    } catch (err: any) {
        console.error('[DNA] GET failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// PUT /api/dna — creates or replaces active Business DNA profile (enforces 1 active row per org+user)
dnaRouter.put('/', async (req: Request, res: Response) => {
    try {
        const body = req.body as Partial<BusinessDNA>;
        if (!body || typeof body.companyName !== 'string' || !body.companyName.trim() || typeof body.industry !== 'string' || !body.industry.trim()) {
            return res.status(400).json({ error: 'companyName and industry are required' });
        }

        const saved = await saveActiveBusinessDNA(req.userId!, req.organizationId!, body);
        return res.json({
            dna: saved,
            onboardingComplete: true,
            organizationId: req.organizationId,
        });
    } catch (err: any) {
        console.error('[DNA] PUT failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// DELETE /api/dna — deactivates active DNA profile (preserves historical rows)
dnaRouter.delete('/', async (req: Request, res: Response) => {
    try {
        await deactivateActiveBusinessDNA(req.userId!, req.organizationId!);
        return res.json({ success: true, onboardingComplete: false });
    } catch (err: any) {
        console.error('[DNA] DELETE failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});
