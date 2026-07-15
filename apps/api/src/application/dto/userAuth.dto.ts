import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type RegisterUserDto = z.infer<typeof registerUserSchema>;

export const userLoginSchema = z.object({
  email: z.string().email('Must be a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type UserLoginDto = z.infer<typeof userLoginSchema>;
