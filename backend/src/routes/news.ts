import { Router, type Request, type Response } from 'express';
import { supabaseAdmin, requireAdmin } from '../middleware/auth.js';
import {
    validateNewsArticle,
    verifyUrlReachable,
    type RawNewsArticle,
} from '../services/newsValidator.js';

export const newsRouter = Router();

// GET /api/news — returns verified, non-duplicate, non-fabricated news articles
newsRouter.get('/', async (req: Request, res: Response) => {
    try {
        const includeUnverified = req.query.includeUnverified === 'true' &&
            (req.userRole === 'admin' || req.userRole === 'superadmin');
        const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));

        const { data, error } = await supabaseAdmin
            .from('news_articles')
            .select('*')
            .order('published_at', { ascending: false })
            .limit(300);

        if (error) {
            return res.status(500).json({ error: `Failed to query news_articles: ${error.message}` });
        }

        const seenHashes = new Set<string>();
        const seenTitles = new Set<string>();
        const validated = (data ?? []).map((row: RawNewsArticle) => {
            const v = validateNewsArticle(row);
            const titleKey = v.cleanTitle.toLowerCase();
            const isDuplicate = (v.urlHash && seenHashes.has(v.urlHash)) || (titleKey && seenTitles.has(titleKey));
            if (v.urlHash) seenHashes.add(v.urlHash);
            if (titleKey) seenTitles.add(titleKey);

            // Honor explicit DB flag if already rejected
            const status = row.verification_status === 'rejected'
                ? 'rejected'
                : row.verification_status === 'ai_summary'
                    ? 'ai_summary'
                    : v.verificationStatus;

            return {
                id: row.id,
                title: v.cleanTitle || row.title,
                summary: v.cleanSummary,
                url: v.normalizedUrl || row.url,
                source: row.source,
                sourceDomain: v.sourceDomain,
                category: row.category,
                topics: row.topics,
                publishedAt: row.published_at,
                retrievedAt: row.retrieved_at,
                verificationStatus: isDuplicate && status === 'verified' ? 'unverified' : status,
                isVerified: !isDuplicate && status === 'verified',
                isDuplicate,
                isExpired: v.isExpired,
                validationReasons: isDuplicate ? [...v.reasons, 'Duplicate URL or headline'] : v.reasons,
            };
        });

        const filtered = includeUnverified
            ? validated
            : validated.filter(a => a.isVerified && !a.isDuplicate && !a.isExpired);

        return res.json({
            articles: filtered.slice(0, limit),
            total: filtered.length,
            summary: {
                inspected: validated.length,
                verified: validated.filter(a => a.isVerified).length,
                rejected: validated.filter(a => a.verificationStatus === 'rejected').length,
                unverified: validated.filter(a => a.verificationStatus === 'unverified').length,
                duplicates: validated.filter(a => a.isDuplicate).length,
                expired: validated.filter(a => a.isExpired).length,
            },
        });
    } catch (err: any) {
        console.error('[News] GET failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/news/validate — admin-only non-destructive validation pass over existing DB rows
newsRouter.post('/validate', requireAdmin, async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('news_articles')
            .select('*')
            .order('published_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        const seenHashes = new Set<string>();
        let verified = 0;
        let rejected = 0;
        let unverified = 0;
        let duplicates = 0;
        let dbUpdated = 0;
        let schemaPending = false;

        for (const row of (data ?? []) as RawNewsArticle[]) {
            const v = validateNewsArticle(row);
            const isDup = !!(v.urlHash && seenHashes.has(v.urlHash));
            if (v.urlHash) seenHashes.add(v.urlHash);
            if (isDup) duplicates++;

            const status = isDup && v.verificationStatus === 'verified' ? 'unverified' : v.verificationStatus;
            if (status === 'verified') verified++;
            else if (status === 'rejected') rejected++;
            else unverified++;

            if (!schemaPending && row.id) {
                const { error: upErr } = await supabaseAdmin
                    .from('news_articles')
                    .update({
                        summary: v.cleanSummary,
                        verification_status: status,
                        source_domain: v.sourceDomain,
                        is_verified: status === 'verified',
                        validation_notes: (isDup ? [...v.reasons, 'Duplicate url_hash'] : v.reasons).join('; ') || null,
                    })
                    .eq('id', row.id);

                if (upErr) {
                    if (upErr.code === 'PGRST204' || /column .* does not exist/i.test(upErr.message)) {
                        schemaPending = true;
                    }
                } else {
                    dbUpdated++;
                }
            }
        }

        return res.json({
            total: (data ?? []).length,
            verified,
            rejected,
            unverified,
            duplicates,
            dbUpdated,
            schemaMigrationPending: schemaPending,
        });
    } catch (err: any) {
        console.error('[News] Validate failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});

// POST /api/news/ingest — admin-only validated ingestion (never inserts fabricated URLs)
newsRouter.post('/ingest', requireAdmin, async (req: Request, res: Response) => {
    try {
        const body = req.body as RawNewsArticle & { checkReachable?: boolean };
        const v = validateNewsArticle(body);

        if (v.verificationStatus === 'rejected' || !v.normalizedUrl || !v.urlHash) {
            return res.status(400).json({
                error: 'Article failed source/URL validation',
                reasons: v.reasons,
                verificationStatus: v.verificationStatus,
            });
        }

        if (body.checkReachable !== false) {
            const reach = await verifyUrlReachable(v.normalizedUrl);
            if (!reach.reachable) {
                return res.status(422).json({
                    error: 'Article source URL could not be verified as reachable',
                    reason: reach.reason,
                });
            }
        }

        // Duplicate check
        const { data: existing } = await supabaseAdmin
            .from('news_articles')
            .select('id')
            .eq('url_hash', v.urlHash)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'Duplicate article URL already exists', existingId: existing.id });
        }

        const insertPayload: Record<string, unknown> = {
            title: v.cleanTitle,
            summary: v.cleanSummary,
            content: body.content ?? null,
            url: v.normalizedUrl,
            url_hash: v.urlHash,
            source: (body.source || '').trim(),
            category: body.category || 'business',
            topics: Array.isArray(body.topics) ? body.topics : [],
            published_at: body.published_at || new Date().toISOString(),
        };

        const { data: inserted, error: insErr } = await supabaseAdmin
            .from('news_articles')
            .insert({
                ...insertPayload,
                verification_status: v.verificationStatus,
                source_domain: v.sourceDomain,
                is_verified: v.isVerified,
                validation_notes: v.reasons.join('; ') || null,
            })
            .select('*')
            .single();

        if (insErr && (insErr.code === 'PGRST204' || /column .* does not exist/i.test(insErr.message))) {
            const { data: fbIns, error: fbErr } = await supabaseAdmin
                .from('news_articles')
                .insert(insertPayload)
                .select('*')
                .single();
            if (fbErr) return res.status(500).json({ error: fbErr.message });
            return res.status(201).json({ article: fbIns, verificationStatus: v.verificationStatus });
        }

        if (insErr) return res.status(500).json({ error: insErr.message });
        return res.status(201).json({ article: inserted, verificationStatus: v.verificationStatus });
    } catch (err: any) {
        console.error('[News] Ingest failed:', err.message);
        return res.status(500).json({ error: err.message });
    }
});
