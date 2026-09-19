import { useTranslation } from 'react-i18next';
import { CheckIcon } from './icons';
import { Icon } from './IconSprite';

interface RoundFeedbackProps {
  feedback: 'correct' | 'wrong' | null;
}

// Shared by every game that shows an inline correct/try-again message after
// an attempt (previously five near-identical, un-announced <p> blocks).
// role="status" + aria-live means a screen-reader user gets the same signal
// a sighted player gets from the colour/text change. Motion: a checkmark
// scale-in + soft teal glow and a floating "Well done!" toast for correct
// (see index.css's .toast-in — the design reference's exact pattern), a
// gentle warm-amber shake for incorrect — never red/danger, so a wrong
// answer reads as "try again", not as an alarm. Plain CSS, not Framer
// Motion — every one of the 14 games needs this component, so it sits on
// the same low-RAM-tablet-critical path this project's non-functional
// requirements call out for avoiding heavy animation libraries.
export function RoundFeedback({ feedback }: RoundFeedbackProps) {
  const { t } = useTranslation();
  if (!feedback) return null;

  const isCorrect = feedback === 'correct';

  return (
    <>
      <p
        key={feedback}
        role="status"
        aria-live="polite"
        className={`mt-4 flex items-center gap-2 text-body font-semibold ${
          isCorrect ? 'text-success feedback-correct-in' : 'text-warn feedback-shake'
        }`}
      >
        {isCorrect && <CheckIcon width={22} height={22} />}
        {isCorrect ? t('common.correct') : t('common.tryAgain')}
      </p>
      {isCorrect && (
        <div className="toast-in pointer-events-none fixed bottom-28 left-1/2 z-40 -translate-x-1/2">
          <span className="pill-ink font-heading">
            {t('common.wellDone')}
            <Icon name="spark" size={13} className="text-[var(--domain-memory)]" />
          </span>
        </div>
      )}
    </>
  );
}
