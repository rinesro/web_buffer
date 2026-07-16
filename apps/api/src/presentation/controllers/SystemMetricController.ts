import type { Request, Response } from 'express';
import type { IdParamDto } from '../../application/dto/common.dto';
import type { SystemMetricService } from '../../application/services/SystemMetricService';
import { asyncHandler } from '../../shared/asyncHandler';
import { METRIC_HISTORY_DEFAULT_LIMIT } from '../../shared/constants';

export class SystemMetricController {
  constructor(private readonly systemMetricService: SystemMetricService) {}

  latest = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const metric = await this.systemMetricService.getLatest(req.params.id);
    res.status(200).json({ success: true, data: metric });
  });

  history = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : METRIC_HISTORY_DEFAULT_LIMIT;
    const history = await this.systemMetricService.getHistory(req.params.id, limit);
    res.status(200).json({ success: true, data: history });
  });
}
