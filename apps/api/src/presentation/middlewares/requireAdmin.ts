import type { NextFunction, Response } from 'express';
import { ForbiddenError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from './authenticate';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

export function requireAdmin(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (!req.user || !ADMIN_ROLES.has(req.user.role)) {
    next(new ForbiddenError('This action requires an administrator account'));
    return;
  }
  next();
}
