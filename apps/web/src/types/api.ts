import type {
  ConnectionAction,
  ConnectionResult,
  DeviceStatus,
  DeviceType,
  DriveFileType,
  NotificationSeverity,
  NotificationType,
  ServerStatus,
} from '@sbm-nac/shared-types';

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Server {
  id: string;
  name: string;
  hostname: string;
  ipAddress: string;
  location: string | null;
  description: string | null;
  status: ServerStatus;
  lastPingAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SystemMetric {
  id: string;
  serverId: string;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  ramUsedMb: number;
  ramTotalMb: number;
  diskUsagePercent: number;
  diskUsedGb: number;
  diskTotalGb: number;
  bufferUsagePercent: number;
  bufferUsedMb: number;
  bufferTotalMb: number;
  recordedAt: string;
  createdAt: string;
}

export interface DeviceSession {
  id: string;
  userId: string;
  fingerprint: string;
  name: string;
  deviceType: DeviceType;
  ipAddress: string;
  status: DeviceStatus;
  lastActivityAt: string;
  createdAt: string;
}

export interface DeviceSessionSummary {
  id: string;
  name: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  lastActivityAt: string;
  userName: string;
  userEmail: string;
}

export interface DeviceSessionDetail extends DeviceSessionSummary {
  userId: string;
  ipAddress: string;
  fingerprint: string;
  createdAt: string;
}

export interface BlockedFingerprint {
  id: string;
  fingerprint: string;
  userId: string | null;
  reason: string | null;
  blockedAt: string;
}

export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: DeviceType;
  status: DeviceStatus;
  serverId: string | null;
  lastSeenAt: string | null;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectionLog {
  id: string;
  deviceId: string;
  ipAddress: string;
  macAddress: string;
  action: ConnectionAction;
  result: ConnectionResult;
  message: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  adminId: string | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  metadata: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface DriveFile {
  id: string;
  name: string;
  path: string;
  type: DriveFileType;
  mimeType: string | null;
  sizeBytes: number;
  parentId: string | null;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  serverCount: number;
  deviceCounts: Record<DeviceStatus, number>;
  latestMetrics: SystemMetric[];
  unreadNotificationCount: number;
}
