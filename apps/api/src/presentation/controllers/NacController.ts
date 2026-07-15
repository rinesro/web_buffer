import type { Request, Response } from 'express';
import type { RecordSightingDto } from '../../application/dto/nac.dto';
import type { DeviceService } from '../../application/services/DeviceService';
import { asyncHandler } from '../../shared/asyncHandler';

export class NacController {
  constructor(private readonly deviceService: DeviceService) {}

  /**
   * Called by network infrastructure (not an admin) whenever a device is observed on the
   * network. Always responds 200 — including for an unrecognized MAC — because "unknown
   * device" is a normal, expected outcome for this endpoint, not an error condition. The
   * caller is expected to act on `recognized`/`status`: e.g. an agent enforcing access would
   * drop traffic when `status` is "BLOCKED" or the device is not `recognized` at all.
   */
  recordSighting = asyncHandler(async (req: Request, res: Response) => {
    const { macAddress, ipAddress } = req.body as RecordSightingDto;
    const device = await this.deviceService.recordSighting(macAddress, ipAddress);

    if (!device) {
      res.status(200).json({
        success: true,
        data: { recognized: false, status: null, device: null },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { recognized: true, status: device.status, device },
    });
  });
}
