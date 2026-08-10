import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  persistent?: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, persistent?: boolean) => void;
  removeToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, persistent = false) => {
      const id = nextId++;
      setToasts((prev) => {
        const next = [...prev, { id, type, message, persistent }];
        return next.length > 4 ? next.slice(next.length - 4) : next;
      });
      if (!persistent) {
        setTimeout(() => removeToast(id), 5000);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");

  return {
    toasts: ctx.toasts,
    removeToast: ctx.removeToast,
    success: (msg: string) => ctx.addToast("success", msg),
    error: (msg: string) => ctx.addToast("error", msg),
    warning: (msg: string) => ctx.addToast("warning", msg),
    info: (msg: string) => ctx.addToast("info", msg),
  };
}
