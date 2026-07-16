import type { Request, Response } from 'express';
import type { IdParamDto } from '../../application/dto/common.dto';
import type {
  DeviceQueryDto,
  RegisterDeviceDto,
  UpdateDeviceDto,
  UpdateDeviceStatusDto,
} from '../../application/dto/device.dto';
import type { DeviceService } from '../../application/services/DeviceService';
import { asyncHandler } from '../../shared/asyncHandler';

export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize, ...filter } = req.query as unknown as DeviceQueryDto;
    const result = await this.deviceService.list({ page, pageSize }, filter);
    res.status(200).json({ success: true, data: result });
  });

  getById = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const device = await this.deviceService.getById(req.params.id);
    res.status(200).json({ success: true, data: device });
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const device = await this.deviceService.register(req.body as RegisterDeviceDto);
    res.status(201).json({ success: true, data: device });
  });

  update = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const device = await this.deviceService.update(req.params.id, req.body as UpdateDeviceDto);
    res.status(200).json({ success: true, data: device });
  });

  updateStatus = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const { status } = req.body as UpdateDeviceStatusDto;
    const device = await this.deviceService.setStatus(req.params.id, status);
    res.status(200).json({ success: true, data: device });
  });

  delete = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    await this.deviceService.delete(req.params.id);
    res.status(204).send();
  });

  statusCounts = asyncHandler(async (_req: Request, res: Response) => {
    const counts = await this.deviceService.getStatusCounts();
    res.status(200).json({ success: true, data: counts });
  });
}
