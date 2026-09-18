import { useEffect, useRef, useState, useCallback } from 'react';
import { WS_BASE_URL } from '../config';
import { ConnectionStatus, WSInboundFrame } from '../types';

interface UseWebSocketOptions {
  roomId: string;
  onMessage: (frame: WSInboundFrame) => void;
  enabled: boolean;
}

export function useWebSocket({ roomId, onMessage, enabled }: UseWebSocketOptions) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [participantCount, setParticipantCount] = useState<number>(1);
  const [socketError, setSocketError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
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

  const connect = useCallback(() => {
    if (!enabled || !roomId) return;

    setStatus('connecting');
    setSocketError(null);

    const wsUrl = `${WS_BASE_URL}/ws/${roomId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      // Keepalive ping every 25 seconds
      pingIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const frame = JSON.parse(event.data) as WSInboundFrame;

        if (frame.type === 'peer_joined') {
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
      setStatus('disconnected');
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      if (event.code === 1008) {
        setSocketError(
          event.reason || 'Conexión rechazada por política del servidor (límite alcanzado o sala llena).'
        );
      }
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
    sendFrame,
  };
}
