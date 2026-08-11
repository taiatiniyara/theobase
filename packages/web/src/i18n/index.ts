import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from '../i18n/en/common.json';
import enMembership from '../i18n/en/membership.json';
import enGiving from '../i18n/en/giving.json';
import enReporting from '../i18n/en/reporting.json';
import hifCommon from '../i18n/hif/common.json';
import hifMembership from '../i18n/hif/membership.json';
import hifGiving from '../i18n/hif/giving.json';
import hifReporting from '../i18n/hif/reporting.json';

const resources = {
  en: { common: enCommon, membership: enMembership, giving: enGiving, reporting: enReporting },
  hif: { common: hifCommon, membership: hifMembership, giving: hifGiving, reporting: hifReporting },
};

export const RTL_LOCALES: string[] = ['ar', 'fa', 'he', 'ur'];

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

function detectLocale(): string {
  const stored = localStorage.getItem('locale');
  if (stored && ['en', 'hif'].includes(stored)) return stored;

  const browser = navigator.language.split('-')[0];
  if (browser === 'hif' || browser === 'hi') return 'hif';

  return 'en';
}

function applyDirection(locale: string): void {
  const dir = isRtl(locale) ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = locale;
}

const detected = detectLocale();
applyDirection(detected);

i18n.use(initReactI18next).init({
  resources,
  lng: detected,
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export function setLocale(locale: string): void {
  localStorage.setItem('locale', locale);
  applyDirection(locale);
  i18n.changeLanguage(locale);
}

export default i18n;
