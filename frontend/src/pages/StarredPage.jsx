import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as filesApi from '../services/filesApi';
import ItemList from '../components/ItemList';
import EmptyState from '../components/EmptyState';
import RenameModal from '../components/RenameModal';
import ShareModal from '../components/ShareModal';

export default function StarredPage() {
  const { view } = useOutletContext();
  const queryClient = useQueryClient();
  const [renameTarget, setRenameTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['starred'],
    queryFn: filesApi.listStarred,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['starred'] });
  }

  async function handleDownload(file) {
    const { url } = await filesApi.getDownloadUrl(file.id);
    window.location.href = url;
  }
  async function handleToggleStar(file) {
    await filesApi.updateFile(file.id, { starred: !file.starred });
    invalidate();
  }
  async function handleTrash(item) {
    await filesApi.trashFile(item.id);
    invalidate();
  }
  async function handleRename(newName) {
    await filesApi.updateFile(renameTarget.item.id, { name: newName });
    invalidate();
  }

  if (isLoading) return <p className="text-sm text-ink/40 font-mono py-10 text-center">Loading…</p>;

  const files = data ?? [];

  return (
    <div>
      <h1 className="font-display text-xl mb-5">Starred</h1>
      {files.length === 0 ? (
        <EmptyState title="No starred files" description="Star a file from its menu to pin it here for quick access." />
      ) : (
        <ItemList
          view={view}
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
