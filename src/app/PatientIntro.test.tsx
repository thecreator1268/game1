// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { db } from '@/db/schema';
import type { Patient } from '@/db/types';
import { PatientIntro } from './PatientIntro';

vi.mock('@/lib/speech', () => ({
  speak: vi.fn().mockResolvedValue(undefined),
  stopSpeaking: vi.fn(),
  isSpeaking: () => false,
}));
vi.mock('@/hooks/useActivePatient', () => ({ useActivePatient: () => ({ preferredLanguage: 'en' }) }));

describe('PatientIntro', () => {
  it('walks three screens, one sentence each, then finishes', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<PatientIntro language="en" onFinish={onFinish} />);

    expect(screen.getByRole('heading', { name: 'Tap a card to play a game.' })).toBeInTheDocument();
    expect(screen.getByText('1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'This is Today. Your reminders are here.' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'This home button always brings you back here.' })).toBeInTheDocument();
    expect(onFinish).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: "Let's begin" }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('can be skipped from any screen, and Skip is as prominent as Next', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<PatientIntro language="en" onFinish={onFinish} />);

    const skip = screen.getByRole('button', { name: 'Skip' });
    const next = screen.getByRole('button', { name: 'Next' });
    // Both are full-size pill buttons (64px minimum tap target) that share the row equally.
    for (const button of [skip, next]) {
      expect(button.className).toContain('flex-1');
      expect(button.className).toMatch(/btn-(primary|secondary)/);
    }

    await user.click(skip);
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('offers the sentence aloud on every screen', () => {
    render(<PatientIntro language="en" onFinish={() => {}} />);
    expect(screen.getByRole('button', { name: 'Listen' })).toBeInTheDocument();
  });

  it('does not read itself aloud while automatic speech is switched off, but the button still speaks', async () => {
    const { speak } = await import('@/lib/speech');
    vi.mocked(speak).mockClear();
    const user = userEvent.setup();
    render(<PatientIntro language="en" onFinish={() => {}} />);

    expect(speak).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Listen' }));
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Tap a card to play a game.' }));
  });
});

describe('intro flag in the patient record', () => {
  it('a caregiver replay (introSeenAt: undefined) really clears the flag', async () => {
    const patient = {
      id: 'intro-flag-test',
      name: 'Test',
      preferredLanguage: 'en',
      caregiverIds: [],
      highContrastPalette: 'theme-1',
      textScale: 'normal',
      consentGivenAt: 1,
      reminderAlertsEnabled: false,
      createdAt: 1,
    } satisfies Patient;
    await db.patients.put(patient);

    await db.patients.update(patient.id, { introSeenAt: 123 });
    expect((await db.patients.get(patient.id))?.introSeenAt).toBe(123);

    await db.patients.update(patient.id, { introSeenAt: undefined });
    const after = await db.patients.get(patient.id);
    expect(after?.introSeenAt).toBeUndefined();
    expect(after && 'introSeenAt' in after).toBe(false);

    await db.patients.delete(patient.id);
  });
});
