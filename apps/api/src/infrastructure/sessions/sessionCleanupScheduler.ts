import type { IDeviceSessionRepository } from '../../domain/repositories/IDeviceSessionRepository';
import { logger } from '../../shared/logger';

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // check every 5 minutes
const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // sessions older than 30 minutes of inactivity expire

export class SessionCleanupScheduler {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly deviceSessionRepository: IDeviceSessionRepository) {}

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch((error: unknown) => {
        logger.error({ error }, 'Session cleanup tick failed');
      });
    }, CHECK_INTERVAL_MS);
    logger.info(
      { checkIntervalMs: CHECK_INTERVAL_MS, inactivityLimitMs: INACTIVITY_LIMIT_MS },
      'Session cleanup scheduler started',
    );
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    const cutoff = new Date(Date.now() - INACTIVITY_LIMIT_MS);
    const deleted = await this.deviceSessionRepository.deleteInactiveSince(cutoff);
    if (deleted > 0) {
      logger.info({ deleted }, 'Expired inactive device sessions');
    }
  }
}
