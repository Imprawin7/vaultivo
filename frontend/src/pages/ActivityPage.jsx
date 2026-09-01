import { useQuery } from '@tanstack/react-query';
import * as activityApi from '../services/activityApi';
import { formatDate } from '../lib/format';

export default function ActivityPage() {
  const { data: activity, isLoading } = useQuery({
    queryKey: ['my-activity'],
    queryFn: () => activityApi.myActivity(50),
  });

  return (
    <div>
      <h1 className="font-display text-xl mb-1">Activity</h1>
      <p className="text-xs text-ink/40 font-mono mb-5">Your recent actions — most recent 50 events.</p>

      {isLoading ? (
        <p className="text-sm text-ink/40 font-mono py-10 text-center">Loading…</p>
      ) : (activity ?? []).length === 0 ? (
        <p className="text-sm text-ink/50">Nothing here yet — your actions will show up as you use Vaultivo.</p>
      ) : (
        <div className="bg-surface border border-line rounded-ticket overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-mono uppercase text-ink/40">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {activity.map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="px-4 py-3 text-ink/60 font-mono text-xs whitespace-nowrap">{formatDate(a.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-mono uppercase tracking-wide text-ink/60 border border-line rounded px-1.5 py-0.5">
                      {formatActionLabel(a.action)}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatActionLabel(action) {
  return action.replace(/_/g, ' ');
}
