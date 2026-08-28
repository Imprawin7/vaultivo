import { useState } from 'react';
import Modal from './Modal';

export default function RenameModal({ item, onClose, onRename }) {
  const [name, setName] = useState(item.name);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || name === item.name) return onClose();
    setSubmitting(true);
    setError(null);
    try {
      await onRename(name.trim());
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not rename');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Rename" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-full px-3 py-2 text-sm bg-paper border border-line rounded-ticket focus:border-vault/50 mb-2"
        />
        {error && <p className="text-sm text-danger mb-2">{error}</p>}
        <div className="flex justify-end gap-2 mt-3">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
