import type { User as PrismaUser } from '@prisma/client';
import type { User } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    isBlocked: row.isBlocked,
    lastLoginAt: row.lastLoginAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  async create(data: Pick<User, 'name' | 'email' | 'passwordHash'>): Promise<User> {
    const row = await prisma.user.create({ data });
    return toDomain(row);
  }

  async updateLastLogin(id: string, lastLoginAt: Date): Promise<void> {
    await prisma.user.update({ where: { id }, data: { lastLoginAt } });
  }

  async setBlocked(id: string, isBlocked: boolean): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isBlocked } });
  }

  async count(): Promise<number> {
    return prisma.user.count();
  }
}
