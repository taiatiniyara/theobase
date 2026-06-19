export { z } from "zod";

export function generateId(): string {
  return crypto.randomUUID();
}

export { getSabbathWindow, isDuringSabbath, shiftBeforeSabbath } from "./sabbath";
export type { SabbathWindow } from "./sabbath";
