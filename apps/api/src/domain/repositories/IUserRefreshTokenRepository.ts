import type { UserRefreshToken } from '../entities/UserRefreshToken';

export interface CreateUserRefreshTokenInput {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface IUserRefreshTokenRepository {
  create(data: CreateUserRefreshTokenInput): Promise<UserRefreshToken>;
  findByTokenHash(tokenHash: string): Promise<UserRefreshToken | null>;
  revoke(id: string, replacedByTokenId: string | null): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
