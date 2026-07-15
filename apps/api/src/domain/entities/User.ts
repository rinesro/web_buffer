export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isBlocked: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<User, 'passwordHash'>;
