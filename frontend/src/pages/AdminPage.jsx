import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import * as adminApi from '../services/adminApi';
import { formatBytes, formatDate } from '../lib/format';

const TABS = ['Overview', 'Users', 'Security', 'Storage'];

export default function AdminPage() {
  const [tab, setTab] = useState('Overview');

  return (
    <div>
      <h1 className="font-display text-xl mb-4">Admin</h1>

      <div className="flex gap-1 mb-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-vault text-vault' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' && <OverviewTab />}
      {tab === 'Users' && <UsersTab />}
      {tab === 'Security' && <SecurityTab />}
      {tab === 'Storage' && <StorageTab />}
    </div>
  );
}

// ---------------------------------------------------------------

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });

  if (isLoading) return <Loading />;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total users" value={stats.totalUsers} />
      <StatCard label="Active users" value={stats.activeUsers} />
      <StatCard label="Suspended users" value={stats.suspendedUsers} />
      <StatCard label="Total files" value={stats.totalFiles} />
      <StatCard label="Total folders" value={stats.totalFolders} />
      <StatCard label="Storage used" value={formatBytes(stats.totalStorageUsedBytes)} />
      <StatCard label="Storage allocated" value={formatBytes(stats.totalStorageAllocatedBytes)} />
    </div>
  );
}

// ---------------------------------------------------------------

