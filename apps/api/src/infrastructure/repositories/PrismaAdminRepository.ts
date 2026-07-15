import type { Admin as PrismaAdmin } from '@prisma/client';
import type { AdminRole } from '@sbm-nac/shared-types';
import type { Admin } from '../../domain/entities/Admin';
import type { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaAdmin): Admin {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as AdminRole,
    isActive: row.isActive,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaAdminRepository implements IAdminRepository {
  async findById(id: string): Promise<Admin | null> {
    const row = await prisma.admin.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const row = await prisma.admin.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async create(data: Pick<Admin, 'name' | 'email' | 'passwordHash' | 'role'>): Promise<Admin> {
    const row = await prisma.admin.create({ data });
    return toDomain(row);
  }

  async updateLastLogin(id: string, lastLoginAt: Date): Promise<void> {
    await prisma.admin.update({ where: { id }, data: { lastLoginAt } });
  }

  async count(): Promise<number> {
    return prisma.admin.count();
  }
}
