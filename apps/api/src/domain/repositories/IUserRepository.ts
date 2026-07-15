import type { User } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Pick<User, 'name' | 'email' | 'passwordHash'>): Promise<User>;
  updateLastLogin(id: string, lastLoginAt: Date): Promise<void>;
  setBlocked(id: string, isBlocked: boolean): Promise<void>;
  count(): Promise<number>;
}
