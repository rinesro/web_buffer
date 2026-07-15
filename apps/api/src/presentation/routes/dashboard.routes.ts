import { Router } from 'express';
import type { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';

export function createDashboardRoutes(controller: DashboardController): Router {
  const router = Router();
  router.use(authenticate);
  router.use(requireAdmin);
  router.get('/summary', controller.summary);
  return router;
}
