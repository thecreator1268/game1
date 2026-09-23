import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { shouldShowBreakPrompt, useFatigueStore } from '@/store/fatigueStore';
import { Modal } from './Modal';
import { Button } from './Button';

const CHECK_INTERVAL_MS = 20_000;

export function BreakPromptWatcher() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const startTracking = useFatigueStore((s) => s.startTracking);
  const dismissBreak = useFatigueStore((s) => s.dismissBreak);
  const resetTracking = useFatigueStore((s) => s.resetTracking);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    startTracking();
  }, [startTracking]);

  useEffect(() => {
    const check = () => setVisible(shouldShowBreakPrompt(useFatigueStore.getState()));
    check();
    const interval = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <Modal title={t('common.takeBreakTitle')} onClose={() => setVisible(false)}>
          <p className="text-body text-text-muted mb-6">{t('common.takeBreakBody')}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => {
                resetTracking();
                setVisible(false);
                navigate('/patient');
              }}
            >
              {t('common.takeBreakStop')}
            </Button>
            <Button
              onClick={() => {
                dismissBreak();
                setVisible(false);
              }}
            >
              {t('common.takeBreakContinue')}
            </Button>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
