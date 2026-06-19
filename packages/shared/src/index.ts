export { z } from "zod";

export function generateId(): string {
  return crypto.randomUUID();
}
