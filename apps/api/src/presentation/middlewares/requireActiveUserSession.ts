import { DeviceStatus } from '@sbm-nac/shared-types';
import type { DeviceSessionService } from '../../application/services/DeviceSessionService';
import { generateDeviceFingerprint } from '../../infrastructure/auth/deviceFingerprint';
import { asyncHandler } from '../../shared/asyncHandler';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from './authenticate';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

export function createRequireActiveUserSession(deviceSessionService: DeviceSessionService) {
  return asyncHandler(async (req: AuthenticatedRequest, _res, next) => {
    if (!req.user) throw new UnauthorizedError();

    // Admins don't have device sessions at all — this gate only applies to the User portal.
    if (ADMIN_ROLES.has(req.user.role)) {
      next();
      return;
    }

    const userAgent = req.headers['user-agent'];
    if (!userAgent) {
      throw new ForbiddenError('A recognizable browser is required to use the Web Drive');
    }

    const fingerprint = generateDeviceFingerprint(req.user.id, userAgent);
    const session = await deviceSessionService.touch(req.user.id, fingerprint, req.ip ?? 'unknown');

    if (!session) {
      throw new ForbiddenError('No active device session for this account — please sign in again');
    }
    if (session.status === DeviceStatus.BLOCKED) {
      throw new ForbiddenError('This device has been blocked');
    }
    if (session.status === DeviceStatus.PENDING) {
      throw new ForbiddenError('This device is awaiting administrator approval');
    }

    next();
  });
}
