import { Router } from 'express';
import type { AuthController } from '../controllers/AuthController';
import type { ConnectionLogController } from '../controllers/ConnectionLogController';
import type { DashboardController } from '../controllers/DashboardController';
import type { DeviceController } from '../controllers/DeviceController';
import type { DriveFileController } from '../controllers/DriveFileController';
import type { NacController } from '../controllers/NacController';
import type { NotificationController } from '../controllers/NotificationController';
import type { ServerController } from '../controllers/ServerController';
import type { SettingController } from '../controllers/SettingController';
import type { SystemMetricController } from '../controllers/SystemMetricController';
import { createAuthRoutes } from './auth.routes';
import { createConnectionLogRoutes } from './connectionLog.routes';
import { createDashboardRoutes } from './dashboard.routes';
import { createDeviceRoutes } from './device.routes';
import { createDriveFileRoutes } from './driveFile.routes';
import { createNacRoutes } from './nac.routes';
import { createNotificationRoutes } from './notification.routes';
import { createServerRoutes } from './server.routes';
import { createSettingRoutes } from './setting.routes';

export interface RouteControllers {
  auth: AuthController;
  server: ServerController;
  systemMetric: SystemMetricController;
  device: DeviceController;
  connectionLog: ConnectionLogController;
  notification: NotificationController;
  setting: SettingController;
  driveFile: DriveFileController;
  dashboard: DashboardController;
  nac: NacController;
}

export function createApiRouter(controllers: RouteControllers): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(controllers.auth));
  router.use('/servers', createServerRoutes(controllers.server, controllers.systemMetric));
  router.use('/devices', createDeviceRoutes(controllers.device));
  router.use('/connection-logs', createConnectionLogRoutes(controllers.connectionLog));
  router.use('/notifications', createNotificationRoutes(controllers.notification));
  router.use('/settings', createSettingRoutes(controllers.setting));
  router.use('/drive', createDriveFileRoutes(controllers.driveFile));
  router.use('/dashboard', createDashboardRoutes(controllers.dashboard));
  router.use('/nac', createNacRoutes(controllers.nac));

  return router;
}
