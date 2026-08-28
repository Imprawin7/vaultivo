import { useNavigate } from 'react-router-dom';
import { formatBytes, formatDate } from '../lib/format';
import ItemActionsMenu from './ItemActionsMenu';

/**
 * folders/files: arrays from FolderDetailResponse / search / starred / trash.
 * mode: 'browse' (default actions) | 'trash' (restore/delete-forever) | 'readonly' (shared-with-me, no destructive actions since the viewer may only have Viewer access).
 */
export default function ItemList({
  view,
  folders = [],
  files = [],
  mode = 'browse',
  onOpenFolder,
  onDownload,
  onShare,
  onRename,
  onToggleStar,
  onTrash,
  onRestore,
  onDeleteForever,
}) {
  const navigate = useNavigate();

  if (folders.length === 0 && files.length === 0) {
    return null; // caller renders EmptyState
  }

  function folderActions(folder) {
    if (mode === 'trash') {
      return [
        { key: 'restore', label: 'Restore', onClick: () => onRestore(folder, 'folder') },
        { key: 'delete', label: 'Delete forever', danger: true, onClick: () => onDeleteForever(folder, 'folder') },
      ];
    }
    if (mode === 'readonly') return [];
    return [
      { key: 'rename', label: 'Rename', onClick: () => onRename(folder, 'folder') },
      { key: 'share', label: 'Share', onClick: () => onShare(folder, 'folder') },
      { key: 'd1', divider: true },
      { key: 'trash', label: 'Move to trash', danger: true, onClick: () => onTrash(folder, 'folder') },
    ];
  }

  function fileActions(file) {
    if (mode === 'trash') {
      return [
        { key: 'restore', label: 'Restore', onClick: () => onRestore(file, 'file') },
        { key: 'delete', label: 'Delete forever', danger: true, onClick: () => onDeleteForever(file, 'file') },
      ];
    }
    const base = [
      { key: 'download', label: 'Download', onClick: () => onDownload(file) },
    ];
    if (mode === 'readonly') return base;
    return [
      ...base,
      { key: 'star', label: file.starred ? 'Remove star' : 'Add star', onClick: () => onToggleStar(file) },
      { key: 'rename', label: 'Rename', onClick: () => onRename(file, 'file') },
      { key: 'share', label: 'Share', onClick: () => onShare(file, 'file') },
      { key: 'd1', divider: true },
      { key: 'trash', label: 'Move to trash', danger: true, onClick: () => onTrash(file, 'file') },
    ];
  }

  if (view === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => (onOpenFolder ? onOpenFolder(folder) : navigate(`/drive/${folder.id}`))}
            className="deposit-card p-4 pt-5 cursor-pointer flex flex-col gap-2"
          >
            <div className="flex items-start justify-between">
              <FolderIcon />
              <ItemActionsMenu actions={folderActions(folder)} />
            </div>
            <p className="text-sm font-medium truncate">{folder.name}</p>
          </div>
        ))}
        {files.map((file) => (
          <div key={file.id} className="deposit-card p-4 pt-5 flex flex-col gap-2">
            <div className="flex items-start justify-between">
              <FileIcon />
              <ItemActionsMenu actions={fileActions(file)} />
            </div>
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs font-mono text-ink/40">{formatBytes(file.sizeBytes)}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="border border-line rounded-ticket overflow-hidden bg-surface">
      <div className="ledger-row bg-paper/60 text-xs font-mono text-ink/50 uppercase tracking-wide">
        <span className="w-5" />
        <span className="flex-1">Name</span>
        <span className="w-28 text-right">Size</span>
        <span className="w-28 text-right">Modified</span>
        <span className="w-7" />
      </div>
      {folders.map((folder) => (
        <div
          key={folder.id}
          onClick={() => (onOpenFolder ? onOpenFolder(folder) : navigate(`/drive/${folder.id}`))}
          className="ledger-row cursor-pointer"
        >
          <FolderIcon small />
          <span className="flex-1 text-sm truncate">{folder.name}</span>
          <span className="w-28 text-right text-xs font-mono text-ink/40">—</span>
          <span className="w-28 text-right text-xs font-mono text-ink/40">{formatDate(folder.updatedAt)}</span>
          <span className="w-7 flex justify-end">
            <ItemActionsMenu actions={folderActions(folder)} />
          </span>
        </div>
      ))}
      {files.map((file) => (
        <div key={file.id} className="ledger-row">
          <FileIcon small />
          <span className="flex-1 text-sm truncate flex items-center gap-1.5">
            {file.name}
            {file.starred && <StarBadge />}
          </span>
          <span className="w-28 text-right text-xs font-mono text-ink/40">{formatBytes(file.sizeBytes)}</span>
          <span className="w-28 text-right text-xs font-mono text-ink/40">{formatDate(file.updatedAt)}</span>
          <span className="w-7 flex justify-end">
            <ItemActionsMenu actions={fileActions(file)} />
          </span>
        </div>
      ))}
    </div>
  );
}

function FolderIcon({ small }) {
  const s = small ? 18 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-brass shrink-0">
      <path d="M3 7l1.5-2h6L12 7h9v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}
function FileIcon({ small }) {
  const s = small ? 18 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-vault shrink-0">
      <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" strokeLinejoin="round" />
      <path d="M15 2v5h5" strokeLinejoin="round" />
    </svg>
  );
}
function StarBadge() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-brass shrink-0">
      <path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9l-5.6 3.2 1.4-6.3-4.8-4.3 6.4-.6L12 3z" />
    </svg>
  );
}
