import { locale, formatLocalizedDate, formatLocalizedCurrency } from "./i18n";
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

export function csvEscape(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export { sanitizeHtml as escapeHtml } from "@theobase/shared";
