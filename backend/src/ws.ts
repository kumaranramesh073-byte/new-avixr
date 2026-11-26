/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — WebSocket Manager
   Handles real-time streaming of step results to connected clients.
   Supports both session-scoped and global (all-session) subscriptions.
   ═══════════════════════════════════════════════════════════════════════════ */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { StreamEvent, StreamEventType } from './types.js';

// Map of sessionId → Set of connected clients
const sessionClients = new Map<string, Set<WebSocket>>();
// Global clients that receive ALL session events
const globalClients = new Set<WebSocket>();

export function createWebSocketServer(server: Server): WebSocketServer {
    const wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        // Extract optional sessionId from query string: /ws?sessionId=xxx
        const url = new URL(req.url ?? '/', `http://localhost`);
        const sessionId = url.searchParams.get('sessionId');

        if (sessionId) {
            // Session-scoped client
            if (!sessionClients.has(sessionId)) {
                sessionClients.set(sessionId, new Set());
            }
            sessionClients.get(sessionId)!.add(ws);
            console.log(`[WS] Client connected: session=${sessionId} (total=${sessionClients.get(sessionId)!.size})`);

            safeSend(ws, {
                type: 'plan_ready',
                sessionId,
                data: { message: 'WebSocket connected. Awaiting execution.' },
                timestamp: Date.now(),
            });

            ws.on('close', () => {
                const clients = sessionClients.get(sessionId);
                if (clients) {
                    clients.delete(ws);
                    if (clients.size === 0) sessionClients.delete(sessionId);
                }
                console.log(`[WS] Client disconnected: session=${sessionId}`);
            });
        } else {
            // Global client — receives ALL session events
            globalClients.add(ws);
            console.log(`[WS] Global client connected (total=${globalClients.size})`);

            safeSend(ws, {
                type: 'connected' as StreamEventType,
                sessionId: '',
                data: { message: 'Global WebSocket connected.' },
                timestamp: Date.now(),
            });

            ws.on('close', () => {
                globalClients.delete(ws);
                console.log(`[WS] Global client disconnected (total=${globalClients.size})`);
            });
        }

        ws.on('error', (err) => {
            console.error(`[WS] Error:`, err.message);
        });
    });

    return wss;
}

// ─── Broadcast helpers ────────────────────────────────────────────────────────

function safeSend(ws: WebSocket, event: StreamEvent): void {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(event));
    }
}

export function broadcast(sessionId: string, type: StreamEventType, data: Record<string, unknown>): void {
    const event: StreamEvent = { type, sessionId, data, timestamp: Date.now() };
    const payload = JSON.stringify(event);

    // Send to session-scoped clients
    const clients = sessionClients.get(sessionId);
    if (clients) {
        for (const ws of clients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(payload);
            }
        }
    }

    // Send to global clients
    for (const ws of globalClients) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(payload);
        }
    }
}

export function broadcastError(sessionId: string, message: string): void {
    broadcast(sessionId, 'error', { message });
}
