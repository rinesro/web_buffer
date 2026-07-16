import { create } from 'zustand';

export type UserAuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserAuthState {
  status: UserAuthStatus;
  user: PortalUser | null;
  accessToken: string | null;
  setSession: (user: PortalUser, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setStatus: (status: UserAuthStatus) => void;
}

export const useUserAuthStore = create<UserAuthState>((set) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  setSession: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken, status: 'authenticated' }),
  clearSession: () => set({ user: null, accessToken: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
}));
