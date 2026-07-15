export interface BlockedFingerprint {
  id: string;
  fingerprint: string;
  userId: string | null;
  reason: string | null;
  blockedAt: Date;
}
