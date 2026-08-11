import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Snackbar } from '../components/features/snackbar';

interface Toast {
  id: string;
  message: string;
  variant: 'success' | 'error' | 'warning';
  undoLabel?: string;
  onUndo?: () => void;
}

interface ToastContextValue {
  toast: (message: string, variant?: 'success' | 'error' | 'warning', opts?: { undoLabel?: string; onUndo?: () => void }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Toast[]>([]);

  const toast = useCallback(
    (message: string, variant: 'success' | 'error' | 'warning' = 'success', opts?: { undoLabel?: string; onUndo?: () => void }) => {
      const id = crypto.randomUUID();
      setQueue((prev) => [...prev, { id, message, variant, ...opts }]);
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentToast = queue[0];

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {currentToast && (
        <Snackbar
          message={currentToast.message}
          variant={currentToast.variant}
          onDismiss={() => dismiss(currentToast.id)}
          undoLabel={currentToast.undoLabel}
          onUndo={currentToast.onUndo}
        />
      )}
    </ToastContext.Provider>
  );
}
