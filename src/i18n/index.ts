import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import as from './as.json';
import mni from './mni.json';
import kha from './kha.json';
import lus from './lus.json';
import nsm from './nsm.json';

// All 7 languages now cover the full UI key structure (see each file's
// "_meta" note) — any key that's still missing anywhere falls back to
// English via fallbackLng below, rather than showing a blank or a raw key
// to the patient. en/hi/as are widely-spoken, high-resource languages;
// mni/kha/lus/nsm are AI-assisted best-effort drafts for languages of
// India's North Eastern Region, not yet reviewed by a native speaker —
// see each file's "_meta.status" before treating them as production-ready.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', complete: true },
  { code: 'hi', label: 'हिन्दी', complete: true },
  { code: 'as', label: 'অসমীয়া', complete: true },
  { code: 'mni', label: 'মৈতৈলোন্ (Manipuri)', complete: true },
  { code: 'kha', label: 'Khasi', complete: true },
  { code: 'lus', label: 'Mizo ṭawng', complete: true },
  { code: 'nsm', label: 'Nagamese', complete: true },
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
