import {
  DeviceStatus,
  NotificationSeverity,
  NotificationType,
  type DeviceType,
} from '@sbm-nac/shared-types';
import type { DeviceSession } from '../../domain/entities/DeviceSession';
import type { IBlockedFingerprintRepository } from '../../domain/repositories/IBlockedFingerprintRepository';
import type { IDeviceSessionRepository } from '../../domain/repositories/IDeviceSessionRepository';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import {
  classifyDeviceType,
  describeDevice,
  generateDeviceFingerprint,
} from '../../infrastructure/auth/deviceFingerprint';
import { ForbiddenError, NotFoundError } from '../../shared/errors/AppError';

export interface DeviceSessionSummary {
  id: string;
  name: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  lastActivityAt: Date;
  userName: string;
  userEmail: string;
}

export interface DeviceSessionDetail extends DeviceSessionSummary {
  userId: string;
  ipAddress: string;
  fingerprint: string;
  createdAt: Date;
}

export class DeviceSessionService {
  constructor(
    private readonly deviceSessionRepository: IDeviceSessionRepository,
    private readonly blockedFingerprintRepository: IBlockedFingerprintRepository,
    private readonly userRepository: IUserRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  /**
   * Called on every user register/login. Rejects outright if the fingerprint is on the
   * permanent blocklist (and defensively re-locks the account, in case it was ever
   * unblocked without clearing the association). Otherwise finds-or-creates the session for
   * this exact (user, browser) pair — a new session always starts PENDING, even if this
   * fingerprint was ALLOWED before; only a block is remembered across sessions.
   */
  async captureSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<DeviceSession> {
    const fingerprint = generateDeviceFingerprint(userId, userAgent);

    const blocked = await this.blockedFingerprintRepository.findByFingerprint(fingerprint);
    if (blocked) {
      await this.userRepository.setBlocked(userId, true);
      throw new ForbiddenError('This device has been blocked and can no longer be used to sign in');
    }

    const existing = await this.deviceSessionRepository.findByUserAndFingerprint(
      userId,
      fingerprint,
    );
    if (existing) {
      await this.deviceSessionRepository.touchActivity(existing.id, ipAddress);
      return { ...existing, ipAddress, lastActivityAt: new Date() };
    }

    const session = await this.deviceSessionRepository.create({
      userId,
      fingerprint,
      name: describeDevice(userAgent),
      deviceType: classifyDeviceType(userAgent),
      ipAddress,
    });

    await this.notificationRepository.create({
      adminId: null,
      type: NotificationType.SYSTEM,
      severity: NotificationSeverity.INFO,
      title: 'New device session awaiting approval',
      message: `${session.name} signed in and is awaiting approval`,
      metadata: JSON.stringify({ deviceSessionId: session.id }),
    });

    return session;
  }

  /** Read-only status check for the portal home page — does not refresh activity, since
   *  just checking status isn't "using" the drive. */
  async getMine(userId: string, userAgent: string): Promise<DeviceSession | null> {
    const fingerprint = generateDeviceFingerprint(userId, userAgent);
    return this.deviceSessionRepository.findByUserAndFingerprint(userId, fingerprint);
  }

  /** Keeps a session alive while its user is actively using the Web Drive — every drive
   *  request touches this, so 30 minutes of no requests is what actually expires it. */
  async touch(
    userId: string,
    fingerprint: string,
    ipAddress: string,
  ): Promise<DeviceSession | null> {
    const session = await this.deviceSessionRepository.findByUserAndFingerprint(
      userId,
      fingerprint,
    );
    if (!session) return null;
    await this.deviceSessionRepository.touchActivity(session.id, ipAddress);
    return { ...session, ipAddress, lastActivityAt: new Date() };
  }

  /** Explicit disconnect — the user left the Web Drive, so the session ends immediately
   *  rather than waiting out the 30-minute inactivity window. */
  async disconnect(userId: string, fingerprint: string): Promise<void> {
    const session = await this.deviceSessionRepository.findByUserAndFingerprint(
      userId,
      fingerprint,
    );
    if (session) {
      await this.deviceSessionRepository.delete(session.id);
    }
  }

  async listForAdmin(pagination: PaginationParams): Promise<PaginatedResult<DeviceSessionSummary>> {
    const page = await this.deviceSessionRepository.findAll(pagination);
    const items = await this.withUserInfo(page.items);
    return { ...page, items };
  }

  async getDetailForAdmin(id: string): Promise<DeviceSessionDetail> {
    const session = await this.deviceSessionRepository.findById(id);
    if (!session) throw new NotFoundError('Device session');
    const user = await this.userRepository.findById(session.userId);
    return {
      ...session,
      userId: session.userId,
      userName: user?.name ?? 'Unknown',
      userEmail: user?.email ?? 'unknown',
    };
  }

  async allow(id: string): Promise<DeviceSessionSummary> {
    const session = await this.deviceSessionRepository.updateStatus(id, DeviceStatus.ALLOWED);
    const summaries = await this.withUserInfo([session]);
    const summary = summaries[0];
    if (!summary) {
      throw new NotFoundError('Device session');
    }
    return summary;
  }

  /**
   * The core of "block a device blocks the account": records the fingerprint permanently,
   * locks the User out entirely, and removes the now-blocked session (a blocked device has
   * no legitimate "active connection" to speak of).
   */
  async block(id: string, reason?: string): Promise<void> {
    const session = await this.deviceSessionRepository.findById(id);
    if (!session) throw new NotFoundError('Device session');

    await this.blockedFingerprintRepository.create({
      fingerprint: session.fingerprint,
      userId: session.userId,
      reason: reason ?? null,
    });
    await this.userRepository.setBlocked(session.userId, true);
    await this.deviceSessionRepository.delete(session.id);

    await this.notificationRepository.create({
      adminId: null,
      type: NotificationType.DEVICE_BLOCKED,
      severity: NotificationSeverity.WARNING,
      title: 'Device blocked',
      message: `${session.name} was blocked; the account that used it is now locked out entirely`,
      metadata: JSON.stringify({ fingerprint: session.fingerprint }),
    });
  }

  async listBlocked(pagination: PaginationParams) {
    return this.blockedFingerprintRepository.findAll(pagination);
  }

  /** Removing a fingerprint from the blocklist does NOT automatically unlock the account —
   *  that's a deliberate separate admin action, so a device unblock alone can't silently
   *  restore access to an account that was locked out for other reasons too. */
  async unblockFingerprint(id: string): Promise<void> {
    const entry = await this.blockedFingerprintRepository.findById(id);
    if (!entry) throw new NotFoundError('Blocked fingerprint');
    await this.blockedFingerprintRepository.delete(entry.id);
  }

  async unlockUser(userId: string): Promise<void> {
    await this.userRepository.setBlocked(userId, false);
  }

  private async withUserInfo(sessions: DeviceSession[]): Promise<DeviceSessionSummary[]> {
    const summaries: DeviceSessionSummary[] = [];
    for (const session of sessions) {
      const user = await this.userRepository.findById(session.userId);
      summaries.push({
        id: session.id,
        name: session.name,
        deviceType: session.deviceType,
        status: session.status,
        lastActivityAt: session.lastActivityAt,
        userName: user?.name ?? 'Unknown',
        userEmail: user?.email ?? 'unknown',
      });
    }
    return summaries;
  }
}
