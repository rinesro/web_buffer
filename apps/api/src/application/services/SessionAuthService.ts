import type { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import type { AuthService, LoginResult, RequestContext } from './AuthService';
import type { UserAuthService, UserLoginResult } from './UserAuthService';

export type SessionLoginOutcome =
  { accountType: 'ADMIN'; result: LoginResult } | { accountType: 'USER'; result: UserLoginResult };

/**
 * A single login form serves both Admins and self-registered Users — this service is the
 * thin routing layer that decides which flow applies, purely by checking which table the
 * email belongs to. It does not duplicate any password-verification or token logic; it
 * delegates entirely to the existing, independently-tested AuthService/UserAuthService.
 */
export class SessionAuthService {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly authService: AuthService,
    private readonly userAuthService: UserAuthService,
  ) {}

  async login(
    email: string,
    password: string,
    context: RequestContext,
  ): Promise<SessionLoginOutcome> {
    const admin = await this.adminRepository.findByEmail(email.toLowerCase());

    if (admin) {
      const result = await this.authService.login(email, password, context);
      return { accountType: 'ADMIN', result };
    }

    const result = await this.userAuthService.login(email, password, context);
    return { accountType: 'USER', result };
  }
}
