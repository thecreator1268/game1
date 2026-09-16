import { useState } from 'react';
import { useActivePatient } from '@/hooks/useActivePatient';
import { speak } from '@/lib/speech';
import { IconButton } from './IconButton';
import { SpeakerIcon } from './icons';

interface VoicePromptProps {
  text: string;
  /** Path under public/audio used only when browser TTS can't speak this language. */
  fallbackAudioSrc?: string;
  label?: string;
}

// Every screen's instructions carry one of these next to the text — reading
// it aloud never blocks the rest of the UI even if no speech engine or
// fallback clip is available (see lib/speech.ts).
export function VoicePrompt({ text, fallbackAudioSrc, label = 'Listen' }: VoicePromptProps) {
  const patient = useActivePatient();
  const [speaking, setSpeaking] = useState(false);

  const handleClick = async () => {
    setSpeaking(true);
    try {
      await speak({ text, lang: patient?.preferredLanguage ?? 'en', fallbackAudioSrc });
    } finally {
      setSpeaking(false);
    }
  };

  return (
    <IconButton label={label} tone="primary" onClick={() => void handleClick()} disabled={speaking}>
      <SpeakerIcon />
    </IconButton>
  );
}
