import { useEffect, useRef, useState } from 'react';

export default function ItemActionsMenu({ actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="More actions"
        className="w-7 h-7 flex items-center justify-center rounded-ticket text-ink/50 hover:text-ink hover:bg-ink/5"
      >
        <DotsIcon />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-surface border border-line rounded-ticket shadow-lg py-1 z-20">
          {actions.map((a) =>
            a.divider ? (
              <div key={a.key} className="my-1 border-t border-line" />
            ) : (
              <button
                key={a.key}
                onClick={() => {
                  setOpen(false);
                  a.onClick();
                }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-ink/5 ${
                  a.danger ? 'text-danger' : 'text-ink/80'
                }`}
              >
                {a.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

function DotsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
