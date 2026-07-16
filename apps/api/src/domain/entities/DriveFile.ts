import type { DriveFileType } from '@sbm-nac/shared-types';

export interface DriveFile {
  id: string;
  name: string;
  path: string;
  type: DriveFileType;
  mimeType: string | null;
  sizeBytes: number;
  parentId: string | null;
  adminOwnerId: string | null;
  userOwnerId: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}
