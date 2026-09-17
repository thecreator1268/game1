// @vitest-environment jsdom
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import type { Patient } from '@/db/types';

// SmritiCardsGame reaches Dexie through three modules (patient lookup,
// adaptive-level lookup/recording, and the sync-pending-count badge) —
// mocking at those boundaries lets the component's own render/interaction
// logic be tested without a real IndexedDB.
vi.mock('@/hooks/useActivePatient', () => ({
  useActivePatient: () => FAKE_PATIENT,
}));
vi.mock('@/sync/queue', () => ({
  countPendingSync: vi.fn().mockResolvedValue(0),
}));
vi.mock('@/engine/gameSessionService', () => ({
  getCurrentLevel: vi.fn().mockResolvedValue(1),
  recordGameSession: vi.fn().mockResolvedValue({
    session: {},
    levelDecision: { changed: false, newLevel: 1, reason: 'not enough attempts yet' },
  }),
}));

const FAKE_PATIENT: Patient = {
  id: 'patient-1',
  name: 'Test Patient',
  preferredLanguage: 'en',
  caregiverIds: ['caregiver-1'],
  highContrastPalette: 'theme-1',
  textScale: 'normal',
  consentGivenAt: Date.now(),
  reminderAlertsEnabled: false,
  createdAt: Date.now(),
};

import SmritiCardsGame from './SmritiCardsGame';

describe('SmritiCardsGame', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deals face-down cards for level 1 (3 pairs = 6 cards)', async () => {
    render(
      <MemoryRouter>
        <SmritiCardsGame />
      </MemoryRouter>,
    );

    const cards = await screen.findAllByRole('button', { name: 'Face-down card' });
    expect(cards).toHaveLength(6);
  });

  it('flips a tapped card face-up, then locks only the card grid while a guess resolves', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { container } = render(
      <MemoryRouter>
        <SmritiCardsGame />
      </MemoryRouter>,
    );
    const cardButtons = () => Array.from(container.querySelectorAll<HTMLButtonElement>('button.aspect-square'));

    const initial = await screen.findAllByRole('button', { name: 'Face-down card' });
    await user.click(initial[0]);
    // The tapped card is no longer announced as face-down.
    expect(screen.queryAllByRole('button', { name: 'Face-down card' })).toHaveLength(5);

    const stillFaceDown = screen.getAllByRole('button', { name: 'Face-down card' });
    await user.click(stillFaceDown[0]);

    // Two cards are flipped — the grid locks until the guess resolves, but
    // shell chrome (Home button etc.) stays interactive.
    for (const button of cardButtons()) {
      expect(button).toBeDisabled();
    }
    expect(screen.getByRole('button', { name: 'Home' })).not.toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Round isn't over yet (only 1 of 3 pairs attempted) — grid unlocks.
    expect(screen.queryByText('Well done!')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(cardButtons().some((b) => !b.disabled)).toBe(true);
    });
  });
});
