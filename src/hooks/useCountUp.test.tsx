// @vitest-environment jsdom
import { StrictMode, type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('useCountUp', () => {
  it('counts up to the final value', async () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useCountUp(7, 150));
    await waitFor(() => expect(result.current).toBe(7), { timeout: 2000 });
  });

  it('still finishes after StrictMode\'s dev double-mount', async () => {
    mockReducedMotion(false);
    const wrapper = ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>;
    const { result } = renderHook(() => useCountUp(7, 150), { wrapper });
    await waitFor(() => expect(result.current).toBe(7), { timeout: 2000 });
  });

  it('skips straight to the final value under prefers-reduced-motion', () => {
    mockReducedMotion(true);
    const { result } = renderHook(() => useCountUp(7, 150));
    expect(result.current).toBe(7);
  });

  it('does not flash 0 while the value is still loading', () => {
    mockReducedMotion(false);
    const { result } = renderHook(() => useCountUp(undefined));
    expect(result.current).toBe(1);
  });
});
