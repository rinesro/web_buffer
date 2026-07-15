import { Router } from 'express';
import type { SettingController } from '../controllers/SettingController';
import { authenticate } from '../middlewares/authenticate';
import { validateKeyParam } from '../validators/common.validator';
import { validateUpsertSetting } from '../validators/setting.validator';

export function createSettingRoutes(controller: SettingController): Router {
  const router = Router();
  router.use(authenticate);

  router.get('/', controller.list);
  router.get('/:key', validateKeyParam, controller.getByKey);
  router.put('/:key', validateKeyParam, validateUpsertSetting, controller.upsert);

  return router;
}
