export type Locale = "en" | "fr" | "es" | "pt" | "sw";

export interface LocaleMeta {
  code: Locale;
  name: string;
  nativeName: string;
  dir: "ltr" | "rtl";
  dateLocale: string;
}

export type TranslationDict = Record<string, Record<string, string>>;

export type TFunc = (key: string, params?: Record<string, string | number>) => string;
