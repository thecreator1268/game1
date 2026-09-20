import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { DomainBalanceChart } from '@/dashboard/DomainBalanceChart';
import { LevelUpBadge } from '@/components/LevelUpBadge';
import { SplashScreen } from './SplashScreen';

const DEMO_BALANCE = [
  { domain: 'memory' as const, sessionCount: 6 },
  { domain: 'attention' as const, sessionCount: 4 },
  { domain: 'routine' as const, sessionCount: 7 },
  { domain: 'pattern' as const, sessionCount: 3 },
  { domain: 'orientation' as const, sessionCount: 5 },
];

const DEMO_SUMMARY =
  'Aitama played 5 days this week, up from 3 last week. Memory games showed the strongest improvement.';

type Beat = 'splash' | 'dashboard' | 'levelup';
const BEATS: Beat[] = ['splash', 'dashboard', 'levelup'];
// How long each beat holds on screen before cutting to the next, once its
// own entrance animation has had time to finish.
const BEAT_HOLD_MS: Record<Beat, number> = { splash: 200, dashboard: 3200, levelup: 1800 };

// Not linked from any nav — reachable only by typing /showcase directly.
// Plays the Tier-2 entrance sequences back-to-back once, purely so the demo
// video has a clean take to record without needing a real seeded account.
// A patient never sees this; per the "nothing loops forever" rule it runs
// once per "Play" press, not on an automatic timer.
export default function ShowcaseMode() {
  const [beatIndex, setBeatIndex] = useState<number | null>(null);
  const [runId, setRunId] = useState(0);

  function play() {
    setRunId((id) => id + 1);
    setBeatIndex(0);
  }

  function advance() {
    setBeatIndex((i) => {
      if (i === null) return null;
      const next = i + 1;
      return next < BEATS.length ? next : null;
    });
  }

  const beat = beatIndex === null ? null : BEATS[beatIndex];

  return (
    <div className="min-h-screen bg-bg">
      <div className="fixed right-4 top-4 z-20 flex gap-2 print:hidden">
        <button onClick={play} disabled={beat !== null} className="pill-ink tap-target disabled:opacity-40">
          {beat !== null ? 'Playing…' : 'Play showcase'}
        </button>
      </div>

      {beat === null && (
        <div className="flex min-h-screen items-center justify-center px-4 text-center">
          <p className="text-body text-text-muted">
            Showcase mode — plays the splash reveal, the caregiver dashboard entrance, and a level-up
            celebration back-to-back for screen recording. Press "Play showcase" to start.
          </p>
        </div>
      )}

      {beat === 'splash' && (
        <SplashScreen key={runId} forceReveal onRevealDone={advance} />
      )}
      {beat === 'dashboard' && <ShowcaseBeat holdMs={BEAT_HOLD_MS.dashboard} onDone={advance}><ShowcaseDashboard /></ShowcaseBeat>}
      {beat === 'levelup' && <ShowcaseLevelUp onDone={advance} />}
    </div>
  );
}

// A fixed-hold beat: shows its child for `holdMs`, then advances. Used for
// beats whose own entrance animation doesn't have a natural "done" signal
// to hook into (unlike the splash reveal or the level-up badge, which both
// report their own completion).
function ShowcaseBeat({ holdMs, onDone, children }: { holdMs: number; onDone: () => void; children: ReactNode }) {
  useEffect(() => {
    const timer = setTimeout(onDone, holdMs);
    return () => clearTimeout(timer);
  }, [holdMs, onDone]);
  return <>{children}</>;
}

// GSAP timeline for the dashboard beat's entrance: heading, summary line and
// chart card arrive in sequence. Recording-only screen (not reachable by a
// patient), so the multi-element timeline is in scope; the bars themselves
// still grow via Motion springs in DomainBalanceChart, started by the card
// mounting. Reduced motion: no timeline, everything already at its final state.
function ShowcaseDashboard() {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-showcase="heading"]', { opacity: 0, y: 16, duration: 0.4 })
        .from('[data-showcase="summary"]', { opacity: 0, y: 10, duration: 0.35 }, '-=0.15')
        .from('[data-showcase="card"]', { opacity: 0, y: 24, duration: 0.5 }, '-=0.1');
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={root} className="mx-auto max-w-3xl px-4 py-10">
      <h1 data-showcase="heading" className="text-heading-lg font-bold">Caregiver Dashboard</h1>
      <p data-showcase="summary" className="mt-2 text-body text-text-muted">{DEMO_SUMMARY}</p>
      <div data-showcase="card" className="card-elderly mt-6">
        <h2 className="text-action font-bold">Domain Balance</h2>
        <DomainBalanceChart data={DEMO_BALANCE} />
      </div>
    </div>
  );
}

function ShowcaseLevelUp({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <p className="text-heading font-bold text-primary">Well done!</p>
      <LevelUpBadge label="Level 5" onDone={onDone} />
    </div>
  );
}
