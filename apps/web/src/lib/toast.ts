import { toast as sonner } from "svelte-sonner";

export function toast(message: string, options?: Record<string, unknown>) {
  return sonner(message, options as any);
}

toast.success = (message: string) => sonner.success(message);
toast.error = (message: string) => sonner.error(message);
