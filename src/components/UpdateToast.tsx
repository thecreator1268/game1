import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Icon } from './IconSprite';

// A tab/PWA that stays open never re-checks for a new service worker on its
// own (browsers only do it on navigation), so testers would sit on a stale
// build indefinitely. Re-check when the app comes back to the foreground and
// on a slow interval.
const UPDATE_CHECK_MS = 30 * 60 * 1000;

// Reloading throws away a game round in progress, so the prompt waits until
// the person is out of an active game (the level-select screen is fine).
const ACTIVE_GAME = /^\/patient\/game\/[^/]+\/?$/;

export function UpdateToast() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => void registration.update().catch(() => undefined);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
      setInterval(check, UPDATE_CHECK_MS);
    },
  });

  if (!needRefresh || dismissed || ACTIVE_GAME.test(pathname)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="update-toast fixed inset-x-4 bottom-28 z-50 mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-card border-[3px] border-text bg-surface p-4 shadow-card print:hidden"
    >
      <span className="flex items-center gap-2 text-body font-semibold">
        <Icon name="spark" size={24} />
        {t('common.updateAvailable')}
      </span>
      <span className="flex gap-2">
        <button className="btn-primary" onClick={() => void updateServiceWorker(true)}>
          {t('common.updateRefresh')}
        </button>
        <button className="btn-secondary" onClick={() => setDismissed(true)}>
          {t('common.updateLater')}
        </button>
      </span>
    </div>
  );
}
