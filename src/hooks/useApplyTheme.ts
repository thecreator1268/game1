import { useEffect } from 'react';
import i18n from '@/i18n';
import { useActivePatient } from './useActivePatient';

export function useApplyTheme(): void {
  const patient = useActivePatient();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = patient?.highContrastPalette ?? 'theme-1';
    root.dataset.textScale = patient?.textScale ?? 'normal';
  }, [patient?.highContrastPalette, patient?.textScale]);

  useEffect(() => {
    if (patient?.preferredLanguage && i18n.language !== patient.preferredLanguage) {
      void i18n.changeLanguage(patient.preferredLanguage);
    }
  }, [patient?.preferredLanguage]);
}
