import { create } from 'zustand';

interface AdminAuthState {
  adminId: string | null;
  isAuthenticated: boolean;
  login: (adminId: string) => void;
  logout: () => void;
}

// In-memory only, same rationale as authStore.ts: a lightweight gate that
// resets on reload rather than a real session, kept deliberately separate
// from caregiver auth so a caregiver PIN never doubles as admin access.
export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  adminId: null,
  isAuthenticated: false,
  login: (adminId) => set({ adminId, isAuthenticated: true }),
  logout: () => set({ adminId: null, isAuthenticated: false }),
}));
