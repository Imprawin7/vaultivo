import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import * as adminApi from '../services/adminApi';
import { formatBytes, formatDate } from '../lib/format';

const SECTIONS = {
  '/admin': { title: 'Dashboard', eyebrow: 'Platform overview', description: 'Overview of your Vaultivo platform' },
  '/admin/users': { title: 'Users', eyebrow: 'Account management', description: 'Manage Vaultivo accounts and permissions' },
  '/admin/storage': { title: 'Storage', eyebrow: 'Capacity and usage', description: 'Monitor platform capacity and usage' },
  '/admin/activity': { title: 'Activity Logs', eyebrow: 'Platform audit trail', description: 'Review platform activity and audit records' },
  '/admin/security': { title: 'Security', eyebrow: 'Access and audit', description: 'Review access and security events' },
};

export default function AdminPage() {
  const { pathname } = useLocation();
  const section = SECTIONS[pathname] || SECTIONS['/admin'];

  return (
    <div>
      <div className="mb-6 lg:mb-7">
        <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-vault/70 mb-1">{section.eyebrow}</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl leading-tight">{section.title}</h2>
            <p className="text-xs sm:text-sm text-ink/45 mt-1">{section.description}</p>
          </div>
          {pathname === '/admin' && <span className="text-[9px] font-mono uppercase tracking-[0.12em] text-ink/30">Live platform data</span>}
        </div>
      </div>

      {pathname === '/admin' && <Overview />}
      {pathname === '/admin/users' && <Users />}
      {pathname === '/admin/storage' && <Storage />}
      {pathname === '/admin/activity' && <ActivityLogs />}
      {pathname === '/admin/security' && <Security />}
    </div>
  );
}

