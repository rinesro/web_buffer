import { hostname } from 'node:os';
import {
  ConnectionAction,
  ConnectionResult,
  DeviceStatus,
  DeviceType,
  DriveFileType,
  NotificationSeverity,
  NotificationType,
  ServerStatus,
} from '@sbm-nac/shared-types';
import { prisma } from '../src/infrastructure/database/prisma';
import { PasswordHasher } from '../src/infrastructure/auth/passwordHasher';
import { config } from '../src/shared/config';

const ALERT_THRESHOLD_DEFAULTS: Array<{ key: string; value: string; description: string }> = [
  { key: 'alert.cpu.threshold', value: '90', description: 'CPU usage percent that triggers a critical notification' },
  { key: 'alert.ram.threshold', value: '90', description: 'RAM usage percent that triggers a critical notification' },
  { key: 'alert.disk.threshold', value: '90', description: 'Disk usage percent that triggers a critical notification' },
  { key: 'alert.buffer.threshold', value: '90', description: 'Buffer/cache usage percent that triggers a critical notification' },
];

async function seedAdmin(): Promise<{ id: string; isFresh: boolean }> {
  const email = config.seedAdmin.email;
  const password = config.seedAdmin.password;

  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set in apps/api/.env before seeding.',
    );
  }

  const existing = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    console.log(`Admin ${email} already exists — leaving credentials untouched.`);
    return { id: existing.id, isFresh: false };
  }

  const passwordHash = await PasswordHasher.hash(password);
  const admin = await prisma.admin.create({
    data: {
      name: 'System Administrator',
      email: email.toLowerCase(),
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });
  console.log(`Created admin account: ${admin.email}`);
  return { id: admin.id, isFresh: true };
}

async function seedServers(): Promise<{ localId: string; demoId: string }> {
  const local = await prisma.server.upsert({
    where: { ipAddress: '127.0.0.1' },
    update: {},
    create: {
      name: `Local host (${hostname()})`,
      hostname: hostname(),
      ipAddress: '127.0.0.1',
      location: 'This machine',
      description:
        'The machine running this Express process. This is the only server that receives real ' +
        'samples from the built-in collector — see infrastructure/metrics/systemMetricsCollector.ts.',
      status: ServerStatus.UNKNOWN,
    },
  });

  const demo = await prisma.server.upsert({
    where: { ipAddress: '10.0.0.20' },
    update: {},
    create: {
      name: 'App server (example)',
      hostname: 'app-01.internal',
      ipAddress: '10.0.0.20',
      location: 'Jakarta, DC1',
      description:
        'Example server for demonstrating multi-server UI. It will not receive live metrics ' +
        'until a remote agent posts samples for its id — this app only measures its own host.',
      status: ServerStatus.UNKNOWN,
    },
  });

  console.log(`Servers ready: ${local.name}, ${demo.name}`);
  return { localId: local.id, demoId: demo.id };
}

async function seedDevices(serverId: string): Promise<string[]> {
  const devices: Array<{
    name: string;
    ipAddress: string;
    macAddress: string;
    deviceType: DeviceType;
    status: DeviceStatus;
  }> = [
    { name: "Admin's laptop", ipAddress: '192.168.1.10', macAddress: 'AA:BB:CC:00:00:01', deviceType: DeviceType.LAPTOP, status: DeviceStatus.ALLOWED },
    { name: 'Office desktop', ipAddress: '192.168.1.11', macAddress: 'AA:BB:CC:00:00:02', deviceType: DeviceType.DESKTOP, status: DeviceStatus.ALLOWED },
    { name: 'Warehouse scanner', ipAddress: '192.168.1.12', macAddress: 'AA:BB:CC:00:00:03', deviceType: DeviceType.IOT, status: DeviceStatus.PENDING },
    { name: 'Unregistered phone', ipAddress: '192.168.1.13', macAddress: 'AA:BB:CC:00:00:04', deviceType: DeviceType.MOBILE, status: DeviceStatus.BLOCKED },
    { name: 'Guest tablet', ipAddress: '192.168.1.14', macAddress: 'AA:BB:CC:00:00:05', deviceType: DeviceType.UNKNOWN, status: DeviceStatus.PENDING },
  ];

  const ids: string[] = [];
  for (const device of devices) {
    const row = await prisma.device.upsert({
      where: { macAddress: device.macAddress },
      update: {},
      create: { ...device, serverId },
    });
    ids.push(row.id);
  }
  console.log(`Devices ready: ${devices.length}`);
  return ids;
}

