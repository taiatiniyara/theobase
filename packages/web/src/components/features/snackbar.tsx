import { useEffect } from 'react';

interface SnackbarProps {
  message: string;
  onUndo?: () => void;
  duration?: number;
  onDismiss: () => void;
}

export function Snackbar({ message, onUndo, duration = 5000, onDismiss }: SnackbarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-neutral-900 px-4 py-3 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm">{message}</span>
        {onUndo && (
          <button type="button" onClick={() => { onUndo(); onDismiss(); }} className="text-sm font-medium text-brand-300 hover:text-brand-200">
            Undo
          </button>
        )}
      </div>
    </div>
  );
}
