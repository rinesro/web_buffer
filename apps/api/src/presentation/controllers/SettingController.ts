import type { Request, Response } from 'express';
import type { KeyParamDto } from '../../application/dto/common.dto';
import type { UpsertSettingDto } from '../../application/dto/setting.dto';
import type { SettingService } from '../../application/services/SettingService';
import { asyncHandler } from '../../shared/asyncHandler';

export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  list = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await this.settingService.listAll();
    res.status(200).json({ success: true, data: settings });
  });

  getByKey = asyncHandler(async (req: Request<KeyParamDto>, res: Response) => {
    const setting = await this.settingService.getByKey(req.params.key);
    res.status(200).json({ success: true, data: setting });
  });

  upsert = asyncHandler(async (req: Request<KeyParamDto>, res: Response) => {
    const { value, description } = req.body as UpsertSettingDto;
    const setting = await this.settingService.upsert(req.params.key, value, description);
    res.status(200).json({ success: true, data: setting });
  });
}
