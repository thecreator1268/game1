function handPoint(angleDeg: number, length: number): { x: number; y: number } {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: 50 + length * Math.cos(rad), y: 50 + length * Math.sin(rad) };
}

interface ClockFaceProps {
  totalMinutes: number; // 0-719, a position on a 12-hour face
  size?: number;
}

// Hand-drawn (no image asset, matches the rest of the icon set) analog
// clock. This is the one thing in the game that's deliberately NOT
// screen-reader-describable — reading an analog face is the visual task
// being tested, the same reasoning Chaya Khoj's shadow images already use.
export function ClockFace({ totalMinutes, size = 220 }: ClockFaceProps) {
  const hour = Math.floor(totalMinutes / 60) % 12;
  const minute = totalMinutes % 60;
  const minuteAngle = minute * 6;
  const hourAngle = hour * 30 + minute * 0.5;
  const hourHand = handPoint(hourAngle, 26);
  const minuteHand = handPoint(minuteAngle, 38);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = i * 30;
        const outer = handPoint(angle, 42);
        const inner = handPoint(angle, i % 3 === 0 ? 34 : 37);
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--color-text-muted)"
            strokeWidth={i % 3 === 0 ? 3 : 2}
            strokeLinecap="round"
          />
        );
      })}
      <line x1="50" y1="50" x2={hourHand.x} y2={hourHand.y} stroke="var(--color-text)" strokeWidth="4" strokeLinecap="round" />
      <line
        x1="50"
        y1="50"
        x2={minuteHand.x}
        y2={minuteHand.y}
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="3.5" fill="var(--color-text)" />
    </svg>
  );
}
