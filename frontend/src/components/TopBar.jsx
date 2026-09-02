import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

export default function TopBar({ view, onViewChange, showViewToggle = true }) {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSearchSubmit(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  const initials = (user?.displayName || user?.email || '?').slice(0, 1).toUpperCase();

  return (
    <header className="h-16 shrink-0 flex items-center gap-4 px-6 border-b border-line bg-paper">
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your files"
            className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-line rounded-ticket
                       placeholder:text-ink/40 focus:border-vault/50"
          />
        </div>
      </form>

      <div className="flex-1" />

      <ThemeToggle />

      {showViewToggle && (
        <div className="flex items-center border border-line rounded-ticket overflow-hidden">
          <button
            onClick={() => onViewChange('list')}
            aria-label="List view"
            className={`px-2.5 py-1.5 ${view === 'list' ? 'bg-vault text-paper' : 'text-ink/60 hover:bg-ink/5'}`}
          >
            <ListIcon />
          </button>
          <button
            onClick={() => onViewChange('grid')}
            aria-label="Grid view"
            className={`px-2.5 py-1.5 ${view === 'grid' ? 'bg-vault text-paper' : 'text-ink/60 hover:bg-ink/5'}`}
          >
            <GridIcon />
          </button>
        </div>
      )}

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="w-9 h-9 rounded-full bg-vault text-paper text-sm font-medium flex items-center justify-center"
        >
          {initials}
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-52 bg-surface border border-line rounded-ticket shadow-lg py-1 z-20">
            <div className="px-3 py-2 border-b border-line">
              <p className="text-sm font-medium truncate">{user?.displayName}</p>
              <p className="text-xs text-ink/50 truncate">{user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-3 py-2 text-sm text-ink/80 hover:bg-ink/5"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function SearchIcon(props) {
  return (
    <svg {...props} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}
