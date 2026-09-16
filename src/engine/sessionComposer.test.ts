import { describe, expect, it } from 'vitest';
import { composeTodaysSet, type PlayHistoryEntry } from './sessionComposer';
import { GAME_LIST } from '@/games/gameList';

describe('composeTodaysSet', () => {
  it('picks the first game of the first 3 domains when nothing has ever been played', () => {
    const result = composeTodaysSet([], { orientationCompletedToday: false });
    expect(result.orientationGame).toBe('aaj-ka-din');
    expect(result.rotatedGames).toEqual(['smriti-cards', 'dhyan-dhaam', 'dinacharya-sequence']);
  });

  it('omits the orientation game once completed today', () => {
    const result = composeTodaysSet([], { orientationCompletedToday: true });
    expect(result.orientationGame).toBeNull();
  });

  it('always returns exactly 3 rotated games from 3 distinct domains', () => {
    const result = composeTodaysSet([], { orientationCompletedToday: false });
    expect(result.rotatedGames).toHaveLength(3);
    const domains = new Set(
      result.rotatedGames.map((id) => GAME_LIST.find((g) => g.id === id)?.domain),
    );
    expect(domains.size).toBe(3);
  });

  it('drops the domain whose games were played most recently', () => {
    const history: PlayHistoryEntry[] = [{ gameId: 'smriti-cards', lastPlayedAt: 1000 }];
    const result = composeTodaysSet(history, { orientationCompletedToday: false });
    const domains = result.rotatedGames.map((id) => GAME_LIST.find((g) => g.id === id)?.domain);
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
    const result = composeTodaysSet(history, { orientationCompletedToday: false });
    expect(result.rotatedGames).toContain('ginti-dhyan');
    expect(result.rotatedGames).not.toContain('dhyan-dhaam');
    expect(result.rotatedGames).not.toContain('awaaz-pehchan');
  });

  it('rotates so a previously-skipped domain resurfaces the next day', () => {
    // Day 1: memory, attention, routine get played; pattern is skipped.
    const day1 = composeTodaysSet([], { orientationCompletedToday: false });
    expect(day1.rotatedGames).toEqual(['smriti-cards', 'dhyan-dhaam', 'dinacharya-sequence']);

    const now = 10_000;
    const historyAfterDay1: PlayHistoryEntry[] = day1.rotatedGames.map((gameId) => ({
      gameId,
      lastPlayedAt: now,
    }));

    // Day 2: pattern (never touched) must now be included since it's the stalest domain;
    // routine is bumped out (last of the 3 equally-stale played domains, by tie-break order).
    const day2 = composeTodaysSet(historyAfterDay1, { orientationCompletedToday: false });
    const day2Domains = day2.rotatedGames.map((id) => GAME_LIST.find((g) => g.id === id)?.domain);
    expect(day2Domains).toContain('pattern');
    expect(day2Domains).not.toContain('routine');
  });
});
