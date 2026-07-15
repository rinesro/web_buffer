'use client';

import { useState } from 'react';
import { ChevronRight, File, FilePlus2, Folder, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { FormField, Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from '@/components/ui/Table';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient, ApiError } from '@/lib/api-client';
import { formatBytes, formatDateTime } from '@/lib/utils';
import type { DriveFile } from '@/types/api';

interface Breadcrumb {
  id: string | null;
  name: string;
}

export function DriveExplorer() {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([{ id: null, name: 'Home' }]);
  const currentFolder = breadcrumbs[breadcrumbs.length - 1] ?? { id: null, name: 'Home' };

  const [modal, setModal] = useState<'folder' | 'file' | null>(null);
  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);
  const [name, setName] = useState('');
  const [sizeKb, setSizeKb] = useState('128');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: items,
    error: listError,
    isLoading,
    refetch,
  } = useApiQuery<DriveFile[]>(
    () => apiClient.get(`/drive${currentFolder.id ? `?parentId=${currentFolder.id}` : ''}`),
    [currentFolder.id],
  );

  const openFolder = (folder: DriveFile): void => {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const jumpTo = (index: number): void => setBreadcrumbs((prev) => prev.slice(0, index + 1));

  const closeModal = (): void => {
    setModal(null);
    setRenameTarget(null);
    setName('');
    setSizeKb('128');
    setError(null);
  };

  const handleCreateFolder = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/drive/folders', { name, parentId: currentFolder.id });
      refetch();
      closeModal();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create this folder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateFile = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/drive/files', {
        name,
        parentId: currentFolder.id,
        sizeBytes: Math.max(0, Number(sizeKb) || 0) * 1024,
      });
      refetch();
      closeModal();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create this file.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRename = async (): Promise<void> => {
    if (!renameTarget) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/drive/${renameTarget.id}/rename`, { name });
      refetch();
      closeModal();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not rename this item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await apiClient.delete(`/drive/${deleteTarget.id}`);
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.id ?? 'root'} className="flex items-center gap-1">
              {index > 0 ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : null}
              <button
                type="button"
                onClick={() => jumpTo(index)}
                className={
                  index === breadcrumbs.length - 1
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </nav>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setModal('folder')}>
            <FolderPlus className="h-4 w-4" />
            New folder
          </Button>
          <Button variant="outline" size="sm" onClick={() => setModal('file')}>
            <FilePlus2 className="h-4 w-4" />
            New file
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Loading" />
      ) : listError ? (
        <ErrorState message={listError} onRetry={refetch} />
      ) : !items?.length ? (
        <EmptyState title="This folder is empty" description="Create a folder or file to get started." />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>Size</TableHeaderCell>
              <TableHeaderCell>Updated</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  {item.type === 'FOLDER' ? (
                    <button
                      type="button"
                      onClick={() => openFolder(item)}
                      className="flex items-center gap-2 font-medium text-foreground hover:text-primary"
                    >
                      <Folder className="h-4 w-4 text-primary" /> {item.name}
                    </button>
                  ) : (
                    <span className="flex items-center gap-2 text-foreground">
                      <File className="h-4 w-4 text-muted-foreground" /> {item.name}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-data text-muted-foreground">
                  {item.type === 'FILE' ? formatBytes(item.sizeBytes) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDateTime(item.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Rename ${item.name}`}
                      onClick={() => {
                        setRenameTarget(item);
                        setName(item.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${item.name}`}
                      onClick={() => setDeleteTarget(item)}
                      className="hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={modal === 'folder'} onClose={closeModal} title="New folder">
        <div className="space-y-4">
          <FormField label="Folder name" htmlFor="folder-name">
            <Input id="folder-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Reports" />
          </FormField>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button isLoading={isSubmitting} disabled={!name} onClick={() => void handleCreateFolder()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'file'}
        onClose={closeModal}
        title="New file"
        description="This creates a file record for the simulation — no bytes are actually uploaded or stored."
      >
        <div className="space-y-4">
          <FormField label="File name" htmlFor="file-name">
            <Input id="file-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="q3-report.pdf" />
          </FormField>
          <FormField label="Declared size (KB)" htmlFor="file-size">
            <Input
              id="file-size"
              type="number"
              min={0}
              className="font-data"
              value={sizeKb}
              onChange={(e) => setSizeKb(e.target.value)}
            />
          </FormField>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button isLoading={isSubmitting} disabled={!name} onClick={() => void handleCreateFile()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={renameTarget !== null} onClose={closeModal} title={`Rename "${renameTarget?.name}"`}>
        <div className="space-y-4">
          <FormField label="New name" htmlFor="rename-name">
            <Input id="rename-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button isLoading={isSubmitting} disabled={!name} onClick={() => void handleRename()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name}"`}
        description={
          deleteTarget?.type === 'FOLDER'
            ? 'This deletes the folder and everything inside it. This cannot be undone.'
            : 'This cannot be undone.'
        }
        isConfirming={isSubmitting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
