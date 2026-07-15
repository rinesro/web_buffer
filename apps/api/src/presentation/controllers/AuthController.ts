import type { Request, Response } from 'express';
import type { LoginDto } from '../../application/dto/auth.dto';
import type { AuthService } from '../../application/services/AuthService';
import { asyncHandler } from '../../shared/asyncHandler';
import { config } from '../../shared/config';
import { REFRESH_TOKEN_COOKIE_NAME } from '../../shared/constants';
import { parseDurationToMs } from '../../shared/duration';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginDto;
    const result = await this.authService.login(email, password, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: { admin: result.admin, accessToken: result.accessToken },
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (!presentedToken) {
      throw new UnauthorizedError('Refresh token cookie is missing');
    }

    const result = await this.authService.refresh(presentedToken, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ success: true, data: { accessToken: result.accessToken } });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (presentedToken) {
      await this.authService.logout(presentedToken);
    }
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: '/api/v1/auth' });
    res.status(204).send();
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const profile = await this.authService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: { admin: profile } });
  });

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: parseDurationToMs(config.jwt.refreshExpiresIn),
      path: '/api/v1/auth',
    });
  }
}
