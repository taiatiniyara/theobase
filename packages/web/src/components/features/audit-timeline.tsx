interface AuditEntry {
  prevState?: string;
  newState?: string;
  actor?: string;
  timestamp?: number;
  reason?: string;
  operation?: string;
}

interface AuditTimelineProps {
  entries: Array<AuditEntry>;
  emptyMessage?: string;
}

export function AuditTimeline({ entries, emptyMessage = 'No audit events yet.' }: AuditTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg className="mb-4 h-12 w-12 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, i) => (
        <div key={i} className="relative flex gap-4 pl-8">
          <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-brand-300 bg-white dark:border-brand-600 dark:bg-neutral-800" />
          {i < entries.length - 1 && (
            <div className="absolute left-[5px] top-4 h-full w-0.5 bg-neutral-200 dark:bg-neutral-700" />
          )}
          <div className="flex-1 space-y-1 pb-4">
            <div className="flex items-center gap-2">
              {entry.prevState && entry.newState && (
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {entry.prevState} → {entry.newState}
                </span>
              )}
              {entry.operation && (
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {entry.operation}
                </span>
              )}
            </div>
            {entry.reason && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{entry.reason}</p>
            )}
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {entry.actor && <span>by {entry.actor} · </span>}
              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
