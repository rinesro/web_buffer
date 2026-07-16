import { randomUUID } from 'node:crypto';
import type { AdminWithoutPassword, Admin } from '../../domain/entities/Admin';
import type { IAdminRepository } from '../../domain/repositories/IAdminRepository';
import type { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { JwtService } from '../../infrastructure/auth/jwtService';
import { PasswordHasher } from '../../infrastructure/auth/passwordHasher';
import { hashToken } from '../../infrastructure/auth/tokenHash';
import { config } from '../../shared/config';
import { parseDurationToMs } from '../../shared/duration';
import { UnauthorizedError } from '../../shared/errors/AppError';

export interface LoginResult {
  admin: AdminWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
}

function stripPassword(admin: Admin): AdminWithoutPassword {
  const { passwordHash: _passwordHash, ...rest } = admin;
  return rest;
}

export class AuthService {
  constructor(
    private readonly adminRepository: IAdminRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async login(email: string, password: string, context: RequestContext): Promise<LoginResult> {
    const admin = await this.adminRepository.findByEmail(email.toLowerCase());
    if (!admin || !admin.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await PasswordHasher.compare(password, admin.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    await this.adminRepository.updateLastLogin(admin.id, new Date());

    const accessToken = JwtService.signAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });
    const { refreshToken } = await this.issueRefreshToken(admin.id, context);

    return { admin: stripPassword(admin), accessToken, refreshToken };
  }

  async refresh(
    presentedToken: string,
    context: RequestContext,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { sub: adminId } = JwtService.verifyRefreshToken(presentedToken);
    const tokenHash = hashToken(presentedToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid, expired, or already used');
    }

    const admin = await this.adminRepository.findById(adminId);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedError('Account is no longer active');
    }

    const { refreshToken, id: newTokenId } = await this.issueRefreshToken(admin.id, context);
    await this.refreshTokenRepository.revoke(stored.id, newTokenId);

    const accessToken = JwtService.signAccessToken({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    });

    return { accessToken, refreshToken };
  }

  async logout(presentedToken: string): Promise<void> {
    const tokenHash = hashToken(presentedToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await this.refreshTokenRepository.revoke(stored.id, null);
    }
  }

  async getProfile(adminId: string): Promise<AdminWithoutPassword> {
    const admin = await this.adminRepository.findById(adminId);
    if (!admin) {
      throw new UnauthorizedError('Account no longer exists');
    }
    return stripPassword(admin);
  }

  private async issueRefreshToken(
    adminId: string,
    context: RequestContext,
  ): Promise<{ refreshToken: string; id: string }> {
    const jti = randomUUID();
    const refreshToken = JwtService.signRefreshToken({ sub: adminId, jti });
    const expiresAt = new Date(Date.now() + parseDurationToMs(config.jwt.refreshExpiresIn));

    const created = await this.refreshTokenRepository.create({
      tokenHash: hashToken(refreshToken),
      adminId,
      expiresAt,
      userAgent: context.userAgent,
      ipAddress: context.ipAddress,
    });

    return { refreshToken, id: created.id };
  }
}
