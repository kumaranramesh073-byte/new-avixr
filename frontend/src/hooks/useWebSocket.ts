/* ═══════════════════════════════════════════════════════════════════════════
   Enterprise GenAI Platform — useWebSocket Hook
   Real-time streaming connection for session step-by-step updates.
   Passes authenticated Supabase JWT via ?sessionId=...&token=...
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { StreamEvent } from '../types';
import { supabase } from '../lib/supabase';

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

    const connect = useCallback(async () => {
        if (!sessionId || wsRef.current) return;

        try {
            const { data } = await supabase.auth.getSession();
            const token = data.session?.access_token ?? '';
            const fullUrl = `${url}?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;
            const ws = new WebSocket(fullUrl);

            ws.onopen = () => {
                setIsConnected(true);
                onConnect?.();
            };

            ws.onmessage = (event) => {
                try {
                    const parsed: StreamEvent = JSON.parse(event.data);
                    onMessage?.(parsed);
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
            void connect();
        }
        return () => disconnect();
    }, [autoConnect, sessionId, connect, disconnect]);

    return { isConnected, connect, disconnect, send };
}
