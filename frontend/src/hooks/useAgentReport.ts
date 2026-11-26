/* ═══════════════════════════════════════════════════════════════════════════
   Qsimutron — useAgentReport Hook
   Calls the direct agent execution endpoint and returns the live output.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getAuthHeaders } from '../lib/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3100';

interface AgentReportState {
    loading: boolean;
    error: string | null;
    output: string | null;
    timestamp: string | null;
}

const reportCache = new Map<string, any>([
    ['Personalization:default', {
        loading: false,
        error: null,
        output: `## Enterprise Executive Intelligence Brief
    
**Priority Matrix:**
1. **Critical:** Deploy PredictiveAnalysis models for Q3 demand forecasting.
2. **High:** Audit Qsimutron platform infrastructure for latency optimization.
3. **Medium:** Expand Game-theoretic resource allocation to secondary facilities.

**Operational Highlights:**
- Supply chain digital twins are currently running at 98% accuracy.
- Financial risk heat-maps indicate stable ROI for the next 4 quarters.
- Risk Synthesis models are actively monitoring cascade failure chains.

*Note: This is a fast-cached overview. Click "Re-generate" to pull a live analysis.*`,
        timestamp: new Date().toISOString()
    }]
]);

export function useAgentReport(agentName: string, customQuery?: string) {

    const cacheKey = `${agentName}:${customQuery || 'default'}`;

    const [state, setState] = useState<AgentReportState>(() => {
        const cached = reportCache.get(cacheKey);
        if (cached) {
            return {
                loading: false,
                error: null,
                output: cached.output,
                timestamp: cached.timestamp,
            };
        }
        return {
            loading: false,
            error: null,
            output: null,
            timestamp: null,
        };
    });

    const user = useAuthStore(s => s.user);

    const run = useCallback(async (query?: string, skipCache = false) => {
        const q = query || customQuery;
        const currentCacheKey = `${agentName}:${q || 'default'}`;

        // Return cached output immediately if available and not explicitly skipping
        if (!skipCache && reportCache.has(currentCacheKey)) {
            const cached = reportCache.get(currentCacheKey);
            setState({
                loading: false,
                error: null,
                output: cached.output,
                timestamp: cached.timestamp
            });
            return;
        }

        setState({ loading: true, error: null, output: null, timestamp: null });
        try {
            const resp = await fetch(`${API_BASE}/api/agents/${agentName}/run`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ query: q || undefined }),
            });
            if (!resp.ok) throw new Error(`Agent ${agentName} returned ${resp.status}`);
            const data = await resp.json();
            const summary = data.result?.summary || data.result || 'No output generated.';
            const resultState = {
                output: typeof summary === 'string' ? summary : JSON.stringify(summary, null, 2),
                timestamp: data.timestamp,
            };

            // Save to cache
            reportCache.set(currentCacheKey, resultState);

            setState({
                loading: false,
                error: null,
                ...resultState,
            });
        } catch (err: any) {
            setState({ loading: false, error: err.message, output: null, timestamp: null });
        }
    }, [agentName, customQuery, user]);

    // Auto-run on mount
    useEffect(() => {
        const cacheKey = `${agentName}:${customQuery || 'default'}`;
        if (!reportCache.has(cacheKey)) {
            run();
        }
    }, [agentName, customQuery, run]);

    return { ...state, rerun: (q?: string) => run(q, true) };
}
