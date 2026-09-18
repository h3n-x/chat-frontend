import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE_URL } from '../config';
import { ConnectionStatus, WSInboundFrame } from '../types';
import { getCustomRelayUrl } from '../utils/torDetection';

interface UseWebSocketOptions {
  roomId: string;
  onMessage: (frame: WSInboundFrame) => void;
  enabled: boolean;
}

export function useWebSocket({ roomId, onMessage, enabled }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [socketError, setSocketError] = useState<string | null>(null);
  const [rttMs, setRttMs] = useState<number | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const lastPingTimeRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef<number>(0);
  const intentionalCloseRef = useRef<boolean>(false);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const sendFrame = useCallback((data: object): boolean => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    if (!enabled || !roomId) return;

    if (retryCountRef.current > 0) {
      setStatus('reconnecting');
    } else {
      setStatus('connecting');
    }
    setSocketError(null);
    intentionalCloseRef.current = false;

    const customRelay = getCustomRelayUrl();
    const baseWs = customRelay ? customRelay.replace(/\/+$/, '') : WS_BASE_URL;
    const wsUrl = `${baseWs}/ws/${roomId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      retryCountRef.current = 0;

      // Keepalive ping every 20 seconds and initial ping
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          lastPingTimeRef.current = Date.now();
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);

      lastPingTimeRef.current = Date.now();
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const frame = JSON.parse(event.data) as WSInboundFrame;

        if (frame.type === 'pong') {
          if (lastPingTimeRef.current) {
            setRttMs(Math.max(1, Date.now() - lastPingTimeRef.current));
            lastPingTimeRef.current = null;
          }
        } else if (frame.type === 'room_welcome') {
          setParticipantCount(frame.participant_count);
        } else if (frame.type === 'peer_joined') {
          setParticipantCount(frame.participant_count);
        } else if (frame.type === 'peer_left') {
          setParticipantCount(frame.participant_count);
        } else if (frame.type === 'error') {
          setSocketError(frame.message);
        }

        onMessageRef.current(frame);
      } catch (e) {
        console.error('Failed to parse incoming WebSocket frame:', e);
      }
    };

    ws.onerror = () => {
      setSocketError('Error en la conexión WebSocket');
    };

    ws.onclose = (event: CloseEvent) => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
      setRttMs(null);

      if (event.code === 1008) {
        setStatus('error');
        setSocketError(
          event.reason || 'Conexión rechazada por políticas de seguridad del relay.'
        );
        return;
      }

      if (intentionalCloseRef.current) {
        setStatus('disconnected');
        return;
      }

      // Exponential backoff reconnect
      setStatus('reconnecting');
      const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
      retryCountRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(connect, delay);
    };
  }, [enabled, roomId]);

  useEffect(() => {
    connect();

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    status,
    participantCount,
    socketError,
    rttMs,
    sendFrame,
    disconnect,
  };
}
