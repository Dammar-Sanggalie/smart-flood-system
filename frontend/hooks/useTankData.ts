// ──────────────────────────────────────────────────
// hooks/useTankData.ts — Main data hook combining
// SSE realtime updates + REST polling for config/status
// ──────────────────────────────────────────────────
'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { useSSE } from './useSSE';
import { fetchConfig, fetchHistory, fetchStatus, updateConfig as apiUpdateConfig } from '@/lib/api';
import { generateId } from '@/lib/utils';
import type {
  ActivityLogEntry,
  AppMode,
  MQTTConnectionStatus,
  SensorReading,
  SSEEvent,
  StatusResponse,
  TankConfig,
} from '@/types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const MAX_HISTORY = 50;
const MAX_LOG_ENTRIES = 100;

// ── State ─────────────────────────────────────────
export interface TankDataState {
  reading: SensorReading | null;
  config: TankConfig | null;
  status: StatusResponse | null;
  history: SensorReading[];
  activityLog: ActivityLogEntry[];
  sseStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  isLoading: boolean;
  error: string | null;
  mode: AppMode;
  mqttStatus: MQTTConnectionStatus;
}

// ── Actions ───────────────────────────────────────
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONFIG'; payload: TankConfig }
  | { type: 'SET_STATUS'; payload: StatusResponse }
  | { type: 'SET_HISTORY'; payload: SensorReading[] }
  | { type: 'SET_SSE_STATUS'; payload: TankDataState['sseStatus'] }
  | { type: 'NEW_READING'; payload: SensorReading }
  | { type: 'MARK_STALE' }
  | { type: 'SET_MQTT_STATUS'; payload: MQTTConnectionStatus }
  | { type: 'ADD_LOG'; payload: ActivityLogEntry }
  | { type: 'CLEAR_LOG' };

// ── Reducer ───────────────────────────────────────
function reducer(state: TankDataState, action: Action): TankDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
        mode: action.payload.mode,
        mqttStatus: action.payload.mqttStatus,
        reading: state.reading ?? action.payload.lastReading,
      };
    case 'SET_HISTORY':
      return { ...state, history: action.payload };
    case 'SET_SSE_STATUS':
      return { ...state, sseStatus: action.payload };
    case 'NEW_READING': {
      const newHistory = [action.payload, ...state.history].slice(0, MAX_HISTORY);
      return {
        ...state,
        reading: action.payload,
        history: newHistory,
        error: null,
      };
    }
    case 'MARK_STALE':
      if (!state.reading) return state;
      return { ...state, reading: { ...state.reading, isStale: true } };
    case 'SET_MQTT_STATUS':
      return { ...state, mqttStatus: action.payload };
    case 'ADD_LOG': {
      const newLog = [action.payload, ...state.activityLog].slice(0, MAX_LOG_ENTRIES);
      return { ...state, activityLog: newLog };
    }
    case 'CLEAR_LOG':
      return { ...state, activityLog: [] };
    default:
      return state;
  }
}

// ── Initial State ─────────────────────────────────
const initialState: TankDataState = {
  reading: null,
  config: null,
  status: null,
  history: [],
  activityLog: [],
  sseStatus: 'connecting',
  isLoading: true,
  error: null,
  mode: 'live',
  mqttStatus: 'disconnected',
};

