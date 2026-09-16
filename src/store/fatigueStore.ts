import { create } from 'zustand';

const BREAK_AFTER_MS = 11 * 60 * 1000; // ~10-12 minutes
const BREAK_AFTER_GAMES = 4;

interface FatigueState {
  sessionStartedAt: number | null;
  windowStartedAt: number | null; // resets each time the patient keeps playing
  gamesPlayedInWindow: number;
  startTracking: () => void;
  recordGamePlayed: () => void;
  dismissBreak: () => void;
  resetTracking: () => void;
}

// Tracks play time/game count purely to protect against cognitive fatigue —
// never surfaced to caregivers as an engagement metric to maximize (see
// README "known limitations" for why that distinction matters here).
export const useFatigueStore = create<FatigueState>((set) => ({
  sessionStartedAt: null,
  windowStartedAt: null,
  gamesPlayedInWindow: 0,
  startTracking: () =>
    set((s) =>
      s.sessionStartedAt
        ? s
        : { sessionStartedAt: Date.now(), windowStartedAt: Date.now(), gamesPlayedInWindow: 0 },
    ),
  recordGamePlayed: () => set((s) => ({ gamesPlayedInWindow: s.gamesPlayedInWindow + 1 })),
  dismissBreak: () => set({ windowStartedAt: Date.now(), gamesPlayedInWindow: 0 }),
  resetTracking: () => set({ sessionStartedAt: null, windowStartedAt: null, gamesPlayedInWindow: 0 }),
}));

export function shouldShowBreakPrompt(state: {
  windowStartedAt: number | null;
  gamesPlayedInWindow: number;
}): boolean {
  if (!state.windowStartedAt) return false;
  const elapsed = Date.now() - state.windowStartedAt;
  return elapsed >= BREAK_AFTER_MS || state.gamesPlayedInWindow >= BREAK_AFTER_GAMES;
}
