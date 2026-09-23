// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { db } from '@/db/schema';
import { generatePinSalt, hashPin } from '@/lib/pin';
import { useAuthStore } from '@/store/authStore';
import CaregiverLogin from './CaregiverLogin';

// PinPad now renders an AnimatedInlineMessage (2026 motion pass), which reads
// prefers-reduced-motion; jsdom has no real matchMedia, and the value doesn't
// matter for these PIN-reset tests, only the presence of a callable — see
// RouteTransition.test.tsx for the same stub.
beforeEach(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
});

describe('CaregiverLogin forgot-PIN reset', () => {
  beforeEach(async () => {
    await db.caregivers.clear();
    useAuthStore.getState().logout();
  });

  it('lets a caregiver who forgot their PIN set a new one and logs them in', async () => {
    const pinSalt = generatePinSalt();
    const pinHash = await hashPin('1234', pinSalt);
    await db.caregivers.add({
      id: 'caregiver-1',
      name: 'Caregiver',
      relation: 'Family',
      pinHash,
      pinSalt,
      patientIds: [],
      role: 'admin',
      createdAt: Date.now(),
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CaregiverLogin />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '9999');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().caregiverId).toBe('caregiver-1');
  });

  it('shows a clear error instead of silently doing nothing when no caregiver exists at all', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CaregiverLogin />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '9999');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    expect(await screen.findByText('No account was found on this device.')).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
