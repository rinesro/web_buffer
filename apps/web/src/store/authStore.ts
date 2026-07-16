import { create } from 'zustand';
import type { Admin } from '@/types/api';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  admin: Admin | null;
  accessToken: string | null;
  setSession: (admin: Admin, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
}

/**
 * The access token lives only in memory (this store), never in localStorage/sessionStorage —
 * that avoids exposing it to any XSS-injected script that can read browser storage. The
 * refresh token is a separate, httpOnly, backend-set cookie that this store never touches;
 * client code cannot read it even if it wanted to.
 */
export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  admin: null,
  accessToken: null,
  setSession: (admin, accessToken) => set({ admin, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken, status: 'authenticated' }),
  clearSession: () => set({ admin: null, accessToken: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));
