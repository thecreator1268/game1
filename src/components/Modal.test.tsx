// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { Modal } from './Modal';

describe('Modal', () => {
  it('moves focus into the dialog on open', async () => {
    render(
      <Modal title="Test dialog" onClose={vi.fn()}>
        <button>Inside action</button>
      </Modal>,
    );

    // The close (X) button is the first focusable element in the dialog.
    await screen.findByRole('button', { name: 'Close' });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal title="Test dialog" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wraps Tab from the last focusable element back to the first', async () => {
    const user = userEvent.setup();
    render(
      <Modal title="Test dialog" onClose={vi.fn()}>
        <button>Inside action</button>
      </Modal>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    const insideAction = screen.getByRole('button', { name: 'Inside action' });

    insideAction.focus();
    expect(insideAction).toHaveFocus();

    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('returns focus to the previously-focused element on close/unmount', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'Open dialog';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { unmount } = render(
      <Modal title="Test dialog" onClose={vi.fn()}>
        <p>Body</p>
      </Modal>,
    );
    expect(trigger).not.toHaveFocus();

    unmount();
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
