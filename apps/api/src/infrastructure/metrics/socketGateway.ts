import type { Server as HttpServer } from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../../shared/config';
import { logger } from '../../shared/logger';
import { JwtService } from '../auth/jwtService';

interface SocketData {
  adminId: string;
}

export type AppSocketIOServer = SocketIOServer<
  Record<string, (...args: unknown[]) => void>,
  Record<string, (...args: unknown[]) => void>,
  Record<string, never>,
  SocketData
>;

export function createSocketGateway(httpServer: HttpServer): AppSocketIOServer {
  const io: AppSocketIOServer = new SocketIOServer(httpServer, {
    cors: {
      origin: config.corsOrigin,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('Authentication token is required'));
      return;
    }
    try {
      const payload = JwtService.verifyAccessToken(token);
      socket.data.adminId = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired authentication token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug({ adminId: socket.data.adminId, socketId: socket.id }, 'Socket connected');

    socket.on('subscribe:server', (serverId: unknown) => {
      if (typeof serverId === 'string' && serverId.length > 0) {
        void socket.join(`server:${serverId}`);
      }
    });

    socket.on('unsubscribe:server', (serverId: unknown) => {
      if (typeof serverId === 'string' && serverId.length > 0) {
        void socket.leave(`server:${serverId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.debug({ adminId: socket.data.adminId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}
