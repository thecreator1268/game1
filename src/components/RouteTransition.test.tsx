// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { motion } from 'motion/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteTransition } from './RouteTransition';

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

function Screen({ routeKey }: { routeKey: string }) {
  return (
    <MemoryRouter>
      <RouteTransition routeKey={routeKey}>
        <motion.div data-testid="child" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
      </RouteTransition>
    </MemoryRouter>
  );
}

describe('RouteTransition', () => {
  // Regression: `AnimatePresence initial={false}` leaks through PresenceContext
  // and blocks the mount animation of every descendant motion.* on a
  // directly-loaded route (chart bars, level-up badge). Descendants must still
  // start from their own `initial` state.
  it('does not block descendants\' own initial state on first load', () => {
    render(<Screen routeKey="a" />);
    expect(screen.getByTestId('child').style.opacity).toBe('0');
  });

  it('skips its own wrapper entrance on first load, then animates later route changes', () => {
    const { rerender } = render(<Screen routeKey="a" />);
    // wrapper: first load is not a slide-in
    expect(screen.getByTestId('child').parentElement?.style.opacity).not.toBe('0');

    rerender(<Screen routeKey="b" />);
    const wrappers = screen.getAllByTestId('child').map((c) => c.parentElement);
    // the newly mounted wrapper starts from its `initial` (opacity 0)
    expect(wrappers.some((w) => w?.style.opacity === '0')).toBe(true);
  });
});
