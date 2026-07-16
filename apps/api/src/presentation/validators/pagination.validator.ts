import { paginationQuerySchema } from '../../application/dto/pagination.dto';
import { validate } from './validate';

export const validatePagination = validate(paginationQuerySchema, 'query');
