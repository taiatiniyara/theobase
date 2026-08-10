import { useEffect, useState } from "react";
import { useToast, type Toast as ToastItem } from "../../lib/useToast";

const typeStyles: Record<ToastItem["type"], string> = {
  success: "bg-success-bg border-success text-success-text",
  error: "bg-danger-bg border-danger text-danger-text",
  warning: "bg-warning-bg border-warning text-warning-text",
  info: "bg-info-bg border-info text-info-text",
};

const typeIcons: Record<ToastItem["type"], string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

function ToastEntry({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToast();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(() => removeToast(toast.id), 200);
  }

  return (
    <div
      role="alert"
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-200
        ${typeStyles[toast.type]}
        ${visible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}`}
    >
      <span className="text-base font-bold leading-none">{typeIcons[toast.type]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={handleClose}
        className="ml-2 shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed right-4 top-16 z-[100] flex w-80 flex-col gap-2"
    >
      {toasts.map((toast) => (
        <ToastEntry key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
