import { Router } from 'express';
import type { DeviceSessionService } from '../../application/services/DeviceSessionService';
import type { AuthController } from '../controllers/AuthController';
import type { ConnectionLogController } from '../controllers/ConnectionLogController';
import type { DashboardController } from '../controllers/DashboardController';
import type { DeviceController } from '../controllers/DeviceController';
import type { DeviceSessionController } from '../controllers/DeviceSessionController';
import type { DriveFileController } from '../controllers/DriveFileController';
import type { NacController } from '../controllers/NacController';
import type { NotificationController } from '../controllers/NotificationController';
import type { ServerController } from '../controllers/ServerController';
import type { SessionController } from '../controllers/SessionController';
import type { SettingController } from '../controllers/SettingController';
import type { SystemMetricController } from '../controllers/SystemMetricController';
import type { UserAuthController } from '../controllers/UserAuthController';
import { createAuthRoutes } from './auth.routes';
import { createConnectionLogRoutes } from './connectionLog.routes';
import { createDashboardRoutes } from './dashboard.routes';
import { createDeviceRoutes } from './device.routes';
import { createDeviceSessionRoutes } from './deviceSession.routes';
import { createDriveFileRoutes } from './driveFile.routes';
import { createNacRoutes } from './nac.routes';
import { createNotificationRoutes } from './notification.routes';
import { createServerRoutes } from './server.routes';
import { createSessionRoutes } from './session.routes';
import { createSettingRoutes } from './setting.routes';
import { createUserAuthRoutes } from './userAuth.routes';

export interface RouteControllers {
  auth: AuthController;
  userAuth: UserAuthController;
  session: SessionController;
  server: ServerController;
  systemMetric: SystemMetricController;
  device: DeviceController;
  deviceSession: DeviceSessionController;
  connectionLog: ConnectionLogController;
  notification: NotificationController;
  setting: SettingController;
  driveFile: DriveFileController;
  dashboard: DashboardController;
  nac: NacController;
}

export function createApiRouter(
  controllers: RouteControllers,
  deviceSessionService: DeviceSessionService,
): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(controllers.auth));
  router.use('/user-auth', createUserAuthRoutes(controllers.userAuth));
  router.use('/session', createSessionRoutes(controllers.session));
  router.use('/servers', createServerRoutes(controllers.server, controllers.systemMetric));
  router.use('/devices', createDeviceRoutes(controllers.device));
  router.use('/device-sessions', createDeviceSessionRoutes(controllers.deviceSession));
  router.use('/connection-logs', createConnectionLogRoutes(controllers.connectionLog));
  router.use('/notifications', createNotificationRoutes(controllers.notification));
  router.use('/settings', createSettingRoutes(controllers.setting));
  router.use('/drive', createDriveFileRoutes(controllers.driveFile, deviceSessionService));
  router.use('/dashboard', createDashboardRoutes(controllers.dashboard));
  router.use('/nac', createNacRoutes(controllers.nac));

  return router;
}
