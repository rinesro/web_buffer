import type { Response } from 'express';
import type { IdParamDto } from '../../application/dto/common.dto';
import type { PaginationQuery } from '../../application/dto/pagination.dto';
import type { DeviceSessionService } from '../../application/services/DeviceSessionService';
import { generateDeviceFingerprint } from '../../infrastructure/auth/deviceFingerprint';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

export class DeviceSessionController {
  constructor(private readonly deviceSessionService: DeviceSessionService) {}

  /** Called by the portal when the user explicitly leaves the Web Drive (button click or
   *  tab close via sendBeacon) — ends the session immediately instead of waiting out the
   *  30-minute inactivity window. */
  disconnect = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const userAgent = req.headers['user-agent'];
    if (userAgent) {
      const fingerprint = generateDeviceFingerprint(req.user.id, userAgent);
      await this.deviceSessionService.disconnect(req.user.id, fingerprint);
    }
    res.status(204).send();
  });

  /** The logged-in User's own current session status. */
  mine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const userAgent = req.headers['user-agent'];
    const session = userAgent
      ? await this.deviceSessionService.getMine(req.user.id, userAgent)
      : null;
    res.status(200).json({ success: true, data: session });
  });

  list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const result = await this.deviceSessionService.listForAdmin({ page, pageSize });
    res.status(200).json({ success: true, data: result });
  });

  detail = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const detail = await this.deviceSessionService.getDetailForAdmin(req.params.id);
    res.status(200).json({ success: true, data: detail });
  });

  allow = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const session = await this.deviceSessionService.allow(req.params.id);
    res.status(200).json({ success: true, data: session });
  });

  block = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const { reason } = req.body as { reason?: string };
    await this.deviceSessionService.block(req.params.id, reason);
    res.status(204).send();
  });

  listBlocked = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { page, pageSize } = req.query as unknown as PaginationQuery;
    const result = await this.deviceSessionService.listBlocked({ page, pageSize });
    res.status(200).json({ success: true, data: result });
  });

  unblock = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    await this.deviceSessionService.unblockFingerprint(req.params.id);
    res.status(204).send();
  });
}
