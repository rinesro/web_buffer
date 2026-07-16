import jwt, { type SignOptions } from 'jsonwebtoken';
import { config } from '../../shared/config';
import { UnauthorizedError } from '../../shared/errors/AppError';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

export class JwtService {
  static signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
    });
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }

  static signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    });
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}
