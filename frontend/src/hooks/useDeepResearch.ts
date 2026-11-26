/* ═══════════════════════════════════════════════════════════════════════════
   Q Simutron — Deep Research Hook
   Zustand store + React hook for managing deep research state.
   Connects to the backend via REST (start) + WebSocket (stream progress).
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState, useEffect, useRef, useCallback } from 'react';

import { getAuthHeaders } from '../lib/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3100/api';
const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:3100/ws';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResearchDepth = 'surface' | 'standard' | 'deep' | 'exhaustive';

export interface ResearchProgressEvent {
    event: 'started' | 'node_complete' | 'status' | 'complete' | 'error';
    node?: string;
    iteration?: number;
    coverage_score?: number;
    total_sources?: number;
    sufficient?: boolean;
    report_ready?: boolean;
    final_report?: string | null;
    message?: string;
    researchId?: string;
}

export interface DeepResearchState {
    status: 'idle' | 'running' | 'complete' | 'error';
    researchId: string | null;
    currentNode: string;
    iteration: number;
    coverageScore: number;
    totalSources: number;
    statusMessage: string;
    finalReport: string | null;
    error: string | null;
}

const NODE_LABELS: Record<string, string> = {
    intake:     'Classifying research scope',
    decompose:  'Decomposing into sub-questions',
    search:     'Searching web via Perplexity',
    collect:    'Collecting evidence',
    gap_eval:   'Evaluating coverage gaps',
    synthesize: 'Synthesizing final report',
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDeepResearch() {
    const [state, setState] = useState<DeepResearchState>({
        status: 'idle',
        researchId: null,
        currentNode: '',
        iteration: 0,
        coverageScore: 0,
        totalSources: 0,
        statusMessage: '',
        finalReport: null,
        error: null,
    });

    const wsRef = useRef<WebSocket | null>(null);

    // Clean up WS on unmount
    useEffect(() => {
        return () => {
            wsRef.current?.close();
        };
    }, []);

    const connectWs = useCallback((researchId: string) => {
        // Close any existing connection
        wsRef.current?.close();

        const ws = new WebSocket(`${WS_BASE}?sessionId=${researchId}`);
        wsRef.current = ws;

        ws.onmessage = (e) => {
            try {
                const raw = JSON.parse(e.data);
                // The backend broadcasts as StreamEvent { type, sessionId, data, timestamp }
                const eventData = raw.data || raw;
                const eventType = eventData.event || raw.type;

                if (eventType === 'research_progress') {
                    const progress = eventData as ResearchProgressEvent;

                    if (progress.event === 'node_complete') {
                        setState((s) => ({
                            ...s,
                            currentNode: NODE_LABELS[progress.node || ''] || progress.node || '',
                            iteration: progress.iteration ?? s.iteration,
                            coverageScore: progress.coverage_score ?? s.coverageScore,
                            totalSources: progress.total_sources ?? s.totalSources,
                            finalReport: progress.final_report ?? s.finalReport,
                        }));
                    } else if (progress.event === 'status') {
                        setState((s) => ({ ...s, statusMessage: progress.message || '' }));
                    } else if (progress.event === 'error') {
                        setState((s) => ({
                            ...s,
                            status: 'error',
                            error: progress.message || 'Unknown error',
                        }));
                        ws.close();
                    }
                } else if (eventType === 'research_complete') {
                    setState((s) => ({
                        ...s,
                        status: 'complete',
                        statusMessage: 'Research complete',
                        finalReport: eventData.final_report ?? s.finalReport,
                        coverageScore: eventData.coverage_score ?? s.coverageScore,
                        totalSources: eventData.total_sources ?? s.totalSources,
                    }));
                    ws.close();
                } else if (eventType === 'error') {
                    setState((s) => ({
                        ...s,
                        status: 'error',
                        error: eventData.message || 'Research failed',
                    }));
                    ws.close();
                }
            } catch (err) {
                console.error('[DeepResearch] WS parse error:', err);
            }
        };

        ws.onerror = () => {
            setState((s) => ({
                ...s,
                status: 'error',
                error: 'WebSocket connection failed',
            }));
        };

        ws.onclose = () => {
            wsRef.current = null;
        };
    }, []);

    const startResearch = useCallback(async (query: string, depth: ResearchDepth = 'deep', mode: 'pro' | 'lite' = 'pro') => {
        // Reset state
        setState({
            status: 'running',
            researchId: null,
            currentNode: '',
            iteration: 0,
            coverageScore: 0,
            totalSources: 0,
            statusMessage: 'Initializing deep research...',
            finalReport: null,
            error: null,
        });

        try {
            const res = await fetch(`${API_BASE}/research`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ query, depth, mode }),
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`Start research failed: ${res.status} ${errText}`);
            }

            const { researchId } = await res.json();
            setState((s) => ({ ...s, researchId }));

            // Connect WS to receive progress
            connectWs(researchId);
        } catch (err: any) {
            setState((s) => ({
                ...s,
                status: 'error',
                error: err.message || 'Failed to start research',
            }));
        }
    }, [connectWs]);

    const cancel = useCallback(() => {
        wsRef.current?.close();
        setState((s) => ({ ...s, status: 'idle', statusMessage: '' }));
    }, []);

    return { state, startResearch, cancel, NODE_LABELS };
}
