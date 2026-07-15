import type { Request, Response } from 'express';
import type { RegisterUserDto, UserLoginDto } from '../../application/dto/userAuth.dto';
import type { UserAuthService } from '../../application/services/UserAuthService';
import { asyncHandler } from '../../shared/asyncHandler';
import { config } from '../../shared/config';
import { USER_REFRESH_TOKEN_COOKIE_NAME } from '../../shared/constants';
import { parseDurationToMs } from '../../shared/duration';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  register = asyncHandler(async (req: Request, res: Response) => {
    const { name, email, password } = req.body as RegisterUserDto;
    const result = await this.userAuthService.register(name, email, password, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    res.status(201).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as UserLoginDto;
    const result = await this.userAuthService.login(email, password, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    res.status(200).json({
      success: true,
      data: { user: result.user, accessToken: result.accessToken },
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[USER_REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (!presentedToken) {
      throw new UnauthorizedError('Refresh token cookie is missing');
    }

    const result = await this.userAuthService.refresh(presentedToken, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    this.setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ success: true, data: { accessToken: result.accessToken } });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const presentedToken = req.cookies?.[USER_REFRESH_TOKEN_COOKIE_NAME] as string | undefined;
    if (presentedToken) {
      await this.userAuthService.logout(presentedToken);
    }
    res.clearCookie(USER_REFRESH_TOKEN_COOKIE_NAME, { path: '/api/v1/user-auth' });
    res.status(204).send();
  });

  me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const profile = await this.userAuthService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: { user: profile } });
  });

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(USER_REFRESH_TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: parseDurationToMs(config.jwt.refreshExpiresIn),
      path: '/api/v1/user-auth',
    });
  }
}
