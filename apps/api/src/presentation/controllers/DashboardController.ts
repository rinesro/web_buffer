import type { Response } from 'express';
import type { DashboardService } from '../../application/services/DashboardService';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  summary = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const summary = await this.dashboardService.getSummary(req.user.id);
    res.status(200).json({ success: true, data: summary });
  });
}
