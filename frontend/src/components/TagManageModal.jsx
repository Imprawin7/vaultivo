import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import * as tagsApi from '../services/tagsApi';

const DEFAULT_COLOR = '#C6A15B';

export default function TagManageModal({ item, itemType, onClose }) {
  const queryClient = useQueryClient();
  const [newTagName, setNewTagName] = useState('');
  const [error, setError] = useState(null);

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: tagsApi.listTags });
  const { data: itemTags, isLoading } = useQuery({
    queryKey: ['item-tags', itemType, item.id],
    queryFn: () => (itemType === 'file' ? tagsApi.tagsForFile(item.id) : tagsApi.tagsForFolder(item.id)),
  });

  const assignedIds = new Set((itemTags ?? []).map((t) => t.id));

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['item-tags', itemType, item.id] });
  }

  async function handleToggle(tag) {
    setError(null);
    try {
      const isAssigned = assignedIds.has(tag.id);
      if (itemType === 'file') {
        await (isAssigned ? tagsApi.removeFromFile(tag.id, item.id) : tagsApi.assignToFile(tag.id, item.id));
      } else {
        await (isAssigned ? tagsApi.removeFromFolder(tag.id, item.id) : tagsApi.assignToFolder(tag.id, item.id));
      }
      invalidate();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update tag');
    }
  }

  async function handleCreateAndAssign(e) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setError(null);
    try {
      const tag = await tagsApi.createTag({ name: newTagName.trim(), color: DEFAULT_COLOR });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      if (itemType === 'file') await tagsApi.assignToFile(tag.id, item.id);
      else await tagsApi.assignToFolder(tag.id, item.id);
      setNewTagName('');
      invalidate();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create tag');
    }
  }

  return (
    <Modal title={`Tags — ${item.name}`} onClose={onClose} width="max-w-sm">
      {error && <p className="text-sm text-danger mb-3">{error}</p>}

      {isLoading ? (
        <p className="text-sm text-ink/40 font-mono text-center py-4">Loading…</p>
      ) : (allTags ?? []).length === 0 ? (
        <p className="text-sm text-ink/50 mb-4">You don't have any tags yet — create one below.</p>
      ) : (
        <div className="space-y-1.5 mb-4 max-h-64 overflow-y-auto">
          {allTags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-ticket hover:bg-paper cursor-pointer"
            >
              <input
                type="checkbox"
                checked={assignedIds.has(tag.id)}
                onChange={() => handleToggle(tag)}
                className="accent-vault"
              />
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color || DEFAULT_COLOR }} />
              <span className="text-sm text-ink">{tag.name}</span>
            </label>
          ))}
        </div>
      )}

      <form onSubmit={handleCreateAndAssign} className="flex gap-2">
        <input
          type="text"
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="New tag name…"
          maxLength={50}
          className="flex-1 px-3 py-2 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50"
        />
        <button type="submit" className="btn-primary text-sm">
          Create
        </button>
      </form>
    </Modal>
  );
}
