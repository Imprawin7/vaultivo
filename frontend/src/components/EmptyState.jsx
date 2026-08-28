export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="w-12 h-12 rounded-ticket border border-line bg-surface flex items-center justify-center mb-4 relative deposit-card">
        <TicketIcon />
      </div>
      <h3 className="font-display text-lg mb-1">{title}</h3>
      <p className="text-sm text-ink/50 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

function TicketIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ink/40">
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" />
    </svg>
  );
}
