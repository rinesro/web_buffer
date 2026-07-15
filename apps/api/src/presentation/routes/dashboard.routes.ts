import { Router } from 'express';
import type { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middlewares/authenticate';

export function createDashboardRoutes(controller: DashboardController): Router {
  const router = Router();
  router.use(authenticate);
  router.get('/summary', controller.summary);
  return router;
}