async function seedSettings(): Promise<void> {
  for (const setting of ALERT_THRESHOLD_DEFAULTS) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log(`Settings ready: ${ALERT_THRESHOLD_DEFAULTS.length} alert thresholds`);
}

async function seedConnectionLogs(deviceIds: string[]): Promise<void> {
  const [allowedId, , , blockedId] = deviceIds;
  const now = Date.now();

  await prisma.connectionLog.createMany({
    data: [
      {
        deviceId: allowedId,
        ipAddress: '192.168.1.10',
        macAddress: 'AA:BB:CC:00:00:01',
        action: ConnectionAction.CONNECT,
        result: ConnectionResult.SUCCESS,
        message: null,
        occurredAt: new Date(now - 1000 * 60 * 60 * 2),
      },
      {
        deviceId: blockedId,
        ipAddress: '192.168.1.13',
        macAddress: 'AA:BB:CC:00:00:04',
        action: ConnectionAction.BLOCKED,
        result: ConnectionResult.FAILED,
        message: 'Connection rejected: device is blocked',
        occurredAt: new Date(now - 1000 * 60 * 30),
      },
      {
        deviceId: blockedId,
        ipAddress: '192.168.1.13',
        macAddress: 'AA:BB:CC:00:00:04',
        action: ConnectionAction.ACCESS_ATTEMPT,
        result: ConnectionResult.FAILED,
        message: 'Repeated access attempt from a blocked device',
        occurredAt: new Date(now - 1000 * 60 * 5),
      },
    ],
  });
  console.log('Connection logs ready: 3 example entries');
}

async function seedNotifications(adminId: string): Promise<void> {
  await prisma.notification.createMany({
    data: [
      {
        adminId: null,
        type: NotificationType.SYSTEM,
        severity: NotificationSeverity.INFO,
        title: 'Welcome to SBM-NAC',
        message: 'Your monitoring dashboard is ready. Live metrics begin once the server starts.',
        isRead: false,
      },
      {
        adminId: null,
        type: NotificationType.DEVICE_BLOCKED,
        severity: NotificationSeverity.WARNING,
        title: 'Device blocked',
        message: 'Unregistered phone (AA:BB:CC:00:00:04) was blocked.',
        isRead: false,
      },
    ],
  });
  console.log(`Notifications ready for admin ${adminId}: 2 example entries`);
}

async function seedDrive(ownerId: string): Promise<void> {
  const folder = await prisma.driveFile.create({
    data: {
      name: 'Getting Started',
      path: '/Getting Started',
      type: DriveFileType.FOLDER,
      ownerId,
    },
  });

  await prisma.driveFile.create({
    data: {
      name: 'welcome.txt',
      path: '/Getting Started/welcome.txt',
      type: DriveFileType.FILE,
      mimeType: 'text/plain',
      sizeBytes: 512,
      parentId: folder.id,
      ownerId,
    },
  });
  console.log('Web Drive ready: 1 folder, 1 file');
}

async function main(): Promise<void> {
  console.log('Seeding SBM-NAC database...\n');

  const admin = await seedAdmin();
  const { localId } = await seedServers();
  const deviceIds = await seedDevices(localId);
  await seedSettings();

  if (admin.isFresh) {
    await seedConnectionLogs(deviceIds);
    await seedNotifications(admin.id);
    await seedDrive(admin.id);
  } else {
    console.log('Admin already existed — skipping connection logs, notifications, and drive seed to avoid duplicates.');
  }

  console.log('\nSeed complete.');
  if (admin.isFresh) {
    console.log(`Sign in with: ${config.seedAdmin.email} / (the password set in SEED_ADMIN_PASSWORD)`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
