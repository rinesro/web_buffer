import type { NextFunction, Request, Response } from 'express';
import { JwtService } from '../../infrastructure/auth/jwtService';
import { UnauthorizedError } from '../../shared/errors/AppError';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest<Params = Record<string, string>>
  extends Request<Params> {
  user?: AuthenticatedUser;
}

export function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);
  try {
    const payload = JwtService.verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}
