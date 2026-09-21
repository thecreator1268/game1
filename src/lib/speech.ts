import type { SupportedLanguage } from '@/db/types';

// Web Speech API is inconsistent across budget Android WebViews, and none of
// our regional languages beyond Hindi reliably have an installed TTS voice.
// This module never throws and never blocks the caller: if speech synthesis
// or a matching voice isn't available, callers fall back to a pre-recorded
// audio clip (public/audio/<lang>/<key>.mp3), and if that also fails, the
// patient simply doesn't hear anything — the on-screen tap targets are never
// gated on audio succeeding.
const BCP47_BY_LANG: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  as: 'as-IN',
  mni: 'en-IN',
  kha: 'en-IN',
  lus: 'en-IN',
  nsm: 'en-IN',
  // Nepali has genuine, widely-installed TTS voice support on Android/Chrome
  // (unlike most of the languages above) — worth calling out, not a guess.
  ne: 'ne-NP',
  kok: 'en-IN',
};

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function findVoice(bcp47: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === bcp47.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(bcp47.slice(0, 2)))
  );
}

export function speakText(text: string, lang: SupportedLanguage): boolean {
  if (!isSpeechSynthesisSupported()) return false;
  const bcp47 = BCP47_BY_LANG[lang] ?? 'en-IN';
  const voice = findVoice(bcp47);
  // No matching voice installed for this language: let the caller fall back
  // to a pre-recorded clip instead of speaking in the wrong language.
  if (!voice && lang !== 'en') return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp47;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

// True while an utterance is playing — callers that *offer* speech again
// (inactivity repeat, reminder cue) check this so they never talk over
// themselves or cut off a manual replay.
export function isSpeaking(): boolean {
  try {
    return isSpeechSynthesisSupported() && window.speechSynthesis.speaking;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

export function playAudioFallback(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(src);
      audio.onended = () => resolve(true);
      audio.onerror = () => resolve(false);
      audio.play().catch(() => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

export interface SpeakOptions {
  text: string;
  lang: SupportedLanguage;
  fallbackAudioSrc?: string;
}

export async function speak({ text, lang, fallbackAudioSrc }: SpeakOptions): Promise<void> {
  const spoke = speakText(text, lang);
  if (spoke) return;
  if (fallbackAudioSrc) {
    const played = await playAudioFallback(fallbackAudioSrc);
    if (played) return;
  }
  // Last resort within the fallback chain: try English TTS so something is
  // audible rather than nothing at all.
  if (lang !== 'en') speakText(text, 'en');
}

// --- Voice input (optional, e.g. spoken answers) -----------------------
type SpeechRecognitionCtor = new () => SpeechRecognition;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function isSpeechRecognitionSupported(): boolean {
  return Boolean(getSpeechRecognitionCtor());
}

export function listenOnce(lang: SupportedLanguage): Promise<string | null> {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) return Promise.resolve(null);

  return new Promise((resolve) => {
    try {
      const recognition = new Ctor();
      recognition.lang = BCP47_BY_LANG[lang] ?? 'en-IN';
      recognition.maxAlternatives = 1;
      recognition.interimResults = false;
      let settled = false;
      const finish = (value: string | null) => {
        if (settled) return;
        settled = true;
        resolve(value);
      };
      recognition.onresult = (event) => {
        finish(event.results[0]?.[0]?.transcript ?? null);
      };
      recognition.onerror = () => finish(null);
      recognition.onend = () => finish(null);
      recognition.start();
    } catch {
      resolve(null);
    }
  });
}
