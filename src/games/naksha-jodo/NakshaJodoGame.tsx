import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '@/components/GameShell';
import { SessionSummary } from '@/components/SessionSummary';
import { VoicePrompt } from '@/components/VoicePrompt';
import { Button } from '@/components/Button';
import { useActivePatient } from '@/hooks/useActivePatient';
import { useLevelParam } from '@/hooks/useLevelParam';
import { getCurrentLevel, recordGameSession } from '@/engine/gameSessionService';
import { isPersonalBest, type LevelDecision } from '@/engine/adaptiveEngine';
import { useFatigueStore } from '@/store/fatigueStore';
import { shuffle } from '@/lib/shuffle';
import type { ErrorType } from '@/db/types';
import { buildMosaic, gridForLevel } from './params';

interface Piece {
  key: string;
  color: string;
}

type Phase = 'loading' | 'playing' | 'summary';

// Same tap-to-place / tap-to-undo interaction as Dinacharya Sequence, for the
// same motor-accessibility reason (see that game's file comment) — this is
// the other of the two "drag-based" exception games.
export default function NakshaJodoGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = useActivePatient();
  const levelParam = useLevelParam();
  const recordGamePlayed = useFatigueStore((s) => s.recordGamePlayed);

  const [phase, setPhase] = useState<Phase>('loading');
  const [level, setLevel] = useState(1);
  const [cols, setCols] = useState(2);
  const [targetColors, setTargetColors] = useState<string[]>([]);
  const [tray, setTray] = useState<Piece[]>([]);
  const [slots, setSlots] = useState<(Piece | null)[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [levelDecision, setLevelDecision] = useState<LevelDecision | null>(null);
  const [resultAccuracyPct, setResultAccuracyPct] = useState(0);

  const sessionStartRef = useRef(0);

  async function startRound(patientId: string, forcedLevel?: number) {
    const currentLevel = forcedLevel ?? (await getCurrentLevel(patientId, 'naksha-jodo'));
    const { rows: r, cols: c } = gridForLevel(currentLevel);
    const colors = buildMosaic(r, c);
    const pieces: Piece[] = colors.map((color, i) => ({ key: `p-${i}-${Math.random()}`, color }));

    setLevel(currentLevel);
    setCols(c);
    setTargetColors(colors);
    setTray(shuffle(pieces));
    setSlots(new Array(colors.length).fill(null));
    setSelectedKey(null);
    setLevelDecision(null);
    sessionStartRef.current = Date.now();
    setPhase('playing');
  }

  useEffect(() => {
    if (patient?.id) void startRound(patient.id, levelParam ?? undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient?.id]);

  function placeInSlot(slotIndex: number) {
    if (!selectedKey || slots[slotIndex]) return;
    const piece = tray.find((p) => p.key === selectedKey);
    if (!piece) return;
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? piece : s)));
    setTray((prev) => prev.filter((p) => p.key !== selectedKey));
    setSelectedKey(null);
  }

  function removeFromSlot(slotIndex: number) {
    const piece = slots[slotIndex];
    if (!piece) return;
    setSlots((prev) => prev.map((s, i) => (i === slotIndex ? null : s)));
    setTray((prev) => [...prev, piece]);
  }

  async function checkAssembly() {
    if (!patient) return;
    const errorTypes: ErrorType[] = slots.map((piece, i) =>
      piece && piece.color === targetColors[i] ? 'none' : 'sequence-error',
    );
    const correctCount = errorTypes.filter((e) => e === 'none').length;
    const accuracy = targetColors.length > 0 ? correctCount / targetColors.length : 1;
    const elapsed = Date.now() - sessionStartRef.current;
    const avgResponseMs = targetColors.length > 0 ? elapsed / targetColors.length : elapsed;

    const { levelDecision: decision } = await recordGameSession({
      patientId: patient.id,
      gameId: 'naksha-jodo',
      level,
      score: Math.round(accuracy * 100),
      accuracy,
      avgResponseMs,
      errorTypes,
      startedAt: sessionStartRef.current,
      endedAt: Date.now(),
    });
    recordGamePlayed();
    setResultAccuracyPct(accuracy * 100);
    setLevelDecision(decision);
    setPhase('summary');
  }

  if (!patient) return null;

  if (phase === 'loading') {
    return (
      <GameShell gameId="naksha-jodo" level={level}>
        <p className="py-20 text-center text-body">{t('common.loading')}</p>
      </GameShell>
    );
  }

  if (phase === 'summary') {
    const displayedLevel = levelDecision?.changed ? levelDecision.newLevel : level;
    return (
      <GameShell gameId="naksha-jodo" level={level}>
        <SessionSummary
          accuracyPct={resultAccuracyPct}
          levelDecision={levelDecision}
          showPersonalBest={isPersonalBest(displayedLevel)}
          onPlayAgain={() => void startRound(patient.id)}
          onGoHome={() => navigate('/patient')}
          onChooseLevel={() => navigate('/patient/game/naksha-jodo/levels')}
        />
      </GameShell>
    );
  }

  const allFilled = slots.every((s) => s !== null);

  return (
    <GameShell gameId="naksha-jodo" level={level}>
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <VoicePrompt text={t('games.naksha-jodo.instructions')} label={t('common.listen')} />
          <p className="text-body text-text-muted">{t('games.naksha-jodo.instructions')}</p>
        </div>

        <div
          className="mx-auto mb-8 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * 76 }}
        >
          {slots.map((piece, index) => (
            <button
              key={index}
              onClick={() => (piece ? removeFromSlot(index) : placeInSlot(index))}
              className="tap-target aspect-square rounded-md border-2 border-dashed border-border"
              style={{ backgroundColor: piece ? piece.color : 'transparent' }}
              aria-label={piece ? 'Filled piece' : `Empty spot ${index + 1}`}
            />
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold text-text-muted">Pieces</p>
        <div className="mb-8 flex flex-wrap gap-2">
          {tray.map((piece) => (
            <button
              key={piece.key}
              onClick={() => setSelectedKey(piece.key === selectedKey ? null : piece.key)}
              className={`h-12 w-12 rounded-md border-4 transition-transform ${
                selectedKey === piece.key ? 'border-accent scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: piece.color }}
              aria-label="mosaic piece"
            />
          ))}
        </div>

        <Button onClick={() => void checkAssembly()} disabled={!allFilled}>
          {t('common.done')}
        </Button>
      </div>
    </GameShell>
  );
}
