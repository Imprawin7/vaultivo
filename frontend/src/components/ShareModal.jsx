import { useEffect, useState } from 'react';
import * as sharesApi from '../services/sharesApi';
import Modal from './Modal';

export default function ShareModal({ item, itemType, onClose }) {
  const [shares, setShares] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [shareError, setShareError] = useState(null);
  const [sharing, setSharing] = useState(false);

  const [linkPassword, setLinkPassword] = useState('');
  const [linkRole, setLinkRole] = useState('VIEWER');
  const [linkExpiry, setLinkExpiry] = useState(''); // hours, blank = never
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const isFile = itemType === 'file';
  const listShares = isFile ? sharesApi.listFileShares : sharesApi.listFolderShares;
  const doShare = isFile ? sharesApi.shareFile : sharesApi.shareFolder;
  const doRevokeShare = isFile ? sharesApi.revokeFileShare : sharesApi.revokeFolderShare;
  const listLinks = isFile ? sharesApi.listFileLinks : sharesApi.listFolderLinks;
  const doCreateLink = isFile ? sharesApi.createFileLink : sharesApi.createFolderLink;

  useEffect(() => {
    Promise.all([listShares(item.id), listLinks(item.id)])
      .then(([s, l]) => {
        setShares(s);
        setLinks(l);
      })
      .finally(() => setLoading(false));
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAddShare(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setSharing(true);
    setShareError(null);
    try {
      const created = await doShare(item.id, { email: email.trim(), role });
      setShares((prev) => [...prev.filter((s) => s.sharedWithEmail !== created.sharedWithEmail), created]);
      setEmail('');
    } catch (err) {
      setShareError(err.response?.data?.message || 'Could not share');
    } finally {
      setSharing(false);
    }
  }

  async function handleRevokeShare(shareId) {
    await doRevokeShare(item.id, shareId);
    setShares((prev) => prev.filter((s) => s.id !== shareId));
  }

  async function handleCreateLink(e) {
    e.preventDefault();
    setCreatingLink(true);
    try {
      const created = await doCreateLink(item.id, {
        role: linkRole,
        password: linkPassword.trim() || null,
        expiresInHours: linkExpiry ? Number(linkExpiry) : null,
      });
      setLinks((prev) => [...prev, created]);
      setLinkPassword('');
      setLinkExpiry('');
    } finally {
      setCreatingLink(false);
    }
  }

  async function handleRevokeLink(linkId) {
    await sharesApi.revokeLink(linkId);
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }

  function linkUrl(token) {
    return `${window.location.origin}/shared-link/${token}`;
  }

  function copyLink(link) {
    navigator.clipboard.writeText(linkUrl(link.token));
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <Modal title={`Share "${item.name}"`} onClose={onClose} width="max-w-lg">
      {loading ? (
        <p className="text-sm text-ink/50 py-6 text-center">Loading…</p>
      ) : (
        <div className="space-y-6">
          {/* Direct shares */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink/50 mb-2">Share with people</h3>
            <form onSubmit={handleAddShare} className="flex gap-2 mb-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 px-3 py-2 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="px-2 py-2 text-sm bg-paper border border-line rounded-ticket"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <button type="submit" disabled={sharing || !email.trim()} className="btn-primary disabled:opacity-50">
                {sharing ? '…' : 'Add'}
              </button>
            </form>
            {shareError && <p className="text-sm text-danger mb-2">{shareError}</p>}

            {shares.length > 0 ? (
              <ul className="space-y-1">
                {shares.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-b-0">
                    <span className="truncate">{s.sharedWithEmail}</span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-ink/50">{s.role}</span>
                      <button onClick={() => handleRevokeShare(s.id)} className="text-xs text-danger hover:underline">
                        Remove
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-ink/40">Not shared with anyone yet.</p>
            )}
          </section>

          {/* Public links */}
          <section>
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink/50 mb-2">Public links</h3>
            <form onSubmit={handleCreateLink} className="grid grid-cols-2 gap-2 mb-2">
              <select
                value={linkRole}
                onChange={(e) => setLinkRole(e.target.value)}
                className="px-2 py-2 text-sm bg-paper border border-line rounded-ticket"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              <input
                type="number"
                min="1"
                value={linkExpiry}
                onChange={(e) => setLinkExpiry(e.target.value)}
                placeholder="Expires in hours (optional)"
                className="px-3 py-2 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
              />
              <input
                type="password"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                placeholder="Password (optional)"
                className="col-span-2 px-3 py-2 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
              />
              <button type="submit" disabled={creatingLink} className="col-span-2 btn-secondary justify-center">
                {creatingLink ? 'Creating…' : 'Create link'}
              </button>
            </form>

            {links.length > 0 && (
              <ul className="space-y-1">
                {links.map((l) => (
                  <li key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-line last:border-b-0 gap-2">
                    <span className="truncate font-mono text-xs text-ink/60">{linkUrl(l.token)}</span>
                    <span className="flex items-center gap-2 shrink-0">
                      {l.hasPassword && <LockIcon />}
                      <button onClick={() => copyLink(l)} className="text-xs text-vault hover:underline">
                        {copiedId === l.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button onClick={() => handleRevokeLink(l.id)} className="text-xs text-danger hover:underline">
                        Revoke
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink/40">
      <rect x="5" y="11" width="14" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </svg>
  );
}