function Overview() {
  const { data: stats, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });
  const { data: users, isLoading: usersLoading } = useQuery({ queryKey: ['admin', 'users', 'dashboard'], queryFn: () => adminApi.listUsers('') });
  const { data: topUsers, isLoading: topLoading } = useQuery({ queryKey: ['admin', 'top-storage'], queryFn: () => adminApi.topStorageUsers(5) });
  const { data: activity, isLoading: activityLoading } = useQuery({ queryKey: ['admin', 'activity', 'dashboard'], queryFn: () => adminApi.recentActivity(6) });
  const [growthPeriod, setGrowthPeriod] = useState('30');
  const [storagePeriod, setStoragePeriod] = useState('30');

  if (isLoading) return <Loading />;
  if (isError || !stats) return <ErrorState message="The dashboard could not load platform statistics." onRetry={refetch} />;

  const used = Number(stats.totalStorageUsedBytes || 0);
  const allocated = Number(stats.totalStorageAllocatedBytes || 0);
  const storagePercent = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0;
  const recentUsers = [...(users || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        <MetricCard label="Total users" value={stats.totalUsers} detail={`${stats.activeUsers} active`} icon={<UsersMiniIcon />} tone="green" />
        <MetricCard label="Active users" value={stats.activeUsers} detail={`${stats.suspendedUsers} suspended`} icon={<PulseIcon />} tone="green" />
        <MetricCard label="Total storage" value={formatBytes(used)} detail={`${formatBytes(allocated)} allocated`} icon={<StorageMiniIcon />} tone="purple" />
        <MetricCard label="Total files" value={stats.totalFiles} detail={`${stats.totalFolders} folders`} icon={<FileMiniIcon />} tone="brass" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Storage Usage" action={
          <select value={storagePeriod} onChange={(e) => setStoragePeriod(e.target.value)} className="text-xs border border-line rounded-ticket bg-surface px-2.5 py-1.5 text-ink/65 outline-none focus:ring-1 focus:ring-vault/30">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        }>
          <StorageUsageChart currentUsed={used} allocated={allocated} percent={storagePercent} period={storagePeriod} />
        </Panel>

        <Panel title="User Growth" action={
          <select value={growthPeriod} onChange={(e) => setGrowthPeriod(e.target.value)} className="text-xs border border-line rounded-ticket bg-surface px-2.5 py-1.5 text-ink/65 outline-none focus:ring-1 focus:ring-vault/30">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
            <option value="all">All time</option>
          </select>
        }>
          <UserGrowthChart users={users || []} period={growthPeriod} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Recent Users" action={<Link to="/admin/users" className="text-xs text-vault hover:underline">View all</Link>}>
          {usersLoading ? <Loading compact /> : recentUsers.length === 0 ? <Empty text="No users yet." /> : (
            <div className="divide-y divide-line/70">
              {recentUsers.map((u) => <UserListItem key={u.id} user={u} />)}
            </div>
          )}
        </Panel>
        <Panel title="Top Storage Users" action={<Link to="/admin/storage" className="text-xs text-vault hover:underline">View all</Link>}>
          {topLoading ? <Loading compact /> : (topUsers || []).length === 0 ? <Empty text="No storage data yet." /> : (
            <div className="space-y-3">
              {topUsers.slice(0, 5).map((u) => <StorageListItem key={u.id} user={u} />)}
            </div>
          )}
        </Panel>
        <Panel title="Recent Activity" action={<Link to="/admin/activity" className="text-xs text-vault hover:underline">View all</Link>}>
          {activityLoading ? <Loading compact /> : (activity || []).length === 0 ? <Empty text="No activity recorded yet." /> : (
            <div className="space-y-3">
              {activity.map((a) => <ActivityListItem key={a.id} activity={a} />)}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function StorageUsageChart({ currentUsed, allocated, percent, period }) {
  const { data: activity = [], isLoading } = useQuery({
    queryKey: ['admin', 'storage-history'],
    queryFn: () => adminApi.recentActivity(1000),
    staleTime: 30000,
    refetchInterval: 30000,
  });

  const points = useMemo(() => buildStorageHistory(activity, currentUsed, period), [activity, currentUsed, period]);
  const values = points.map((p) => p.bytes);
  const max = Math.max(...values, currentUsed, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  const width = 720;
  const height = 190;
  const padX = 18;
  const padY = 12;
  const plotW = width - padX * 2;
  const plotH = height - padY * 2;
  const coords = points.map((p, i) => ({
    x: padX + (plotW * i) / Math.max(points.length - 1, 1),
    y: padY + plotH - ((p.bytes - min) / span) * plotH,
  }));
  const line = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = coords.length ? `${line} L ${coords.at(-1).x.toFixed(1)} ${height - padY} L ${coords[0].x.toFixed(1)} ${height - padY} Z` : '';
  const start = points[0]?.bytes ?? currentUsed;
  const change = currentUsed - start;
  const changePct = start > 0 ? (change / start) * 100 : 0;
  const grid = [0, 1, 2, 3].map((i) => min + (span * i) / 3);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-display text-3xl sm:text-4xl leading-none">{formatBytes(currentUsed)}</div>
          <div className="text-xs text-ink/45 mt-2">of {formatBytes(allocated)} used</div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-mono text-xs font-medium">{percent.toFixed(2)}% used</div>
          <div className={`text-[10px] mt-1 ${change >= 0 ? 'text-vault' : 'text-danger'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(changePct).toFixed(1)}% in period
          </div>
        </div>
      </div>

      <div className="mt-5 h-2 bg-paper border border-line rounded-full overflow-hidden">
        <div className="h-full bg-vault rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      <div className="mt-4 rounded-ticket overflow-hidden">
        {isLoading ? <Loading compact /> : points.length === 0 ? <Empty text="No storage history available yet." /> : (
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[190px]" preserveAspectRatio="none" role="img" aria-label={`Storage usage for the selected ${period === 'all' ? 'period' : `${period} day`} period`}>
            <defs>
              <linearGradient id="storageArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(var(--color-vault))" stopOpacity="0.18" />
                <stop offset="100%" stopColor="rgb(var(--color-vault))" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {grid.map((value, i) => {
              const y = padY + plotH - ((value - min) / span) * plotH;
              return <g key={i}><line x1={padX} x2={width - padX} y1={y} y2={y} stroke="rgb(var(--color-line))" strokeOpacity="0.65" strokeWidth="1" /><text x="0" y={y + 3} className="fill-ink/35" fontSize="10">{formatChartBytes(value)}</text></g>;
            })}
            <path d={area} fill="url(#storageArea)" />
            <path d={line} fill="none" stroke="rgb(var(--color-vault))" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        <div className="grid grid-cols-5 gap-2 mt-1 px-7">
          {points.filter((_, i) => i === 0 || i === Math.floor(points.length / 4) || i === Math.floor(points.length / 2) || i === Math.floor(points.length * 3 / 4) || i === points.length - 1).map((p) => (
            <span key={p.label} className="text-[9px] text-ink/35 truncate text-center">{p.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildStorageHistory(activity, currentUsed, period) {
  const now = new Date();
  const events = (activity || []).map((item) => {
    const date = new Date(item.createdAt);
    const metadata = item.metadata || {};
    const size = Number(metadata.size ?? metadata.sizeBytes ?? metadata.bytes ?? metadata.fileSize ?? 0);
    const action = String(item.action || '').toUpperCase();
    return { date, size: Number.isFinite(size) ? size : 0, action };
  }).filter((e) => !Number.isNaN(e.date.getTime()) && e.size > 0 && /UPLOAD|DELETE|TRASH|RESTORE|PERMANENT|VERSION/.test(e.action));

  let start;
  if (period === 'all') {
    start = events.length ? new Date(Math.min(...events.map((e) => e.date.getTime()))) : new Date(now.getTime() - 30 * 86400000);
  } else {
    start = new Date(now.getTime() - Number(period) * 86400000);
  }
  const end = now;
  const bucketCount = period === '7' ? 7 : period === '30' ? 10 : period === '90' ? 12 : 12;
  const range = Math.max(end.getTime() - start.getTime(), 86400000);

  // Reconstruct a historical curve from real activity events. Because the API
  // reports the current snapshot separately, we walk backwards from that
  // snapshot to estimate each bucket's ending usage.
  const sorted = [...events].sort((a, b) => a.date - b.date);
  const delta = (e) => (/UPLOAD|RESTORE/.test(e.action) && !/DELETE|TRASH|PERMANENT/.test(e.action)) ? e.size : -e.size;
  const totalDelta = sorted.filter((e) => e.date <= end).reduce((sum, e) => sum + delta(e), 0);
  const baseline = Math.max(0, currentUsed - totalDelta);

  return Array.from({ length: bucketCount }, (_, i) => {
    const date = new Date(start.getTime() + (range * i) / (bucketCount - 1));
    const accumulated = sorted.filter((e) => e.date >= start && e.date <= date).reduce((sum, e) => sum + delta(e), 0);
    const beforeStart = sorted.filter((e) => e.date < start).reduce((sum, e) => sum + delta(e), 0);
    const bytes = Math.max(0, baseline + beforeStart + accumulated);
    return { date, bytes, label: formatStorageLabel(date, period) };
  });
}

function formatStorageLabel(date, period) {
  if (period === '365' || period === 'all') return date.toLocaleDateString(undefined, { month: 'short' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatChartBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n >= 1024 ** 4) return `${(n / 1024 ** 4).toFixed(1)} TB`;
  if (n >= 1024 ** 3) return `${Math.round(n / 1024 ** 3)} GB`;
  if (n >= 1024 ** 2) return `${Math.round(n / 1024 ** 2)} MB`;
  return `${Math.round(n / 1024)} KB`;
}

function UserGrowthChart({ users, period }) {
  const points = useMemo(() => {
    const now = new Date();
    const validDates = users.map((u) => new Date(u.createdAt)).filter((d) => !Number.isNaN(d.getTime()));
    let start;
    if (period === 'all') {
      start = validDates.length ? new Date(Math.min(...validDates.map((d) => d.getTime()))) : new Date(now);
    } else {
      start = new Date(now);
      start.setDate(start.getDate() - Number(period));
    }
    const range = Math.max(now.getTime() - start.getTime(), 86400000);
    const bucketCount = 6;
    return Array.from({ length: bucketCount }, (_, i) => {
      const date = new Date(start.getTime() + (range * i) / (bucketCount - 1));
      return {
        date,
        label: i === bucketCount - 1 ? 'Today' : formatGrowthLabel(date, period, range),
        count: validDates.filter((created) => created <= date).length,
      };
    });
  }, [users, period]);

  const max = Math.max(...points.map((p) => p.count), 1);
  const firstDate = period === 'all' ? null : new Date(Date.now() - Number(period) * 86400000);
  const newUsers = users.filter((user) => {
    const date = new Date(user.createdAt);
    return !Number.isNaN(date.getTime()) && (!firstDate || date >= firstDate);
  }).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <div className="font-display text-3xl">{users.length}</div>
          <div className="text-xs text-ink/45 mt-1">Total users</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-medium text-vault">+{newUsers}</div>
          <div className="text-[10px] text-ink/40 mt-1">new in selected period</div>
        </div>
      </div>
      <div className="h-40 flex items-end gap-2 sm:gap-4 border-b border-line px-1">
        {points.map((point) => (
          <div key={point.date.toISOString()} className="flex-1 h-full flex flex-col justify-end items-center gap-2">
            <span className="text-[10px] font-mono text-ink/45">{point.count}</span>
            <div className="w-full max-w-12 bg-vault/80 rounded-t-sm transition-all duration-300" style={{ height: `${Math.max(6, (point.count / max) * 92)}%` }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-2 mt-2">
        {points.map((point) => <span key={point.date.toISOString()} className="text-center text-[9px] text-ink/35 truncate">{point.label}</span>)}
      </div>
    </div>
  );
}

function formatGrowthLabel(date, period, range) {
  if (period === '7') return date.toLocaleDateString(undefined, { weekday: 'short' });
  if (period === '365' || period === 'all' || range >= 180 * 86400000) return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  return formatShortDate(date);
}

function formatShortDate(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function StorageRing({ percent }) {
  return (
    <div className="relative w-20 h-20 shrink-0 rounded-full" style={{ background: `conic-gradient(rgb(var(--color-vault)) ${percent * 3.6}deg, rgb(var(--color-line)) 0deg)` }}>
      <div className="absolute inset-2 rounded-full bg-surface flex flex-col items-center justify-center">
        <span className="font-mono text-xs font-medium">{percent.toFixed(0)}%</span>
        <span className="text-[8px] text-ink/35 uppercase">used</span>
      </div>
    </div>
  );
}

function Users() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [quotaEdits, setQuotaEdits] = useState({});
  const [busyId, setBusyId] = useState(null);
  const { data: users, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'users', search], queryFn: () => adminApi.listUsers(search) });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin'] });

  async function runAction(id, action) {
    setBusyId(id);
    try { await action(); invalidate(); } catch (err) { alert(err.response?.data?.message || 'The requested action could not be completed.'); } finally { setBusyId(null); }
  }

  function handleToggleActive(target) {
    if (target.id === me.id) return;
    return runAction(target.id, () => adminApi.updateUser(target.id, { active: !target.active }));
  }

  function handleToggleAdmin(target) {
    if (target.id === me.id) return;
    const verb = target.admin ? 'remove administrator access from' : 'grant administrator access to';
    if (!window.confirm(`Are you sure you want to ${verb} ${target.email}?`)) return;
    return runAction(target.id, () => adminApi.updateUser(target.id, { admin: !target.admin }));
  }

  function handleSaveQuota(target) {
    const draftGb = quotaEdits[target.id];
    if (draftGb === undefined || draftGb === '') return;
    const bytes = Math.round(parseFloat(draftGb) * 1024 * 1024 * 1024);
    if (!Number.isFinite(bytes) || bytes < 0) { alert('Enter a valid, non-negative number of GB.'); return; }
    return runAction(target.id, async () => {
      await adminApi.updateUser(target.id, { storageQuotaBytes: bytes });
      setQuotaEdits((prev) => { const next = { ...prev }; delete next[target.id]; return next; });
    });
  }

  function handleDelete(target) {
    if (target.id === me.id) return;
    if (!window.confirm(`Permanently delete ${target.email}'s account? This deletes their files, folders, and shares. This cannot be undone.`)) return;
    return runAction(target.id, () => adminApi.deleteUser(target.id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-lg">
          <SearchIcon />
          <input type="text" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2.5 text-sm bg-surface border border-line rounded-ticket placeholder:text-ink/35 focus:border-vault/50" />
        </div>
        <div className="text-xs text-ink/40 font-mono">{isLoading ? 'Loading…' : `${(users || []).length} account${(users || []).length === 1 ? '' : 's'}`}</div>
      </div>

      {isError ? <ErrorState message="Users could not be loaded." onRetry={refetch} /> : (
        <Panel title="All Users" action={<span className="text-[9px] font-mono uppercase tracking-wide text-ink/35">Account directory</span>} noPadding>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[980px]">
              <thead><tr className="border-b border-line text-left text-[10px] font-mono uppercase tracking-wide text-ink/40">
                <th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 font-medium">Provider</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Storage</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr></thead>
              <tbody>
                {isLoading ? <tr><td colSpan={6}><Loading /></td></tr> : (users || []).length === 0 ? <tr><td colSpan={6}><Empty text={`No users match “${search}”.`} /></td></tr> : (users || []).map((u) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0 align-top hover:bg-paper/50 transition-colors">
                    <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={u.displayName || u.email} /><div><div className="font-medium">{u.displayName || 'Unnamed user'} {u.admin && <Badge tone="brass">Admin</Badge>}</div><div className="text-ink/45 text-xs mt-0.5">{u.email}</div></div></div></td>
                    <td className="px-5 py-4 text-ink/55 font-mono text-xs">{u.authProvider}</td>
                    <td className="px-5 py-4 text-ink/55 font-mono text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-4"><div className="text-xs font-mono text-ink/65 mb-2">{formatBytes(u.storageUsedBytes)} / {formatBytes(u.storageQuotaBytes)}</div><div className="flex items-center gap-1.5"><input type="number" min="0" step="0.5" placeholder="GB" value={quotaEdits[u.id] ?? ''} onChange={(e) => setQuotaEdits((prev) => ({ ...prev, [u.id]: e.target.value }))} className="w-16 px-1.5 py-1.5 text-xs bg-paper border border-line rounded" /><button onClick={() => handleSaveQuota(u)} disabled={busyId === u.id} className="text-xs text-vault hover:underline disabled:opacity-40">Set</button></div></td>
                    <td className="px-5 py-4"><span className={`inline-flex text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded-full ${u.active ? 'text-vault bg-vault/10' : 'text-danger bg-danger/10'}`}>{u.active ? 'Active' : 'Suspended'}</span></td>
                    <td className="px-5 py-4 text-right"><div className="flex flex-col items-end gap-2"><button onClick={() => handleToggleActive(u)} disabled={u.id === me.id || busyId === u.id} className="text-xs font-medium text-ink/55 hover:text-ink disabled:opacity-30">{u.active ? 'Suspend' : 'Reactivate'}</button><button onClick={() => handleToggleAdmin(u)} disabled={u.id === me.id || busyId === u.id} className="text-xs font-medium text-ink/55 hover:text-ink disabled:opacity-30">{u.admin ? 'Remove admin' : 'Make admin'}</button><button onClick={() => handleDelete(u)} disabled={u.id === me.id || busyId === u.id} className="text-xs font-medium text-danger hover:underline disabled:opacity-30">Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Storage() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });
  const { data: topUsers, isLoading: topLoading } = useQuery({ queryKey: ['admin', 'top-storage'], queryFn: () => adminApi.topStorageUsers(10) });
  const { data: failed, isLoading: failedLoading } = useQuery({ queryKey: ['admin', 'failed-uploads'], queryFn: adminApi.failedUploads });
  const used = Number(stats?.totalStorageUsedBytes || 0);
  const allocated = Number(stats?.totalStorageAllocatedBytes || 0);
  const percent = allocated > 0 ? Math.min((used / allocated) * 100, 100) : 0;

  return <div className="space-y-5">
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <MetricCard label="Storage used" value={statsLoading ? '—' : formatBytes(used)} detail="Across all accounts" icon={<StorageMiniIcon />} tone="purple" />
      <MetricCard label="Storage allocated" value={statsLoading ? '—' : formatBytes(allocated)} detail="Combined user quotas" icon={<DatabaseIcon />} tone="blue" />
      <MetricCard label="Utilization" value={statsLoading ? '—' : `${percent.toFixed(1)}%`} detail={percent >= 90 ? 'Approaching capacity' : 'Within allocated capacity'} icon={<GaugeIcon />} tone="green" />
    </div>
    <Panel title="Platform Capacity" action={<span className="text-xs text-ink/45">Current snapshot</span>}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        <StorageRing percent={percent} />
        <div className="flex-1"><div className="flex items-end justify-between mb-3"><div><div className="font-display text-3xl">{formatBytes(used)}</div><div className="text-xs text-ink/45 mt-1">used of {formatBytes(allocated)} allocated</div></div><span className="font-mono text-xs text-ink/50">{percent.toFixed(1)}%</span></div><div className="h-3 bg-paper border border-line rounded-full overflow-hidden"><div className="h-full bg-vault rounded-full" style={{ width: `${percent}%` }} /></div></div>
      </div>
    </Panel>
    <Panel title="Largest Users" action={<span className="text-[9px] font-mono uppercase tracking-wide text-ink/35">Top 10</span>}>
      {topLoading ? <Loading /> : (topUsers || []).length === 0 ? <Empty text="No storage data yet." /> : <div className="space-y-4">{topUsers.map((u, i) => { const p = u.storageQuotaBytes ? Math.min((u.storageUsedBytes / u.storageQuotaBytes) * 100, 100) : 0; return <div key={u.id}><div className="flex items-center justify-between gap-4 mb-1.5"><div className="flex items-center gap-3 min-w-0"><span className="w-5 text-center text-[10px] font-mono text-ink/35">{i + 1}</span><Avatar name={u.displayName || u.email} small /><div className="min-w-0"><div className="text-sm font-medium truncate">{u.displayName || 'Unnamed user'}</div><div className="text-xs text-ink/40 truncate">{u.email}</div></div></div><div className="text-right shrink-0"><div className="text-xs font-mono text-ink/65">{formatBytes(u.storageUsedBytes)}</div><div className="text-[10px] text-ink/35">of {formatBytes(u.storageQuotaBytes)}</div></div></div><div className="ml-8 h-1.5 bg-paper rounded-full overflow-hidden"><div className="h-full bg-vault/80 rounded-full" style={{ width: `${p}%` }} /></div></div> })}</div>}
    </Panel>
    <Panel title="Failed / Abandoned Uploads"><p className="text-xs text-ink/40 font-mono mb-4">Uploads that never completed within 30 minutes of starting.</p>{failedLoading ? <Loading /> : (failed || []).length === 0 ? <Empty text="None — every recent upload attempt completed." /> : <div className="overflow-x-auto"><table className="w-full text-sm min-w-[650px]"><thead><tr className="border-b border-line text-left text-[10px] font-mono uppercase text-ink/40"><th className="py-3 pr-4">File</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">Size</th><th className="py-3 text-right">Started</th></tr></thead><tbody>{failed.map((f) => <tr key={f.id} className="border-b border-line/60 last:border-0"><td className="py-3 pr-4">{f.name}</td><td className="py-3 pr-4 text-ink/50 text-xs">{f.ownerEmail}</td><td className="py-3 pr-4 text-ink/55 font-mono text-xs">{formatBytes(f.sizeBytes)}</td><td className="py-3 text-right text-ink/40 font-mono text-xs">{formatDate(f.createdAt)}</td></tr>)}</tbody></table></div>}</Panel>
  </div>;
}

function ActivityLogs() {
  const { data: activity, isLoading, isError, refetch } = useQuery({ queryKey: ['admin', 'activity'], queryFn: () => adminApi.recentActivity(100) });
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() => (activity || []).filter((a) => `${a.actorEmail} ${a.action} ${JSON.stringify(a.metadata || {})}`.toLowerCase().includes(filter.toLowerCase())), [activity, filter]);
  if (isError) return <ErrorState message="Activity logs could not be loaded." onRetry={refetch} />;
  return <Panel title="Platform Activity" action={<span className="text-[9px] font-mono uppercase tracking-wide text-ink/35">Latest 100 events</span>}>
    <div className="mb-4 relative max-w-sm"><SearchIcon /><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter activity…" className="w-full pl-9 pr-3 py-2.5 text-sm bg-paper border border-line rounded-ticket" /></div>
    <div className="overflow-x-auto"><table className="w-full text-sm min-w-[800px]"><thead><tr className="border-b border-line text-left text-[10px] font-mono uppercase tracking-wide text-ink/40"><th className="px-3 py-3">When</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Details</th></tr></thead><tbody>{isLoading ? <tr><td colSpan={4}><Loading /></td></tr> : filtered.length === 0 ? <tr><td colSpan={4}><Empty text={filter ? 'No activity matches your filter.' : 'No activity recorded yet.'} /></td></tr> : filtered.map((a) => <tr key={a.id} className="border-b border-line/60 last:border-0 hover:bg-paper/50"><td className="px-3 py-3 text-ink/50 font-mono text-xs whitespace-nowrap">{formatDate(a.createdAt)}</td><td className="px-3 py-3 text-xs">{a.actorEmail || 'Unknown actor'}</td><td className="px-3 py-3"><Badge>{a.action}</Badge></td><td className="px-3 py-3 text-ink/45 text-xs font-mono">{metadataText(a.metadata)}</td></tr>)}</tbody></table></div>
  </Panel>;
}

function Security() {
  const { user } = useAuth();
  const { data: activity, isLoading } = useQuery({ queryKey: ['admin', 'activity', 'security'], queryFn: () => adminApi.recentActivity(100) });
  const events = (activity || []).filter((item) => { const action = String(item.action || '').toLowerCase(); return action.includes('admin') || action.includes('login') || action.includes('auth') || action.includes('security') || action.includes('logout'); });
  return <div className="space-y-5">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SecurityCard title="Console access" value={user?.isAdmin ? 'Protected' : 'Restricted'} detail="The current account is authorized for the administration console." icon={<ShieldIcon />} />
      <SecurityCard title="Administrator" value="Enabled" detail="This account has administrator privileges in Vaultivo." icon={<KeyIcon />} />
      <SecurityCard title="Security events" value={events.length} detail="Matching events in the latest 100 activity records." icon={<ActivityMiniIcon />} />
    </div>
    <Panel title="Security Events" action={<span className="text-[9px] font-mono uppercase tracking-wide text-ink/35">Recent audit records</span>}>
      {isLoading ? <Loading /> : events.length === 0 ? <Empty text="No matching security events in the latest activity records." /> : <div className="overflow-x-auto"><table className="w-full text-sm min-w-[750px]"><thead><tr className="border-b border-line text-left text-[10px] font-mono uppercase tracking-wide text-ink/40"><th className="px-3 py-3">When</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Event</th><th className="px-3 py-3">Details</th></tr></thead><tbody>{events.map((a) => <tr key={a.id} className="border-b border-line/60 last:border-0"><td className="px-3 py-3 text-ink/50 font-mono text-xs whitespace-nowrap">{formatDate(a.createdAt)}</td><td className="px-3 py-3 text-xs">{a.actorEmail || 'Unknown actor'}</td><td className="px-3 py-3"><Badge>{a.action}</Badge></td><td className="px-3 py-3 text-ink/45 text-xs font-mono">{metadataText(a.metadata)}</td></tr>)}</tbody></table></div>}
    </Panel>
  </div>;
}

function MetricCard({ label, value, detail, icon, tone = 'green' }) {
  const tones = { green: 'bg-vault/10 text-vault', purple: 'bg-purple-500/10 text-purple-500', brass: 'bg-brass/10 text-brass', blue: 'bg-blue-500/10 text-blue-500' };
  return <div className="bg-surface border border-line rounded-ticket p-4 sm:p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]"><div className="flex items-start justify-between gap-4"><div><div className="text-[9px] font-mono uppercase tracking-[0.08em] text-ink/40">{label}</div><div className="font-display text-2xl sm:text-3xl mt-2 leading-none">{value}</div><div className="text-xs text-ink/45 mt-2">{detail}</div></div><div className={`w-11 h-11 rounded-full flex items-center justify-center ${tones[tone] || tones.green}`}>{icon}</div></div></div>;
}
function Panel({ title, action, children, className = '', noPadding = false }) { return <section className={`bg-surface border border-line rounded-ticket shadow-[0_1px_2px_rgb(0_0_0/0.025)] overflow-hidden ${className}`}><div className={`${noPadding ? 'px-5 pt-5 pb-4' : 'px-5 pt-5'} flex items-center justify-between gap-4`}><h3 className="font-semibold text-sm tracking-[-0.01em]">{title}</h3>{action}</div><div className={noPadding ? '' : 'px-5 pb-5'}>{children}</div></section>; }
function SmallStat({ label, value }) { return <div><div className="text-[9px] font-mono uppercase tracking-wide text-ink/35">{label}</div><div className="text-sm font-medium mt-1">{value}</div></div>; }
function UserListItem({ user }) { return <div className="flex items-center gap-3 py-2.5"><Avatar name={user.displayName || user.email} small /><div className="min-w-0 flex-1"><div className="text-xs font-medium truncate">{user.displayName || 'Unnamed user'}</div><div className="text-[11px] text-ink/40 truncate">{user.email}</div></div><div className="text-[10px] text-ink/35 font-mono whitespace-nowrap">{formatDate(user.createdAt)}</div></div>; }
function StorageListItem({ user }) { return <div><div className="flex items-center justify-between gap-3 text-xs"><span className="truncate text-ink/65">{user.displayName || user.email}</span><span className="font-mono text-ink/55 whitespace-nowrap">{formatBytes(user.storageUsedBytes)}</span></div><div className="h-1.5 bg-paper rounded-full mt-1.5 overflow-hidden"><div className="h-full bg-vault rounded-full" style={{ width: `${user.storageQuotaBytes ? Math.min((user.storageUsedBytes / user.storageQuotaBytes) * 100, 100) : 0}%` }} /></div></div>; }
function ActivityListItem({ activity }) { return <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-vault/10 text-vault flex items-center justify-center shrink-0"><ActivityMiniIcon /></div><div className="min-w-0"><div className="text-xs text-ink/65 truncate">{activity.actorEmail || 'Unknown actor'} <span className="text-ink/35">· {activity.action}</span></div><div className="text-[10px] text-ink/35 mt-0.5">{formatDate(activity.createdAt)}</div></div></div>; }
function SecurityCard({ title, value, detail, icon }) { return <div className="bg-surface border border-line rounded-ticket p-5"><div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-vault/10 text-vault flex items-center justify-center shrink-0">{icon}</div><div><div className="text-[9px] font-mono uppercase tracking-wide text-ink/40">{title}</div><div className="font-display text-xl mt-1">{value}</div><p className="text-xs leading-relaxed text-ink/45 mt-1.5">{detail}</p></div></div></div>; }
function Avatar({ name, small = false }) { const initials = String(name || 'U').split(/\s+/).slice(0, 2).map((x) => x[0]).join('').toUpperCase(); return <div className={`${small ? 'w-8 h-8 text-[9px]' : 'w-9 h-9 text-[10px]'} rounded-full bg-paper border border-line text-vault flex items-center justify-center font-semibold shrink-0`}>{initials}</div>; }
function Badge({ children, tone = 'default' }) { return <span className={`inline-flex text-[9px] font-mono uppercase tracking-wide rounded-full px-2 py-1 ${tone === 'brass' ? 'text-brass bg-brass/10' : 'text-ink/55 border border-line'}`}>{children}</span>; }
function Empty({ text }) { return <div className="py-8 text-center text-xs text-ink/40 font-mono">{text}</div>; }
function Loading({ compact = false }) { return <div className={`${compact ? 'py-5' : 'py-10'} text-center text-xs text-ink/40 font-mono`}>Loading…</div>; }
function ErrorState({ message, onRetry }) { return <div className="bg-surface border border-danger/20 rounded-ticket p-8 text-center"><div className="text-sm text-ink/70">{message}</div><button onClick={onRetry} className="mt-3 btn-secondary text-xs">Try again</button></div>; }
function metadataText(metadata) { if (!metadata || Object.keys(metadata).length === 0) return '—'; return Object.entries(metadata).map(([k, v]) => `${k}=${v}`).join(', '); }
function SearchIcon() { return <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>; }
function UsersMiniIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9.5" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87" /></svg>; }
function PulseIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>; }
function FileMiniIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5" /></svg>; }
function StorageMiniIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="5" rx="7" ry="3" /><path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" /><path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" /></svg>; }
function DatabaseIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>; }
function GaugeIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 15a8 8 0 1 1 16 0" /><path d="M12 12l4-4" /><path d="M7 18h10" /></svg>; }
function ShieldIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 20 6v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></svg>; }
function KeyIcon() { return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="8" cy="15" r="4" /><path d="m11 12 8-8" /><path d="m16 7 2 2" /><path d="m14 9 2 2" /></svg>; }
function ActivityMiniIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>; }
