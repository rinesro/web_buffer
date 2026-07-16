'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Feedback';
import { useAuthStore } from '@/store/authStore';
import { useUserAuthStore } from '@/store/userAuthStore';

export default function RootPage() {
  const router = useRouter();
  const adminStatus = useAuthStore((state) => state.status);
  const userStatus = useUserAuthStore((state) => state.status);

  useEffect(() => {
    if (adminStatus === 'authenticated') {
      router.replace('/dashboard');
      return;
    }
    if (userStatus === 'authenticated') {
      router.replace('/portal');
      return;
    }
    // Only send to /login once BOTH stores have resolved — otherwise an authenticated user
    // could briefly get bounced to /login before their (slightly slower) refresh resolves.
    if (adminStatus === 'unauthenticated' && userStatus === 'unauthenticated') {
      router.replace('/login');
    }
  }, [adminStatus, userStatus, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Spinner label="Checking session" />
    </div>
  );
}
