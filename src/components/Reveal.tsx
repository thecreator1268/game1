import { useEffect, useRef, useState, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  className?: string;
}

// Fades + lifts its children in the first time they scroll into view
// (IntersectionObserver, see .reveal/.reveal-visible in index.css). Starts
// already visible if IntersectionObserver is unavailable — content must
// never be invisible without JS.
export function Reveal({ children, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || !ref.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className={`${visible ? 'reveal-visible' : 'reveal'} ${className}`.trim()}>
      {children}
    </div>
  );
}
