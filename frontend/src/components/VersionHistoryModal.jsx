import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import * as versionsApi from '../services/versionsApi';
import { formatBytes, formatDate } from '../lib/format';

export default function VersionHistoryModal({ file, onClose, onChanged }) {
  const queryClient = useQueryClient();
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const { data: versions, isLoading } = useQuery({
    queryKey: ['file-versions', file.id],
    queryFn: () => versionsApi.listVersions(file.id),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['file-versions', file.id] });
    onChanged?.();
  }

  async function handleFileSelected(e) {
    const selected = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!selected) return;

    setError(null);
    setUploading(true);
    setProgress(0);
    try {
      await versionsApi.uploadNewVersion({ fileId: file.id, file: selected, onProgress: setProgress });
      invalidate();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(versionId) {
    try {
      const { url } = await versionsApi.getVersionDownloadUrl(file.id, versionId);
      window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.message || 'Could not download this version');
    }
  }

  async function handleRestore(versionId) {
    if (!window.confirm('Restore this version? The current content will be kept in history too.')) return;
    try {
      await versionsApi.restoreVersion(file.id, versionId);
      invalidate();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not restore this version');
    }
  }

  return (
    <Modal title={`Version history — ${file.name}`} onClose={onClose} width="max-w-lg">
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelected} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-ink/50">
          Current: v{file.currentVersion ?? '—'} · {formatBytes(file.sizeBytes)}
        </p>
        <button onClick={() => inputRef.current?.click()} disabled={uploading} className="btn-primary text-sm disabled:opacity-50">
          {uploading ? `Uploading… ${progress}%` : 'Upload new version'}
        </button>
      </div>

      {error && <p className="text-sm text-danger mb-3">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-ink/40 font-mono text-center py-6">Loading…</p>
      ) : (versions ?? []).length === 0 ? (
        <p className="text-sm text-ink/50 text-center py-6">No earlier versions yet — this file has only ever had one version.</p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {versions.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-ticket border border-line bg-paper">
              <div>
                <p className="text-sm font-medium text-ink">Version {v.versionNumber}</p>
                <p className="text-xs text-ink/50 font-mono">
                  {formatBytes(v.sizeBytes)} · {formatDate(v.createdAt)} · {v.uploadedByEmail}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => handleDownload(v.id)} className="text-xs font-medium text-vault hover:underline">
                  Download
                </button>
                <button onClick={() => handleRestore(v.id)} className="text-xs font-medium text-ink/60 hover:text-ink">
                  Restore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
