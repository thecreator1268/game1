import { useTranslation } from 'react-i18next';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import { Card } from '@/components/Card';
import { Icon, type IconName } from '@/components/IconSprite';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { useReminderVoice } from '@/hooks/useReminderVoice';
import { getTodaysReminders, markReminderTaken } from '@/reminders/reminderService';

const CATEGORY_ICON: Record<string, IconName> = {
  medicine: 'pill',
  hydration: 'drop',
  activity: 'walk',
  appointment: 'stethoscope',
};

// Full-row flat color per category (not just an icon chip) — matches the
// game card / reminder-row anatomy everywhere else in this pass: a bold
// color block with a white "sticker" element floating on top, never a
// white card with a colored accent.
const CATEGORY_ROW_CLASS: Record<string, string> = {
  medicine: 'bg-chip-pink',
  hydration: 'bg-[var(--domain-attention)]',
  activity: 'bg-[var(--domain-memory)]',
  appointment: 'bg-[var(--domain-orientation)]',
};

// Routine (teal) isn't used here, but if it ever is, dark ink text still
// needs to flip like the game cards' routine card — none of today's four
// categories are that dark, so no row currently needs the inverted flag.

export function TodayReminders({ patientId }: { patientId: string }) {
  const { t } = useTranslation();
  const reminders = useLiveQuery(() => getTodaysReminders(patientId), [patientId], []);
  const prefersReducedMotion = usePrefersReducedMotion();
  useReminderVoice(reminders);

  if (!reminders || reminders.length === 0) {
    return (
      <Card>
        <h2 className="text-action font-bold">{t('reminders.title')}</h2>
        <p className="mt-2 text-body text-text-muted">{t('reminders.noneToday')}</p>
      </Card>
    );
  }

  const doneCount = reminders.filter((r) => r.takenToday).length;
  const allDone = doneCount === reminders.length;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-action font-bold">{t('reminders.title')}</h2>
        {prefersReducedMotion ? (
          <p className="text-body text-text-muted">
            {allDone
              ? t('reminders.allDoneCount', { total: reminders.length })
              : t('reminders.doneCount', { done: doneCount, total: reminders.length })}
          </p>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={allDone ? 'done' : 'progress'}
              className="text-body text-text-muted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              {allDone
                ? t('reminders.allDoneCount', { total: reminders.length })
                : t('reminders.doneCount', { done: doneCount, total: reminders.length })}
            </motion.p>
          </AnimatePresence>
        )}
      </div>
      <ul className="flex flex-col gap-4">
        {reminders.map((r) => {
          const isNoted = r.category === 'appointment';
          return (
            <li
              key={r.id}
              className={`shadow-card flex flex-wrap items-center gap-4 rounded-card border-[3px] border-text p-4 transition-opacity ${
                CATEGORY_ROW_CLASS[r.category] ?? 'bg-surface-alt'
              } ${r.takenToday ? 'opacity-[0.66]' : ''}`}
            >
              <span className="icon-tile" aria-hidden>
                <Icon name={CATEGORY_ICON[r.category] ?? 'clock'} size={34} />
              </span>
              <div className="min-w-0 flex-1">
                {/* Full-opacity ink, never muted — an alpha-reduced label
                    directly on a saturated row color (no white chip behind
                    it) drops well below the 7:1 target on some of these
                    hues; full ink clears all four category colors. */}
                <p className="text-[13px] font-bold uppercase tracking-wide text-text">
                  {t(`reminders.${r.category}`)}
                </p>
                <p className="font-heading text-body font-bold">{r.label}</p>
                <p className="text-sm text-text">{r.schedule}</p>
              </div>
              {r.takenToday ? (
                <span
                  className="pill-ink bg-surface text-text"
                  style={{ animation: 'ssStamp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}
                >
                  <Icon name="check" size={16} />
                  {isNoted ? t('common.done') : t('reminders.taken')}
                </span>
              ) : (
                <button className="pill-ink tap-target" onClick={() => void markReminderTaken(r)}>
                  <Icon name="check" size={16} />
                  {t('reminders.markTaken')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
