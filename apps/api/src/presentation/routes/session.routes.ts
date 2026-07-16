import { Router } from 'express';
import type { SessionController } from '../controllers/SessionController';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validateLogin } from '../validators/auth.validator';

export function createSessionRoutes(controller: SessionController): Router {
  const router = Router();
  router.post('/login', authRateLimiter, validateLogin, controller.login);
  return router;
}
