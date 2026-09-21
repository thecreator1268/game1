import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useActivePatient } from '@/hooks/useActivePatient';
import { isSpeaking, speak } from '@/lib/speech';
import { AUTO_SPEAK_ENABLED } from '@/lib/voiceConfig';
import type { TodayReminderView } from '@/reminders/reminderService';
import { historyKey, readHistory, reminderVoiceAction, writeHistory } from '@/reminders/reminderVoice';

const CHECK_INTERVAL_MS = 30_000;

// Speaks due reminders from the patient's Today list while it is on screen:
// one cue when a reminder comes due, one gentle replay if it is still
// unacknowledged 10 minutes later (see reminders/reminderVoice.ts). Same voice
// and pace as every other prompt; one reminder at a time, never over other
// speech, and never into a hidden tab.
export function useReminderVoice(reminders: TodayReminderView[] | undefined): void {
  const { t } = useTranslation();
  const patient = useActivePatient();
  const lang = patient?.preferredLanguage ?? 'en';

  useEffect(() => {
    if (!AUTO_SPEAK_ENABLED || !reminders || reminders.length === 0) return undefined;

    const check = () => {
      if (document.visibilityState !== 'visible' || isSpeaking()) return;
      // Browsers block speech until the person has tapped something on this
      // page. Skip (without using up the cue) until they have.
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;

      const now = Date.now();
      const history = readHistory(now);
      for (const reminder of reminders) {
        const key = historyKey(reminder.id, now);
        const action = reminderVoiceAction(reminder, now, history[key]);
        if (!action) continue;
        history[key] = { count: (history[key]?.count ?? 0) + 1, lastAt: now };
        writeHistory(history);
        const text = t(action === 'cue' ? 'reminders.notificationTitle' : 'reminders.voiceReplay', {
          label: reminder.label,
        });
        void speak({ text, lang });
        return; // one at a time; the next check picks up the rest
      }
    };

    check();
    const id = window.setInterval(check, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reminders, t, lang]);
}
