import type { Setting } from '../entities/Setting';

export interface ISettingRepository {
  findAll(): Promise<Setting[]>;
  findByKey(key: string): Promise<Setting | null>;
  upsert(key: string, value: string, description?: string | null): Promise<Setting>;
}
