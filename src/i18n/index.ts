import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import as from './as.json';
import mni from './mni.json';
import kha from './kha.json';
import lus from './lus.json';
import nsm from './nsm.json';
import kok from './kok.json';
import ne from './ne.json';

// All 9 languages now cover the full UI key structure — any key that's
// still missing anywhere falls back to English via fallbackLng below,
// rather than showing a blank or a raw key to the patient. en/hi/as are
// widely-spoken, high-resource languages; mni/kha/lus/nsm/kok/ne are
// AI-assisted best-effort drafts for languages of India's North Eastern
// Region, not yet reviewed by a native speaker. Confidence varies a lot
// within that group — ne (Nepali, Sikkim) is a well-documented language;
// kok (Kokborok, Tripura) has far fewer digital resources to draw on and
// needs native-speaker review before it's treated as production-ready.
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', complete: true },
  { code: 'hi', label: 'हिन्दी', complete: true },
  { code: 'as', label: 'অসমীয়া', complete: true },
  { code: 'mni', label: 'মৈতৈলোন্ (Manipuri)', complete: true },
  { code: 'kha', label: 'Khasi', complete: true },
  { code: 'lus', label: 'Mizo ṭawng', complete: true },
  { code: 'nsm', label: 'Nagamese', complete: true },
  { code: 'kok', label: 'Kokborok', complete: true },
  { code: 'ne', label: 'नेपाली', complete: true },
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
      kok: { translation: kok },
      ne: { translation: ne },
    },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnEmptyString: false,
  });

// WCAG 3.1.1 (Language of Page) and screen-reader pronunciation both depend
// on <html lang> matching what's actually on screen — every i18n.changeLanguage
// call (onboarding's language picker, useApplyTheme syncing a patient's saved
// preference) goes through here, so this one listener keeps it correct
// regardless of which call site triggered the change.
if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
  i18n.on('languageChanged', (lng) => {
    document.documentElement.lang = lng;
  });
}

export default i18n;
