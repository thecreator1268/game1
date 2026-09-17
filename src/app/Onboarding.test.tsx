// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import '@/i18n';
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
