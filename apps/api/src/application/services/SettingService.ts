import type { Setting } from '../../domain/entities/Setting';
import type { ISettingRepository } from '../../domain/repositories/ISettingRepository';
import { NotFoundError } from '../../shared/errors/AppError';

export class SettingService {
  constructor(private readonly settingRepository: ISettingRepository) {}

  async listAll(): Promise<Setting[]> {
    return this.settingRepository.findAll();
  }

  async getByKey(key: string): Promise<Setting> {
    const setting = await this.settingRepository.findByKey(key);
    if (!setting) throw new NotFoundError(`Setting "${key}"`);
    return setting;
  }

  async upsert(key: string, value: string, description?: string): Promise<Setting> {
    return this.settingRepository.upsert(key, value, description);
  }
}
