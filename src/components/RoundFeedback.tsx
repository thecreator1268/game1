import { useTranslation } from 'react-i18next';

interface RoundFeedbackProps {
  feedback: 'correct' | 'wrong' | null;
}

// Shared by every game that shows an inline correct/try-again message after
// an attempt (previously five near-identical, un-announced <p> blocks).
// role="status" + aria-live means a screen-reader user gets the same signal
// a sighted player gets from the colour/text change.
export function RoundFeedback({ feedback }: RoundFeedbackProps) {
  const { t } = useTranslation();
  if (!feedback) return null;

  return (
    <p
      role="status"
      aria-live="polite"
      className={`mt-4 text-body font-semibold ${feedback === 'correct' ? 'text-success' : 'text-danger'}`}
    >
      {feedback === 'correct' ? t('common.correct') : t('common.tryAgain')}
    </p>
  );
}
