'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Menu } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { disconnectSocket } from '@/lib/socket-client';
import { useAuthStore } from '@/store/authStore';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';
import { ThemeToggle } from './ThemeToggle';

export function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const router = useRouter();
  const admin = useAuthStore((state) => state.admin);
  const clearSession = useAuthStore((state) => state.clearSession);
  const { unreadCount } = useNotificationsFeed();

  const handleLogout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      disconnectSocket();
      clearSession();
      router.replace('/login');
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-muted-foreground hover:bg-muted md:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>
      <div className="hidden md:block" />
      <div className="flex items-center gap-2">
        <Link
          href="/notifications"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 ? (
            <span className="font-data absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </Link>
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <div className="text-right leading-tight">
          <p className="text-sm font-medium text-foreground">{admin?.name ?? 'Admin'}</p>
          <p className="text-xs text-muted-foreground">{admin?.email ?? ''}</p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          aria-label="Sign out"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border text-muted-foreground hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
