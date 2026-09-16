import { create } from 'zustand';

interface SyncState {
  /** Demo-panel override: when true, the app behaves as offline regardless
   *  of navigator.onLine, so judges can show the offline→online flow without
   *  needing to physically disconnect the device. */
  simulateOffline: boolean;
  isSyncing: boolean;
  lastSyncedAt: number | null;
  lastSyncError: string | null;
  setSimulateOffline: (value: boolean) => void;
  setSyncing: (value: boolean) => void;
  setLastSyncedAt: (timestamp: number) => void;
  setLastSyncError: (message: string | null) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  simulateOffline: false,
  isSyncing: false,
  lastSyncedAt: null,
  lastSyncError: null,
  setSimulateOffline: (value) => set({ simulateOffline: value }),
  setSyncing: (value) => set({ isSyncing: value }),
  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp, lastSyncError: null }),
  setLastSyncError: (message) => set({ lastSyncError: message }),
}));

export function isEffectivelyOnline(): boolean {
  const { simulateOffline } = useSyncStore.getState();
  if (simulateOffline) return false;
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}
