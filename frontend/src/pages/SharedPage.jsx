import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as sharesApi from '../services/sharesApi';
import * as filesApi from '../services/filesApi';
import * as foldersApi from '../services/foldersApi';
import ItemList from '../components/ItemList';
import EmptyState from '../components/EmptyState';
import RenameModal from '../components/RenameModal';
import ShareModal from '../components/ShareModal';

/**
 * Actions here use 'browse' mode (not a stripped-down readonly mode) even
 * though some items may only grant Viewer access — the backend is the real
 * authority on what's allowed, and a Viewer attempting an Editor action
 * gets a clear rejected-by-server message in the modal rather than the
 * option being silently hidden. A future improvement would have the API
 * surface the caller's effective role per item so the UI can hide actions
 * proactively instead.
 */
export default function SharedPage() {
  const { view } = useOutletContext();
  const queryClient = useQueryClient();
  const [renameTarget, setRenameTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['shared-with-me'],
    queryFn: sharesApi.listSharedWithMe,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['shared-with-me'] });
  }

  async function handleDownload(file) {
    const { url } = await filesApi.getDownloadUrl(file.id);
    window.location.href = url;
  }
  async function handleToggleStar(file) {
    await filesApi.updateFile(file.id, { starred: !file.starred });
    invalidate();
  }
  async function handleTrash(item, type) {
    if (type === 'file') await filesApi.trashFile(item.id);
    else await foldersApi.trashFolder(item.id);
    invalidate();
  }
  async function handleRename(newName) {
    const { item, type } = renameTarget;
    if (type === 'file') await filesApi.updateFile(item.id, { name: newName });
    else await foldersApi.updateFolder(item.id, { name: newName });
    invalidate();
  }

  if (isLoading) return <p className="text-sm text-ink/40 font-mono py-10 text-center">Loading…</p>;

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];

  return (
    <div>
      <h1 className="font-display text-xl mb-5">Shared with me</h1>
      {folders.length === 0 && files.length === 0 ? (
        <EmptyState title="Nothing shared yet" description="Files and folders others share with you will show up here." />
      ) : (
        <ItemList
          view={view}
          folders={folders}
          files={files}
          onDownload={handleDownload}
          onShare={(item, type) => setShareTarget({ item, type })}
          onRename={(item, type) => setRenameTarget({ item, type })}
          onToggleStar={handleToggleStar}
          onTrash={handleTrash}
        />
      )}
      {renameTarget && (
        <RenameModal item={renameTarget.item} onClose={() => setRenameTarget(null)} onRename={handleRename} />
      )}
      {shareTarget && (
        <ShareModal item={shareTarget.item} itemType={shareTarget.type} onClose={() => setShareTarget(null)} />
      )}
    </div>
  );
}
