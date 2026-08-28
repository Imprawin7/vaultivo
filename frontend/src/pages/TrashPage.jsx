import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as trashApi from '../services/trashApi';
import * as filesApi from '../services/filesApi';
import * as foldersApi from '../services/foldersApi';
import ItemList from '../components/ItemList';
import EmptyState from '../components/EmptyState';

export default function TrashPage() {
  const { view } = useOutletContext();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trash'],
    queryFn: trashApi.listTrash,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['trash'] });
  }

  async function handleRestore(item, type) {
    if (type === 'file') await filesApi.restoreFile(item.id);
    else await foldersApi.restoreFolder(item.id);
    invalidate();
  }

  async function handleDeleteForever(item, type) {
    if (!window.confirm(`Permanently delete "${item.name}"? This can't be undone.`)) return;
    if (type === 'file') await filesApi.permanentlyDeleteFile(item.id);
    else await foldersApi.permanentlyDeleteFolder(item.id);
    invalidate();
  }

  async function handleEmptyTrash() {
    if (!window.confirm('Permanently delete everything in Trash? This cannot be undone.')) return;
    await trashApi.emptyTrash();
    invalidate();
  }

  if (isLoading) return <p className="text-sm text-ink/40 font-mono py-10 text-center">Loading…</p>;

  const folders = data?.folders ?? [];
  const files = data?.files ?? [];
  const isEmpty = folders.length === 0 && files.length === 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-xl">Trash</h1>
        {!isEmpty && (
          <button onClick={handleEmptyTrash} className="btn-danger">
            Empty trash
          </button>
        )}
      </div>

      {isEmpty ? (
        <EmptyState title="Trash is empty" description="Items you delete are kept here until you restore or empty the trash." />
      ) : (
        <ItemList
          view={view}
          folders={folders}
          files={files}
          mode="trash"
          onRestore={handleRestore}
          onDeleteForever={handleDeleteForever}
        />
      )}
    </div>
  );
}
