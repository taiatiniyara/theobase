import type { LocaleMeta } from "./types";

export const locales: Record<string, LocaleMeta> = {
  en: { code: "en", name: "English", nativeName: "English", dir: "ltr", dateLocale: "en-US" },
  fr: { code: "fr", name: "French", nativeName: "Français", dir: "ltr", dateLocale: "fr-FR" },
  es: { code: "es", name: "Spanish", nativeName: "Español", dir: "ltr", dateLocale: "es-ES" },
  pt: { code: "pt", name: "Portuguese", nativeName: "Português", dir: "ltr", dateLocale: "pt-BR" },
  sw: { code: "sw", name: "Swahili", nativeName: "Kiswahili", dir: "ltr", dateLocale: "sw-KE" },
};

export const defaultLocale = "en";

export function localeFromNavigator(): string {
  if (typeof navigator === "undefined") return defaultLocale;
  const lang = navigator.language?.split("-")[0];
  return lang && lang in locales ? lang : defaultLocale;
}
