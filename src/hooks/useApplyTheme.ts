import { useEffect } from 'react';
import i18n from '@/i18n';
import { useActivePatient } from './useActivePatient';

export function useApplyTheme(): void {
  const patient = useActivePatient();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = patient?.highContrastPalette ?? 'theme-1';
    root.dataset.textScale = patient?.textScale ?? 'normal';
    root.dataset.colorMode = patient?.colorMode ?? 'light';
    // Keep the browser/PWA chrome in step with the page background — dark
    // mode is a per-patient setting here, not prefers-color-scheme, so the
    // static <meta> in index.html can only ever describe the light default.
    const bg = getComputedStyle(root).getPropertyValue('--color-bg').trim();
    if (bg) {
      document
        .querySelectorAll('meta[name="theme-color"]')
        .forEach((meta) => meta.setAttribute('content', bg));
    }
  }, [patient?.highContrastPalette, patient?.textScale, patient?.colorMode]);

  useEffect(() => {
    if (patient?.preferredLanguage && i18n.language !== patient.preferredLanguage) {
      void i18n.changeLanguage(patient.preferredLanguage);
    }
  }, [patient?.preferredLanguage]);
}