// ── Hook ──────────────────────────────────────────
export function useTankData(): TankDataState & {
  refreshConfig: () => void;
  updateConfig: (config: TankConfig) => Promise<void>;
  clearActivityLog: () => void;
} {
  const [state, dispatch] = useReducer(reducer, initialState);
  const mountedRef = useRef(true);

  // Helper: add activity log entry
  const addLog = useCallback(
    (
      message: string,
      type: ActivityLogEntry['type'],
      severity: ActivityLogEntry['severity'],
    ) => {
      dispatch({
        type: 'ADD_LOG',
        payload: {
          id: generateId(),
          timestamp: new Date().toISOString(),
          type,
          message,
          severity,
        },
      });
    },
    [],
  );

  // ── Initial data load ────────────────────────────
  const loadInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const [configData, statusData, historyData] = await Promise.all([
        fetchConfig(),
        fetchStatus(),
        fetchHistory(MAX_HISTORY),
      ]);

      if (!mountedRef.current) return;

      if (configData) dispatch({ type: 'SET_CONFIG', payload: configData });
      if (statusData) dispatch({ type: 'SET_STATUS', payload: statusData });
      if (historyData.length) {
        dispatch({ type: 'SET_HISTORY', payload: historyData });
      }

      addLog('Dashboard initialized', 'system', 'info');
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? err.message : 'Failed to load data';
      dispatch({ type: 'SET_ERROR', payload: msg });
      addLog(`Initialization error: ${msg}`, 'system', 'error');
    } finally {
      if (mountedRef.current) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [addLog]);

  useEffect(() => {
    mountedRef.current = true;
    loadInitialData();
    return () => { mountedRef.current = false; };
  }, [loadInitialData]);

  // ── SSE event handler ────────────────────────────
  const handleSSEEvent = useCallback(
    (event: SSEEvent) => {
      if (!mountedRef.current) return;

      switch (event.type) {
        case 'reading': {
          const reading = event.data as SensorReading;
          dispatch({ type: 'NEW_READING', payload: reading });
          const level = reading.sensorValid
            ? `${reading.waterLevelCm.toFixed(1)}cm (${reading.fillPercentage.toFixed(1)}%)`
            : 'invalid sensor';
          addLog(
            `New reading: ${level} — ${reading.calculatedStatus}`,
            'reading',
            reading.calculatedStatus === 'DANGER'
              ? 'error'
              : reading.calculatedStatus === 'WARNING'
              ? 'warning'
              : 'success',
          );
          break;
        }
        case 'status': {
          const statusData = event.data as StatusResponse;
          dispatch({ type: 'SET_STATUS', payload: statusData });
          break;
        }
        case 'stale': {
          dispatch({ type: 'MARK_STALE' });
          addLog('Sensor data is stale — no recent readings', 'stale', 'warning');
          break;
        }
        case 'connection': {
          const connData = event.data as { mqttStatus: MQTTConnectionStatus };
          if (connData?.mqttStatus) {
            dispatch({ type: 'SET_MQTT_STATUS', payload: connData.mqttStatus });
            addLog(
              `MQTT status: ${connData.mqttStatus}`,
              'connection',
              connData.mqttStatus === 'connected' ? 'success' : 'warning',
            );
          }
          break;
        }
        case 'error': {
          const errData = event.data as { message?: string };
          addLog(
            `Server error: ${errData?.message ?? 'Unknown error'}`,
            'error',
            'error',
          );
          break;
        }
      }
    },
    [addLog],
  );

  // ── SSE connection status ─────────────────────────
  const handleSSEStatusChange = useCallback(
    (newStatus: TankDataState['sseStatus']) => {
      dispatch({ type: 'SET_SSE_STATUS', payload: newStatus });
      if (newStatus === 'connected') {
        addLog('Real-time connection established', 'system', 'success');
      } else if (newStatus === 'disconnected' || newStatus === 'error') {
        addLog('Real-time connection lost, reconnecting…', 'system', 'warning');
      }
    },
    [addLog],
  );

  const { connectionStatus } = useSSE({
    url: `${API_BASE}/api/events`,
    onEvent: handleSSEEvent,
    enabled: true,
  });

  // Sync SSE connection status into state
  useEffect(() => {
    dispatch({ type: 'SET_SSE_STATUS', payload: connectionStatus });
    if (connectionStatus === 'connected') {
      addLog('Real-time connection established', 'system', 'success');
    } else if (connectionStatus === 'disconnected') {
      addLog('Real-time connection lost, reconnecting…', 'system', 'warning');
    }
  }, [connectionStatus, addLog]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Exposed actions ───────────────────────────────
  const refreshConfig = useCallback(() => {
    fetchConfig().then((cfg) => {
      if (cfg && mountedRef.current) {
        dispatch({ type: 'SET_CONFIG', payload: cfg });
        addLog('Configuration refreshed', 'system', 'info');
      }
    });
  }, [addLog]);

  const updateConfig = useCallback(
    async (config: TankConfig) => {
      const updated = await apiUpdateConfig(config);
      if (mountedRef.current) {
        dispatch({ type: 'SET_CONFIG', payload: updated });
        addLog('Tank configuration updated', 'system', 'success');
      }
    },
    [addLog],
  );

  const clearActivityLog = useCallback(() => {
    dispatch({ type: 'CLEAR_LOG' });
  }, []);

  return {
    ...state,
    refreshConfig,
    updateConfig,
    clearActivityLog,
  };
}
