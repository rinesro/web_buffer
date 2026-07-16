import type { RefreshToken } from '../entities/RefreshToken';

export interface CreateRefreshTokenInput {
  tokenHash: string;
  adminId: string;
  expiresAt: Date;
  userAgent: string | null;
  ipAddress: string | null;
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenInput): Promise<RefreshToken>;
  findByTokenHash(tokenHash: string): Promise<RefreshToken | null>;
  revoke(id: string, replacedByTokenId: string | null): Promise<void>;
  revokeAllForAdmin(adminId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
