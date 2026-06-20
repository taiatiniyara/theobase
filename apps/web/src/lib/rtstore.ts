import { writable } from "svelte/store";

export interface RealtimeEvent {
  type: string;
  channel?: string;
  [key: string]: unknown;
}

export const realtimeEvents = writable<RealtimeEvent | null>(null);

export function dispatchRealtimeEvent(event: RealtimeEvent) {
  realtimeEvents.set(event);
}
