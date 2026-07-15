'use client';

import { useEffect, type ReactNode } from 'react';
import { apiClient, ApiError, refreshSession } from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';
import type { Admin } from '@/types/api';

export function Providers({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status !== 'idle') return;
    setStatus('loading');

    (async () => {
      const refreshed = await refreshSession();
      if (!refreshed) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const { admin } = await apiClient.get<{ admin: Admin }>('/auth/me');
        setSession(admin, useAuthStore.getState().accessToken ?? '');
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        setStatus('unauthenticated');
      }
    })().catch(() => setStatus('unauthenticated'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
