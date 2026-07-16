'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cable } from 'lucide-react';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAuthStore } from '@/store/authStore';
import { useUserAuthStore } from '@/store/userAuthStore';

export default function LoginPage() {
  const router = useRouter();
  const adminStatus = useAuthStore((state) => state.status);
  const userStatus = useUserAuthStore((state) => state.status);

  useEffect(() => {
    if (adminStatus === 'authenticated') {
      router.replace('/dashboard');
    } else if (userStatus === 'authenticated') {
      router.replace('/portal');
    }
  }, [adminStatus, userStatus, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-primary/15 text-primary">
            <Cable className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">SBM-NAC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage the system, or access your Web Drive.
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          No account yet?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
