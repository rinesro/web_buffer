'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/ui/DashboardShell';
import { Spinner } from '@/components/ui/Feedback';
import { useAuthStore } from '@/store/authStore';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

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

  return <DashboardShell>{children}</DashboardShell>;
}
