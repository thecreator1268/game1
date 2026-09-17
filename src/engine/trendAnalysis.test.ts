import { describe, expect, it } from 'vitest';
import { computeDomainTrend, detectAnomalies, type TrendPoint } from './trendAnalysis';

const DAY = 24 * 60 * 60 * 1000;

function point(dayOffset: number, accuracy: number): TrendPoint {
  return { timestamp: dayOffset * DAY, accuracy };
}

describe('computeDomainTrend', () => {
  it('reports insufficient data below the minimum session count', () => {
    const result = computeDomainTrend([point(0, 0.5), point(1, 0.5)]);
    expect(result.direction).toBe('insufficient-data');
    expect(result.reason).toContain('gathering data');
  });

  it('detects a clean improving trend with high confidence', () => {
    const points = [
      point(0, 0.4),
      point(7, 0.5),
      point(14, 0.6),
      point(21, 0.7),
      point(28, 0.8),
    ];
    const result = computeDomainTrend(points);
    expect(result.direction).toBe('improving');
    expect(result.slopePerWeek).toBeGreaterThan(0);
    expect(result.confidencePct).toBeGreaterThan(90);
  });

  it('detects a clean declining trend', () => {
    const points = [
      point(0, 0.9),
      point(7, 0.75),
      point(14, 0.6),
      point(21, 0.45),
      point(28, 0.3),
    ];
    const result = computeDomainTrend(points);
    expect(result.direction).toBe('declining');
    expect(result.slopePerWeek).toBeLessThan(0);
    expect(result.confidencePct).toBeGreaterThan(90);
  });

  it('reports stable for flat performance', () => {
    const points = [point(0, 0.7), point(7, 0.71), point(14, 0.69), point(21, 0.7), point(28, 0.7)];
    const result = computeDomainTrend(points);
    expect(result.direction).toBe('stable');
  });

  it('is order-independent (sorts by timestamp internally)', () => {
    const ordered = [point(0, 0.4), point(7, 0.5), point(14, 0.6), point(21, 0.7), point(28, 0.8)];
    const shuffled = [ordered[3], ordered[0], ordered[4], ordered[2], ordered[1]];
    expect(computeDomainTrend(shuffled).slopePerWeek).toBeCloseTo(computeDomainTrend(ordered).slopePerWeek, 5);
  });
});

describe('detectAnomalies', () => {
  it('flags no anomalies in a small, uniform baseline', () => {
    const points = [point(0, 0.7), point(1, 0.71), point(2, 0.69), point(3, 0.7)];
    expect(detectAnomalies(points)).toHaveLength(0);
  });

  it('flags a session that is a statistical outlier against a stable baseline', () => {
    const baseline = [point(0, 0.8), point(1, 0.82), point(2, 0.79), point(3, 0.81), point(4, 0.8)];
    const outlier = point(5, 0.2);
    const flags = detectAnomalies([...baseline, outlier]);
    expect(flags).toHaveLength(1);
    expect(flags[0].timestamp).toBe(outlier.timestamp);
    expect(flags[0].zScore).toBeLessThan(-2);
    expect(flags[0].reason).toContain('unusually low');
  });

  it('does not flag a session within normal baseline variance', () => {
    const points = [point(0, 0.6), point(1, 0.75), point(2, 0.65), point(3, 0.7), point(4, 0.68)];
    expect(detectAnomalies(points)).toHaveLength(0);
  });

  it('only looks at the trailing window, not the whole history', () => {
    // A big early spike should not distort whether a much-later point is anomalous.
    const points = [
      point(0, 0.9),
      point(1, 0.5),
      point(2, 0.5),
      point(3, 0.5),
      point(4, 0.5),
      point(5, 0.5),
      point(6, 0.5),
      point(7, 0.51),
    ];
    expect(detectAnomalies(points)).toHaveLength(0);
  });
});
