// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { db } from '@/db/schema';
import { generatePinSalt, hashPin } from '@/lib/pin';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import AdminLogin from './AdminLogin';

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

// Seeds a fully set-up admin: a caregiver PIN plus its own, separate admin
// PIN — the shape every new onboarding produces (see Onboarding.tsx).
async function seedAdmin(oldAdminPin: string, caregiverPin = '0000') {
  const pinSalt = generatePinSalt();
  const pinHash = await hashPin(caregiverPin, pinSalt);
  const adminPinSalt = generatePinSalt();
  const adminPinHash = await hashPin(oldAdminPin, adminPinSalt);
  const id = 'caregiver-1';
  await db.caregivers.add({
    id,
    name: 'Caregiver',
    relation: 'Family',
    pinHash,
    pinSalt,
    adminPinHash,
    adminPinSalt,
    patientIds: [],
    role: 'admin',
    createdAt: Date.now(),
  });
  return id;
}

describe('AdminLogin forgot-PIN reset', () => {
  beforeEach(async () => {
    await db.caregivers.clear();
    useAdminAuthStore.getState().logout();
  });

  it('lets an admin who forgot their PIN set a new one and logs them in', async () => {
    const id = await seedAdmin('1234');
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Forgot your PIN?' }));

    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '9999');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    await waitFor(() => {
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAdminAuthStore.getState().adminId).toBe(id);

    const updated = await db.caregivers.get(id);
    expect(updated).toBeDefined();
    const rehash = await hashPin('9999', updated!.adminPinSalt!);
    expect(rehash).toBe(updated!.adminPinHash);
    // The caregiver PIN is a separate credential and must be untouched by
    // an admin-PIN reset.
    const caregiverRehash = await hashPin('0000', updated!.pinSalt);
    expect(caregiverRehash).toBe(updated!.pinHash);
  });

  it('shows a mismatch error and does not touch the stored PIN when the two entries differ', async () => {
    const id = await seedAdmin('1234');
    const before = await db.caregivers.get(id);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '8888');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    expect(await screen.findByText("PINs don't match — try again.")).toBeInTheDocument();
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
    const after = await db.caregivers.get(id);
    expect(after!.adminPinHash).toBe(before!.adminPinHash);
  });
});

describe('AdminLogin forgot-PIN reset — no admin-role record present', () => {
  beforeEach(async () => {
    await db.caregivers.clear();
    useAdminAuthStore.getState().logout();
  });

  it('promotes the existing caregiver to admin instead of leaving them locked out', async () => {
    // Reproduces the actual bug report: a caregiver record exists (so the
    // person clearly did onboard this device once) but nothing has
    // role: 'admin' — resetPin used to filter these out and silently do
    // nothing. This app's own rule is "whoever onboarded this device is
    // the admin," so recovering here means promoting them, not refusing.
    await db.caregivers.add({
      id: 'caregiver-1',
      name: 'Caregiver',
      relation: 'Family',
      pinHash: 'irrelevant',
      pinSalt: 'irrelevant',
      patientIds: [],
      role: 'caregiver',
      createdAt: Date.now(),
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '9999');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    await waitFor(() => {
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAdminAuthStore.getState().adminId).toBe('caregiver-1');
    const updated = await db.caregivers.get('caregiver-1');
    expect(updated!.role).toBe('admin');
    const rehash = await hashPin('9999', updated!.adminPinSalt!);
    expect(rehash).toBe(updated!.adminPinHash);
    // Promoting to admin and setting the admin PIN must not touch whatever
    // was already stored as the caregiver PIN.
    expect(updated!.pinHash).toBe('irrelevant');
  });

  it('shows a clear error instead of silently doing nothing when no caregiver exists at all', async () => {
    // No onboarding has ever happened on this device — there is genuinely
    // no account to recover into, so this should say so, not pretend to work.
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '9999');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    expect(await screen.findByText('No account was found on this device.')).toBeInTheDocument();
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
  });
});

async function typePin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const digit of pin) {
    await user.click(screen.getByRole('button', { name: digit }));
  }
}

describe('AdminLogin — admin PIN separated from the caregiver PIN', () => {
  beforeEach(async () => {
    await db.caregivers.clear();
    useAdminAuthStore.getState().logout();
  });

  async function seedOnboardedCaregiverWithoutAdminPin(caregiverPin: string) {
    const pinSalt = generatePinSalt();
    const pinHash = await hashPin(caregiverPin, pinSalt);
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
  }

  it('requires the caregiver PIN, then a distinct admin PIN, before a not-yet-set-up device reaches /admin', async () => {
    // Reproduces existing/already-onboarded data with no adminPinHash yet
    // (the shape every caregiver record had before this fix).
    await seedOnboardedCaregiverWithoutAdminPin('1234');
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/doesn't have an admin PIN yet/i)).toBeInTheDocument();

    await typePin(user, '1234'); // caregiver PIN proves identity
    expect(await screen.findByText(/Choose a 4-digit PIN for the Admin Panel/i)).toBeInTheDocument();

    await typePin(user, '1234'); // same as caregiver PIN — must be rejected
    expect(
      await screen.findByText('The admin PIN must be different from the caregiver PIN.'),
    ).toBeInTheDocument();

    await typePin(user, '5678'); // a genuinely different candidate
    expect(await screen.findByText(/Enter the new admin PIN again to confirm/i)).toBeInTheDocument();

    await typePin(user, '5678'); // confirmed

    await waitFor(() => {
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);
    });

    const saved = await db.caregivers.get('caregiver-1');
    const adminRehash = await hashPin('5678', saved!.adminPinSalt!);
    expect(adminRehash).toBe(saved!.adminPinHash);
    // Setting the admin PIN must not change the caregiver PIN.
    const caregiverRehash = await hashPin('1234', saved!.pinSalt);
    expect(caregiverRehash).toBe(saved!.pinHash);
  });

  it('no longer lets the caregiver PIN alone open the admin panel once a distinct admin PIN exists', async () => {
    // The actual bug this fix closes: caregiver and admin PIN used to be
    // the same hash on the same record. Seed a device that already
    // completed setup with two distinct PINs and confirm the caregiver PIN
    // is rejected here, while the real admin PIN still works.
    await seedAdmin('5678', '1234');
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <AdminLogin />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Enter your admin PIN')).toBeInTheDocument();

    await typePin(user, '1234'); // caregiver PIN, not the admin PIN
    expect(await screen.findByText("That PIN doesn't match. Try again.")).toBeInTheDocument();
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);

    await typePin(user, '5678'); // the actual admin PIN
    await waitFor(() => {
      expect(useAdminAuthStore.getState().isAuthenticated).toBe(true);
    });
  });
});
