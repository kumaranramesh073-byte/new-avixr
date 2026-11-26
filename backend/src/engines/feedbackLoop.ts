/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — Continuous Feedback Loop
   Stores session outcomes and provides context from past sessions to
   improve future orchestrations. In-memory for now, can be backed by DB.
   ═══════════════════════════════════════════════════════════════════════════ */

export interface FeedbackEntry {
    sessionId: string;
    query: string;
    intent: string;
    agentsUsed: string[];
    compositeScore: number;
    rank: string;
    timestamp: number;
}

// In-memory feedback store (last 100 entries)
const feedbackStore: FeedbackEntry[] = [];

export function recordFeedback(entry: FeedbackEntry): void {
    feedbackStore.push(entry);
    // Keep only last 100 entries
    if (feedbackStore.length > 100) {
        feedbackStore.shift();
    }
    console.log(`[Engine] FeedbackLoop: Recorded outcome for session ${entry.sessionId} (score: ${entry.compositeScore})`);
}

export function getRelevantContext(query: string): FeedbackEntry[] {
    // Find past sessions with similar keywords
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    return feedbackStore
        .filter(entry => {
            const entryWords = entry.query.toLowerCase().split(/\s+/);
            return queryWords.some(qw => entryWords.some(ew => ew.includes(qw)));
        })
        .slice(-5); // Return last 5 relevant entries
}

export function getFeedbackStats(): {
    totalSessions: number;
    avgScore: number;
    topAgents: Record<string, number>;
} {
    const total = feedbackStore.length;
    const avgScore = total > 0
        ? feedbackStore.reduce((sum, e) => sum + e.compositeScore, 0) / total
        : 0;

    const agentCounts: Record<string, number> = {};
    feedbackStore.forEach(e => {
        e.agentsUsed.forEach(a => {
            agentCounts[a] = (agentCounts[a] || 0) + 1;
        });
    });

    return { totalSessions: total, avgScore: Math.round(avgScore), topAgents: agentCounts };
}
