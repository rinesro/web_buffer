import { z } from 'zod';
import { DeviceStatus, DeviceType } from '@sbm-nac/shared-types';
import { paginationQuerySchema } from './pagination.dto';

const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const macAddressRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const registerDeviceSchema = z.object({
  name: z.string().min(1).max(100),
  ipAddress: z.string().regex(ipv4Regex, 'Must be a valid IPv4 address'),
  macAddress: z
    .string()
    .regex(macAddressRegex, 'Must be a valid MAC address (AA:BB:CC:DD:EE:FF)'),
  deviceType: z.nativeEnum(DeviceType).default(DeviceType.UNKNOWN),
  serverId: z.string().cuid().optional(),
});
export type RegisterDeviceDto = z.infer<typeof registerDeviceSchema>;

export const updateDeviceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  ipAddress: z.string().regex(ipv4Regex, 'Must be a valid IPv4 address').optional(),
  deviceType: z.nativeEnum(DeviceType).optional(),
  serverId: z.string().cuid().nullable().optional(),
});
export type UpdateDeviceDto = z.infer<typeof updateDeviceSchema>;

export const updateDeviceStatusSchema = z.object({
  status: z.nativeEnum(DeviceStatus),
});
export type UpdateDeviceStatusDto = z.infer<typeof updateDeviceStatusSchema>;

export const deviceQuerySchema = paginationQuerySchema.extend({
  status: z.nativeEnum(DeviceStatus).optional(),
  search: z.string().max(100).optional(),
});
export type DeviceQueryDto = z.infer<typeof deviceQuerySchema>;
