import { Router } from 'express';
import type { DriveFileController } from '../controllers/DriveFileController';
import { authenticate } from '../middlewares/authenticate';
import { validateIdParam } from '../validators/common.validator';
import {
  validateCreateFile,
  validateCreateFolder,
  validateDriveFileQuery,
  validateMoveDriveFile,
  validateRenameDriveFile,
} from '../validators/driveFile.validator';

export function createDriveFileRoutes(controller: DriveFileController): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/', validateDriveFileQuery, controller.listChildren);
  router.post('/folders', validateCreateFolder, controller.createFolder);
  router.post('/files', validateCreateFile, controller.createFile);
  router.patch('/:id/rename', validateIdParam, validateRenameDriveFile, controller.rename);
  router.patch('/:id/move', validateIdParam, validateMoveDriveFile, controller.move);
  router.delete('/:id', validateIdParam, controller.delete);

  return router;
}
