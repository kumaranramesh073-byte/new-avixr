/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — API Client
   Routes all calls through the backend. Falls back to direct Anthropic if
   VITE_API_BASE is not set (dev without backend).
   ═══════════════════════════════════════════════════════════════════════════ */

import { getAuthHeaders } from '../lib/authHeaders';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3100/api';
const WS_BASE = import.meta.env.VITE_WS_BASE || 'ws://localhost:3100/ws';

export { WS_BASE };

// All callers use getAuthHeaders() from the shared lib (returns the Supabase JWT)
const getHeaders = getAuthHeaders;

// ─── Types (local to client, mirrors backend responses) ───────────────────────

interface PlanStep {
    id: number;
    title: string;
    description: string;
    type: 'chart' | 'table' | 'map' | 'text';
    dataSource: string;
}

interface CreateSessionResponse {
    sessionId: string;
    status: string;
}

// ─── Sessions API ─────────────────────────────────────────────────────────────

/**
 * Creates a new session on the backend and triggers async plan generation.
 * The backend broadcasts `plan_ready` over WebSocket when the plan is ready.
 */
export async function createSession(
    query: string,
    agentMode: string = 'All Agents'
): Promise<CreateSessionResponse> {
    const res = await fetch(`${API_BASE}/sessions`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify({ query, agentMode }),
    });
    if (!res.ok) throw new Error(`Create session failed: ${res.status}`);
    return res.json();
}

/**
 * Triggers execution of all plan steps for a session.
 * Results are streamed over WebSocket.
 */
export async function executeSessionPlan(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}/execute`, {
        method: 'POST',
        headers: await getHeaders(),
    });
    if (!res.ok) throw new Error(`Execute failed: ${res.status}`);
}

/**
 * Returns a full session object including executed step results.
 */
export async function getSession(sessionId: string): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(`Get session failed: ${res.status}`);
    return res.json();
}

export async function listSessions(): Promise<Record<string, unknown>[]> {
    const res = await fetch(`${API_BASE}/sessions`, { headers: await getHeaders() });
    if (!res.ok) throw new Error(`List sessions failed: ${res.status}`);
    return res.json();
}

export async function deleteSession(sessionId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, { method: 'DELETE', headers: await getHeaders() });
    if (!res.ok) throw new Error(`Delete session failed: ${res.status}`);
}

export async function updateSession(
    sessionId: string,
    patch: { query?: string; agentMode?: string; status?: string }
): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`Update session failed: ${res.status}`);
    return res.json();
}

// ─── Resource APIs ────────────────────────────────────────────────────────────

export async function fetchDataSources(): Promise<Record<string, unknown>[]> {
    const res = await fetch(`${API_BASE}/data-sources`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch data sources');
    return res.json();
}

export async function createDataSource(payload: {
    name: string;
    type: string;
    region?: string;
    status?: string;
}): Promise<Record<string, unknown>> {
    const res = await fetch(`${API_BASE}/data-sources`, {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to save data source' }));
        throw new Error(err.error || 'Failed to save data source');
    }
    return res.json();
}

export async function deleteDataSource(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/data-sources/${id}`, {
        method: 'DELETE',
        headers: await getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete data source');
}

export async function fetchModels(): Promise<Record<string, unknown>[]> {
    const res = await fetch(`${API_BASE}/models`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch models');
    return res.json();
}

export async function fetchSuites(): Promise<Record<string, unknown>[]> {
    const res = await fetch(`${API_BASE}/suites`, { headers: await getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch suites');
    return res.json();
}

// ─── Legacy direct-Claude shims (kept for backward-compat) ───────────────────
// These are no longer called by the app — session creation now goes via backend.
// Kept here so nothing breaks during the transition.

const _LEGACY_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || '';
const _LEGACY_API_URL = import.meta.env.VITE_API_URL || 'https://api.anthropic.com/v1/messages';
const _LEGACY_MODEL = import.meta.env.VITE_MODEL || 'claude-sonnet-4-20250514';

export async function callClaude(
    system: string,
    user: string,
    maxTokens: number = 1200
): Promise<string> {
    const res = await fetch(_LEGACY_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': _LEGACY_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: _LEGACY_MODEL,
            max_tokens: maxTokens,
            system,
            messages: [{ role: 'user', content: user }],
        }),
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    return data.content?.map((b: { text?: string }) => b.text || '').join('') || '';
}

export async function generatePlan(query: string): Promise<{ steps: PlanStep[] }> {
    // Delegate to backend — this shim is kept for the useSession hook's existing imports
    await createSession(query);
    // Return empty plan — the real plan arrives via WebSocket
    return { steps: [] };
}

export async function executeStep(
    _query: string,
    _step: { title: string; description: string; type: string }
): Promise<Record<string, unknown>> {
    // No longer called directly — backend handles all step execution
    return { summary: 'Execution handled by backend.' };
}
