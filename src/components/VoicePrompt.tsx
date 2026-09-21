import { useState } from 'react';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useInactivityRepeat } from '@/hooks/useInactivityRepeat';
import { speak } from '@/lib/speech';
import { AUTO_SPEAK_ENABLED } from '@/lib/voiceConfig';
import { IconButton } from './IconButton';
import { SpeakerIcon } from './icons';

interface VoicePromptProps {
  text: string;
  /** Path under public/audio used only when browser TTS can't speak this language. */
  fallbackAudioSrc?: string;
  label?: string;
  /**
   * Offer this instruction again after a stretch with no input (see
   * useInactivityRepeat; Engelsma et al. 2021 in src/lib/evidence.ts). Only
   * for instructions — not for content the patient is meant to memorise
   * (a shopping list, a story) or caregiver-facing text. Additive: the
   * speaker button below always works too.
   */
  repeatOnInactivity?: boolean;
}

// Every screen's instructions carry one of these next to the text — reading
// it aloud never blocks the rest of the UI even if no speech engine or
// fallback clip is available (see lib/speech.ts).
export function VoicePrompt({ text, fallbackAudioSrc, label = 'Listen', repeatOnInactivity = false }: VoicePromptProps) {
  const patient = useActivePatient();
  const [speaking, setSpeaking] = useState(false);

  const play = async () => {
    setSpeaking(true);
    try {
      await speak({ text, lang: patient?.preferredLanguage ?? 'en', fallbackAudioSrc });
    } finally {
      setSpeaking(false);
    }
  };

  // Same voice, rate and volume as a manual tap — no chime, no urgency cue.
  useInactivityRepeat(
    () => {
      if (!speaking) void play();
    },
    { enabled: repeatOnInactivity && AUTO_SPEAK_ENABLED },
  );

  return (
    <IconButton label={label} tone="primary" onClick={() => void play()} disabled={speaking}>
      <SpeakerIcon />
    </IconButton>
  );
}
