import type { ConnectionLog } from '../../domain/entities/ConnectionLog';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import type {
  ConnectionLogFilter,
  IConnectionLogRepository,
} from '../../domain/repositories/IConnectionLogRepository';

export class ConnectionLogService {
  constructor(private readonly connectionLogRepository: IConnectionLogRepository) {}

  async list(
    pagination: PaginationParams,
    filter: ConnectionLogFilter,
  ): Promise<PaginatedResult<ConnectionLog>> {
    return this.connectionLogRepository.findAll(pagination, filter);
  }
}
