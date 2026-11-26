/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Routes (Supabase intelligence_feeds backed)
   POST  /api/research         → Start a deep research session
   GET   /api/research/health  → Health check (must stay BEFORE /:id)
   GET   /api/research         → List user/org research feeds
   GET   /api/research/:id     → Retrieve research result
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { broadcast, broadcastError } from '../ws.js';
import { supabaseAdmin } from '../middleware/auth.js';
import { runDeepResearch } from '../engines/deepResearch/index.js';
import type { ResearchState, ResearchProgressEvent } from '../engines/deepResearch/index.js';
import { logAgentActivity } from '../services/userContext.js';

export const researchRouter = Router();

// Active in-flight tracker (paired with Supabase intelligence_feeds persistence)
const activeRuns = new Map<string, {
    status: 'running' | 'complete' | 'error';
    userId: string;
    organizationId: string;
    query: string;
    depth: string;
    mode: 'pro' | 'lite';
    startedAt: number;
    result: Partial<ResearchState> | null;
    error: string | null;
}>();

// ─── GET /api/research/health ────────────────────────────────────────────────

researchRouter.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'Q Simutron Deep Research Engine online',
        version: '1.0.0',
        activeResearch: activeRuns.size,
    });
});

// ─── GET /api/research ───────────────────────────────────────────────────────

researchRouter.get('/', async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('intelligence_feeds')
            .select('id, feed_type, query, depth, mode, status, confidence_score, coverage_score, created_at, updated_at')
            .eq('organization_id', req.organizationId!)
            .eq('user_id', req.userId!)
            .order('created_at', { ascending: false })
            .limit(30);

        if (error) return res.status(500).json({ error: error.message });
        return res.json({ feeds: data ?? [] });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/research ──────────────────────────────────────────────────────

researchRouter.post('/', async (req: Request, res: Response) => {
    const { query, depth = 'deep', mode = 'pro' } = req.body as { query?: string; depth?: string; mode?: string };

    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'query is required' });
    }

    const userId = req.userId!;
    const organizationId = req.organizationId!;

    const validDepths = ['surface', 'standard', 'deep', 'exhaustive'];
    const normalizedDepth = validDepths.includes(depth) ? depth : 'deep';

    const validModes = ['pro', 'lite'];
    const normalizedMode = (validModes.includes(mode) ? mode : 'pro') as 'pro' | 'lite';

    const researchId = uuidv4();
    const trimmedQuery = query.trim();

    // Persist initial row in Supabase intelligence_feeds
    const { error: insErr } = await supabaseAdmin.from('intelligence_feeds').insert({
        id: researchId,
        organization_id: organizationId,
        user_id: userId,
        feed_type: 'deep_research',
        query: trimmedQuery,
        depth: normalizedDepth,
        mode: normalizedMode,
        status: 'running',
        content: null,
        citations: [],
    });

    if (insErr) {
        console.error('[Research] Failed to insert intelligence_feeds:', insErr.message);
        return res.status(500).json({ error: 'Failed to initialize research session' });
    }

    activeRuns.set(researchId, {
        status: 'running',
        userId,
        organizationId,
        query: trimmedQuery,
        depth: normalizedDepth,
        mode: normalizedMode,
        startedAt: Date.now(),
        result: null,
        error: null,
    });

    res.status(201).json({ researchId, status: 'started', depth: normalizedDepth, mode: normalizedMode });

    (async () => {
        try {
            broadcast(researchId, 'research_started' as any, {
                researchId,
                query: trimmedQuery,
                depth: normalizedDepth,
                mode: normalizedMode,
            });

            const finalState = await runDeepResearch(
                trimmedQuery,
                normalizedDepth as any,
                normalizedMode,
                (event: ResearchProgressEvent) => {
                    broadcast(researchId, 'research_progress' as any, {
                        researchId,
                        ...event,
                    });
                }
            );

            const resultPayload: Partial<ResearchState> = {
                query: finalState.query,
                depth: finalState.depth,
                domain: finalState.domain,
                intent: finalState.intent,
                final_report: finalState.final_report,
                confidence_score: finalState.confidence_score,
                coverage_score: finalState.coverage_score,
                total_sources: finalState.total_sources,
                elapsed_searches: finalState.elapsed_searches,
                iteration: finalState.iteration,
                all_citations: finalState.all_citations,
                sub_questions: finalState.sub_questions,
            };

            await supabaseAdmin
                .from('intelligence_feeds')
                .update({
                    status: 'complete',
                    content: resultPayload,
                    citations: finalState.all_citations ?? [],
                    confidence_score: finalState.confidence_score ?? null,
                    coverage_score: finalState.coverage_score ?? null,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', researchId);

            await logAgentActivity({
                agentType: 'DeepResearch',
                action: `Research_${normalizedMode}`,
                status: 'success',
                organizationId,
                userId,
            });

            activeRuns.set(researchId, {
                status: 'complete',
                userId,
                organizationId,
                query: trimmedQuery,
                depth: normalizedDepth,
                mode: normalizedMode,
                startedAt: activeRuns.get(researchId)?.startedAt ?? Date.now(),
                result: resultPayload,
                error: null,
            });

            broadcast(researchId, 'research_complete' as any, {
                researchId,
                final_report: finalState.final_report,
                confidence_score: finalState.confidence_score,
                coverage_score: finalState.coverage_score,
                total_sources: finalState.total_sources,
                iterations: finalState.iteration,
            });
        } catch (err: any) {
            console.error(`[Research] Failed ${researchId}:`, err.message);
            await supabaseAdmin
                .from('intelligence_feeds')
                .update({
                    status: 'error',
                    error_message: err.message,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', researchId);

            await logAgentActivity({
                agentType: 'DeepResearch',
                action: `Research_${normalizedMode}`,
                status: 'error',
                organizationId,
                userId,
            });

            const existing = activeRuns.get(researchId);
            if (existing) {
                activeRuns.set(researchId, { ...existing, status: 'error', error: err.message });
            }
            broadcastError(researchId, `Deep research failed: ${err.message}`);
        }
    })();
});

// ─── GET /api/research/:id ───────────────────────────────────────────────────

researchRouter.get('/:id', async (req: Request, res: Response) => {
    const active = activeRuns.get(req.params.id);
    if (active && active.userId === req.userId && active.organizationId === req.organizationId) {
        return res.json({
            researchId: req.params.id,
            status: active.status,
            query: active.query,
            depth: active.depth,
            mode: active.mode,
            startedAt: active.startedAt,
            result: active.result,
            error: active.error,
        });
    }

    const { data, error } = await supabaseAdmin
        .from('intelligence_feeds')
        .select('*')
        .eq('id', req.params.id)
        .eq('user_id', req.userId!)
        .eq('organization_id', req.organizationId!)
        .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Research session not found' });

    return res.json({
        researchId: data.id,
        status: data.status,
        query: data.query,
        depth: data.depth,
        mode: data.mode,
        startedAt: new Date(data.created_at).getTime(),
        result: data.content,
        error: data.error_message,
    });
});

// ─── DELETE /api/research/:id ────────────────────────────────────────────────

researchRouter.delete('/:id', async (req: Request, res: Response) => {
    const { data, error } = await supabaseAdmin
        .from('intelligence_feeds')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.userId!)
        .eq('organization_id', req.organizationId!)
        .select('id');

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: 'Research session not found' });
    activeRuns.delete(req.params.id);
    return res.json({ deleted: true, id: req.params.id });
});
