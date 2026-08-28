import { NavLink } from 'react-router-dom';
import { formatBytes } from '../lib/format';

const NAV_ITEMS = [
  { to: '/drive', label: 'My Drive', icon: DriveIcon },
  { to: '/shared', label: 'Shared with me', icon: SharedIcon },
  { to: '/starred', label: 'Starred', icon: StarIcon },
  { to: '/trash', label: 'Trash', icon: TrashIcon },
];

export default function Sidebar({ user, onNewFolder, onUploadClick }) {
  const used = user?.storageUsedBytes ?? 0;
  const quota = user?.storageQuotaBytes ?? 1;
  const pct = Math.min(100, Math.round((used / quota) * 100));

  return (
    <aside className="w-60 shrink-0 bg-ink text-paper flex flex-col h-full">
      <div className="px-5 pt-6 pb-5">
        <span className="font-display text-2xl tracking-wide" style={{ letterSpacing: '0.02em' }}>
          Vaultivo
        </span>
      </div>

      <div className="px-4 mb-4 flex flex-col gap-2">
        <button onClick={onUploadClick} className="btn-primary justify-center w-full">
          <UploadIcon /> Upload file
        </button>
        <button
          onClick={onNewFolder}
          className="inline-flex items-center gap-2 justify-center px-4 py-2 text-sm font-medium rounded-ticket
                     border border-paper/20 text-paper/90 hover:bg-paper/5 transition-colors duration-150"
        >
          <FolderPlusIcon /> New folder
        </button>
      </div>

      <nav className="flex-1 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-ticket text-sm transition-colors duration-150 ${
                isActive ? 'bg-paper/10 text-paper font-medium' : 'text-paper/70 hover:bg-paper/5 hover:text-paper'
              }`
            }
          >
            <Icon /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-5 border-t border-paper/10">
        <div className="flex justify-between text-xs text-paper/60 mb-1.5 font-mono">
          <span>{formatBytes(used)} used</span>
          <span>{formatBytes(quota)}</span>
        </div>
        {/* Brass gauge bar — the storage meter as a small vault-dial detail */}
        <div className="h-1.5 rounded-full bg-paper/10 overflow-hidden">
          <div className="h-full bg-brass transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </aside>
  );
}

function DriveIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7l3-4h12l3 4M3 7v11a2 2 0 002 2h14a2 2 0 002-2V7M3 7h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SharedIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" strokeLinecap="round" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path
        d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9l-5.6 3.2 1.4-6.3-4.8-4.3 6.4-.6L12 3z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 16V4M7 9l5-5 5 5M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FolderPlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 7l1.5-2h6L12 7h9v11a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" strokeLinejoin="round" />
      <path d="M12 12v4M10 14h4" strokeLinecap="round" />
    </svg>
  );
}
