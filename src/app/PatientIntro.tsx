import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BlobMascot } from '@/components/BlobMascot';
import { Icon } from '@/components/IconSprite';
import { VoicePrompt } from '@/components/VoicePrompt';
import { DOMAIN_CARD_CLASS } from '@/dashboard/domainColors';
import type { SupportedLanguage } from '@/db/types';
import { speak, stopSpeaking } from '@/lib/speech';
import { AUTO_SPEAK_ENABLED } from '@/lib/voiceConfig';

// First-launch introduction for the patient: three screens, one idea each,
// one short sentence, one picture, read aloud. It follows the ADRD usability
// review's suggestions to show limited information and to break instructions
// into simple steps given one at a time (Engelsma et al. 2021, see
// src/lib/evidence.ts). Skip is exactly as big and as easy to find as Next —
// leaving is never harder than continuing. The pictures are the app's own
// blob mascot and sprite icons, not new art, so what the patient sees here is
// what they will meet on the home screen.

const STEP_KEYS = ['intro.step1', 'intro.step2', 'intro.step3'] as const;

function CardPicture() {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden
      className={`game-card ${DOMAIN_CARD_CLASS.memory} pointer-events-none w-60 min-h-[190px]`}
    >
      <span className="speech-tag -mx-1 -mt-1 mb-auto self-stretch">{t('games.smriti-cards.name')}</span>
      <BlobMascot gameId="smriti-cards" />
      <span className="pill-ink mt-2 self-start">
        {t('common.play')}
        <Icon name="play" size={12} />
      </span>
    </div>
  );
}

function ReminderPicture() {
  const { t } = useTranslation();
  return (
    <div
      aria-hidden
      className="shadow-card flex w-full max-w-sm items-center gap-4 rounded-card border-[3px] border-text bg-chip-pink p-4"
    >
      <span className="icon-tile">
        <Icon name="pill" size={34} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-heading text-body font-bold">{t('reminders.medicine')}</p>
        <p className="text-sm text-text">{t('reminders.title')}</p>
      </div>
      <span className="pill-ink">
        <Icon name="check" size={16} />
      </span>
    </div>
  );
}

function HomePicture() {
  return (
    <span
      aria-hidden
      className="shadow-card flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-text bg-surface text-text"
    >
      <Icon name="home" size={52} />
    </span>
  );
}

const PICTURES: ReactNode[] = [<CardPicture key="card" />, <ReminderPicture key="rem" />, <HomePicture key="home" />];

interface PatientIntroProps {
  language: SupportedLanguage;
  /** Called on Skip, or on the last screen's button. Marks the intro as seen. */
  onFinish: () => void;
}

export function PatientIntro({ language, onFinish }: PatientIntroProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const isLast = step === STEP_KEYS.length - 1;
  const sentence = t(STEP_KEYS[step]);

  // Read each screen aloud as it appears. The patient has already tapped
  // through the role screen to get here, so the browser allows it; if speech
  // is unavailable the sentence is on screen and the speaker button remains.
  useEffect(() => {
    if (!AUTO_SPEAK_ENABLED) return undefined;
    void speak({ text: sentence, lang: language });
    return () => stopSpeaking();
  }, [sentence, language]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-bg px-4 py-10 text-center">
      <p className="pill-flat" aria-live="polite">
        {t('intro.progress', { current: step + 1, total: STEP_KEYS.length })}
      </p>

      <div className="flex min-h-[200px] items-center justify-center">{PICTURES[step]}</div>

      <div className="flex max-w-xl items-center justify-center gap-3">
        <VoicePrompt text={sentence} label={t('common.listen')} repeatOnInactivity />
        <h1 className="text-balance text-heading-lg font-bold leading-tight">{sentence}</h1>
      </div>

      {/* Same size, same weight of emphasis for both: Skip must be as easy to
          find as Next. Skip is first in reading order so it is never buried. */}
      <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
        <button className="btn-secondary flex-1" onClick={onFinish}>
          {t('intro.skip')}
        </button>
        <button className="btn-primary flex-1" onClick={isLast ? onFinish : () => setStep((s) => s + 1)}>
          {isLast ? t('intro.start') : t('intro.next')}
        </button>
      </div>
    </div>
  );
}
