import {
  createFileSchema,
  createFolderSchema,
  driveFileQuerySchema,
  moveDriveFileSchema,
  renameDriveFileSchema,
} from '../../application/dto/driveFile.dto';
import { validate } from './validate';

export const validateCreateFolder = validate(createFolderSchema, 'body');
export const validateCreateFile = validate(createFileSchema, 'body');
export const validateRenameDriveFile = validate(renameDriveFileSchema, 'body');
export const validateMoveDriveFile = validate(moveDriveFileSchema, 'body');
export const validateDriveFileQuery = validate(driveFileQuerySchema, 'query');
