interface AuditTimelineProps {
  entries: Array<Record<string, unknown>>;
  emptyMessage?: string;
}

export function AuditTimeline({ entries, emptyMessage = 'No audit events yet.' }: AuditTimelineProps) {
  if (entries.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="relative ml-3 border-l border-neutral-200 py-4">
      {entries.map((entry, i) => {
        const prevState = entry.prevState as string | undefined;
        const newState = entry.newState as string | undefined;
        const actor = entry.actor as string | undefined;
        const timestamp = entry.timestamp as number | undefined;
        const reason = entry.reason as string | undefined | null;

        return (
          <div key={i} className="mb-6 ml-6">
            <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-brand-500 bg-white" />
            <div className="text-sm font-medium text-neutral-900">
              {prevState} → {newState}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
              {actor && <span>{actor}</span>}
              {timestamp && <span>{new Date(timestamp).toLocaleString()}</span>}
            </div>
            {reason && (
              <p className="mt-1 text-xs text-neutral-600">{reason}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
