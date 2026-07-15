'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Server } from '@/types/api';

interface ServerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  server?: Server | null;
}

interface FormValues {
  name: string;
  hostname: string;
  ipAddress: string;
  location: string;
  description: string;
}

const EMPTY_FORM: FormValues = { name: '', hostname: '', ipAddress: '', location: '', description: '' };

export function ServerFormModal({ isOpen, onClose, onSuccess, server }: ServerFormModalProps) {
  const isEditing = Boolean(server);
  const [values, setValues] = useState<FormValues>(() =>
    server
      ? {
          name: server.name,
          hostname: server.hostname,
          ipAddress: server.ipAddress,
          location: server.location ?? '',
          description: server.description ?? '',
        }
      : EMPTY_FORM,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        hostname: values.hostname,
        ipAddress: values.ipAddress,
        location: values.location || undefined,
        description: values.description || undefined,
      };
      if (isEditing && server) {
        await apiClient.patch(`/servers/${server.id}`, payload);
      } else {
        await apiClient.post('/servers', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit server' : 'Add server'}
      description="Servers registered here receive live resource samples from this app's collector."
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <FormField label="Name" htmlFor="server-name">
          <Input id="server-name" required value={values.name} onChange={update('name')} placeholder="Primary web server" />
        </FormField>
        <FormField label="Hostname" htmlFor="server-hostname">
          <Input id="server-hostname" required value={values.hostname} onChange={update('hostname')} placeholder="web-01.internal" />
        </FormField>
        <FormField label="IP address" htmlFor="server-ip">
          <Input
            id="server-ip"
            required
            value={values.ipAddress}
            onChange={update('ipAddress')}
            placeholder="10.0.0.10"
            className="font-data"
          />
        </FormField>
        <FormField label="Location" htmlFor="server-location" hint="Optional">
          <Input id="server-location" value={values.location} onChange={update('location')} placeholder="Jakarta, DC1" />
        </FormField>
        <FormField label="Description" htmlFor="server-description" hint="Optional">
          <Input id="server-description" value={values.description} onChange={update('description')} placeholder="Handles inbound HTTP traffic" />
        </FormField>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add server'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
