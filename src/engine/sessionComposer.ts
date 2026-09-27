import type { Domain, GameId } from '@/db/types';
import { GAME_LIST, type GameMeta } from '@/games/gameList';

// "Today's Set" rotation logic.
//
// Exactly 3 games, one per domain, presented as free/unordered choices —
// no forced sequence, no domain pinned or specially prioritized. Of the 5
// domains, pick the 3 whose most-recently-played game is the oldest (i.e.
// the domain touched longest ago); within each picked domain, feature the
// single game that was played longest ago (or never). Purely timestamp-
// driven, so the set naturally adapts if a patient skips days rather than
// assuming daily play — playing Aaj Ka Din today, for instance, simply
// makes the Orientation domain the freshest one, so it rotates back out on
// its own without needing a separate "already done today" flag.

const ALL_DOMAINS: Domain[] = ['memory', 'attention', 'routine', 'pattern', 'orientation'];
const NEVER_PLAYED = Number.NEGATIVE_INFINITY;
const TODAYS_SET_SIZE = 3;

export interface PlayHistoryEntry {
  gameId: GameId;
  lastPlayedAt: number | null;
}

// Plain subtraction (a - b) breaks when both sides are NEVER_PLAYED
// (-Infinity - -Infinity = NaN) — harmless in practice (the spec treats a
// NaN comparator result as 0, and Array.prototype.sort is stable, so ties
// already resolve to ALL_DOMAINS's declared order every run), but a NaN
// comparator is fragile to rely on. Compares explicitly instead so ties are
// deterministic by construction, not by a spec nuance.
function compareStaleness(a: number, b: number): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function composeTodaysSet(
  playHistory: PlayHistoryEntry[],
  games: GameMeta[] = GAME_LIST,
): GameId[] {
  const lastPlayedByGame = new Map<GameId, number>();
  for (const entry of playHistory) {
    lastPlayedByGame.set(entry.gameId, entry.lastPlayedAt ?? NEVER_PLAYED);
  }
  const lastPlayed = (id: GameId) => lastPlayedByGame.get(id) ?? NEVER_PLAYED;

  const gamesByDomain = new Map<Domain, GameMeta[]>();
  for (const domain of ALL_DOMAINS) {
    gamesByDomain.set(
      domain,
      games.filter((g) => g.domain === domain),
    );
  }

  const domainFreshness = ALL_DOMAINS.map((domain) => {
    const domainGames = gamesByDomain.get(domain) ?? [];
    const mostRecentInDomain = domainGames.reduce(
      (max, g) => Math.max(max, lastPlayed(g.id)),
      NEVER_PLAYED,
    );
    return { domain, mostRecentInDomain };
  });

  const selectedDomains = new Set(
    [...domainFreshness]
      .sort((a, b) => compareStaleness(a.mostRecentInDomain, b.mostRecentInDomain))
      .slice(0, TODAYS_SET_SIZE)
      .map((d) => d.domain),
  );

  return ALL_DOMAINS.filter((d) => selectedDomains.has(d))
    .map((domain) => {
      const domainGames = gamesByDomain.get(domain) ?? [];
      const leastRecentlyPlayed = [...domainGames].sort((a, b) =>
        compareStaleness(lastPlayed(a.id), lastPlayed(b.id)),
      )[0];
      return leastRecentlyPlayed?.id;
    })
    .filter((id): id is GameId => Boolean(id));
}
