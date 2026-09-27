// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import '@/i18n';
import { db } from '@/db/schema';
import { hashPin } from '@/lib/pin';
import Onboarding from './Onboarding';

describe('Onboarding consent step', () => {
  it('requires consent before the patient-name step is reachable', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>,
    );

    // Language step first — patient-name/consent copy isn't shown yet.
    expect(screen.getByText('Choose your language')).toBeInTheDocument();
    expect(screen.queryByText('Before we begin')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'English' }));

    // Consent step, not straight to patient-name.
    expect(screen.getByText('Before we begin')).toBeInTheDocument();
    expect(screen.queryByText("What is the patient's name?")).not.toBeInTheDocument();
  });

  it('advances to patient-name only after agreeing', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'English' }));
    await user.click(screen.getByRole('button', { name: 'I Understand & Agree' }));

    expect(screen.getByText("What is the patient's name?")).toBeInTheDocument();
  });
});

describe('Onboarding admin PIN step', () => {
  beforeEach(async () => {
    await db.patients.clear();
    await db.caregivers.clear();
  });

  async function reachAdminPinStep(user: ReturnType<typeof userEvent.setup>, caregiverPin: string) {
    render(
      <MemoryRouter>
        <Onboarding />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'English' }));
    await user.click(screen.getByRole('button', { name: 'I Understand & Agree' }));
    await user.type(screen.getByPlaceholderText('Enter name'), 'Test Patient');
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const [pin, confirmPin] = screen.getAllByPlaceholderText('••••');
    await user.type(pin, caregiverPin);
    await user.type(confirmPin, caregiverPin);
    await user.click(screen.getByRole('button', { name: 'Next' }));
  }

  it('rejects an admin PIN identical to the caregiver PIN, then accepts a distinct one', async () => {
    const user = userEvent.setup();
    await reachAdminPinStep(user, '1234');

    expect(screen.getByText('Set an admin PIN')).toBeInTheDocument();
    const [adminPin, confirmAdminPin] = screen.getAllByPlaceholderText('••••');
    await user.type(adminPin, '1234');
    await user.type(confirmAdminPin, '1234');
    await user.click(screen.getByRole('button', { name: 'Done' }));

    expect(
      await screen.findByText('The admin PIN must be different from the caregiver PIN.'),
    ).toBeInTheDocument();
    // Setup isn't finished yet — still on this same step, nothing persisted.
    expect(await db.caregivers.count()).toBe(0);

    await user.clear(adminPin);
    await user.clear(confirmAdminPin);
    await user.type(adminPin, '5678');
    await user.type(confirmAdminPin, '5678');
    await user.click(screen.getByRole('button', { name: 'Done' }));

    await waitFor(async () => {
      expect(await db.caregivers.count()).toBe(1);
    });
    const [caregiver] = await db.caregivers.toArray();
    const caregiverRehash = await hashPin('1234', caregiver.pinSalt);
    expect(caregiverRehash).toBe(caregiver.pinHash);
    const adminRehash = await hashPin('5678', caregiver.adminPinSalt!);
    expect(adminRehash).toBe(caregiver.adminPinHash);
    expect(screen.getByText('All set!')).toBeInTheDocument();
  });
});
