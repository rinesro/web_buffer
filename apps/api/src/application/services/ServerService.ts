import type { Server } from '../../domain/entities/Server';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import type { IServerRepository } from '../../domain/repositories/IServerRepository';
import type { CreateServerDto, UpdateServerDto } from '../dto/server.dto';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';

export class ServerService {
  constructor(private readonly serverRepository: IServerRepository) {}

  async list(pagination: PaginationParams): Promise<PaginatedResult<Server>> {
    return this.serverRepository.findAll(pagination);
  }

  async getById(id: string): Promise<Server> {
    const server = await this.serverRepository.findById(id);
    if (!server) throw new NotFoundError('Server');
    return server;
  }

  async create(data: CreateServerDto): Promise<Server> {
    const existing = await this.serverRepository.findByIpAddress(data.ipAddress);
    if (existing) {
      throw new ConflictError(`A server with IP address ${data.ipAddress} already exists`);
    }
    return this.serverRepository.create({
      name: data.name,
      hostname: data.hostname,
      ipAddress: data.ipAddress,
      location: data.location ?? null,
      description: data.description ?? null,
    });
  }

  async update(id: string, data: UpdateServerDto): Promise<Server> {
    await this.getById(id);
    if (data.ipAddress) {
      const existing = await this.serverRepository.findByIpAddress(data.ipAddress);
      if (existing && existing.id !== id) {
        throw new ConflictError(`A server with IP address ${data.ipAddress} already exists`);
      }
    }
    return this.serverRepository.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.serverRepository.delete(id);
  }
}
