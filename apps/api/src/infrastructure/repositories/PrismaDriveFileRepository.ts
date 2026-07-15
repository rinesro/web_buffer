import type { DriveFile as PrismaDriveFile } from '@prisma/client';
import type { DriveFileType } from '@sbm-nac/shared-types';
import type { DriveFile } from '../../domain/entities/DriveFile';
import type {
  CreateDriveFileInput,
  DriveOwner,
  IDriveFileRepository,
} from '../../domain/repositories/IDriveFileRepository';
import { prisma } from '../database/prisma';

function toDomain(row: PrismaDriveFile): DriveFile {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    type: row.type as DriveFileType,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    parentId: row.parentId,
    adminOwnerId: row.adminOwnerId,
    userOwnerId: row.userOwnerId,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Translates the domain-level DriveOwner into the pair of nullable FK columns Postgres
 *  actually has, ensuring exactly one is ever set. */
function ownerWhere(owner: DriveOwner): { adminOwnerId?: string; userOwnerId?: string } {
  return owner.type === 'ADMIN' ? { adminOwnerId: owner.id } : { userOwnerId: owner.id };
}

export class PrismaDriveFileRepository implements IDriveFileRepository {
  async findChildren(parentId: string | null, owner: DriveOwner): Promise<DriveFile[]> {
    const rows = await prisma.driveFile.findMany({
      where: { parentId, ...ownerWhere(owner) },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toDomain);
  }

  async findById(id: string): Promise<DriveFile | null> {
    const row = await prisma.driveFile.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByParentAndName(
    parentId: string | null,
    name: string,
    owner: DriveOwner,
  ): Promise<DriveFile | null> {
    const row = await prisma.driveFile.findFirst({
      where: { parentId, name, ...ownerWhere(owner) },
    });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateDriveFileInput): Promise<DriveFile> {
    const row = await prisma.driveFile.create({
      data: {
        name: data.name,
        path: data.path,
        type: data.type,
        mimeType: data.mimeType ?? null,
        sizeBytes: data.sizeBytes ?? 0,
        parentId: data.parentId ?? null,
        isPublic: data.isPublic ?? false,
        adminOwnerId: data.owner.type === 'ADMIN' ? data.owner.id : null,
        userOwnerId: data.owner.type === 'USER' ? data.owner.id : null,
      },
    });
    return toDomain(row);
  }

  async rename(id: string, name: string, path: string): Promise<DriveFile> {
    const row = await prisma.driveFile.update({ where: { id }, data: { name, path } });
    return toDomain(row);
  }

  async move(id: string, parentId: string | null, path: string): Promise<DriveFile> {
    const row = await prisma.driveFile.update({ where: { id }, data: { parentId, path } });
    return toDomain(row);
  }

  async updatePath(id: string, path: string): Promise<void> {
    await prisma.driveFile.update({ where: { id }, data: { path } });
  }

  async delete(id: string): Promise<void> {
    await prisma.driveFile.delete({ where: { id } });
  }
}
