/**
 * These fields are modeled as plain String columns in Prisma (see apps/api/prisma/schema.prisma),
 * even though the app now runs on PostgreSQL, which does support native enums — the app was
 * originally built on SQLite (no native enum support), and staying with Strings avoided an
 * unnecessary refactor when the database was later migrated. See schema.prisma for the full
 * rationale. These literal unions are the single source of truth for the allowed values,
 * imported by:
 *  - apps/api Zod validators, to reject any value outside the union at the API boundary
 *  - apps/web components, for type-safe status badges, filters, and form selects
 */

export const AdminRole = {
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type AdminRole = (typeof AdminRole)[keyof typeof AdminRole];

export const ServerStatus = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  UNKNOWN: 'UNKNOWN',
} as const;
export type ServerStatus = (typeof ServerStatus)[keyof typeof ServerStatus];

export const DeviceType = {
  LAPTOP: 'LAPTOP',
  DESKTOP: 'DESKTOP',
  MOBILE: 'MOBILE',
  IOT: 'IOT',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
} as const;
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];

export const DeviceStatus = {
  ALLOWED: 'ALLOWED',
  BLOCKED: 'BLOCKED',
  PENDING: 'PENDING',
} as const;
export type DeviceStatus = (typeof DeviceStatus)[keyof typeof DeviceStatus];

export const ConnectionAction = {
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  BLOCKED: 'BLOCKED',
  ALLOWED: 'ALLOWED',
  ACCESS_ATTEMPT: 'ACCESS_ATTEMPT',
} as const;
export type ConnectionAction = (typeof ConnectionAction)[keyof typeof ConnectionAction];

export const ConnectionResult = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const;
export type ConnectionResult = (typeof ConnectionResult)[keyof typeof ConnectionResult];

export const NotificationType = {
  ANOMALY: 'ANOMALY',
  DEVICE_BLOCKED: 'DEVICE_BLOCKED',
  DEVICE_ALLOWED: 'DEVICE_ALLOWED',
  SERVER_OFFLINE: 'SERVER_OFFLINE',
  THRESHOLD_EXCEEDED: 'THRESHOLD_EXCEEDED',
  SYSTEM: 'SYSTEM',
  INFO: 'INFO',
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationSeverity = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
} as const;
export type NotificationSeverity = (typeof NotificationSeverity)[keyof typeof NotificationSeverity];

export const DriveFileType = {
  FILE: 'FILE',
  FOLDER: 'FOLDER',
} as const;
export type DriveFileType = (typeof DriveFileType)[keyof typeof DriveFileType];
