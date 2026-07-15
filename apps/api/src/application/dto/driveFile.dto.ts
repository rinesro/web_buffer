import { z } from 'zod';

const fileNameSchema = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[^/\\:*?"<>|]+$/, 'Name cannot contain / \\ : * ? " < > |');

export const createFolderSchema = z.object({
  name: fileNameSchema,
  parentId: z.string().cuid().nullable().optional(),
});
export type CreateFolderDto = z.infer<typeof createFolderSchema>;

export const createFileSchema = z.object({
  name: fileNameSchema,
  parentId: z.string().cuid().nullable().optional(),
  mimeType: z.string().max(255).optional(),
  sizeBytes: z.number().int().min(0).max(1_073_741_824).default(0),
  isPublic: z.boolean().default(false),
});
export type CreateFileDto = z.infer<typeof createFileSchema>;

export const renameDriveFileSchema = z.object({
  name: fileNameSchema,
});
export type RenameDriveFileDto = z.infer<typeof renameDriveFileSchema>;

export const moveDriveFileSchema = z.object({
  parentId: z.string().cuid().nullable(),
});
export type MoveDriveFileDto = z.infer<typeof moveDriveFileSchema>;

export const driveFileQuerySchema = z.object({
  parentId: z.string().cuid().optional(),
});
export type DriveFileQueryDto = z.infer<typeof driveFileQuerySchema>;
