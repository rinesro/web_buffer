import type { Response } from 'express';
import type { IdParamDto } from '../../application/dto/common.dto';
import type {
  CreateFileDto,
  CreateFolderDto,
  DriveFileQueryDto,
  MoveDriveFileDto,
  RenameDriveFileDto,
} from '../../application/dto/driveFile.dto';
import type { DriveFileService } from '../../application/services/DriveFileService';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

export class DriveFileController {
  constructor(private readonly driveFileService: DriveFileService) {}

  listChildren = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const { parentId } = req.query as unknown as DriveFileQueryDto;
    const children = await this.driveFileService.listChildren(parentId ?? null, req.user.id);
    res.status(200).json({ success: true, data: children });
  });

  createFolder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const folder = await this.driveFileService.createFolder(
      req.body as CreateFolderDto,
      req.user.id,
    );
    res.status(201).json({ success: true, data: folder });
  });

  createFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const file = await this.driveFileService.createFile(req.body as CreateFileDto, req.user.id);
    res.status(201).json({ success: true, data: file });
  });

  rename = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const node = await this.driveFileService.rename(
      req.params.id,
      req.body as RenameDriveFileDto,
      req.user.id,
    );
    res.status(200).json({ success: true, data: node });
  });

  move = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    const node = await this.driveFileService.move(
      req.params.id,
      req.body as MoveDriveFileDto,
      req.user.id,
    );
    res.status(200).json({ success: true, data: node });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    if (!req.user) throw new UnauthorizedError();
    await this.driveFileService.delete(req.params.id, req.user.id);
    res.status(204).send();
  });
}
