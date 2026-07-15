import {
  deviceQuerySchema,
  registerDeviceSchema,
  updateDeviceSchema,
  updateDeviceStatusSchema,
} from '../../application/dto/device.dto';
import { validate } from './validate';

export const validateRegisterDevice = validate(registerDeviceSchema, 'body');
export const validateUpdateDevice = validate(updateDeviceSchema, 'body');
export const validateUpdateDeviceStatus = validate(updateDeviceStatusSchema, 'body');
export const validateDeviceQuery = validate(deviceQuerySchema, 'query');
