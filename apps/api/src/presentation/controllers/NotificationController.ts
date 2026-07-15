import type { Response } from 'express';
import type { IdParamDto } from '../../application/dto/common.dto';
import type { NotificationQueryDto } from '../../application/dto/notification.dto';
import type { NotificationService } from '../../application/services/NotificationService';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { page, pageSize, unreadOnly } = req.query as unknown as NotificationQueryDto;
    const result = await this.notificationService.listForAdmin(
      req.user.id,
      { page, pageSize },
      unreadOnly,
    );
    res.status(200).json({ success: true, data: result });
  });

  unreadCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const count = await this.notificationService.countUnread(req.user.id);
    res.status(200).json({ success: true, data: { count } });
  });

  markAsRead = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const notification = await this.notificationService.markAsRead(req.params.id);
    res.status(200).json({ success: true, data: notification });
  });

  markAllAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const count = await this.notificationService.markAllAsRead(req.user.id);
    res.status(200).json({ success: true, data: { updated: count } });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    await this.notificationService.delete(req.params.id);
    res.status(204).send();
  });
}
