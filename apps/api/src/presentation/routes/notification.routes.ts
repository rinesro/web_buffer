import { Router } from 'express';
import type { NotificationController } from '../controllers/NotificationController';
import { authenticate } from '../middlewares/authenticate';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validateIdParam } from '../validators/common.validator';
import { validateNotificationQuery } from '../validators/notification.validator';

export function createNotificationRoutes(controller: NotificationController): Router {
  const router = Router();
  router.use(authenticate);
  router.use(requireAdmin);

  router.get('/', validateNotificationQuery, controller.list);
  router.get('/unread-count', controller.unreadCount);
  router.patch('/read-all', controller.markAllAsRead);
  router.patch('/:id/read', validateIdParam, controller.markAsRead);
  router.delete('/:id', validateIdParam, controller.delete);

  return router;
}
