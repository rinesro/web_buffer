'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, User as UserIcon } from 'lucide-react';
import { Spinner } from '@/components/ui/Feedback';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ApiError } from '@/lib/api-client';
import { userApiClient, refreshUserSession } from '@/lib/userApiClient';
import { useUserAuthStore, type PortalUser } from '@/store/userAuthStore';

const LOGIN_PATH = '/portal/login';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useUserAuthStore((state) => state.status);
  const user = useUserAuthStore((state) => state.user);
  const setStatus = useUserAuthStore((state) => state.setStatus);
  const setSession = useUserAuthStore((state) => state.setSession);
  const clearSession = useUserAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (status !== 'idle') return;
    setStatus('loading');

    (async () => {
      const refreshed = await refreshUserSession();
      if (!refreshed) {
        setStatus('unauthenticated');
        return;
      }
      try {
        const { user: profile } = await userApiClient.get<{ user: PortalUser }>('/user-auth/me');
        setSession(profile, useUserAuthStore.getState().accessToken ?? '');
      } catch (error) {
        if (!(error instanceof ApiError)) throw error;
        setStatus('unauthenticated');
      }
    })().catch(() => setStatus('unauthenticated'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated' && pathname !== LOGIN_PATH) {
      router.replace(LOGIN_PATH);
    }
  }, [status, pathname, router]);

  if (pathname === LOGIN_PATH) {
    return <>{children}</>;
  }

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner label="Checking session" />
      </div>
    );
  }

  if (status !== 'authenticated') {
    return null;
  }

  const handleLogout = async (): Promise<void> => {
    try {
      await userApiClient.post('/user-auth/logout');
    } finally {
      clearSession();
      router.replace(LOGIN_PATH);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
        <span className="text-sm font-semibold tracking-tight">SBM-NAC Portal</span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <UserIcon className="h-4 w-4" aria-hidden="true" />
            {user?.name}
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            aria-label="Sign out"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-muted-foreground hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl p-4 md:p-6">{children}</main>
    </div>
  );
}
