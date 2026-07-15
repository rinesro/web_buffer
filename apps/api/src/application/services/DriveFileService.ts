import { DriveFileType } from '@sbm-nac/shared-types';
import type { DriveFile } from '../../domain/entities/DriveFile';
import type {
  DriveOwner,
  IDriveFileRepository,
} from '../../domain/repositories/IDriveFileRepository';
import type {
  CreateFileDto,
  CreateFolderDto,
  MoveDriveFileDto,
  RenameDriveFileDto,
} from '../dto/driveFile.dto';
import { ConflictError, NotFoundError, ValidationError } from '../../shared/errors/AppError';

function buildPath(parentPath: string | null, name: string): string {
  return parentPath === null ? `/${name}` : `${parentPath}/${name}`;
}

function ownedBy(node: DriveFile, owner: DriveOwner): boolean {
  return owner.type === 'ADMIN' ? node.adminOwnerId === owner.id : node.userOwnerId === owner.id;
}

export class DriveFileService {
  constructor(private readonly driveFileRepository: IDriveFileRepository) {}

  async listChildren(parentId: string | null, owner: DriveOwner): Promise<DriveFile[]> {
    if (parentId) {
      await this.getOwned(parentId, owner);
    }
    return this.driveFileRepository.findChildren(parentId, owner);
  }

  async createFolder(data: CreateFolderDto, owner: DriveOwner): Promise<DriveFile> {
    const parentId = data.parentId ?? null;
    const parentPath = await this.resolveParentPath(parentId, owner);

    const existing = await this.driveFileRepository.findByParentAndName(parentId, data.name, owner);
    if (existing) {
      throw new ConflictError(`"${data.name}" already exists in this folder`);
    }

    return this.driveFileRepository.create({
      name: data.name,
      path: buildPath(parentPath, data.name),
      type: DriveFileType.FOLDER,
      parentId,
      owner,
    });
  }

  async createFile(data: CreateFileDto, owner: DriveOwner): Promise<DriveFile> {
    const parentId = data.parentId ?? null;
    const parentPath = await this.resolveParentPath(parentId, owner);

    const existing = await this.driveFileRepository.findByParentAndName(parentId, data.name, owner);
    if (existing) {
      throw new ConflictError(`"${data.name}" already exists in this folder`);
    }

    return this.driveFileRepository.create({
      name: data.name,
      path: buildPath(parentPath, data.name),
      type: DriveFileType.FILE,
      mimeType: data.mimeType ?? null,
      sizeBytes: data.sizeBytes,
      parentId,
      owner,
      isPublic: data.isPublic,
    });
  }

  async rename(id: string, data: RenameDriveFileDto, owner: DriveOwner): Promise<DriveFile> {
    const node = await this.getOwned(id, owner);
    const parentPath = node.parentId ? (await this.getOwned(node.parentId, owner)).path : null;

    const sibling = await this.driveFileRepository.findByParentAndName(
      node.parentId,
      data.name,
      owner,
    );
    if (sibling && sibling.id !== id) {
      throw new ConflictError(`"${data.name}" already exists in this folder`);
    }

    const newPath = buildPath(parentPath, data.name);
    const renamed = await this.driveFileRepository.rename(id, data.name, newPath);

    if (node.type === DriveFileType.FOLDER) {
      await this.cascadePathUpdate(id, newPath, owner);
    }

    return renamed;
  }

  async move(id: string, data: MoveDriveFileDto, owner: DriveOwner): Promise<DriveFile> {
    const node = await this.getOwned(id, owner);

    if (data.parentId === id) {
      throw new ValidationError('A folder cannot be moved into itself');
    }

    if (data.parentId) {
      const target = await this.getOwned(data.parentId, owner);
      if (target.type !== DriveFileType.FOLDER) {
        throw new ValidationError('Destination must be a folder');
      }
      if (
        node.type === DriveFileType.FOLDER &&
        (await this.isDescendant(id, data.parentId, owner))
      ) {
        throw new ValidationError('A folder cannot be moved into one of its own subfolders');
      }
    }

    const sibling = await this.driveFileRepository.findByParentAndName(
      data.parentId,
      node.name,
      owner,
    );
    if (sibling && sibling.id !== id) {
      throw new ConflictError(`"${node.name}" already exists in the destination folder`);
    }

    const parentPath = data.parentId ? (await this.getOwned(data.parentId, owner)).path : null;
    const newPath = buildPath(parentPath, node.name);
    const moved = await this.driveFileRepository.move(id, data.parentId, newPath);

    if (node.type === DriveFileType.FOLDER) {
      await this.cascadePathUpdate(id, newPath, owner);
    }

    return moved;
  }

  async delete(id: string, owner: DriveOwner): Promise<void> {
    await this.getOwned(id, owner);
    await this.driveFileRepository.delete(id);
  }

  private async getOwned(id: string, owner: DriveOwner): Promise<DriveFile> {
    const node = await this.driveFileRepository.findById(id);
    if (!node || !ownedBy(node, owner)) {
      throw new NotFoundError('File or folder');
    }
    return node;
  }

  private async resolveParentPath(
    parentId: string | null,
    owner: DriveOwner,
  ): Promise<string | null> {
    if (!parentId) return null;
    const parent = await this.getOwned(parentId, owner);
    if (parent.type !== DriveFileType.FOLDER) {
      throw new ValidationError('Destination must be a folder');
    }
    return parent.path;
  }

  private async cascadePathUpdate(
    folderId: string,
    folderPath: string,
    owner: DriveOwner,
  ): Promise<void> {
    const children = await this.driveFileRepository.findChildren(folderId, owner);
    for (const child of children) {
      const childPath = buildPath(folderPath, child.name);
      await this.driveFileRepository.updatePath(child.id, childPath);
      if (child.type === DriveFileType.FOLDER) {
        await this.cascadePathUpdate(child.id, childPath, owner);
      }
    }
  }

  private async isDescendant(
    ancestorId: string,
    candidateId: string,
    owner: DriveOwner,
  ): Promise<boolean> {
    let current = await this.driveFileRepository.findById(candidateId);
    while (current?.parentId) {
      if (current.parentId === ancestorId) return true;
      if (!ownedBy(current, owner)) return false;
      current = await this.driveFileRepository.findById(current.parentId);
    }
    return false;
  }
}
