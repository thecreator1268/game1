import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

const PARTICLE_COLORS = [
  'var(--domain-memory)',
  'var(--domain-attention)',
  'var(--domain-routine)',
  'var(--domain-pattern)',
  'var(--domain-orientation)',
];
const PARTICLE_COUNT = 10;
const AUTO_DISMISS_MS = 1400;

interface Particle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
}

// Deterministic-enough scatter (real Math.random, but read once via a lazy
// initializer, never during render) — a level-up only happens once per
// session-summary mount, so re-rolling on re-render was never a risk here
// the way PatientHome's card order is.
function useParticles(): Particle[] {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const distance = 44 + Math.random() * 24;
      return {
        id: i,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: (Math.random() - 0.5) * 200,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      };
    }),
  );
  return particles;
}

interface LevelUpBadgeProps {
  label: string;
  /** Called once the celebration has run its course — never gates anything
   *  else on screen; every button around this badge stays clickable the
   *  whole time regardless of whether this has fired yet. */
  onDone?: () => void;
}

// The "leveled up" celebration: a badge that springs in with a slight
// overshoot while a handful of palette-colored chips arc outward and fade.
// Reserved for LevelDecision.direction === 'up' specifically (see
// SessionSummary) — a difficulty *decrease* is a supportive adjustment, not
// a win, and should never get confetti.
export function LevelUpBadge({ label, onDone }: LevelUpBadgeProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const particles = useParticles();

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (prefersReducedMotion) {
    return (
      <div className="mt-4 flex justify-center">
        <span className="pill-ink px-5 py-3 font-heading text-body">{label}</span>
      </div>
    );
  }

  return (
    <div className="relative mt-4 flex justify-center">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-[2px] border-2 border-text"
          style={{ background: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.4, rotate: p.rotate }}
          transition={{ duration: 0.95, ease: 'easeOut' }}
        />
      ))}
      <motion.span
        className="pill-ink px-5 py-3 font-heading text-body"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 320, damping: 11, mass: 0.7 }}
      >
        {label}
      </motion.span>
    </div>
  );
}
