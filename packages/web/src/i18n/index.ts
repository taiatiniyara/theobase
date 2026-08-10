import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../i18n/en/common.json';
import hif from '../i18n/hif/common.json';

const resources = {
  en: { common: en },
  hif: { common: hif },
};

function detectLocale(): string {
  const stored = localStorage.getItem('locale');
  if (stored && ['en', 'hif'].includes(stored)) return stored;

  const browser = navigator.language.split('-')[0];
  if (browser === 'hif' || browser === 'hi') return 'hif';

  return 'en';
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
