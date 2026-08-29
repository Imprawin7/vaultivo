import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import * as adminApi from '../services/adminApi';
import { formatBytes, formatDate } from '../lib/format';

export default function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [quotaEdits, setQuotaEdits] = useState({}); // userId -> draft GB value while editing

  const { data: stats } = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminApi.getStats });
  const { data: users, isLoading } = useQuery({ queryKey: ['admin', 'users'], queryFn: adminApi.listUsers });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin'] });
  }

  async function handleToggleActive(target) {
    if (target.id === user.id) return; // self-deactivation blocked server-side too, but skip the round-trip
    try {
      await adminApi.updateUser(target.id, { active: !target.active });
      invalidate();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user');
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

  return (
    <div>
      <h1 className="font-display text-xl mb-5">Admin</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <StatCard label="Users" value={stats.totalUsers} />
          <StatCard label="Active" value={stats.activeUsers} />
          <StatCard label="Files" value={stats.totalFiles} />
          <StatCard label="Folders" value={stats.totalFolders} />
          <StatCard label="Storage used" value={formatBytes(stats.totalStorageUsedBytes)} />
        </div>
      )}

      <div className="bg-surface border border-line rounded-ticket overflow-hidden">
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
            ) : (
              (users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-line/60 last:border-0">
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
                      <button
                        onClick={() => handleSaveQuota(u)}
                        className="text-xs text-vault hover:underline font-medium"
                      >
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
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleToggleActive(u)}
                      disabled={u.id === user.id}
                      className="text-xs font-medium text-ink/60 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
                      title={u.id === user.id ? "You can't suspend your own account" : undefined}
                    >
                      {u.active ? 'Suspend' : 'Reactivate'}
                    </button>
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

function StatCard({ label, value }) {
  return (
    <div className="bg-surface border border-line rounded-ticket px-4 py-3 deposit-card">
      <div className="text-xs font-mono uppercase text-ink/40 mb-1">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}