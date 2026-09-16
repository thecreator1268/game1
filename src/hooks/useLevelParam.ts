import { useSearchParams } from 'react-router-dom';
import { MAX_LEVEL, MIN_LEVEL } from '@/engine/adaptiveEngine';

/**
 * Reads an explicit `?level=N` from the URL (set by the level-select screen)
 * so a game can be started at a manually-chosen level instead of always
 * deferring to the adaptive engine's recommendation. Returns null when no
 * level was specified, so normal quick-play from the home screen is
 * unaffected.
 */
export function useLevelParam(): number | null {
  const [searchParams] = useSearchParams();
  const raw = searchParams.get('level');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n)) return null;
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, n));
}
