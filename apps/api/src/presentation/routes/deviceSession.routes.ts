import { Router } from 'express';
import type { DeviceSessionController } from '../controllers/DeviceSessionController';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateIdParam } from '../validators/common.validator';
import { validatePagination } from '../validators/pagination.validator';

export function createDeviceSessionRoutes(controller: DeviceSessionController): Router {
  const router = Router();
  router.use(authenticate);

  // Any authenticated account may disconnect their own current session, or check its status.
  router.post('/disconnect', controller.disconnect);
  router.get('/mine', controller.mine);

  router.use(requireAdmin);

  router.get('/blocked', validatePagination, controller.listBlocked);
  router.delete('/blocked/:id', validateIdParam, controller.unblock);

  router.get('/', validatePagination, controller.list);
  router.get('/:id', validateIdParam, controller.detail);
  router.patch('/:id/allow', validateIdParam, controller.allow);
  router.post('/:id/block', validateIdParam, controller.block);

  return router;
}
