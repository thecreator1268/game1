import type { Domain, GameId } from '@/db/types';

export interface GameMeta {
  id: GameId;
  domain: Domain;
  usesAdaptiveEngine: boolean;
}

// Canonical list of all 14 games and the clinical domain each maps to.
// Order here is the stable tie-break order used by the session composer.
export const GAME_LIST: GameMeta[] = [
  { id: 'smriti-cards', domain: 'memory', usesAdaptiveEngine: true },
  { id: 'smriti-katha', domain: 'memory', usesAdaptiveEngine: true },
  { id: 'naam-yaad', domain: 'memory', usesAdaptiveEngine: true },
  { id: 'dhyan-dhaam', domain: 'attention', usesAdaptiveEngine: true },
  { id: 'ginti-dhyan', domain: 'attention', usesAdaptiveEngine: true },
  { id: 'awaaz-pehchan', domain: 'attention', usesAdaptiveEngine: true },
  { id: 'dinacharya-sequence', domain: 'routine', usesAdaptiveEngine: true },
  { id: 'bazaar-list', domain: 'routine', usesAdaptiveEngine: true },
  { id: 'ghar-ka-kaam', domain: 'routine', usesAdaptiveEngine: true },
  { id: 'aakar-milan', domain: 'pattern', usesAdaptiveEngine: true },
  { id: 'chaya-khoj', domain: 'pattern', usesAdaptiveEngine: true },
  { id: 'naksha-jodo', domain: 'pattern', usesAdaptiveEngine: true },
  { id: 'aaj-ka-din', domain: 'orientation', usesAdaptiveEngine: false },
  { id: 'ghadi-dekho', domain: 'orientation', usesAdaptiveEngine: true },
];

export const DOMAINS: Domain[] = ['memory', 'attention', 'routine', 'pattern', 'orientation'];

export function gamesInDomain(domain: Domain): GameMeta[] {
  return GAME_LIST.filter((g) => g.domain === domain);
}

export function getGameMeta(id: GameId): GameMeta {
  const meta = GAME_LIST.find((g) => g.id === id);
  if (!meta) throw new Error(`Unknown gameId: ${id}`);
  return meta;
}
