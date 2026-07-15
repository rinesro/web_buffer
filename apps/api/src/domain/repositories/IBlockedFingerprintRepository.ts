import type { BlockedFingerprint } from '../entities/BlockedFingerprint';
import type { PaginatedResult, PaginationParams } from './shared';

export interface CreateBlockedFingerprintInput {
  fingerprint: string;
  userId: string | null;
  reason?: string | null;
}

export interface IBlockedFingerprintRepository {
  findByFingerprint(fingerprint: string): Promise<BlockedFingerprint | null>;
  findById(id: string): Promise<BlockedFingerprint | null>;
  findAll(pagination: PaginationParams): Promise<PaginatedResult<BlockedFingerprint>>;
  create(data: CreateBlockedFingerprintInput): Promise<BlockedFingerprint>;
  delete(id: string): Promise<void>;
}
