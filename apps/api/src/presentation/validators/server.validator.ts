import {
  createServerSchema,
  serverQuerySchema,
  updateServerSchema,
} from '../../application/dto/server.dto';
import { validate } from './validate';

export const validateCreateServer = validate(createServerSchema, 'body');
export const validateUpdateServer = validate(updateServerSchema, 'body');
export const validateServerQuery = validate(serverQuerySchema, 'query');
