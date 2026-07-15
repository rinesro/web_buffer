import type { Request, Response } from 'express';
import type { IdParamDto } from '../../application/dto/common.dto';
import type {
  CreateServerDto,
  ServerQueryDto,
  UpdateServerDto,
} from '../../application/dto/server.dto';
import type { ServerService } from '../../application/services/ServerService';
import { asyncHandler } from '../../shared/asyncHandler';

export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const { page, pageSize } = req.query as unknown as ServerQueryDto;
    const result = await this.serverService.list({ page, pageSize });
    res.status(200).json({ success: true, data: result });
  });

  getById = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const server = await this.serverService.getById(req.params.id);
    res.status(200).json({ success: true, data: server });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const server = await this.serverService.create(req.body as CreateServerDto);
    res.status(201).json({ success: true, data: server });
  });

  update = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    const server = await this.serverService.update(req.params.id, req.body as UpdateServerDto);
    res.status(200).json({ success: true, data: server });
  });

  delete = asyncHandler(async (req: Request<IdParamDto>, res: Response) => {
    await this.serverService.delete(req.params.id);
    res.status(204).send();
  });
}
