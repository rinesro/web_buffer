import { Router } from 'express';
import type { ServerController } from '../controllers/ServerController';
import type { SystemMetricController } from '../controllers/SystemMetricController';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateIdParam } from '../validators/common.validator';
import {
  validateCreateServer,
  validateServerQuery,
  validateUpdateServer,
} from '../validators/server.validator';

export function createServerRoutes(
  serverController: ServerController,
  metricController: SystemMetricController,
): Router {
  const router = Router();
  router.use(authenticate);
  router.use(requireAdmin);

  router.get('/', validateServerQuery, serverController.list);
  router.post('/', validateCreateServer, serverController.create);
  router.get('/:id', validateIdParam, serverController.getById);
  router.patch('/:id', validateIdParam, validateUpdateServer, serverController.update);
  router.delete('/:id', validateIdParam, serverController.delete);
  router.get('/:id/metrics/latest', validateIdParam, metricController.latest);
  router.get('/:id/metrics/history', validateIdParam, metricController.history);

  return router;
}
