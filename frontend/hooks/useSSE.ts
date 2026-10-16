// ──────────────────────────────────────────────────
// hooks/useSSE.ts — Server-Sent Events hook with
// exponential backoff reconnection
// ──────────────────────────────────────────────────
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { MQTTConnectionStatus, SSEEvent } from '@/types';

export type SSEConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface UseSSEOptions {
  url: string;
  onEvent: (event: SSEEvent) => void;
  onStatusChange?: (status: MQTTConnectionStatus) => void;
  enabled?: boolean;
}

const MIN_BACKOFF_MS = 1_000;
const MAX_BACKOFF_MS = 30_000;

export function useSSE({
  url,
  onEvent,
  onStatusChange,
  enabled = true,
}: UseSSEOptions): {
  connectionStatus: SSEConnectionStatus;
  reconnectCount: number;
} {
  const [connectionStatus, setConnectionStatus] =
    useState<SSEConnectionStatus>('disconnected');
  const [reconnectCount, setReconnectCount] = useState(0);

  // Stable callback refs — avoids stale closure bugs
  const onEventRef = useRef(onEvent);
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const backoffRef = useRef(MIN_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current || !enabled) return;

    // Clean up any existing connection
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    setConnectionStatus('connecting');

    let es: EventSource;
    try {
      es = new EventSource(url);
    } catch (err) {
      console.error('[useSSE] Failed to create EventSource:', err);
      setConnectionStatus('error');
      scheduleReconnect();
      return;
    }

    esRef.current = es;

    es.onopen = () => {
      if (!mountedRef.current) return;
      backoffRef.current = MIN_BACKOFF_MS; // Reset backoff on success
      setConnectionStatus('connected');
      setReconnectCount(0);
      console.log('[useSSE] Connected to', url);
    };

    es.onmessage = (raw) => {
      if (!mountedRef.current) return;
      try {
        const parsed = JSON.parse(raw.data) as SSEEvent;
        onEventRef.current(parsed);
      } catch (err) {
        console.warn('[useSSE] Failed to parse SSE message:', raw.data, err);
      }
    };

    // Named event types forwarded by the backend (e.g. event: reading)
    const eventTypes = ['reading', 'status', 'connection', 'stale', 'error'];
    eventTypes.forEach((type) => {
      es.addEventListener(type, (raw: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(raw.data);
          const sseEvent: SSEEvent = {
            type: type as SSEEvent['type'],
            data,
            timestamp: new Date().toISOString(),
          };
          onEventRef.current(sseEvent);
        } catch (err) {
          console.warn(`[useSSE] Failed to parse '${type}' event:`, err);
        }
      });
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      console.warn('[useSSE] Connection error, scheduling reconnect...');
      es.close();
      esRef.current = null;
      setConnectionStatus('error');
      scheduleReconnect();
    };
  }, [url, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = backoffRef.current;
    console.log(`[useSSE] Reconnecting in ${delay}ms...`);
    setConnectionStatus('disconnected');
    setReconnectCount((c) => c + 1);
    reconnectTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      // Exponential backoff: double each time, max 30s
      backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF_MS);
      connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [enabled, connect]);

  return { connectionStatus, reconnectCount };
}
