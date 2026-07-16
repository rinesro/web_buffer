'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Input';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuthStore } from '@/store/authStore';
import { useUserAuthStore, type PortalUser } from '@/store/userAuthStore';
import type { Admin } from '@/types/api';

type LoginResponse =
  | { accountType: 'ADMIN'; admin: Admin; accessToken: string }
  | { accountType: 'USER'; user: PortalUser; accessToken: string };

/**
 * One form for everyone — /api/v1/session/login figures out whether the email belongs to
 * an Admin or a User and issues the right kind of session; this component just reacts to
 * whichever accountType comes back and sends each to their own area.
 */
export function LoginForm() {
  const router = useRouter();
  const setAdminSession = useAuthStore((state) => state.setSession);
  const setUserSession = useUserAuthStore((state) => state.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiClient.post<LoginResponse>('/session/login', { email, password });
      if (result.accountType === 'ADMIN') {
        setAdminSession(result.admin, result.accessToken);
        router.replace('/dashboard');
      } else {
        setUserSession(result.user, result.accessToken);
        router.replace('/portal');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <FormField label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
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
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </FormField>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" className="w-full" isLoading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
