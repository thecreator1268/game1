// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import type { DomainInsight } from './dashboardData';
import { CognitiveInsights } from './CognitiveInsights';

const BASE_INSIGHT: DomainInsight = {
  domain: 'memory',
  trend: { direction: 'improving', slopePerWeek: 4.2, confidencePct: 78, reason: 'accuracy rising steadily' },
  anomalies: [],
};

describe('CognitiveInsights', () => {
  it('shows the domain name, trend direction, and reason', () => {
    render(<CognitiveInsights insights={[BASE_INSIGHT]} />);

    expect(screen.getByText('Memory')).toBeInTheDocument();
    expect(screen.getByText(/Improving/)).toBeInTheDocument();
    expect(screen.getByText('accuracy rising steadily')).toBeInTheDocument();
  });

  it('lists flagged anomalies when present', () => {
    const insight: DomainInsight = {
      ...BASE_INSIGHT,
      domain: 'attention',
      anomalies: [{ timestamp: Date.UTC(2026, 0, 15), accuracy: 0.2, zScore: -2.6, reason: 'unusually low accuracy' }],
    };
    render(<CognitiveInsights insights={[insight]} />);

    expect(screen.getByText(/unusually low accuracy/)).toBeInTheDocument();
  });

  it('renders nothing extra when there are no anomalies', () => {
    render(<CognitiveInsights insights={[BASE_INSIGHT]} />);
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('renders one row per domain insight, in order', () => {
    const insights: DomainInsight[] = [
      BASE_INSIGHT,
      { ...BASE_INSIGHT, domain: 'orientation', trend: { ...BASE_INSIGHT.trend, direction: 'declining' } },
    ];
    render(<CognitiveInsights insights={insights} />);

    const headings = screen.getAllByText(/Memory|Orientation/);
    expect(headings.map((el) => el.textContent)).toEqual(['Memory', 'Orientation']);
  });
});