function UsersTab() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [quotaEdits, setQuotaEdits] = useState({});

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminApi.listUsers(search),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function handleToggleActive(target) {
    if (target.id === me.id) return;
    try {
      await adminApi.updateUser(target.id, { active: !target.active });
      invalidate();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user');
    }
  }

  async function handleToggleAdmin(target) {
    if (target.id === me.id) return;
    const verb = target.admin ? 'remove admin access from' : 'grant admin access to';
    if (!window.confirm(`Are you sure you want to ${verb} ${target.email}?`)) return;
    try {
      await adminApi.updateUser(target.id, { admin: !target.admin });
      invalidate();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update admin status');
    }
  }

  async function handleSaveQuota(target) {
    const draftGb = quotaEdits[target.id];
    if (draftGb === undefined || draftGb === '') return;
    const bytes = Math.round(parseFloat(draftGb) * 1024 * 1024 * 1024);
    if (!Number.isFinite(bytes) || bytes < 0) {
      alert('Enter a valid, non-negative number of GB');
      return;
    }
    try {
      await adminApi.updateUser(target.id, { storageQuotaBytes: bytes });
      setQuotaEdits((prev) => {
        const next = { ...prev };
        delete next[target.id];
        return next;
      });
      invalidate();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update quota');
    }
  }

  async function handleDelete(target) {
    if (target.id === me.id) return;
    const confirmed = window.confirm(
      `Permanently delete ${target.email}'s account? This deletes all their files, folders, and shares. This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await adminApi.deleteUser(target.id);
      invalidate();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete account');
    }
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm mb-4 px-3 py-2 text-sm bg-surface border border-line rounded-ticket focus:border-vault/50"
      />

      <div className="bg-surface border border-line rounded-ticket overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-mono uppercase text-ink/40">
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Provider</th>
              <th className="px-4 py-3 font-medium">Joined</th>
              <th className="px-4 py-3 font-medium">Storage</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/40 font-mono text-xs">
                  Loading…
                </td>
              </tr>
            ) : (users ?? []).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink/40 font-mono text-xs">
                  No users match "{search}"
                </td>
              </tr>
            ) : (
              (users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-ink">
                      {u.displayName}
                      {u.admin && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-wide text-brass border border-brass/40 rounded px-1.5 py-0.5">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-ink/50 text-xs">{u.email}</div>
                  </td>
                  <td className="px-4 py-3 text-ink/60 font-mono text-xs">{u.authProvider}</td>
                  <td className="px-4 py-3 text-ink/60 font-mono text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="text-xs font-mono text-ink/70 mb-1">
                      {formatBytes(u.storageUsedBytes)} / {formatBytes(u.storageQuotaBytes)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="GB"
                        value={quotaEdits[u.id] ?? ''}
                        onChange={(e) => setQuotaEdits((prev) => ({ ...prev, [u.id]: e.target.value }))}
                        className="w-16 px-1.5 py-1 text-xs bg-paper border border-line rounded"
                      />
                      <button onClick={() => handleSaveQuota(u)} className="text-xs text-vault hover:underline font-medium">
                        Set
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        u.active ? 'text-vault bg-vault/10' : 'text-danger bg-danger/10'
                      }`}
                    >
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex flex-col items-end gap-1">
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={u.id === me.id}
                        className="text-xs font-medium text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {u.active ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button
                        onClick={() => handleToggleAdmin(u)}
                        disabled={u.id === me.id}
                        className="text-xs font-medium text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {u.admin ? 'Remove admin' : 'Make admin'}
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        disabled={u.id === me.id}
                        className="text-xs font-medium text-danger hover:underline disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------

function SecurityTab() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ['admin', 'activity'],
    queryFn: () => adminApi.recentActivity(100),
  });

  if (isLoading) return <Loading />;

  return (
    <div>
      <p className="text-xs text-ink/40 font-mono mb-3">
        Login and admin-action history — most recent 100 events.
      </p>
      <div className="bg-surface border border-line rounded-ticket overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs font-mono uppercase text-ink/40">
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {(activity ?? []).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink/40 font-mono text-xs">
                  No activity recorded yet
                </td>
              </tr>
            ) : (
              (activity ?? []).map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-ink/60 font-mono text-xs whitespace-nowrap">
                    {formatDate(a.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-ink/70 text-xs">{a.actorEmail}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ink/60 border border-line rounded px-1.5 py-0.5">
                      {a.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink/50 text-xs font-mono">
                    {a.metadata && Object.keys(a.metadata).length > 0
                      ? Object.entries(a.metadata)
                          .map(([k, v]) => `${k}=${v}`)
                          .join(', ')
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------

function StorageTab() {
  const { data: stats } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });
  const { data: topUsers, isLoading: topLoading } = useQuery({
    queryKey: ['admin', 'top-storage'],
    queryFn: () => adminApi.topStorageUsers(10),
  });
  const { data: failed, isLoading: failedLoading } = useQuery({
    queryKey: ['admin', 'failed-uploads'],
    queryFn: adminApi.failedUploads,
  });

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <StatCard label="Total usage" value={formatBytes(stats.totalStorageUsedBytes)} />
          <StatCard label="Total allocated" value={formatBytes(stats.totalStorageAllocatedBytes)} />
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-ink/70 mb-2">Largest users</h2>
        {topLoading ? (
          <Loading />
        ) : (
          <div className="bg-surface border border-line rounded-ticket overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {(topUsers ?? []).map((u, i) => (
                  <tr key={u.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5 text-ink/40 font-mono text-xs w-8">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-ink text-sm">{u.displayName}</div>
                      <div className="text-ink/50 text-xs">{u.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs text-ink/70">
                      {formatBytes(u.storageUsedBytes)} / {formatBytes(u.storageQuotaBytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-medium text-ink/70 mb-2">Failed / abandoned uploads</h2>
        <p className="text-xs text-ink/40 font-mono mb-3">
          Uploads that never completed within 30 minutes of starting.
        </p>
        {failedLoading ? (
          <Loading />
        ) : (failed ?? []).length === 0 ? (
          <p className="text-sm text-ink/50">None — every recent upload attempt completed.</p>
        ) : (
          <div className="bg-surface border border-line rounded-ticket overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {failed.map((f) => (
                  <tr key={f.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-2.5 text-sm text-ink">{f.name}</td>
                    <td className="px-4 py-2.5 text-ink/50 text-xs">{f.ownerEmail}</td>
                    <td className="px-4 py-2.5 text-ink/50 font-mono text-xs">{formatBytes(f.sizeBytes)}</td>
                    <td className="px-4 py-2.5 text-right text-ink/40 font-mono text-xs whitespace-nowrap">
                      {formatDate(f.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------

function StatCard({ label, value }) {
  return (
    <div className="bg-surface border border-line rounded-ticket px-4 py-3 deposit-card">
      <div className="text-xs font-mono uppercase text-ink/40 mb-1">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}

function Loading() {
  return <p className="text-sm text-ink/40 font-mono py-6 text-center">Loading…</p>;
}
