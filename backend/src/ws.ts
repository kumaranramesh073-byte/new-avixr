/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — WebSocket Manager (Authenticated)
   Handles real-time streaming of step results to authorized clients.
   Verifies Supabase JWT & session/research ownership before subscribing.
   ═══════════════════════════════════════════════════════════════════════════ */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { StreamEvent, StreamEventType } from './types.js';
import { verifyBearerToken, supabaseAdmin } from './middleware/auth.js';

const sessionClients = new Map<string, Set<WebSocket>>();
const globalAdminClients = new Set<WebSocket>();

export function createWebSocketServer(server: Server): WebSocketServer {
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', async (ws, req) => {
        try {
            const url = new URL(req.url ?? '/ws', 'http://localhost');
            let sessionId = url.searchParams.get('sessionId');

            // Support legacy /ws/<sessionId> path if used
            if (!sessionId && url.pathname.startsWith('/ws/')) {
                const rest = url.pathname.slice(4).trim();
                if (rest) sessionId = rest;
            }

            const token =
                url.searchParams.get('token') ||
                (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7).trim() : '');

            if (!token) {
                ws.close(4401, 'Authentication token required');
                return;
            }

            const ctx = await verifyBearerToken(token);

            if (sessionId) {
                // Verify ownership of either a session or a research feed
                const [{ data: sess }, { data: feed }] = await Promise.all([
                    supabaseAdmin.from('sessions').select('user_id, organization_id').eq('id', sessionId).maybeSingle(),
                    supabaseAdmin.from('intelligence_feeds').select('user_id, organization_id').eq('id', sessionId).maybeSingle(),
                ]);

                const owner = sess || feed;
                const isAdmin = ctx.role === 'admin' || ctx.role === 'superadmin';
                if (owner && !isAdmin && (owner.user_id !== ctx.userId || owner.organization_id !== ctx.organizationId)) {
                    ws.close(4403, 'Unauthorized session subscription');
                    return;
                }

                if (!sessionClients.has(sessionId)) {
                    sessionClients.set(sessionId, new Set());
                }
                sessionClients.get(sessionId)!.add(ws);
                console.log(`[WS] Authenticated client connected: session=${sessionId}`);

                safeSend(ws, {
                    type: 'plan_ready',
                    sessionId,
                    data: { message: 'WebSocket connected. Awaiting execution.' },
                    timestamp: Date.now(),
                });

                ws.on('close', () => {
                    const clients = sessionClients.get(sessionId!);
                    if (clients) {
                        clients.delete(ws);
                        if (clients.size === 0) sessionClients.delete(sessionId!);
                    }
                });
            } else {
                // Global stream strictly restricted to verified admins
                if (ctx.role !== 'admin' && ctx.role !== 'superadmin') {
                    ws.close(4403, 'Global stream requires admin privileges');
                    return;
                }
                globalAdminClients.add(ws);
                safeSend(ws, {
                    type: 'connected' as StreamEventType,
                    sessionId: '',
                    data: { message: 'Global WebSocket connected.' },
                    timestamp: Date.now(),
                });

                ws.on('close', () => {
                    globalAdminClients.delete(ws);
                });
            }

            ws.on('error', (err) => {
                console.error('[WS] Error:', err.message);
            });
        } catch (err: any) {
            console.warn('[WS] Rejected unauthenticated connection:', err.message);
            ws.close(4401, 'Invalid or expired token');
        }
    });

    return wss;
}

function safeSend(ws: WebSocket, event: StreamEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
    }
}

export function broadcast(sessionId: string, type: StreamEventType, data: Record<string, unknown>): void {
    const event: StreamEvent = { type, sessionId, data, timestamp: Date.now() };
    const payload = JSON.stringify(event);

    const clients = sessionClients.get(sessionId);
    if (clients) {
        for (const ws of clients) {
            if (ws.readyState === WebSocket.OPEN) ws.send(payload);
        }
    }

    for (const ws of globalAdminClients) {
        if (ws.readyState === WebSocket.OPEN) ws.send(payload);
    }
}

export function broadcastError(sessionId: string, message: string): void {
    broadcast(sessionId, 'error', { message });
}
