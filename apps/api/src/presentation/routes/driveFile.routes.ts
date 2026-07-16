import { Router } from 'express';
import type { DeviceSessionService } from '../../application/services/DeviceSessionService';
import type { DriveFileController } from '../controllers/DriveFileController';
import { authenticate } from '../middlewares/authenticate';
import { createRequireActiveUserSession } from '../middlewares/requireActiveUserSession';
import { validateIdParam } from '../validators/common.validator';
import {
  validateCreateFile,
  validateCreateFolder,
  validateDriveFileQuery,
  validateMoveDriveFile,
  validateRenameDriveFile,
} from '../validators/driveFile.validator';

export function createDriveFileRoutes(
  controller: DriveFileController,
  deviceSessionService: DeviceSessionService,
): Router {
  const router = Router();
  router.use(authenticate);
  // Admin requests pass straight through; User requests must have an ALLOWED device session,
  // and every request here refreshes that session's activity timestamp.
  router.use(createRequireActiveUserSession(deviceSessionService));

  router.get('/', validateDriveFileQuery, controller.listChildren);
  router.post('/folders', validateCreateFolder, controller.createFolder);
  router.post('/files', validateCreateFile, controller.createFile);
  router.patch('/:id/rename', validateIdParam, validateRenameDriveFile, controller.rename);
  router.patch('/:id/move', validateIdParam, validateMoveDriveFile, controller.move);
  router.delete('/:id', validateIdParam, controller.delete);

  return router;
}
