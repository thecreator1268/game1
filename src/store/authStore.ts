import { create } from 'zustand';

interface CaregiverAuthState {
  caregiverId: string | null;
  isAuthenticated: boolean;
  login: (caregiverId: string) => void;
  logout: () => void;
}

// Deliberately in-memory only: caregiver login is a lightweight gate (PIN or
// QR) meant to keep a patient from wandering into the dashboard, not a real
// security boundary — so it resets on app reload rather than persisting.
export const useAuthStore = create<CaregiverAuthState>((set) => ({
  caregiverId: null,
  isAuthenticated: false,
  login: (caregiverId) => set({ caregiverId, isAuthenticated: true }),
  logout: () => set({ caregiverId: null, isAuthenticated: false }),
}));
