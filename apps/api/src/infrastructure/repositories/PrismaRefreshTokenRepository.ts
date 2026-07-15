import type { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import type { RefreshToken } from '../../domain/entities/RefreshToken';
import type {
  CreateRefreshTokenInput,
  IRefreshTokenRepository,
} from '../../domain/repositories/IRefreshTokenRepository';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaRefreshToken): RefreshToken {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    adminId: row.adminId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    replacedByTokenId: row.replacedByTokenId,
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: CreateRefreshTokenInput): Promise<RefreshToken> {
    const row = await prisma.refreshToken.create({ data });
    return toDomain(row);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    return row ? toDomain(row) : null;
  }

  async revoke(id: string, replacedByTokenId: string | null): Promise<void> {
    await prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
  }

  async revokeAllForAdmin(adminId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { adminId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
