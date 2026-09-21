// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTO_SPEAK_ENABLED } from '@/lib/voiceConfig';
import { VoicePrompt } from './VoicePrompt';

const speak = vi.fn().mockResolvedValue(undefined);
vi.mock('@/lib/speech', () => ({ speak: (...args: unknown[]) => speak(...args), isSpeaking: () => false }));
vi.mock('@/hooks/useActivePatient', () => ({ useActivePatient: () => ({ preferredLanguage: 'en' }) }));

beforeEach(() => speak.mockClear());
afterEach(() => vi.useRealTimers());

describe('VoicePrompt', () => {
  it('speaks when the speaker button is tapped, whatever the automatic-speech switch says', async () => {
    const user = userEvent.setup();
    render(<VoicePrompt text="Tap two cards." label="Listen" repeatOnInactivity />);

    await user.click(screen.getByRole('button', { name: 'Listen' }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({ text: 'Tap two cards.', lang: 'en' }));
  });

  it('only repeats the instruction on its own when automatic speech is switched on', () => {
    vi.useFakeTimers();
    render(<VoicePrompt text="Tap two cards." label="Listen" repeatOnInactivity />);

    act(() => void vi.advanceTimersByTime(5 * 60_000));
    // The shipped default is off: five idle minutes must produce no speech.
    expect(AUTO_SPEAK_ENABLED).toBe(false);
    expect(speak).not.toHaveBeenCalled();
  });
});
