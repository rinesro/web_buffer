import type { AdminRole } from '@sbm-nac/shared-types';

export interface Admin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AdminWithoutPassword = Omit<Admin, 'passwordHash'>;
