import { Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', end: true },
];

export default function AdminLayout() {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <p className="text-ink/40 font-mono text-sm">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (!user?.isAdmin) {
    return <Navigate to="/drive" replace />;
  }

  return (
    <div className="flex h-screen bg-paper text-ink">
      <aside className="w-60 shrink-0 bg-ink text-paper flex flex-col h-full">
        <div className="px-5 pt-6 pb-5">
          <div
            className="font-display text-2xl tracking-wide"
            style={{ letterSpacing: '0.02em' }}
          >
            Vaultivo
          </div>

          <div className="mt-1 text-[10px] font-mono uppercase tracking-[0.18em] text-paper/40">
            Admin Console
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-ticket text-sm transition-colors duration-150 ${
                  isActive
                    ? 'bg-paper/10 text-paper font-medium'
                    : 'text-paper/70 hover:bg-paper/5 hover:text-paper'
                }`
              }
            >
              <DashboardIcon />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-paper/10">
          <div className="text-xs text-paper/60 truncate">
            {user.email}
          </div>

          <div className="text-[10px] font-mono uppercase tracking-wide text-brass mt-1">
            Administrator
          </div>

          <NavLink
            to="/drive"
            className="inline-flex mt-3 text-xs font-medium text-paper/60 hover:text-paper"
          >
            ← Back to Drive
          </NavLink>
        </div>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-16 shrink-0 border-b border-line bg-surface flex items-center justify-between px-6">
          <div>
            <h1 className="font-display text-lg">
              Administration
            </h1>

            <p className="text-[10px] font-mono uppercase tracking-wide text-ink/40">
              Platform management
            </p>
          </div>

          <div className="text-xs font-mono text-ink/50">
            {user.displayName || user.email}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </svg>
  );
}