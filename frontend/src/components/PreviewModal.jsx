import { useEffect, useState } from 'react';
import Modal from './Modal';

/**
 * fetchPreviewUrl: async () => { url } — injected so this same component
 * works for both the authenticated Drive view (filesApi.getPreviewUrl) and
 * the anonymous public-link view (publicLinksApi.getPreviewUrl / ...folder
 * variant), without this component needing to know which context it's in.
 */
export default function PreviewModal({ file, fetchPreviewUrl, onClose, onDownload }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchPreviewUrl()
      .then((data) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load preview');
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPreviewUrl]);

  const isImage = file.mimeType?.startsWith('image/');
  const isPdf = file.mimeType === 'application/pdf';

  return (
    <Modal title={file.name} onClose={onClose} width="max-w-3xl">
      <div className="flex flex-col items-center">
        {error && <p className="text-sm text-danger py-8">{error}</p>}

        {!error && !url && <p className="text-sm text-ink/40 font-mono py-8">Loading preview…</p>}

        {!error && url && isImage && (
          <img src={url} alt={file.name} className="max-w-full max-h-[70vh] rounded-ticket border border-line" />
        )}

        {!error && url && isPdf && (
          <iframe src={url} title={file.name} className="w-full h-[70vh] rounded-ticket border border-line" />
        )}

        {!error && url && !isImage && !isPdf && (
          <p className="text-sm text-ink/50 py-8">Preview isn't available for this file type.</p>
        )}

        {onDownload && (
          <button onClick={onDownload} className="btn-primary text-sm mt-4">
            Download
          </button>
        )}
      </div>
    </Modal>
  );
}
