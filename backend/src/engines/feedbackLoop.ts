/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Continuous Feedback Loop (Supabase query_history backed)
   Stores session outcomes in Supabase query_history and provides historical
   context from past sessions.
   ═══════════════════════════════════════════════════════════════════════════ */

import { supabaseAdmin } from '../middleware/auth.js';

export interface FeedbackEntry {
    sessionId: string;
    organizationId?: string;
    userId?: string;
    query: string;
    intent: string;
    agentsUsed: string[];
    compositeScore: number;
    rank: string;
    timestamp: number;
}

export async function recordFeedback(entry: FeedbackEntry): Promise<void> {
    if (entry.organizationId && entry.userId) {
        const { error } = await supabaseAdmin.from('query_history').insert({
            organization_id: entry.organizationId,
            user_id: entry.userId,
            session_id: entry.sessionId,
            query: entry.query,
            intent: entry.intent,
            agents_used: entry.agentsUsed,
            composite_score: entry.compositeScore,
            decision_rank: entry.rank,
        });
        if (error) {
            console.warn('[Engine] FeedbackLoop Supabase insert failed:', error.message);
        }
    }
    console.log(`[Engine] FeedbackLoop: Recorded outcome for session ${entry.sessionId} (score: ${entry.compositeScore})`);
}

export async function getRelevantContext(
    query: string,
    organizationId?: string,
    userId?: string
): Promise<FeedbackEntry[]> {
    if (!organizationId || !userId) return [];

    const { data, error } = await supabaseAdmin
        .from('query_history')
        .select('session_id, organization_id, user_id, query, intent, agents_used, composite_score, decision_rank, created_at')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

    if (error || !data) return [];

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return data
        .filter(row => {
            const entryWords = String(row.query || '').toLowerCase().split(/\s+/);
            return queryWords.some(qw => entryWords.some(ew => ew.includes(qw)));
        })
        .slice(0, 5)
        .map(row => ({
            sessionId: row.session_id,
            organizationId: row.organization_id,
            userId: row.user_id,
            query: row.query,
            intent: row.intent || 'general',
            agentsUsed: Array.isArray(row.agents_used) ? row.agents_used : [],
            compositeScore: Number(row.composite_score ?? 0),
            rank: row.decision_rank || '',
            timestamp: new Date(row.created_at).getTime(),
        }));
}
