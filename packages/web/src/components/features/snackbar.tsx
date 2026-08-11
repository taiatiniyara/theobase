import { useEffect } from 'react';

export type SnackbarVariant = 'success' | 'error' | 'warning';

interface SnackbarProps {
  message: string;
  variant?: SnackbarVariant;
  onDismiss: () => void;
  duration?: number;
  undoLabel?: string;
  onUndo?: () => void;
}

const VARIANT_ICONS: Record<SnackbarVariant, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
};

export function Snackbar({
  message,
  variant = 'success',
  onDismiss,
  duration = 5000,
  undoLabel,
  onUndo,
}: SnackbarProps) {
  const effectiveUndoLabel = undoLabel ?? (onUndo ? 'Undo' : undefined);
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [onDismiss, duration]);

  const icon = VARIANT_ICONS[variant];

  return (
    <div className="animate-slide-in-from-bottom fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-lg">
      <div className="flex items-center gap-3 rounded-lg bg-neutral-900 px-4 py-3 text-white shadow-md dark:bg-neutral-100 dark:text-neutral-900">
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-sm ${variant === 'success' ? 'text-success' : variant === 'error' ? 'text-error' : 'text-warning'}`}
        >
          {icon}
        </span>
        <span className="flex-1 text-sm">{message}</span>
        {effectiveUndoLabel && onUndo && (
          <button
            type="button"
            onClick={() => {
              onUndo();
              onDismiss();
            }}
            className="shrink-0 rounded px-2 py-1 text-sm font-medium text-brand-400 hover:text-brand-300 dark:text-brand-600 dark:hover:text-brand-700 touch-target-min"
          >
            {effectiveUndoLabel}
          </button>
        )}
      </div>
    </div>
  );
}
