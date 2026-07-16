import type { UserRefreshToken as PrismaUserRefreshToken } from '@prisma/client';
import type { UserRefreshToken } from '../../domain/entities/UserRefreshToken';
import type {
  CreateUserRefreshTokenInput,
  IUserRefreshTokenRepository,
} from '../../domain/repositories/IUserRefreshTokenRepository';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaUserRefreshToken): UserRefreshToken {
  return {
    id: row.id,
    tokenHash: row.tokenHash,
    userId: row.userId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    replacedByTokenId: row.replacedByTokenId,
    userAgent: row.userAgent,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt,
  };
}

export class PrismaUserRefreshTokenRepository implements IUserRefreshTokenRepository {
  async create(data: CreateUserRefreshTokenInput): Promise<UserRefreshToken> {
    const row = await prisma.userRefreshToken.create({ data });
    return toDomain(row);
  }

  async findByTokenHash(tokenHash: string): Promise<UserRefreshToken | null> {
    const row = await prisma.userRefreshToken.findUnique({ where: { tokenHash } });
    return row ? toDomain(row) : null;
  }

  async revoke(id: string, replacedByTokenId: string | null): Promise<void> {
    await prisma.userRefreshToken.update({
      where: { id },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await prisma.userRefreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await prisma.userRefreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
