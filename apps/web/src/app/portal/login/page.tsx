'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api-client';
import { userApiClient } from '@/lib/userApiClient';
import { useUserAuthStore } from '@/store/userAuthStore';
import type { PortalUser } from '@/store/userAuthStore';

interface LoginResponse {
  user: PortalUser;
  accessToken: string;
}

export default function PortalLoginPage() {
  const router = useRouter();
  const setSession = useUserAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await userApiClient.post<LoginResponse>('/user-auth/login', {
        email,
        password,
      });
      setSession(result.user, result.accessToken);
      router.replace('/portal');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-primary/15 text-primary">
            <LogIn className="h-5 w-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your Web Drive and device status.
          </p>
        </div>
        <div className="rounded-[var(--radius)] border border-border bg-card p-6">
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Password" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </FormField>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            No account yet?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
