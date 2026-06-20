import { writable, derived } from "svelte/store";
import { locales, defaultLocale, localeFromNavigator } from "./locales";
import { translations } from "./translations/index";
import type { Locale, LocaleMeta, TFunc } from "./types";

export type { Locale } from "./types";
export { locales } from "./locales";

const STORAGE_KEY = "theobase_locale";

function loadLocale(): Locale {
  if (typeof localStorage === "undefined") return defaultLocale;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored in locales) return stored as Locale;
  const nav = localeFromNavigator();
  return nav as Locale;
}

export const locale = writable<Locale>(loadLocale());

export const localeMeta = derived(locale, ($locale) => locales[$locale]);

export function setLocale(code: Locale) {
  locale.set(code);
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, code);
  }
  if (typeof document !== "undefined") {
    const meta = locales[code];
    document.documentElement.lang = code;
    document.documentElement.dir = meta.dir;
    document.documentElement.setAttribute("data-locale", code);
  }
}

export function initI18n(): LocaleMeta {
  const current = loadLocale();
  locale.set(current);
  if (typeof document !== "undefined") {
    const meta = locales[current];
    document.documentElement.lang = current;
    document.documentElement.dir = meta.dir;
    document.documentElement.setAttribute("data-locale", current);
  }
  return locales[current];
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

function resolve(path: string, dict: Record<string, Record<string, string>>): string {
  const parts = path.split(".");
  let current: any = dict;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return path;
    current = current[part];
  }
  return typeof current === "string" ? current : path;
}

export const t: TFunc = (key: string, params?: Record<string, string | number>): string => {
  let currentLocale: Locale = defaultLocale;
  const unsub = locale.subscribe((v) => {
    currentLocale = v;
  });
  unsub();

  const dict = translations[currentLocale] ?? translations[defaultLocale];
  const value = resolve(key, dict);
  return interpolate(value, params);
};

export function getT(localeValue: Locale): TFunc {
  return (key: string, params?: Record<string, string | number>): string => {
    const dict = translations[localeValue] ?? translations[defaultLocale];
    const value = resolve(key, dict);
    return interpolate(value, params);
  };
}

export function formatLocalizedNumber(value: number, localeValue?: Locale): string {
  const loc = localeValue ?? defaultLocale;
  const meta = locales[loc];
  return new Intl.NumberFormat(meta.dateLocale).format(value);
}

export function formatLocalizedCurrency(cents: number, localeValue?: Locale): string {
  const loc = localeValue ?? defaultLocale;
  const meta = locales[loc];
  return new Intl.NumberFormat(meta.dateLocale, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatLocalizedDate(iso: string, localeValue?: Locale): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const loc = localeValue ?? defaultLocale;
  const meta = locales[loc];
  return date.toLocaleDateString(meta.dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatLocalizedRelative(iso: string, localeValue?: Locale): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const t = getT(localeValue ?? defaultLocale);

  if (seconds < 60) return t("time.just_now");
  if (minutes < 60) return t("time.minutes_ago", { n: minutes });
  if (hours < 24) return t("time.hours_ago", { n: hours });
  if (days < 7) return t("time.days_ago", { n: days });
  return formatLocalizedDate(iso, localeValue);
}
