import { randomUUID } from 'node:crypto';
import type { User, UserWithoutPassword } from '../../domain/entities/User';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IUserRefreshTokenRepository } from '../../domain/repositories/IUserRefreshTokenRepository';
import { JwtService } from '../../infrastructure/auth/jwtService';
import { PasswordHasher } from '../../infrastructure/auth/passwordHasher';
import { hashToken } from '../../infrastructure/auth/tokenHash';
import { config } from '../../shared/config';
import { parseDurationToMs } from '../../shared/duration';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../../shared/errors/AppError';
import type { DeviceSessionService } from './DeviceSessionService';

export interface UserLoginResult {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

function stripPassword(user: User): UserWithoutPassword {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export class UserAuthService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userRefreshTokenRepository: IUserRefreshTokenRepository,
    private readonly deviceSessionService: DeviceSessionService,
  ) {}

  async register(
    name: string,
    email: string,
    password: string,
    context: RequestContext,
  ): Promise<UserLoginResult> {
    const normalizedEmail = email.toLowerCase();
    const existing = await this.userRepository.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    const passwordHash = await PasswordHasher.hash(password);
    const user = await this.userRepository.create({ name, email: normalizedEmail, passwordHash });

    if (context.ipAddress && context.userAgent) {
      // Throws ForbiddenError if this exact browser fingerprint is already on the permanent
      // blocklist — a brand-new account can still be locked out immediately if someone
      // re-registers from a device that was blocked under a different account.
      await this.deviceSessionService.captureSession(user.id, context.ipAddress, context.userAgent);
    }

    return this.issueSession(user, context);
  }

  async login(email: string, password: string, context: RequestContext): Promise<UserLoginResult> {
    const user = await this.userRepository.findByEmail(email.toLowerCase());
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await PasswordHasher.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new ForbiddenError('This account has been blocked');
    }

    await this.userRepository.updateLastLogin(user.id, new Date());

    if (context.ipAddress && context.userAgent) {
      await this.deviceSessionService.captureSession(user.id, context.ipAddress, context.userAgent);
    }

    return this.issueSession(user, context);
  }

  async refresh(
    presentedToken: string,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { sub: userId } = JwtService.verifyRefreshToken(presentedToken);
    const tokenHashValue = hashToken(presentedToken);
    const stored = await this.userRefreshTokenRepository.findByTokenHash(tokenHashValue);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid, expired, or already used');
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Account no longer exists');
    }
    if (user.isBlocked) {
      throw new ForbiddenError('This account has been blocked');
    }

    const { refreshToken, id: newTokenId } = await this.issueRefreshToken(user.id, context);
    await this.userRefreshTokenRepository.revoke(stored.id, newTokenId);

    const accessToken = JwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: 'USER',
    });

    return { accessToken, refreshToken };
  }

  async logout(presentedToken: string): Promise<void> {
    const tokenHashValue = hashToken(presentedToken);
    const stored = await this.userRefreshTokenRepository.findByTokenHash(tokenHashValue);
    if (stored && !stored.revokedAt) {
      await this.userRefreshTokenRepository.revoke(stored.id, null);
    }
  }

  async getProfile(userId: string): Promise<UserWithoutPassword> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('Account no longer exists');
    }
    return stripPassword(user);
  }

  private async issueSession(user: User, context: RequestContext): Promise<UserLoginResult> {
    const accessToken = JwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      role: 'USER',
    });
    const { refreshToken } = await this.issueRefreshToken(user.id, context);
    return { user: stripPassword(user), accessToken, refreshToken };
  }

  private async issueRefreshToken(
    userId: string,
    context: RequestContext,
  ): Promise<{ refreshToken: string; id: string }> {
    const jti = randomUUID();
    const refreshToken = JwtService.signRefreshToken({ sub: userId, jti });
    const expiresAt = new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn));

    const created = await this.userRefreshTokenRepository.create({
      tokenHash: hashToken(refreshToken),
      userId,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return { refreshToken, id: created.id };
  }
}
