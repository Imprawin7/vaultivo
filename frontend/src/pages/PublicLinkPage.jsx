import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as publicLinksApi from '../services/publicLinksApi';
import ItemList from '../components/ItemList';

/**
 * Fully anonymous — no AuthProvider guard, matches the backend's permitAll
 * /api/public-links/** routes. Folder links show only the top level of
 * contents (no anonymous drill-down into nested folders — the backend
 * doesn't expose that recursively, so nested subfolders shown here are
 * display-only, not clickable).
 */
export default function PublicLinkPage() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [submittedPassword, setSubmittedPassword] = useState(undefined);
  const [downloadError, setDownloadError] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-link', token, submittedPassword],
    queryFn: () => publicLinksApi.getInfo(token, submittedPassword),
  });

  async function handleDownload() {
    setDownloadError(null);
    try {
      const { url } = await publicLinksApi.getDownloadUrl(token, submittedPassword);
      window.location.href = url;
    } catch (err) {
      setDownloadError(err.response?.data?.message || 'Could not download this file');
    }
  }

  function handlePasswordSubmit(e) {
    e.preventDefault();
    setSubmittedPassword(password);
  }

  if (isLoading) {
    return (
      <CenteredShell>
        <p className="text-ink/40 font-mono text-sm">Loading…</p>
      </CenteredShell>
    );
  }

  if (isError) {
    return (
      <CenteredShell>
        <h1 className="font-display text-xl mb-2">Link unavailable</h1>
        <p className="text-sm text-ink/50">This link may have expired, been revoked, or never existed.</p>
      </CenteredShell>
    );
  }

  // Backend reports requiresPassword=true with empty listings until the
  // correct password is supplied — see LinkShareService.getPublicInfo.
  const stillLocked = data.requiresPassword && submittedPassword === undefined;

  if (stillLocked) {
    return (
      <CenteredShell>
        <h1 className="font-display text-xl mb-1">{data.name}</h1>
        <p className="text-sm text-ink/50 mb-5">This link is password-protected.</p>
        <form onSubmit={handlePasswordSubmit} className="flex gap-2">
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="flex-1 px-3 py-2.5 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
          />
          <button type="submit" className="btn-primary">
            Unlock
          </button>
        </form>
      </CenteredShell>
    );
  }

  if (!data.isFolder) {
    return (
      <CenteredShell>
        <div className="w-14 h-14 rounded-ticket border border-line bg-surface deposit-card flex items-center justify-center mb-4 mx-auto">
          <FileIcon />
        </div>
        <h1 className="font-display text-xl mb-1 text-center">{data.name}</h1>
        <p className="text-xs text-ink/40 font-mono text-center mb-5 uppercase">{data.role} access</p>
        {downloadError && <p className="text-sm text-danger text-center mb-3">{downloadError}</p>}
        <button onClick={handleDownload} className="btn-primary w-full justify-center">
          Download
        </button>
      </CenteredShell>
    );
  }

  // Folder link — top-level listing only.
  return (
    <div className="min-h-screen bg-paper px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <span className="font-display text-2xl">{data.name}</span>
          <p className="text-xs text-ink/40 font-mono uppercase mt-1">{data.role} access · shared folder</p>
        </div>
        {data.childFolders.length === 0 && data.childFiles.length === 0 ? (
          <p className="text-sm text-ink/50">This folder is empty.</p>
        ) : (
          <ItemList
            view="list"
            folders={data.childFolders}
            files={data.childFiles}
            mode="readonly"
            onOpenFolder={() => {}} // no anonymous drill-down — see file header comment
            onDownload={async (file) => {
              try {
                const { url } = await publicLinksApi.getFolderFileDownloadUrl(token, file.id, submittedPassword);
                window.location.href = url;
              } catch (err) {
                alert(err.response?.data?.message || 'Could not download this file');
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

function CenteredShell({ children }) {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">{children}</div>
    </div>
  );
}

function FileIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-vault">
      <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M15 2v5h5" strokeLinejoin="round" />
    </svg>
  );
}
