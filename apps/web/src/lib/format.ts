import { locale, formatLocalizedDate, formatLocalizedRelative, formatLocalizedCurrency } from "./i18n";
import type { Locale } from "./i18n/types";
import { get as storeGet } from "svelte/store";

function currentLocale(): Locale {
  try {
    return storeGet(locale) as Locale;
  } catch {
    return "en";
  }
}

export function formatDate(iso: string): string {
  return formatLocalizedDate(iso, currentLocale());
}

export function formatCents(cents: number): string {
  return formatLocalizedCurrency(cents, currentLocale());
}

export function formatRelative(iso: string): string {
  return formatLocalizedRelative(iso, currentLocale());
}

export function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
