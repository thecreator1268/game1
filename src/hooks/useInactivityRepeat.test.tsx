// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INACTIVITY_REPEAT_MS, MAX_AUTO_REPEATS, useInactivityRepeat } from './useInactivityRepeat';

const speaking = vi.fn(() => false);
vi.mock('@/lib/speech', () => ({ isSpeaking: () => speaking() }));

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  vi.useFakeTimers();
  speaking.mockReturnValue(false);
});
afterEach(() => vi.useRealTimers());

describe('useInactivityRepeat', () => {
  it('offers the instruction again after the idle window, and only then', () => {
    const onRepeat = vi.fn();
    renderHook(() => useInactivityRepeat(onRepeat));

    tick(INACTIVITY_REPEAT_MS - 1);
    expect(onRepeat).not.toHaveBeenCalled();
    tick(1);
    expect(onRepeat).toHaveBeenCalledTimes(1);
  });

  it('re-offers after another idle window if there is still no input, then stops at the cap', () => {
    const onRepeat = vi.fn();
    renderHook(() => useInactivityRepeat(onRepeat));

    tick(INACTIVITY_REPEAT_MS * (MAX_AUTO_REPEATS + 3));
    expect(onRepeat).toHaveBeenCalledTimes(MAX_AUTO_REPEATS);
  });

  it('never fires while the patient is interacting: each tap restarts the window', () => {
    const onRepeat = vi.fn();
    renderHook(() => useInactivityRepeat(onRepeat));

    // Tap every 10s for a full minute — always inside the 22s window.
    for (let i = 0; i < 6; i++) {
      tick(10_000);
      document.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    }
    expect(onRepeat).not.toHaveBeenCalled();

    tick(INACTIVITY_REPEAT_MS);
    expect(onRepeat).toHaveBeenCalledTimes(1);
  });

  it('starts a fresh idle stretch (and repeat budget) after the patient acts again', () => {
    const onRepeat = vi.fn();
    renderHook(() => useInactivityRepeat(onRepeat));

    tick(INACTIVITY_REPEAT_MS * (MAX_AUTO_REPEATS + 1));
    expect(onRepeat).toHaveBeenCalledTimes(MAX_AUTO_REPEATS);

    document.dispatchEvent(new Event('keydown', { bubbles: true }));
    tick(INACTIVITY_REPEAT_MS);
    expect(onRepeat).toHaveBeenCalledTimes(MAX_AUTO_REPEATS + 1);
  });

  it('does not talk over speech that is already playing', () => {
    const onRepeat = vi.fn();
    renderHook(() => useInactivityRepeat(onRepeat));

    speaking.mockReturnValue(true);
    tick(INACTIVITY_REPEAT_MS * 2);
    expect(onRepeat).not.toHaveBeenCalled();

    speaking.mockReturnValue(false);
    tick(INACTIVITY_REPEAT_MS);
    expect(onRepeat).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled, and cleans up its timer on unmount', () => {
    const onRepeat = vi.fn();
    const { unmount } = renderHook(() => useInactivityRepeat(onRepeat, { enabled: false }));
    tick(INACTIVITY_REPEAT_MS * 2);
    expect(onRepeat).not.toHaveBeenCalled();

    const live = vi.fn();
    const second = renderHook(() => useInactivityRepeat(live));
    second.unmount();
    unmount();
    tick(INACTIVITY_REPEAT_MS * 2);
    expect(live).not.toHaveBeenCalled();
  });
});
