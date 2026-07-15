import { notificationQuerySchema } from '../../application/dto/notification.dto';
import { validate } from './validate';

export const validateNotificationQuery = validate(notificationQuerySchema, 'query');
