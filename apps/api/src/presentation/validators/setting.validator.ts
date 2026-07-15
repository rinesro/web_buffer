import { upsertSettingSchema } from '../../application/dto/setting.dto';
import { validate } from './validate';

export const validateUpsertSetting = validate(upsertSettingSchema, 'body');
