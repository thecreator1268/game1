import { create } from 'zustand';

interface CaregiverAuthState {
  caregiverId: string | null;
  isAuthenticated: boolean;
  // Which of this caregiver's linked patients the dashboard is currently
  // showing — null means "default to the first one" (useCaregiverPatient
  // handles that fallback). Only meaningful for a caregiver linked to more
  // than one patient; see CaregiverPatientSwitcher.
  viewPatientId: string | null;
  login: (caregiverId: string) => void;
  logout: () => void;
  // Accepts null so deleting the currently-viewed patient's data can clear
  // the selection instead of leaving a dangling id pointing at nothing.
  setViewPatientId: (patientId: string | null) => void;
}

// Deliberately in-memory only: caregiver login is a lightweight gate (PIN or
// QR) meant to keep a patient from wandering into the dashboard, not a real
// security boundary — so it resets on app reload rather than persisting.
export const useAuthStore = create<CaregiverAuthState>((set) => ({
  caregiverId: null,
  isAuthenticated: false,
  viewPatientId: null,
  login: (caregiverId) => set({ caregiverId, isAuthenticated: true, viewPatientId: null }),
  logout: () => set({ caregiverId: null, isAuthenticated: false, viewPatientId: null }),
  setViewPatientId: (patientId) => set({ viewPatientId: patientId }),
}));
