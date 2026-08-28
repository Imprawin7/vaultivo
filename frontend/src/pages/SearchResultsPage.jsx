import { useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as searchApi from '../services/searchApi';
import * as filesApi from '../services/filesApi';
import * as foldersApi from '../services/foldersApi';
import ItemList from '../components/ItemList';
import EmptyState from '../components/EmptyState';
import RenameModal from '../components/RenameModal';
import ShareModal from '../components/ShareModal';

export default function SearchResultsPage() {
  const { view } = useOutletContext();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const queryClient = useQueryClient();
  const [renameTarget, setRenameTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: () => searchApi.search(query),
    enabled: query.length > 0,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['search', query] });
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

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];

  return (
    <div>
      <h1 className="font-display text-xl mb-5">
        {query ? (
          <>
            Results for <span className="text-vault">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          'Search'
        )}
      </h1>

      {isLoading ? (
        <p className="text-sm text-ink/40 font-mono py-10 text-center">Searching…</p>
      ) : !query ? (
        <EmptyState title="Search your vault" description="Use the search bar above to find files and folders by name." />
      ) : folders.length === 0 && files.length === 0 ? (
        <EmptyState title="No matches" description="Try a different search term." />
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
