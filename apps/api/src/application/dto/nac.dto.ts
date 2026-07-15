import { z } from 'zod';

const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const macAddressRegex = /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export const recordSightingSchema = z.object({
  macAddress: z.string().regex(macAddressRegex, 'Must be a valid MAC address (AA:BB:CC:DD:EE:FF)'),
  ipAddress: z.string().regex(ipv4Regex, 'Must be a valid IPv4 address'),
});
export type RecordSightingDto = z.infer<typeof recordSightingSchema>;
