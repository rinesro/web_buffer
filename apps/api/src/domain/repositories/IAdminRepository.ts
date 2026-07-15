import type { Admin } from '../entities/Admin';

export interface IAdminRepository {
  findById(id: string): Promise<Admin | null>;
  findByEmail(email: string): Promise<Admin | null>;
  create(data: Pick<Admin, 'name' | 'email' | 'passwordHash' | 'role'>): Promise<Admin>;
  updateLastLogin(id: string, lastLoginAt: Date): Promise<void>;
  count(): Promise<number>;
}
