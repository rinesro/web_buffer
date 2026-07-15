import type { DriveFile } from '../entities/DriveFile';

export interface CreateDriveFileInput {
  name: string;
  path: string;
  type: DriveFile['type'];
  mimeType?: string | null;
  sizeBytes?: number;
  parentId?: string | null;
  ownerId: string;
  isPublic?: boolean;
}

export interface IDriveFileRepository {
  findChildren(parentId: string | null, ownerId: string): Promise<DriveFile[]>;
  findById(id: string): Promise<DriveFile | null>;
  findByParentAndName(parentId: string | null, name: string): Promise<DriveFile | null>;
  create(data: CreateDriveFileInput): Promise<DriveFile>;
  rename(id: string, name: string, path: string): Promise<DriveFile>;
  move(id: string, parentId: string | null, path: string): Promise<DriveFile>;
  /** Updates only the denormalized path column, used when cascading a folder rename/move to its descendants. */
  updatePath(id: string, path: string): Promise<void>;
  delete(id: string): Promise<void>;
}
