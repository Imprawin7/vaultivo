import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFile } from '../services/filesApi';

/**
 * Wraps its children with a full-area dropzone. Tracks per-file progress in
 * local state and calls onUploaded(fileResponse) as each completes, so the
 * parent can refresh its listing incrementally rather than waiting for all
 * uploads to finish.
 */
export default function UploadDropzone({ folderId, onUploaded, children, inputRef }) {
  const [uploads, setUploads] = useState([]); // [{id, name, progress, error}]

  const onDrop = useCallback(
    (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        const uploadId = `${file.name}-${Date.now()}-${Math.random()}`;
        setUploads((prev) => [...prev, { id: uploadId, name: file.name, progress: 0, error: null }]);

        uploadFile({
          file,
          folderId,
          onProgress: (pct) =>
            setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, progress: pct } : u))),
        })
          .then((created) => {
            setUploads((prev) => prev.filter((u) => u.id !== uploadId));
            onUploaded?.(created);
          })
          .catch((err) => {
            const message = err.response?.data?.message || 'Upload failed';
            setUploads((prev) => prev.map((u) => (u.id === uploadId ? { ...u, error: message } : u)));
          });
      });
    },
    [folderId, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, noKeyboard: true });

  return (
    <div {...getRootProps()} className="relative flex-1 min-h-0">
      <input {...getInputProps()} ref={inputRef} />
      {children}

      {isDragActive && (
        <div className="absolute inset-0 z-30 bg-vault/5 border-2 border-dashed border-vault rounded-ticket flex items-center justify-center pointer-events-none">
          <p className="font-display text-xl text-vault">Drop to upload</p>
        </div>
      )}

      {uploads.length > 0 && (
        <div className="fixed bottom-5 right-5 w-72 bg-surface border border-line rounded-ticket shadow-xl z-40 overflow-hidden">
          <div className="px-3 py-2 border-b border-line text-xs font-medium text-ink/60">
            Uploading {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {uploads.map((u) => (
              <div key={u.id} className="px-3 py-2 border-b border-line last:border-b-0">
                <p className="text-xs truncate mb-1">{u.name}</p>
                {u.error ? (
                  <p className="text-xs text-danger">{u.error}</p>
                ) : (
                  <div className="h-1 rounded-full bg-line overflow-hidden">
                    <div className="h-full bg-vault transition-all duration-200" style={{ width: `${u.progress}%` }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
