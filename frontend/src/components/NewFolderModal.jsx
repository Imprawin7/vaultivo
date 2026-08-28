import { useState } from 'react';
import Modal from './Modal';

export default function NewFolderModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create folder');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New folder" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Untitled folder"
          className="w-full px-3 py-2 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50 mb-2"
        />
        {error && <p className="text-sm text-danger mb-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting || !name.trim()} className="btn-primary disabled:opacity-50">
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
