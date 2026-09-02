import { Navigate, Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import * as adminApi from '../services/adminApi';
import { formatDate } from '../lib/format';

const NAV_ITEMS = [
  { to: '/admin', label: 'Dashboard', end: true, icon: DashboardIcon },
  { to: '/admin/users', label: 'Users', icon: UsersIcon },
  { to: '/admin/storage', label: 'Storage', icon: StorageIcon },
  { to: '/admin/activity', label: 'Activity Logs', icon: ActivityIcon },
  { to: '/admin/security', label: 'Security', icon: SecurityIcon },
];

const PAGE_TITLES = {
  '/admin': ['Dashboard', 'Overview of your Vaultivo platform'],
  '/admin/users': ['Users', 'Manage Vaultivo accounts and permissions'],
  '/admin/storage': ['Storage', 'Monitor platform capacity and usage'],
  '/admin/activity': ['Activity Logs', 'Review platform activity and audit records'],
  '/admin/security': ['Security', 'Review access and security events'],
};

export default function AdminLayout() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('vaultivo_admin_read_notifications') || '[]'); } catch { return []; }
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => adminApi.recentActivity(10),
    enabled: Boolean(isAuthenticated && user?.isAdmin),
    refetchInterval: 30000,
  });
  const unreadCount = useMemo(() => notifications.filter((item) => !readIds.includes(item.id)).length, [notifications, readIds]);

  useEffect(() => {
    localStorage.setItem('vaultivo_admin_read_notifications', JSON.stringify(readIds.slice(-100)));
  }, [readIds]);

  const [title, subtitle] = PAGE_TITLES[location.pathname] || PAGE_TITLES['/admin'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink">
        <p className="text-ink/40 font-mono text-sm">Loading admin console…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!user?.isAdmin) {
    return <Navigate to="/drive" replace />;
  }

  const initials = (user.displayName || user.email || 'A')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="hidden md:flex md:w-[250px] shrink-0 bg-ink text-paper flex-col min-h-screen sticky top-0">
        <AdminBrand />
        <AdminNav />
        <AdminIdentity user={user} initials={initials} onLogout={logout} />
      </aside>

      <div className="flex flex-col flex-1 min-w-0 min-h-screen">
        <header className="h-[100px] shrink-0 border-b border-line bg-surface flex items-center justify-between px-5 sm:px-7 lg:px-8 sticky top-0 z-20">
          <div className="min-w-0">
            <h1 className="font-display text-2xl sm:text-[26px] leading-tight">{title}</h1>
            <p className="text-xs sm:text-sm text-ink/45 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle compact />
            <div className="relative">
              <button type="button" aria-label="Notifications" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)} className="relative w-9 h-9 rounded-full border border-line bg-paper text-ink/65 hover:text-ink hover:bg-ink/5 transition-colors flex items-center justify-center">
                <BellIcon />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-brass text-paper text-[9px] font-mono flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notificationsOpen && (
                <NotificationPanel
                  notifications={notifications}
                  readIds={readIds}
                  unreadCount={unreadCount}
                  onMarkAllRead={() => setReadIds(notifications.map((item) => item.id))}
                  onOpen={(id) => {
                    if (id) setReadIds((current) => current.includes(id) ? current : [...current, id]);
                    setNotificationsOpen(false);
                    navigate('/admin/activity');
                  }}
                />
              )}
            </div>
            <div className="hidden sm:block h-8 w-px bg-line" />
            <div className="hidden sm:block text-right leading-tight">
              <div className="text-xs font-medium truncate max-w-48">{user.displayName || user.email}</div>
              <div className="text-[10px] text-ink/40 mt-1">Administrator</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-vault text-paper flex items-center justify-center text-xs font-semibold shadow-sm">
              {initials}
            </div>
            <button onClick={logout} aria-label="Sign out" className="hidden lg:flex text-ink/45 hover:text-danger transition-colors">
              <ChevronDownIcon />
            </button>
          </div>
        </header>

        <div className="md:hidden border-b border-line bg-surface px-3 py-2 overflow-x-auto">
          <nav className="flex items-center gap-1 min-w-max">
            {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) =>
                `inline-flex items-center gap-2 px-3 py-2 rounded-ticket text-xs whitespace-nowrap ${
                  isActive ? 'bg-vault text-paper' : 'text-ink/55 hover:bg-paper'
                }`
              }>
                <Icon /> {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-7 lg:py-7">
          <div className="max-w-[1500px] mx-auto">
            <Outlet />
          </div>
          <footer className="max-w-[1500px] mx-auto pt-8 pb-2 text-center text-[11px] text-ink/40">
            © {new Date().getFullYear()} Vaultivo. All rights reserved.
          </footer>
        </main>
      </div>
    </div>
  );
}


