import type { Setting } from '../../domain/entities/Setting';
import type { ISettingRepository } from '../../domain/repositories/ISettingRepository';
import { prisma } from '../database/prisma';

export class PrismaSettingRepository implements ISettingRepository {
  async findAll(): Promise<Setting[]> {
    return prisma.setting.findMany({ orderBy: { key: 'asc' } });
  }

  async findByKey(key: string): Promise<Setting | null> {
    return prisma.setting.findUnique({ where: { key } });
  }

  async upsert(key: string, value: string, description?: string | null): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      create: { key, value, description: description ?? null },
      update: { value, ...(description !== undefined ? { description } : {}) },
    });
  }
}
