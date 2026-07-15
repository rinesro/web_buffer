import {
  ConnectionAction,
  ConnectionResult,
  type DeviceStatus,
  NotificationSeverity,
  NotificationType,
} from '@sbm-nac/shared-types';
import type { Device } from '../../domain/entities/Device';
import type { PaginatedResult, PaginationParams } from '../../domain/repositories/shared';
import type { IConnectionLogRepository } from '../../domain/repositories/IConnectionLogRepository';
import type { IDeviceRepository } from '../../domain/repositories/IDeviceRepository';
import type { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import type {
  DeviceQueryDto,
  RegisterDeviceDto,
  UpdateDeviceDto,
} from '../dto/device.dto';
import { ConflictError, NotFoundError } from '../../shared/errors/AppError';

export class DeviceService {
  constructor(
    private readonly deviceRepository: IDeviceRepository,
    private readonly connectionLogRepository: IConnectionLogRepository,
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async list(
    pagination: PaginationParams,
    filter: Pick<DeviceQueryDto, 'status' | 'search'>,
  ): Promise<PaginatedResult<Device>> {
    return this.deviceRepository.findAll(pagination, filter);
  }

  async getById(id: string): Promise<Device> {
    const device = await this.deviceRepository.findById(id);
    if (!device) throw new NotFoundError('Device');
    return device;
  }

  async register(data: RegisterDeviceDto): Promise<Device> {
    const normalizedMac = data.macAddress.toUpperCase();
    const existing = await this.deviceRepository.findByMacAddress(normalizedMac);
    if (existing) {
      throw new ConflictError(`A device with MAC address ${data.macAddress} is already registered`);
    }

    const device = await this.deviceRepository.create({
      name: data.name,
      ipAddress: data.ipAddress,
      macAddress: normalizedMac,
      deviceType: data.deviceType,
      serverId: data.serverId ?? null,
    });

    await this.connectionLogRepository.create({
      deviceId: device.id,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress,
      action: ConnectionAction.ACCESS_ATTEMPT,
      result: ConnectionResult.SUCCESS,
      message: 'Device registered and awaiting approval',
    });

    return device;
  }

  async update(id: string, data: UpdateDeviceDto): Promise<Device> {
    await this.getById(id);
    return this.deviceRepository.update(id, data);
  }

  async setStatus(id: string, status: DeviceStatus): Promise<Device> {
    const device = await this.getById(id);
    const updated = await this.deviceRepository.updateStatus(id, status);
    const wasAllowed = status === 'ALLOWED';

    await this.connectionLogRepository.create({
      deviceId: device.id,
      ipAddress: device.ipAddress,
      macAddress: device.macAddress,
      action: wasAllowed ? ConnectionAction.ALLOWED : ConnectionAction.BLOCKED,
      result: ConnectionResult.SUCCESS,
      message: `Device status changed to ${status}`,
    });

    await this.notificationRepository.create({
      adminId: null,
      type: wasAllowed ? NotificationType.DEVICE_ALLOWED : NotificationType.DEVICE_BLOCKED,
      severity: wasAllowed ? NotificationSeverity.INFO : NotificationSeverity.WARNING,
      title: wasAllowed ? 'Device allowed' : 'Device blocked',
      message: `${device.name} (${device.macAddress}) was ${wasAllowed ? 'allowed' : 'blocked'}`,
      metadata: JSON.stringify({ deviceId: device.id }),
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.deviceRepository.delete(id);
  }

  /** Called by the NAC ingest path when a device is observed on the network. */
  async recordSighting(macAddress: string, ipAddress: string): Promise<Device | null> {
    const device = await this.deviceRepository.findByMacAddress(macAddress.toUpperCase());
    if (!device) return null;

    await this.deviceRepository.updateLastSeen(device.id, ipAddress, new Date());
    const isBlocked = device.status === 'BLOCKED';

    await this.connectionLogRepository.create({
      deviceId: device.id,
      ipAddress,
      macAddress: device.macAddress,
      action: isBlocked ? ConnectionAction.BLOCKED : ConnectionAction.CONNECT,
      result: isBlocked ? ConnectionResult.FAILED : ConnectionResult.SUCCESS,
      message: isBlocked ? 'Connection rejected: device is blocked' : null,
    });

    return device;
  }

  async getStatusCounts(): Promise<Record<DeviceStatus, number>> {
    return this.deviceRepository.countByStatus();
  }
}
