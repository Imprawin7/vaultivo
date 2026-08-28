import { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as foldersApi from '../services/foldersApi';
import * as filesApi from '../services/filesApi';
import ItemList from '../components/ItemList';
import EmptyState from '../components/EmptyState';
import Breadcrumbs from '../components/Breadcrumbs';
import RenameModal from '../components/RenameModal';
import ShareModal from '../components/ShareModal';

export default function DrivePage() {
  const { folderId } = useParams();
  const { view } = useOutletContext();
  const queryClient = useQueryClient();
  const [renameTarget, setRenameTarget] = useState(null); // { item, type }
  const [shareTarget, setShareTarget] = useState(null);

  const queryKey = ['folder', folderId ?? 'root'];
  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => (folderId ? foldersApi.getFolder(folderId) : foldersApi.getRoot()),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey });
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

  if (isLoading) {
    return <p className="text-sm text-ink/40 font-mono py-10 text-center">Loading…</p>;
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't open this folder"
        description="It may have been moved, deleted, or you no longer have access."
      />
    );
  }

  const folders = data?.childFolders ?? [];
  const files = data?.childFiles ?? [];
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div>
      <Breadcrumbs items={data?.breadcrumb ?? []} />

      {isEmpty ? (
        <EmptyState
          title="This vault is empty"
          description="Drag files in anywhere on this page, or use Upload in the sidebar to get started."
        />
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
