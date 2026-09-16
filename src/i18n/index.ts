import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import as from './as.json';
import mni from './mni.json';
import kha from './kha.json';
import lus from './lus.json';
import nsm from './nsm.json';

// en / hi / as are complete UI translations. mni / kha / lus / nsm are
// intentionally partial stubs (see each file's "_meta" note) — any key
// missing from them falls back to English via fallbackLng below, rather
// than showing a blank or a raw key to the patient.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', complete: true },
  { code: 'hi', label: 'हिन्दी', complete: true },
  { code: 'as', label: 'অসমীয়া', complete: true },
  { code: 'mni', label: 'মৈতৈলোন্ (Manipuri)', complete: false },
  { code: 'kha', label: 'Khasi', complete: false },
  { code: 'lus', label: 'Mizo ṭawng', complete: false },
  { code: 'nsm', label: 'Nagamese', complete: false },
] as const;

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      as: { translation: as },
      mni: { translation: mni },
      kha: { translation: kha },
      lus: { translation: lus },
      nsm: { translation: nsm },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

export default i18n;
