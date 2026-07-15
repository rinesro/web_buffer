import 'dotenv/config';
import { createServer } from 'node:http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { AuthService } from './application/services/AuthService';
import { ConnectionLogService } from './application/services/ConnectionLogService';
import { DashboardService } from './application/services/DashboardService';
import { DeviceService } from './application/services/DeviceService';
import { DriveFileService } from './application/services/DriveFileService';
import { NotificationService } from './application/services/NotificationService';
import { ServerService } from './application/services/ServerService';
import { SettingService } from './application/services/SettingService';
import { SystemMetricService } from './application/services/SystemMetricService';
import { prisma } from './infrastructure/database/prisma';
import { MetricsScheduler } from './infrastructure/metrics/metricsScheduler';
import { createSocketGateway } from './infrastructure/metrics/socketGateway';
import { PrismaAdminRepository } from './infrastructure/repositories/PrismaAdminRepository';
import { PrismaConnectionLogRepository } from './infrastructure/repositories/PrismaConnectionLogRepository';
import { PrismaDeviceRepository } from './infrastructure/repositories/PrismaDeviceRepository';
import { PrismaDriveFileRepository } from './infrastructure/repositories/PrismaDriveFileRepository';
import { PrismaNotificationRepository } from './infrastructure/repositories/PrismaNotificationRepository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/PrismaRefreshTokenRepository';
import { PrismaServerRepository } from './infrastructure/repositories/PrismaServerRepository';
import { PrismaSettingRepository } from './infrastructure/repositories/PrismaSettingRepository';
import { PrismaSystemMetricRepository } from './infrastructure/repositories/PrismaSystemMetricRepository';
import { AuthController } from './presentation/controllers/AuthController';
import { ConnectionLogController } from './presentation/controllers/ConnectionLogController';
import { DashboardController } from './presentation/controllers/DashboardController';
import { DeviceController } from './presentation/controllers/DeviceController';
import { DriveFileController } from './presentation/controllers/DriveFileController';
import { NacController } from './presentation/controllers/NacController';
import { NotificationController } from './presentation/controllers/NotificationController';
import { ServerController } from './presentation/controllers/ServerController';
import { SettingController } from './presentation/controllers/SettingController';
import { SystemMetricController } from './presentation/controllers/SystemMetricController';
import { errorHandler } from './presentation/middlewares/errorHandler';
import { notFoundHandler } from './presentation/middlewares/notFoundHandler';
import { apiRateLimiter } from './presentation/middlewares/rateLimiter';
import { createApiRouter, type RouteControllers } from './presentation/routes';
import { config } from './shared/config';
import { logger } from './shared/logger';

function buildApp(controllers: RouteControllers): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use('/api/v1', apiRateLimiter, createApiRouter(controllers));

  app.get('/health', (_req, res) => {
    res
      .status(200)
      .json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function bootstrap(): Promise<void> {
  const adminRepository = new PrismaAdminRepository();
  const refreshTokenRepository = new PrismaRefreshTokenRepository();
  const serverRepository = new PrismaServerRepository();
  const systemMetricRepository = new PrismaSystemMetricRepository();
  const deviceRepository = new PrismaDeviceRepository();
  const connectionLogRepository = new PrismaConnectionLogRepository();
  const notificationRepository = new PrismaNotificationRepository();
  const settingRepository = new PrismaSettingRepository();
  const driveFileRepository = new PrismaDriveFileRepository();

  const authService = new AuthService(adminRepository, refreshTokenRepository);
  const serverService = new ServerService(serverRepository);
  const systemMetricService = new SystemMetricService(systemMetricRepository, serverRepository);
  const deviceService = new DeviceService(
    deviceRepository,
    connectionLogRepository,
    notificationRepository,
  );
  const connectionLogService = new ConnectionLogService(connectionLogRepository);
  const notificationService = new NotificationService(notificationRepository);
  const settingService = new SettingService(settingRepository);
  const driveFileService = new DriveFileService(driveFileRepository);
  const dashboardService = new DashboardService(
    serverRepository,
    systemMetricRepository,
    deviceRepository,
    notificationRepository,
  );

  const controllers: RouteControllers = {
    auth: new AuthController(authService),
    server: new ServerController(serverService),
    systemMetric: new SystemMetricController(systemMetricService),
    device: new DeviceController(deviceService),
    connectionLog: new ConnectionLogController(connectionLogService),
    notification: new NotificationController(notificationService),
    setting: new SettingController(settingService),
    driveFile: new DriveFileController(driveFileService),
    dashboard: new DashboardController(dashboardService),
    nac: new NacController(deviceService),
  };

  const app = buildApp(controllers);
  const httpServer = createServer(app);
  const io = createSocketGateway(httpServer);

  const metricsScheduler = new MetricsScheduler(
    io,
    systemMetricService,
    serverRepository,
    notificationService,
    settingService,
  );
  metricsScheduler.start();

  httpServer.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'SBM-NAC API server started');
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully');
    metricsScheduler.stop();
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});
