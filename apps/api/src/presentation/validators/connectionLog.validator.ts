import { connectionLogQuerySchema } from '../../application/dto/connectionLog.dto';
import { validate } from './validate';

export const validateConnectionLogQuery = validate(connectionLogQuerySchema, 'query');
