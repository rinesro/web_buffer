import { Router } from 'express';
import type { ConnectionLogController } from '../controllers/ConnectionLogController';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateConnectionLogQuery } from '../validators/connectionLog.validator';

export function createConnectionLogRoutes(controller: ConnectionLogController): Router {
  const router = Router();
  router.use(authenticate);
  router.use(requireAdmin);
  router.get('/', validateConnectionLogQuery, controller.list);
  return router;
}
