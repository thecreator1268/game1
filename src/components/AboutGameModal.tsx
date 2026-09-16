import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { GameId } from '@/db/types';
import { stopSpeaking } from '@/lib/speech';
import { Modal } from './Modal';
import { VoicePrompt } from './VoicePrompt';

interface AboutGameModalProps {
  gameId: GameId;
  onClose: () => void;
}

// The direct answer to "is this clinically valid" — every game shows exactly
// which MoCA/ADAS-Cog domain it maps to, sourced from games.<id>.clinicalMapping.
export function AboutGameModal({ gameId, onClose }: AboutGameModalProps) {
  const { t } = useTranslation();

  // Closing the modal mid-sentence shouldn't leave speech synthesis running.
  useEffect(() => {
    return () => stopSpeaking();
  }, []);

  const name = t(`games.${gameId}.name`);
  const meaning = t(`games.${gameId}.meaning`);
  const clinicalMapping = t(`games.${gameId}.clinicalMapping`);

  return (
    <Modal title={t('common.aboutThisGame')} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-body font-semibold">
          {name}
          {meaning && meaning !== name && <span className="ml-1 font-normal text-text-muted">({meaning})</span>}
        </p>
        <div className="flex items-start gap-3">
          <VoicePrompt text={clinicalMapping} label={t('common.listen')} />
          <p className="text-body text-text-muted">{clinicalMapping}</p>
        </div>
        <p className="text-sm text-text-muted border-t border-border pt-4">
          {t('common.clinicalNote')}
        </p>
      </div>
    </Modal>
  );
}
