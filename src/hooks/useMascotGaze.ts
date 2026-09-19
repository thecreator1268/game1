import { useEffect } from 'react';

// Passive pointermove listener that writes a clamped +/-4deg angle onto
// :root as --look, consumed by the blob mascot's ssBreathe animation
// (`rotate(var(--look, 0deg))`) so every mascot on screen subtly "looks
// toward" the pointer without any component re-rendering — nothing else on
// the page reads or writes `transform` from JS, so there's nothing to fight
// over. Mounted once at the app root (see App.tsx).
export function useMascotGaze(): void {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let raf = 0;
    function handleMove(e: PointerEvent) {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const nx = e.clientX / window.innerWidth - 0.5;
        const deg = Math.max(-4, Math.min(4, nx * 8));
        document.documentElement.style.setProperty('--look', `${deg.toFixed(2)}deg`);
      });
    }

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
