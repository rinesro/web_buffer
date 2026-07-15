import { recordSightingSchema } from '../../application/dto/nac.dto';
import { validate } from './validate';

export const validateRecordSighting = validate(recordSightingSchema, 'body');
