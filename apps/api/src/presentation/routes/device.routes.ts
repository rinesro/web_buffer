import { Router } from 'express';
import type { DeviceController } from '../controllers/DeviceController';
import { authenticate } from '../middlewares/authenticate';
import { validateIdParam } from '../validators/common.validator';
import {
  validateDeviceQuery,
  validateRegisterDevice,
  validateUpdateDevice,
  validateUpdateDeviceStatus,
} from '../validators/device.validator';

export function createDeviceRoutes(controller: DeviceController): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/', validateDeviceQuery, controller.list);
  router.get('/status-counts', controller.statusCounts);
  router.post('/', validateRegisterDevice, controller.register);
  router.get('/:id', validateIdParam, controller.getById);
  router.patch('/:id', validateIdParam, validateUpdateDevice, controller.update);
  router.patch(
    '/:id/status',
    validateIdParam,
    validateUpdateDeviceStatus,
    controller.updateStatus,
  );
  router.delete('/:id', validateIdParam, controller.delete);

  return router;
}
