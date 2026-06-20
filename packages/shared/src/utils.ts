export function generateId(): string {
  return crypto.randomUUID();
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function sanitizeText(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}