function NotificationPanel({ notifications, readIds, unreadCount, onMarkAllRead, onOpen }) {
  return (
    <div className="absolute right-0 top-12 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-ticket border border-line bg-surface shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <div>
          <div className="text-sm font-semibold">Notifications</div>
          <div className="text-[10px] text-ink/40 mt-0.5">Recent platform activity</div>
        </div>
        {unreadCount > 0 && <button type="button" onClick={onMarkAllRead} className="text-[10px] text-vault hover:underline">Mark all read</button>}
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-ink/40">No notifications yet.</div>
        ) : notifications.map((item) => {
          const unread = !readIds.includes(item.id);
          return (
            <button key={item.id} type="button" onClick={() => onOpen(item.id)} className={`w-full text-left px-4 py-3 border-b border-line/70 hover:bg-ink/5 transition-colors ${unread ? 'bg-vault/[0.04]' : ''}`}>
              <div className="flex gap-3">
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${unread ? 'bg-vault' : 'bg-line'}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{formatNotification(item)}</div>
                  <div className="text-[10px] text-ink/40 mt-1">{item.actorEmail || 'System'} · {formatDate(item.createdAt)}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button type="button" onClick={() => onOpen(notifications[0]?.id)} className="w-full px-4 py-3 text-xs font-medium text-vault hover:bg-vault/5 transition-colors">View all activity</button>
    </div>
  );
}

function formatNotification(item) {
  const action = String(item.action || '').replaceAll('_', ' ').toLowerCase();
  return action ? action.charAt(0).toUpperCase() + action.slice(1) : 'New platform activity';
}

function AdminBrand() {
  return (
    <div className="px-5 pt-7 pb-6">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md border border-brass/60 text-brass flex items-center justify-center">
          <ShieldSmallIcon />
        </div>
        <span className="font-display text-2xl tracking-wide">Vaultivo</span>
      </div>
      <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-brass">Admin Console</div>
    </div>
  );
}

function AdminNav() {
  return (
    <nav className="flex-1 px-3 py-3">
      <div className="px-3 pb-2 text-[9px] font-mono uppercase tracking-[0.16em] text-paper/30">Administration</div>
      {NAV_ITEMS.map(({ to, label, end, icon: Icon }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 mb-1 rounded-ticket text-sm transition-colors duration-150 ${
            isActive ? 'bg-paper/10 text-paper font-semibold' : 'text-paper/65 hover:bg-paper/5 hover:text-paper'
          }`
        }>
          <Icon /> {label}
        </NavLink>
      ))}
    </nav>
  );
}

function AdminIdentity({ user, initials, onLogout }) {
  return (
    <div className="px-4 py-4 border-t border-paper/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-full bg-vault text-paper flex items-center justify-center text-xs font-semibold">{initials}</div>
        <div className="min-w-0">
          <div className="text-xs text-paper/80 truncate">{user.email}</div>
          <div className="text-[10px] font-mono uppercase tracking-wide text-brass mt-1">Administrator</div>
        </div>
      </div>
      <NavLink to="/drive" className="inline-flex items-center gap-2 text-xs font-medium text-paper/60 hover:text-paper">
        <ArrowLeftIcon /> Back to Drive
      </NavLink>
      <button onClick={onLogout} className="ml-4 text-xs text-paper/35 hover:text-paper">Sign out</button>
    </div>
  );
}

function Icon({ children }) {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">{children}</svg>;
}
function DashboardIcon() { return <Icon><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></Icon>; }
function UsersIcon() { return <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon>; }
function StorageIcon() { return <Icon><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v7c0 1.66 3.58 3 8 3s8-1.34 8-3V5" /><path d="M4 12v7c0 1.66 3.58 3 8 3s8-1.34 8-3v-7" /></Icon>; }
function ActivityIcon() { return <Icon><path d="M3 12h4l3-8 4 16 3-8h4" /></Icon>; }
function SecurityIcon() { return <Icon><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></Icon>; }
function BellIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>; }
function ChevronDownIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>; }
function ShieldSmallIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>; }
function ArrowLeftIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>; }
