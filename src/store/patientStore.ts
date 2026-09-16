import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PatientStoreState {
  activePatientId: string | null;
  setActivePatient: (id: string | null) => void;
}

// Persisted to localStorage only (a per-device convenience so the app reopens
// on the right patient's screen) — never a source of truth for patient data,
// which always lives in Dexie.
export const usePatientStore = create<PatientStoreState>()(
  persist(
    (set) => ({
      activePatientId: null,
      setActivePatient: (id) => set({ activePatientId: id }),
    }),
    { name: 'smriti-setu-active-patient' },
  ),
);
