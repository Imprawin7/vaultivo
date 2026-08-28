import { useEffect } from 'react';

export default function Modal({ title, onClose, children, width = 'max-w-md' }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-[1px]">
      <div
        className={`w-full ${width} bg-surface rounded-ticket border border-line shadow-xl mx-4`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 id="modal-title" className="font-display text-lg">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-ink/50 hover:text-ink w-7 h-7 flex items-center justify-center rounded-ticket hover:bg-ink/5"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
