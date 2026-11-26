/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Routes
   POST  /api/research         → Start a deep research session
   GET   /api/research/:id     → Retrieve completed research result
   GET   /api/research/health  → Health check
   ═══════════════════════════════════════════════════════════════════════════ */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { broadcast, broadcastError } from '../ws.js';
import { runDeepResearch } from '../engines/deepResearch/index.js';
import type { ResearchState, ResearchProgressEvent } from '../engines/deepResearch/index.js';

export const researchRouter = Router();

// In-memory store for research results (keyed by researchId)
const researchStore = new Map<string, {
    status: 'running' | 'complete' | 'error';
    query: string;
    depth: string;
    mode: 'pro' | 'lite';
    startedAt: number;
    result: Partial<ResearchState> | null;
    error: string | null;
}>();

// ─── POST /api/research ──────────────────────────────────────────────────────

researchRouter.post('/', async (req: Request, res: Response) => {
    const { query, depth = 'deep', mode = 'pro' } = req.body as { query?: string; depth?: string; mode?: string };

    if (!query || typeof query !== 'string' || !query.trim()) {
        return res.status(400).json({ error: 'query is required' });
    }

    const validDepths = ['surface', 'standard', 'deep', 'exhaustive'];
    const normalizedDepth = validDepths.includes(depth) ? depth : 'deep';
    
    const validModes = ['pro', 'lite'];
    const normalizedMode = validModes.includes(mode) ? mode : 'pro';

    const researchId = uuidv4();

    researchStore.set(researchId, {
        status: 'running',
        query: query.trim(),
        depth: normalizedDepth,
        mode: normalizedMode as 'pro' | 'lite',
        startedAt: Date.now(),
        result: null,
        error: null,
    });

    // Respond immediately — research runs async
    res.status(201).json({ researchId, status: 'started', depth: normalizedDepth, mode: normalizedMode });

    // ── Run deep research async ──
    (async () => {
        try {
            console.log(`[Research] Starting ${normalizedMode.toUpperCase()} ${normalizedDepth} research: "${query.trim().slice(0, 80)}..."`);

            // Broadcast start event
            broadcast(researchId, 'research_started' as any, {
                researchId,
                query: query.trim(),
                depth: normalizedDepth,
                mode: normalizedMode,
            });

            const finalState = await runDeepResearch(
                query.trim(),
                normalizedDepth as any,
                normalizedMode as 'pro' | 'lite',
                (event: ResearchProgressEvent) => {
                    // Stream progress to all WS clients subscribed to this researchId
                    broadcast(researchId, 'research_progress' as any, {
                        researchId,
                        ...event,
                    });
                }
            );

            // Store result
            researchStore.set(researchId, {
                status: 'complete',
                query: query.trim(),
                depth: normalizedDepth,
                mode: normalizedMode as 'pro' | 'lite',
                startedAt: researchStore.get(researchId)?.startedAt ?? Date.now(),
                result: {
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
                },
                error: null,
            });

            // Broadcast completion
            broadcast(researchId, 'research_complete' as any, {
                researchId,
                final_report: finalState.final_report,
                confidence_score: finalState.confidence_score,
                coverage_score: finalState.coverage_score,
                total_sources: finalState.total_sources,
                iterations: finalState.iteration,
            });

            console.log(`[Research] Complete: ${researchId} — ${finalState.total_sources} sources, ${finalState.iteration} iterations`);

        } catch (err: any) {
            console.error(`[Research] Failed ${researchId}:`, err.message);
            researchStore.set(researchId, {
                ...researchStore.get(researchId)!,
                status: 'error',
                error: err.message,
            });
            broadcastError(researchId, `Deep research failed: ${err.message}`);
        }
    })();
});


// ─── GET /api/research/:id ───────────────────────────────────────────────────

researchRouter.get('/:id', async (req: Request, res: Response) => {
    const entry = researchStore.get(req.params.id);
    if (!entry) {
        return res.status(404).json({ error: 'Research session not found' });
    }
    res.json({
        researchId: req.params.id,
        ...entry,
    });
});


// ─── GET /api/research/health ────────────────────────────────────────────────

researchRouter.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'Q Simutron Deep Research Engine online',
        version: '1.0.0',
        activeResearch: researchStore.size,
    });
});
