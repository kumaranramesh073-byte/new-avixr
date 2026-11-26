/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — useWebSocket Hook
   Real-time streaming connection for session step-by-step updates.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { StreamEvent } from '../types';

interface UseWebSocketOptions {
    url: string;
    sessionId: string | null;
    onMessage?: (event: StreamEvent) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
    autoConnect?: boolean;
}

export function useWebSocket({
    url,
    sessionId,
    onMessage,
    onConnect,
    onDisconnect,
    autoConnect = false,
}: UseWebSocketOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
        if (!sessionId || wsRef.current) return;

        try {
            const fullUrl = `${url}/${sessionId}`;
            const ws = new WebSocket(fullUrl);

            ws.onopen = () => {
                setIsConnected(true);
                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const data: StreamEvent = JSON.parse(event.data);
                    onMessage?.(data);
                } catch (e) {
                    console.error('WebSocket parse error:', e);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                wsRef.current = null;
                onDisconnect?.();
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                ws.close();
            };

            wsRef.current = ws;
        } catch (e) {
            console.error('WebSocket connection failed:', e);
        }
    }, [url, sessionId, onMessage, onConnect, onDisconnect]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const send = useCallback((data: unknown) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    }, []);

    useEffect(() => {
        if (autoConnect && sessionId) {
            connect();
        }
        return () => disconnect();
    }, [autoConnect, sessionId, connect, disconnect]);

    return { isConnected, connect, disconnect, send };
}
