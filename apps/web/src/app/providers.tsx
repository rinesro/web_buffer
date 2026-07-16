'use client';

import { useEffect, type ReactNode } from 'react';
import { apiClient, ApiError, refreshSession } from '@/lib/api-client';
import { userApiClient, refreshUserSession } from '@/lib/userApiClient';
import { useAuthStore } from '@/store/authStore';
import { useUserAuthStore, type PortalUser } from '@/store/userAuthStore';
import type { Admin } from '@/types/api';

/**
 * Bootstraps BOTH the admin session and the user session in parallel on every app load,
 * regardless of which page is being visited. This is what makes a single unified login
 * page possible — after logging in, only ONE of the two cookies will actually be set, so
 * this resolves both stores to 'authenticated'/'unauthenticated' up front, and pages like
 * the root redirect or the portal guard just read whichever one won instead of each
 * re-triggering their own refresh attempt.
 */
export function Providers({ children }: { children: ReactNode }) {
  const setSession = useAuthStore((state) => state.setSession);
  const setStatus = useAuthStore((state) => state.setStatus);
  const status = useAuthStore((state) => state.status);

  const setUserSession = useUserAuthStore((state) => state.setSession);
  const setUserStatus = useUserAuthStore((state) => state.setStatus);
  const userStatus = useUserAuthStore((state) => state.status);

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

  useEffect(() => {
    if (userStatus !== 'idle') return;
    setUserStatus('loading');

    (async () => {
      const refreshed = await refreshUserSession();
      if (!refreshed) {
        setUserStatus('unauthenticated');
        return;
      }
      try {
        const { user } = await userApiClient.get<{ user: PortalUser }>('/user-auth/me');
        setUserSession(user, useUserAuthStore.getState().accessToken ?? '');
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        setUserStatus('unauthenticated');
      }
    })().catch(() => setUserStatus('unauthenticated'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
