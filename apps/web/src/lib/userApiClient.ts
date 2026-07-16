import { useUserAuthStore } from '@/store/userAuthStore';
import type { ApiEnvelope } from '@/types/api';
import { ApiError, API_URL } from './api-client';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  skipAuthRetry?: boolean;
}

let userRefreshPromise: Promise<boolean> | null = null;

async function refreshUserSession(): Promise<boolean> {
  if (!userRefreshPromise) {
    userRefreshPromise = (async () => {
      try {
        const res = await fetch(`${API_URL}/user-auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) return false;
        const body = (await res.json()) as ApiEnvelope<{ accessToken: string }>;
        if (!body.success) return false;
        useUserAuthStore.getState().setAccessToken(body.data.accessToken);
        return true;
      } catch {
        return false;
      } finally {
        userRefreshPromise = null;
      }
    })();
  }
  return userRefreshPromise;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRetry, headers, ...rest } = options;
  const accessToken = useUserAuthStore.getState().accessToken;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    method: options.method ?? (body !== undefined ? 'POST' : 'GET'),
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !skipAuthRetry) {
    const refreshed = await refreshUserSession();
    if (refreshed) {
      return request<T>(path, { ...options, skipAuthRetry: true });
    }
    useUserAuthStore.getState().clearSession();
    throw new ApiError(401, 'UNAUTHORIZED', 'Session expired. Please sign in again.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const envelope = (await res.json()) as ApiEnvelope<T>;
  if (!envelope.success) {
    throw new ApiError(
      res.status,
      envelope.error.code,
      envelope.error.message,
      envelope.error.details,
    );
  }
  return envelope.data;
}

export const userApiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export { refreshUserSession };
