import type { Request, Response } from 'express';
import type { LoginDto } from '../../application/dto/auth.dto';
import type { SessionAuthService } from '../../application/services/SessionAuthService';
import { asyncHandler } from '../../shared/asyncHandler';
import { config } from '../../shared/config';
import { REFRESH_TOKEN_COOKIE_NAME, USER_REFRESH_TOKEN_COOKIE_NAME } from '../../shared/constants';
import { parseDurationToMs } from '../../shared/duration';

export class SessionController {
  constructor(private readonly sessionAuthService: SessionAuthService) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginDto;
    const outcome = await this.sessionAuthService.login(email, password, {
      ipAddress: req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    const maxAge = parseDurationToMs(config.jwt.refreshExpiresIn);
    const baseCookieOptions = {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax' as const,
      maxAge,
    };

    if (outcome.accountType === 'ADMIN') {
      res.cookie(REFRESH_TOKEN_COOKIE_NAME, outcome.result.refreshToken, {
        ...baseCookieOptions,
        path: '/api/v1/auth',
      });
      res.status(200).json({
        success: true,
        data: {
          accountType: 'ADMIN',
          admin: outcome.result.admin,
          accessToken: outcome.result.accessToken,
        },
      });
      return;
    }

    res.cookie(USER_REFRESH_TOKEN_COOKIE_NAME, outcome.result.refreshToken, {
      ...baseCookieOptions,
      path: '/api/v1/user-auth',
    });
    res.status(200).json({
      success: true,
      data: {
        accountType: 'USER',
        user: outcome.result.user,
        accessToken: outcome.result.accessToken,
      },
    });
  });
}
