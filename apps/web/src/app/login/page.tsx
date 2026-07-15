'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Cable } from 'lucide-react';
import { LoginForm } from '@/features/auth/LoginForm';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard');
  }, [status, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-primary/15 text-primary">
            <Cable className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">SBM-NAC</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to manage server monitoring and network access.
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
