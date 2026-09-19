import { describe, expect, it } from 'vitest';
import { composeTodaysSet, type PlayHistoryEntry } from './sessionComposer';
import { GAME_LIST } from '@/games/gameList';

describe('composeTodaysSet', () => {
  it('picks the first game of the first 3 domains when nothing has ever been played', () => {
    const result = composeTodaysSet([]);
    expect(result).toEqual(['smriti-cards', 'dhyan-dhaam', 'dinacharya-sequence']);
  });

  it('always returns exactly 3 games from 3 distinct domains, out of all 5', () => {
    const result = composeTodaysSet([]);
    expect(result).toHaveLength(3);
    const domains = new Set(result.map((id) => GAME_LIST.find((g) => g.id === id)?.domain));
    expect(domains.size).toBe(3);
  });

  it('drops the domain whose games were played most recently', () => {
    const history: PlayHistoryEntry[] = [{ gameId: 'smriti-cards', lastPlayedAt: 1000 }];
    const result = composeTodaysSet(history);
    const domains = result.map((id) => GAME_LIST.find((g) => g.id === id)?.domain);
    expect(domains).not.toContain('memory');
    expect(domains).toEqual(['attention', 'routine', 'pattern']);
  });

  it('within a selected domain, features the least-recently-played game', () => {
    const history: PlayHistoryEntry[] = [
      // memory/routine/pattern played very recently, so they're excluded from
      // today's rotation, leaving attention as the (only) stalest domain to feature.
      { gameId: 'smriti-cards', lastPlayedAt: 9000 },
      { gameId: 'dinacharya-sequence', lastPlayedAt: 9000 },
      { gameId: 'aakar-milan', lastPlayedAt: 9000 },
      { gameId: 'dhyan-dhaam', lastPlayedAt: 5000 },
      { gameId: 'ginti-dhyan', lastPlayedAt: 1000 },
      { gameId: 'awaaz-pehchan', lastPlayedAt: 3000 },
    ];
    const result = composeTodaysSet(history);
    expect(result).toContain('ginti-dhyan');
    expect(result).not.toContain('dhyan-dhaam');
    expect(result).not.toContain('awaaz-pehchan');
  });

  it('rotates so a previously-skipped domain resurfaces the next day', () => {
    // Day 1: memory, attention, routine get played; pattern and orientation are skipped.
    const day1 = composeTodaysSet([]);
    expect(day1).toEqual(['smriti-cards', 'dhyan-dhaam', 'dinacharya-sequence']);

    const now = 10_000;
    const historyAfterDay1: PlayHistoryEntry[] = day1.map((gameId) => ({
      gameId,
      lastPlayedAt: now,
    }));

    // Day 2: pattern and orientation (never touched) must now be included since
    // they're the stalest domains; routine is bumped out (last of the 3
    // equally-stale played domains, by tie-break order).
    const day2 = composeTodaysSet(historyAfterDay1);
    const day2Domains = day2.map((id) => GAME_LIST.find((g) => g.id === id)?.domain);
    expect(day2Domains).toContain('pattern');
    expect(day2Domains).toContain('orientation');
    expect(day2Domains).not.toContain('routine');
  });

  it('rotates Orientation out for a few days after Aaj Ka Din is played, then back in', () => {
    // Playing Aaj Ka Din "today" makes Orientation the freshest domain —
    // no separate "completed today" flag is needed, staleness handles it.
    const today = 20_000;
    const afterOrientationPlayed: PlayHistoryEntry[] = [
      { gameId: 'aaj-ka-din', lastPlayedAt: today },
    ];
    const result = composeTodaysSet(afterOrientationPlayed);
    const domains = result.map((id) => GAME_LIST.find((g) => g.id === id)?.domain);
    expect(domains).not.toContain('orientation');

    // Once every other domain has been played more recently than Orientation,
    // Orientation becomes the stalest domain again and resurfaces.
    const muchLater = 90_000;
    const otherDomainsPlayed: PlayHistoryEntry[] = [
      ...afterOrientationPlayed,
      { gameId: 'smriti-cards', lastPlayedAt: muchLater },
      { gameId: 'dhyan-dhaam', lastPlayedAt: muchLater },
      { gameId: 'dinacharya-sequence', lastPlayedAt: muchLater },
      { gameId: 'aakar-milan', lastPlayedAt: muchLater },
    ];
    const later = composeTodaysSet(otherDomainsPlayed);
    const laterDomains = later.map((id) => GAME_LIST.find((g) => g.id === id)?.domain);
    expect(laterDomains).toContain('orientation');
  });
});
