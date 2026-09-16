import type { Domain, GameId } from '@/db/types';
import { GAME_LIST, type GameMeta } from '@/games/gameList';

// "Today's Set" rotation logic.
//
// Domains rotate purely off last-played timestamps (no day-of-week math),
// so the set naturally adapts if a patient skips days rather than assuming
// daily play:
//   1. Of the 4 non-orientation domains, pick the 3 whose most-recently-
//      played game is the oldest (i.e. the domain touched longest ago).
//   2. Within each picked domain, feature the single game that was played
//      longest ago (or never).
//   3. Aaj Ka Din (orientation) is pinned separately, once per day, only
//      while not yet completed today — it isn't part of the 3-domain
//      rotation since it's a daily check-in, not a repeatable drill.

const ROTATION_DOMAINS: Domain[] = ['memory', 'attention', 'routine', 'pattern'];
const NEVER_PLAYED = Number.NEGATIVE_INFINITY;

export interface PlayHistoryEntry {
  gameId: GameId;
  lastPlayedAt: number | null;
}

export interface TodaysSet {
  orientationGame: GameId | null;
  rotatedGames: GameId[];
}

export function composeTodaysSet(
  playHistory: PlayHistoryEntry[],
  opts: { orientationCompletedToday: boolean },
  games: GameMeta[] = GAME_LIST,
): TodaysSet {
  const lastPlayedByGame = new Map<GameId, number>();
  for (const entry of playHistory) {
    lastPlayedByGame.set(entry.gameId, entry.lastPlayedAt ?? NEVER_PLAYED);
  }
  const lastPlayed = (id: GameId) => lastPlayedByGame.get(id) ?? NEVER_PLAYED;

  const gamesByDomain = new Map<Domain, GameMeta[]>();
  for (const domain of ROTATION_DOMAINS) {
    gamesByDomain.set(
      domain,
      games.filter((g) => g.domain === domain),
    );
  }

  const domainFreshness = ROTATION_DOMAINS.map((domain) => {
    const domainGames = gamesByDomain.get(domain) ?? [];
    const mostRecentInDomain = domainGames.reduce(
      (max, g) => Math.max(max, lastPlayed(g.id)),
      NEVER_PLAYED,
    );
    return { domain, mostRecentInDomain };
  });

  const selectedDomains = new Set(
    [...domainFreshness]
      .sort((a, b) => a.mostRecentInDomain - b.mostRecentInDomain)
      .slice(0, 3)
      .map((d) => d.domain),
  );

  const rotatedGames = ROTATION_DOMAINS.filter((d) => selectedDomains.has(d))
    .map((domain) => {
      const domainGames = gamesByDomain.get(domain) ?? [];
      const leastRecentlyPlayed = [...domainGames].sort(
        (a, b) => lastPlayed(a.id) - lastPlayed(b.id),
      )[0];
      return leastRecentlyPlayed?.id;
    })
    .filter((id): id is GameId => Boolean(id));

  return {
    orientationGame: opts.orientationCompletedToday ? null : 'aaj-ka-din',
    rotatedGames,
  };
}
