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
import type { DriveOwner } from '../../domain/repositories/IDriveFileRepository';
import { asyncHandler } from '../../shared/asyncHandler';
import { UnauthorizedError } from '../../shared/errors/AppError';
import type { AuthenticatedRequest } from '../middlewares/authenticate';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

/** Every Web Drive request is scoped to whichever account (Admin or User) the JWT belongs
 *  to — the same set of endpoints serves both, each seeing only their own files. */
function ownerFromRequest(req: AuthenticatedRequest): DriveOwner {
  if (!req.user) throw new UnauthorizedError();
  return { type: ADMIN_ROLES.has(req.user.role) ? 'ADMIN' : 'USER', id: req.user.id };
}

export class DriveFileController {
  constructor(private readonly driveFileService: DriveFileService) {}

  listChildren = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const owner = ownerFromRequest(req);
    const { parentId } = req.query as unknown as DriveFileQueryDto;
    const children = await this.driveFileService.listChildren(parentId ?? null, owner);
    res.status(200).json({ success: true, data: children });
  });

  createFolder = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const owner = ownerFromRequest(req);
    const folder = await this.driveFileService.createFolder(req.body as CreateFolderDto, owner);
    res.status(201).json({ success: true, data: folder });
  });

  createFile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const owner = ownerFromRequest(req);
    const file = await this.driveFileService.createFile(req.body as CreateFileDto, owner);
    res.status(201).json({ success: true, data: file });
  });

  rename = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const owner = ownerFromRequest(req);
    const node = await this.driveFileService.rename(
      req.params.id,
      req.body as RenameDriveFileDto,
      owner,
    );
    res.status(200).json({ success: true, data: node });
  });

  move = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const owner = ownerFromRequest(req);
    const node = await this.driveFileService.move(
      req.params.id,
      req.body as MoveDriveFileDto,
      owner,
    );
    res.status(200).json({ success: true, data: node });
  });

  delete = asyncHandler(async (req: AuthenticatedRequest<IdParamDto>, res: Response) => {
    const owner = ownerFromRequest(req);
    await this.driveFileService.delete(req.params.id, owner);
    res.status(204).send();
  });
}
