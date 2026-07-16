import { loginSchema } from '../../application/dto/auth.dto';
import { validate } from './validate';

export const validateLogin = validate(loginSchema, 'body');
