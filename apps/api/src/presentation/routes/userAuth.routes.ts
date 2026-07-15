import { Router } from 'express';
import type { UserAuthController } from '../controllers/UserAuthController';
import { authenticate } from '../middlewares/authenticate';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validateRegisterUser, validateUserLogin } from '../validators/userAuth.validator';

export function createUserAuthRoutes(controller: UserAuthController): Router {
  const router = Router();

  router.post('/register', authRateLimiter, validateRegisterUser, controller.register);
  router.post('/login', authRateLimiter, validateUserLogin, controller.login);
  router.post('/refresh', authRateLimiter, controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);

  return router;
}
