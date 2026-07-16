import { registerUserSchema, userLoginSchema } from '../../application/dto/userAuth.dto';
import { validate } from './validate';

export const validateRegisterUser = validate(registerUserSchema, 'body');
export const validateUserLogin = validate(userLoginSchema, 'body');
