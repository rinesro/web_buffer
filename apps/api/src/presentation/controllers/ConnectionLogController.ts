import type { Request, Response } from 'express';
import type { ConnectionLogQueryDto } from '../../application/dto/connectionLog.dto';
import type { ConnectionLogService } from '../../application/services/ConnectionLogService';
import { asyncHandler } from '../../shared/asyncHandler';

export class ConnectionLogController {
  constructor(private readonly connectionLogService: ConnectionLogService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, ...filter } = req.query as unknown as ConnectionLogQueryDto;
    const result = await this.connectionLogService.list({ page, pageSize }, filter);
    res.status(200).json({ success: true, data: result });
  });
}
