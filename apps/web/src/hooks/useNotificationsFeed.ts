'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { getSocket } from '@/lib/socket-client';
import { useAuthStore } from '@/store/authStore';
import type { Notification } from '@/types/api';

export function useNotificationsFeed() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latest, setLatest] = useState<Notification | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    apiClient
      .get<{ count: number }>('/notifications/unread-count')
      .then((result) => setUnreadCount(result.count))
      .catch(() => undefined);
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    const socket = getSocket(accessToken);

    const handleNotification = (notification: Notification): void => {
      setLatest(notification);
      setUnreadCount((count) => count + 1);
    };

    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [accessToken]);

  const markAllSeen = (): void => setUnreadCount(0);

  return { unreadCount, latest, markAllSeen };
}
