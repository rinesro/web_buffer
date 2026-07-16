import { idParamSchema, keyParamSchema } from '../../application/dto/common.dto';
import { validate } from './validate';

export const validateIdParam = validate(idParamSchema, 'params');
export const validateKeyParam = validate(keyParamSchema, 'params');
