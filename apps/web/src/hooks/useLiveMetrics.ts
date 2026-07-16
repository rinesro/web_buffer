'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getSocket } from '@/lib/socket-client';
import type { SystemMetric } from '@/types/api';

const MAX_HISTORY_POINTS = 60;

export function useLiveMetrics(serverId: string | null, seedHistory: SystemMetric[] = []) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [history, setHistory] = useState<SystemMetric[]>(seedHistory);
  const [isConnected, setIsConnected] = useState(false);
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current && seedHistory.length > 0) {
      setHistory(seedHistory);
      seededRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedHistory]);

  useEffect(() => {
    if (!serverId || !accessToken) return;

    const socket = getSocket(accessToken);
    setIsConnected(socket.connected);

    const handleConnect = (): void => {
      setIsConnected(true);
      socket.emit('subscribe:server', serverId);
    };
    const handleDisconnect = (): void => setIsConnected(false);
    const handleMetric = (metric: SystemMetric): void => {
      if (metric.serverId !== serverId) return;
      setHistory((prev) => [...prev.slice(-(MAX_HISTORY_POINTS - 1)), metric]);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('metric', handleMetric);

    if (socket.connected) {
      socket.emit('subscribe:server', serverId);
    }

    return () => {
      socket.emit('unsubscribe:server', serverId);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('metric', handleMetric);
    };
  }, [serverId, accessToken]);

  const latest = history[history.length - 1] ?? null;
  return { latest, history, isConnected };
}
