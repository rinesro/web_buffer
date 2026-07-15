import type { BlockedFingerprint as PrismaBlockedFingerprint } from '@prisma/client';
import type { BlockedFingerprint } from '../../domain/entities/BlockedFingerprint';
import type {
  CreateBlockedFingerprintInput,
  IBlockedFingerprintRepository,
} from '../../domain/repositories/IBlockedFingerprintRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaBlockedFingerprint): BlockedFingerprint {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    userId: row.userId,
    reason: row.reason,
    blockedAt: row.blockedAt,
  };
}

export class PrismaBlockedFingerprintRepository implements IBlockedFingerprintRepository {
  async findByFingerprint(fingerprint: string): Promise<BlockedFingerprint | null> {
    const row = await prisma.blockedFingerprint.findUnique({ where: { fingerprint } });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<BlockedFingerprint | null> {
    const row = await prisma.blockedFingerprint.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findAll(pagination: PaginationParams): Promise<PaginatedResult<BlockedFingerprint>> {
    const { page, pageSize } = pagination;
    const [rows, total] = await Promise.all([
      prisma.blockedFingerprint.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { blockedAt: 'desc' },
      }),
      prisma.blockedFingerprint.count(),
    ]);
    return {
      items: rows.map(toDomain),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async create(data: CreateBlockedFingerprintInput): Promise<BlockedFingerprint> {
    const row = await prisma.blockedFingerprint.create({
      data: {
        fingerprint: data.fingerprint,
        userId: data.userId,
        reason: data.reason ?? null,
      },
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.blockedFingerprint.delete({ where: { id } });
  }
}
