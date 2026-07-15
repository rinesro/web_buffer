'use client';

import { useState, type FormEvent } from 'react';
import { DeviceType } from '@sbm-nac/shared-types';
import { Button } from '@/components/ui/Button';
import { FormField, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, ApiError, buildQuery } from '@/lib/api-client';
import type { Device, Paginated, Server } from '@/types/api';

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device?: Device | null;
}

interface FormValues {
  name: string;
  ipAddress: string;
  macAddress: string;
  deviceType: DeviceType;
  serverId: string;
}

const EMPTY_FORM: FormValues = {
  name: '',
  ipAddress: '',
  macAddress: '',
  deviceType: DeviceType.UNKNOWN,
  serverId: '',
};

export function DeviceFormModal({ isOpen, onClose, onSuccess, device }: DeviceFormModalProps) {
  const isEditing = Boolean(device);
  const [values, setValues] = useState<FormValues>(() =>
    device
      ? {
          name: device.name,
          ipAddress: device.ipAddress,
          macAddress: device.macAddress,
          deviceType: device.deviceType,
          serverId: device.serverId ?? '',
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: serverPage } = useApiQuery<Paginated<Server> | null>(
    () => (isOpen ? apiClient.get(`/servers${buildQuery({ page: 1, pageSize: 100 })}`) : Promise.resolve(null)),
    [isOpen],
  );

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (isEditing && device) {
        await apiClient.patch(`/devices/${device.id}`, {
          name: values.name,
          ipAddress: values.ipAddress,
          deviceType: values.deviceType,
          serverId: values.serverId || null,
        });
      } else {
        await apiClient.post('/devices', {
          name: values.name,
          ipAddress: values.ipAddress,
          macAddress: values.macAddress,
          deviceType: values.deviceType,
          serverId: values.serverId || undefined,
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save this device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit device' : 'Register device'}
      description="New devices register as Pending until an admin allows or blocks them."
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <FormField label="Name" htmlFor="device-name">
          <Input
            id="device-name"
            required
            value={values.name}
            onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Alice's laptop"
          />
        </FormField>
        <FormField label="IP address" htmlFor="device-ip">
          <Input
            id="device-ip"
            required
            className="font-data"
            value={values.ipAddress}
            onChange={(e) => setValues((prev) => ({ ...prev, ipAddress: e.target.value }))}
            placeholder="192.168.1.42"
          />
        </FormField>
        <FormField label="MAC address" htmlFor="device-mac" hint={isEditing ? 'MAC address cannot be changed after registration' : undefined}>
          <Input
            id="device-mac"
            required
            disabled={isEditing}
            className="font-data"
            value={values.macAddress}
            onChange={(e) => setValues((prev) => ({ ...prev, macAddress: e.target.value }))}
            placeholder="AA:BB:CC:DD:EE:FF"
          />
        </FormField>
        <FormField label="Device type" htmlFor="device-type">
          <Select
            id="device-type"
            value={values.deviceType}
            onChange={(e) => setValues((prev) => ({ ...prev, deviceType: e.target.value as DeviceType }))}
          >
            {Object.values(DeviceType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Server" htmlFor="device-server" hint="Optional — the network segment this device belongs to">
          <Select
            id="device-server"
            value={values.serverId}
            onChange={(e) => setValues((prev) => ({ ...prev, serverId: e.target.value }))}
          >
            <option value="">Unassigned</option>
            {serverPage?.items.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </Select>
        </FormField>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Register device'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
