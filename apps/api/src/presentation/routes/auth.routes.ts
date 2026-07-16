import { Router } from 'express';
import type { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middlewares/authenticate';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validateLogin } from '../validators/auth.validator';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/login', authRateLimiter, validateLogin, controller.login);
  router.post('/refresh', authRateLimiter, controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
}
