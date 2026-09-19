// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import '@/i18n';
import { db } from '@/db/schema';
import { generatePinSalt, hashPin } from '@/lib/pin';
import { useAdminAuthStore } from '@/store/adminAuthStore';
import AdminLogin from './AdminLogin';

async function seedAdmin(oldPin: string) {
  const pinSalt = generatePinSalt();
  const pinHash = await hashPin(oldPin, pinSalt);
  const id = 'caregiver-1';
  await db.caregivers.add({
    id,
    name: 'Caregiver',
    relation: 'Family',
    pinHash,
    pinSalt,
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

    await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }));

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
    const rehash = await hashPin('9999', updated!.pinSalt);
    expect(rehash).toBe(updated!.pinHash);
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

    await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '8888');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    expect(await screen.findByText("PINs don't match — try again.")).toBeInTheDocument();
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
    const after = await db.caregivers.get(id);
    expect(after!.pinHash).toBe(before!.pinHash);
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

    await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }));
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

    await user.click(screen.getByRole('button', { name: 'Forgot your PIN?' }));
    const [pinInput, confirmInput] = screen.getAllByPlaceholderText('••••');
    await user.type(pinInput, '9999');
    await user.type(confirmInput, '9999');
    await user.click(screen.getByRole('button', { name: 'Set New PIN' }));

    expect(await screen.findByText('No account was found on this device.')).toBeInTheDocument();
    expect(useAdminAuthStore.getState().isAuthenticated).toBe(false);
  });
});
