import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as tagsApi from '../services/tagsApi';
import * as filesApi from '../services/filesApi';
import * as foldersApi from '../services/foldersApi';
import ItemList from '../components/ItemList';
import EmptyState from '../components/EmptyState';
import RenameModal from '../components/RenameModal';
import ShareModal from '../components/ShareModal';

const DEFAULT_COLOR = '#C6A15B';

export default function TagsPage() {
  const { view } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedTag, setSelectedTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [renameTarget, setRenameTarget] = useState(null); // { item, type }
  const [shareTarget, setShareTarget] = useState(null);

  const { data: tags, isLoading: tagsLoading } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.listTags });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['tag-items', selectedTag?.id],
    queryFn: () => tagsApi.itemsByTag(selectedTag.id),
    enabled: !!selectedTag,
  });

  function invalidateTags() {
    queryClient.invalidateQueries({ queryKey: ['tags'] });
  }
  function invalidateItems() {
    queryClient.invalidateQueries({ queryKey: ['tag-items', selectedTag?.id] });
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await tagsApi.createTag({ name: newTagName.trim(), color: DEFAULT_COLOR });
      setNewTagName('');
      invalidateTags();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create tag');
    }
  }

  async function handleDelete(tag) {
    if (!window.confirm(`Delete the tag "${tag.name}"? This removes it from every file and folder.`)) return;
    try {
      await tagsApi.deleteTag(tag.id);
      if (selectedTag?.id === tag.id) setSelectedTag(null);
      invalidateTags();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete tag');
    }
  }

  async function handleDownload(file) {
    const { url } = await filesApi.getDownloadUrl(file.id);
    window.location.href = url;
  }
  async function handleToggleStar(file) {
    await filesApi.updateFile(file.id, { starred: !file.starred });
    invalidateItems();
  }
  async function handleTrash(item, type) {
    if (type === 'file') await filesApi.trashFile(item.id);
    else await foldersApi.trashFolder(item.id);
    invalidateItems();
  }

  async function handleRename(newName) {
    const { item, type } = renameTarget;
    if (type === 'file') await filesApi.updateFile(item.id, { name: newName });
    else await foldersApi.updateFolder(item.id, { name: newName });
    invalidateItems();
  }

  return (
    <div>
      <h1 className="font-display text-xl mb-1">Tags</h1>
      <p className="text-xs text-ink/40 font-mono mb-5">Your personal labels — click a tag to see everything tagged with it.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {tagsLoading ? (
          <p className="text-sm text-ink/40 font-mono">Loading…</p>
        ) : (
          (tags ?? []).map((tag) => (
            <div
              key={tag.id}
              className={`group flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-ticket border cursor-pointer transition-colors ${
                selectedTag?.id === tag.id ? 'border-vault bg-vault/10' : 'border-line bg-surface hover:bg-paper'
              }`}
              onClick={() => setSelectedTag(tag)}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color || DEFAULT_COLOR }} />
              <span className="text-sm text-ink">{tag.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(tag);
                }}
                className="text-ink/30 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-xs"
                title="Delete tag"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-8 max-w-sm">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name…"
          maxLength={50}
          className="flex-1 px-3 py-2 text-sm bg-surface border border-line rounded-ticket focus:border-vault/50"
        />
        <button type="submit" className="btn-primary text-sm">
          Create
        </button>
      </form>

      {selectedTag && (
        <div>
          <h2 className="text-sm font-medium text-ink/70 mb-3">Tagged "{selectedTag.name}"</h2>
          {itemsLoading ? (
            <p className="text-sm text-ink/40 font-mono py-6 text-center">Loading…</p>
          ) : (items?.folders ?? []).length === 0 && (items?.files ?? []).length === 0 ? (
            <EmptyState title="Nothing tagged yet" description={`Use "Manage tags" on any file or folder to tag it "${selectedTag.name}".`} />
          ) : (
            <ItemList
              view={view}
              folders={items.folders}
              files={items.files}
              onDownload={handleDownload}
              onToggleStar={handleToggleStar}
              onTrash={handleTrash}
              onRename={(item, type) => setRenameTarget({ item, type })}
              onShare={(item, type) => setShareTarget({ item, type })}
            />
          )}
        </div>
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
