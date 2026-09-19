import type { CSSProperties } from 'react';

// One shared line-icon set for the whole app (24x24 viewBox, ~1.9px stroke,
// rounded caps/joins, stroke:currentColor) so nothing falls back to emoji,
// which renders inconsistently per device/OS and reads as an unstyled
// placeholder rather than a designed icon. Defs are reused verbatim from the
// approved design reference (see CLAUDE_CODE_BUILD_PROMPT.md's "Indopendence"
// section) rather than redrawn, so every icon in the app is guaranteed to
// share one hand, not fourteen slightly-different ones.
//
// Mounted once near the app root; every other icon usage is <Icon name="…"/>
// referencing these <symbol> ids via <use>, the same pattern browsers use
// for SVG sprite sheets — one parse, zero per-instance markup cost.
export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden focusable="false">
      <defs>
        <symbol id="i-person" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.6" />
          <path d="M4.5 20c0-4.1 3.4-6.5 7.5-6.5s7.5 2.4 7.5 6.5" />
        </symbol>
        <symbol id="i-family" viewBox="0 0 24 24">
          <circle cx="8" cy="7.6" r="2.6" />
          <path d="M3 19.2c0-3.4 1.9-5.6 5-5.6s5 2.2 5 5.6" />
          <circle cx="16" cy="7.6" r="2.6" />
          <path d="M11 19.2c0-3.4 1.9-5.6 5-5.6s5 2.2 5 5.6" />
        </symbol>
        <symbol id="i-backspace" viewBox="0 0 24 24">
          <path d="M9 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-6-6 6-6z" />
          <path d="M12.5 10l4 4M16.5 10l-4 4" />
        </symbol>
        <symbol id="i-flame" viewBox="0 0 24 24">
          <path d="M12 21c-3.6 0-6-2.2-6-5.5 0-2.6 1.7-4.3 2.7-6.1.4 1.7 1.7 1.9 1.9.3.2-1.6-.6-2.6-.4-4.4 2.6 1 5.3 3.6 5.3 7 0 1-.3 1.8-.8 2.5.6-.2 1.1-.8 1.4-1.6.7 1.1 1.2 2.3 1.2 3.4 0 3-2 4.4-5.3 4.4z" />
        </symbol>
        <symbol id="i-home" viewBox="0 0 24 24">
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6 10.5V19h12v-8.5" />
        </symbol>
        <symbol id="i-calendar" viewBox="0 0 24 24">
          <rect x="4" y="6" width="16" height="14" rx="3" />
          <path d="M8 4v4M16 4v4M4 10.5h16" />
          <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-settings" viewBox="0 0 24 24">
          <path d="M4 7h6M14 7h6M4 12h11M19 12h1M4 17h13M21 17h-1" />
          <circle cx="12" cy="7" r="2.1" />
          <circle cx="17" cy="12" r="2.1" />
          <circle cx="16" cy="17" r="2.1" />
        </symbol>
        <symbol id="i-pill" viewBox="0 0 24 24">
          <g transform="rotate(45 12 12)">
            <rect x="4.5" y="9" width="15" height="6" rx="3" />
            <line x1="12" y1="9" x2="12" y2="15" />
          </g>
        </symbol>
        <symbol id="i-book" viewBox="0 0 24 24">
          <path d="M4 5.5c2-1 5-1 7 .5v13c-2-1.5-5-1.5-7-.5v-13z" />
          <path d="M20 5.5c-2-1-5-1-7 .5v13c2-1.5 5-1.5 7-.5v-13z" />
        </symbol>
        <symbol id="i-target" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-clock" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7.8" />
          <path d="M12 7.5V12l3.2 2" />
        </symbol>
        <symbol id="i-flower" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="12" cy="6.5" r="2.6" />
          <circle cx="17" cy="9.5" r="2.6" />
          <circle cx="17" cy="15" r="2.6" />
          <circle cx="12" cy="18" r="2.6" />
          <circle cx="7" cy="15" r="2.6" />
          <circle cx="7" cy="9.5" r="2.6" />
        </symbol>
        <symbol id="i-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4.3" />
          <path d="M12 3v2.4M12 18.6V21M21 12h-2.4M5.4 12H3M18.4 5.6l-1.7 1.7M7.3 16.7l-1.7 1.7M18.4 18.4l-1.7-1.7M7.3 7.3 5.6 5.6" />
        </symbol>
        <symbol id="i-trend" viewBox="0 0 24 24">
          <path d="M4 16l5.5-6 4 3.5L20 6" />
          <path d="M14.5 6H20v5.5" />
        </symbol>
        <symbol id="i-sync" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.5" />
          <path d="M8.3 12.3l2.4 2.4 5-5.4" />
        </symbol>
        <symbol id="i-butterfly" viewBox="0 0 24 24">
          <path d="M12 5v14" />
          <path d="M12 8c-1-3-4-4-6.5-3-1 3 .5 5.5 3 6.5-2.5 1-4 3.5-3 6.5C8 19 11 18 12 15" />
          <path d="M12 8c1-3 4-4 6.5-3 1 3-.5 5.5-3 6.5 2.5 1 4 3.5 3 6.5C16 19 13 18 12 15" />
        </symbol>
        <symbol id="i-play" viewBox="0 0 24 24">
          <path d="M6 4.5v15l13-7.5-13-7.5z" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-drop" viewBox="0 0 24 24">
          <path d="M12 3c3 4.5 6 7.8 6 11a6 6 0 0 1-12 0c0-3.2 3-6.5 6-11z" />
        </symbol>
        <symbol id="i-walk" viewBox="0 0 24 24">
          <circle cx="13.5" cy="4.5" r="1.8" fill="currentColor" stroke="none" />
          <path d="M11 9l2 2 3-1 2.5 4M9 11l1.5 1.8L9 17l-2.5 3M11 11l-1 5 3 4" />
        </symbol>
        <symbol id="i-stethoscope" viewBox="0 0 24 24">
          <path d="M6 4v5.5a4 4 0 0 0 8 0V4" />
          <path d="M10 13.5v2a4.5 4.5 0 0 0 9 0v-1.7" />
          <circle cx="19.3" cy="12.3" r="1.6" />
          <path d="M6 4H4.3M10 4H8.3" />
        </symbol>
        <symbol id="i-leaf" viewBox="0 0 24 24">
          <path d="M5 19c-1.5-6 2-13 14-14 1 10-5 15-14 14z" />
          <path d="M6 18c3-4 6-7 12-10.5" />
        </symbol>
        <symbol id="i-spark" viewBox="0 0 24 24">
          <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </symbol>
        <symbol id="i-elephant" viewBox="0 0 24 24">
          <path d="M7.3 7.2c-2.9.3-4.7 2.8-4 5.6.5 2 2.4 3.5 4.5 3.3" />
          <path d="M16.7 7.2c2.9.3 4.7 2.8 4 5.6-.5 2-2.4 3.5-4.5 3.3" />
          <circle cx="12" cy="10.3" r="3.8" />
          <circle cx="10.2" cy="9.8" r=".65" fill="currentColor" stroke="none" />
          <circle cx="13.8" cy="9.8" r=".65" fill="currentColor" stroke="none" />
          <path d="M11 13.7c-.5 1.9-.4 3.7.5 4.9.6.8 1.6 1.2 2.6 1.1" />
        </symbol>
        <symbol id="i-rhino" viewBox="0 0 24 24">
          <path d="M4.5 15c0-2.8 2.4-4.8 5.6-4.8h4.4c2.5 0 4.5 1.8 4.5 4v.3c0 1.9-1.7 3.5-3.9 3.5H8.4c-2.2 0-3.9-1.3-3.9-3z" />
          <path d="M9.5 10.2l1.3-3.4 1 .4-.9 3.1" />
          <path d="M6.5 17v1.8M15 17v1.8" />
          <circle cx="8" cy="12.8" r=".7" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-tiger" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="5.3" />
          <path d="M8 8 6.7 5.5M16 8l1.3-2.5" />
          <path d="M9 15.2c.8.7 2 1.1 3 1.1s2.2-.4 3-1.1" />
          <path d="M6.8 10.5h2M15.2 10.5h2M7.3 13h1.6M15.1 13h1.6" />
          <circle cx="10" cy="11.3" r=".7" fill="currentColor" stroke="none" />
          <circle cx="14" cy="11.3" r=".7" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-fish" viewBox="0 0 24 24">
          <path d="M8 12c2.7-3.6 7.2-5 10.8-3.1 1.8.9 3.2 2.1 4.2 3.1-1 1-2.4 2.2-4.2 3.1-3.6 1.9-8.1.5-10.8-3.1z" />
          <path d="M3 8.5c1.8 1 3 2.1 5 3.5-2 1.4-3.2 2.5-5 3.5" />
          <circle cx="17" cy="10.5" r=".8" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-bird" viewBox="0 0 24 24">
          <path d="M4.5 16c0-3.6 3-6.3 6.8-6.3 1 0 1.9.2 2.7.6.4-1 1.3-1.7 2.4-1.7-.2.9-.6 1.6-1.2 2.1 1.1 1.1 1.8 2.6 1.8 4.3H4.5z" />
          <path d="M9 16v2.3M13 16v2.3" />
          <circle cx="9.3" cy="12" r=".7" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-dog" viewBox="0 0 24 24">
          <path d="M7 8.5c0-1.8 1.3-3 3-3h4c1.7 0 3 1.2 3 3v3.5c0 2.4-2.2 4.3-5 4.3s-5-1.9-5-4.3V8.5z" />
          <path d="M7.5 9c-1.6.6-2.4 2.2-1.8 3.9M16.5 9c1.6.6 2.4 2.2 1.8 3.9" />
          <circle cx="10.3" cy="10.5" r=".8" fill="currentColor" stroke="none" />
          <circle cx="13.7" cy="10.5" r=".8" fill="currentColor" stroke="none" />
          <path d="M11 13.3c.3.5.7.5 1 0" />
        </symbol>
        <symbol id="i-bamboo" viewBox="0 0 24 24">
          <path d="M11 21V5" />
          <path d="M8.5 8h5M8.5 12h5M8.5 16h5" />
          <path d="M11 6c-1.5-1-3-1-4-.3M11 6c1.6-1.3 3.3-1.5 4.4-1" />
        </symbol>
        <symbol id="i-mountain" viewBox="0 0 24 24">
          <path d="M3 18.5 9 8l3.2 5.4L15 9.5l6 9H3z" />
        </symbol>
        <symbol id="i-tree" viewBox="0 0 24 24">
          <path d="M12 21v-6.5" />
          <path d="M7 9.5A5 5 0 0 1 12 4a5 5 0 0 1 5 5.5 4.2 4.2 0 0 1-1.3 8.2H8.3A4.2 4.2 0 0 1 7 9.5z" />
        </symbol>
        <symbol id="i-boat" viewBox="0 0 24 24">
          <path d="M3 14.5c2.2 2 5.3 3.1 9 3.1s6.8-1.1 9-3.1l-1.8 3.3c-2 1.3-4.5 2-7.2 2s-5.2-.7-7.2-2L3 14.5z" />
          <path d="M6 14.2c1.7-3 3.8-5.8 6-8.2 2.2 2.4 4.3 5.2 6 8.2" />
        </symbol>
        <symbol id="i-jaapi" viewBox="0 0 24 24">
          <path d="M2.5 17c3-7.5 6-11 9.5-11s6.5 3.5 9.5 11c-6.3-2-12.7-2-19 0z" />
          <path d="M6 14.5c3.8-1 8.2-1 12 0M4.3 16.3c5-1.4 10.4-1.4 15.4 0" />
        </symbol>
        <symbol id="i-drum" viewBox="0 0 24 24">
          <ellipse cx="12" cy="6.5" rx="6" ry="2.4" />
          <path d="M6 6.5v7.5c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4V6.5" />
          <path d="M9 4.5l3.5 5.5M17 5l-3 5" />
          <circle cx="9" cy="4.5" r=".9" fill="currentColor" stroke="none" />
          <circle cx="17" cy="5" r=".9" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-guitar" viewBox="0 0 24 24">
          <path d="M10.5 21c-2.2 0-4-1.7-4-4.2 0-1.6.8-2.7 1.8-3.5-1-.7-1.6-1.7-1.6-3 0-2.2 1.8-3.8 4-3.8s4 1.6 4 3.8c0 1.2-.5 2.2-1.4 2.9 1.2.8 2.2 2 2.2 3.6 0 2.5-2.1 4.2-4.6 4.2z" />
          <path d="M12 6.5V2.2" />
          <rect x="10.6" y="0.8" width="2.8" height="1.6" rx=".4" />
          <path d="M9.5 17.5h4" />
        </symbol>
        <symbol id="i-bicycle" viewBox="0 0 24 24">
          <circle cx="6.3" cy="17" r="3.3" />
          <circle cx="17.7" cy="17" r="3.3" />
          <path d="M6.3 17 9 10 15 10 17.7 17M9 10 11 17 6.3 17M11 17 15 10" />
        </symbol>
        <symbol id="i-car" viewBox="0 0 24 24">
          <path d="M4.5 16v-2.3c0-.5.3-1 .8-1.2l1.9-.8 1.6-3c.3-.6.9-1 1.6-1h4.2c.7 0 1.3.4 1.6 1l1.6 3 1.9.8c.5.2.8.7.8 1.2V16" />
          <path d="M2.8 16h18.4" />
          <circle cx="7.5" cy="16" r="1.8" />
          <circle cx="16.5" cy="16" r="1.8" />
        </symbol>
        <symbol id="i-umbrella" viewBox="0 0 24 24">
          <path d="M4 12a8 8 0 0 1 16 0z" />
          <path d="M12 4v1M12 12v7.5" />
          <path d="M12 19.5a1.8 1.8 0 0 0 3.2 1.1" />
        </symbol>
        <symbol id="i-chair" viewBox="0 0 24 24">
          <path d="M6 11h12v2.3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" />
          <path d="M7 4.5v6.5M17 4.5v6.5M7 4.5h10" />
          <path d="M7.5 14.3v4.8M16.5 14.3v4.8" />
        </symbol>
        <symbol id="i-key" viewBox="0 0 24 24">
          <circle cx="7" cy="8" r="3.3" />
          <path d="M9.5 10.3 18.5 19.3M14.5 15.3l2-2M16.8 17.6l2-2" />
        </symbol>
        <symbol id="i-broom" viewBox="0 0 24 24">
          <path d="M12 3v11" />
          <path d="M8 21l2.7-7h2.6L16 21c-1.3.6-2.7.9-4 .9s-2.7-.3-4-.9z" />
          <path d="M9.3 15.7h5.4" />
        </symbol>
        <symbol id="i-kettle" viewBox="0 0 24 24">
          <path d="M4.5 14c0-4 3.3-6.5 7.5-6.5s7.5 2.5 7.5 6.5c0 2.8-2.2 4.7-5 5.2v1.3H9.5v-1.3c-2.8-.5-5-2.4-5-5.2z" />
          <path d="M17.5 10.5c1.8-.6 3.4.2 3.8 1.7.3 1.2-.3 2.3-1.5 2.9" />
          <path d="M9 6.2c1-1.4 3-1.4 4 0" />
          <circle cx="12" cy="5" r=".9" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-needle" viewBox="0 0 24 24">
          <path d="M6 20 18 8" />
          <ellipse cx="17.5" cy="7.3" rx="1.3" ry=".8" transform="rotate(45 17.5 7.3)" />
          <path d="M6 20c-1.2.4-2.4.2-3-.7" />
        </symbol>
        <symbol id="i-basket" viewBox="0 0 24 24">
          <path d="M5.5 11h13l-1.6 7.6a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.5 11z" />
          <path d="M8 11c.5-2.3 2-3.7 4-3.7s3.5 1.4 4 3.7" />
          <path d="M7.3 13.5h9.4M6.8 16h9.8" />
        </symbol>
        <symbol id="i-hammer" viewBox="0 0 24 24">
          <path d="M8 8.5 12 4.5c.4-.4 1-.4 1.4 0l2.1 2.1c.4.4.4 1 0 1.4L11.5 12z" />
          <path d="M10 12 4.5 19.5" />
        </symbol>
        <symbol id="i-spoon" viewBox="0 0 24 24">
          <ellipse cx="12" cy="7" rx="3.4" ry="4.2" />
          <path d="M12 11.2V21" />
        </symbol>
        <symbol id="i-sponge" viewBox="0 0 24 24">
          <rect x="4" y="8" width="16" height="8" rx="2.5" />
          <path d="M8 8c.5-1.2 1.5-1.2 2 0M13 8c.5-1.2 1.5-1.2 2 0" />
          <circle cx="9" cy="12" r=".6" fill="currentColor" stroke="none" />
          <circle cx="14.5" cy="12.5" r=".6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="10.3" r=".6" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-scissors" viewBox="0 0 24 24">
          <circle cx="7" cy="18" r="2.3" />
          <circle cx="13.5" cy="18" r="2.3" />
          <path d="M8.7 16.3 19 5M11.7 16.3 5 8" />
        </symbol>
        <symbol id="i-bucket" viewBox="0 0 24 24">
          <path d="M5.5 8h13l-1.8 11a2 2 0 0 1-2 1.7h-5.4a2 2 0 0 1-2-1.7L5.5 8z" />
          <ellipse cx="12" cy="8" rx="6.5" ry="1.6" />
          <path d="M7.5 8c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
        </symbol>
        <symbol id="i-bottle" viewBox="0 0 24 24">
          <path d="M8.5 10.5v8.5a1.7 1.7 0 0 0 1.7 1.7h3.6a1.7 1.7 0 0 0 1.7-1.7v-8.5z" />
          <path d="M10 10.5V7.3h3.2v3.2" />
          <path d="M13.2 7.3h2.3M15.5 6v2.6" />
        </symbol>
        <symbol id="i-flashlight" viewBox="0 0 24 24">
          <path d="M5 10h7v6H5z" />
          <path d="M12 9.3h4.5l1.5 1.4v4.6l-1.5 1.4H12z" />
          <path d="M20 10.5l2-.7M20 13.5l2 .3M19.3 15.7l1.5 1.3" />
        </symbol>
        <symbol id="i-trash" viewBox="0 0 24 24">
          <path d="M6 8h12l-1.3 11.2a2 2 0 0 1-2 1.8h-5.4a2 2 0 0 1-2-1.8L6 8z" />
          <path d="M4.5 8h15M9.5 8V5.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V8" />
          <path d="M10.3 11v6.5M13.7 11v6.5" />
        </symbol>
        <symbol id="i-paper-roll" viewBox="0 0 24 24">
          <circle cx="10" cy="10" r="6" />
          <circle cx="10" cy="10" r="2.2" />
          <path d="M15.5 13.5c2 .5 3.5 2 3.8 4-1.7.5-3.4 0-4.5-1.3" />
        </symbol>
        <symbol id="i-ball" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8.2l2.6 1.9-1 3h-3.2l-1-3zM12 8.2V5.3M14.6 10.1l2.7-.9M13.6 13.1l1.7 2.4M10.4 13.1l-1.7 2.4M9.4 10.1l-2.7-.9" />
        </symbol>
        <symbol id="i-bowl" viewBox="0 0 24 24">
          <path d="M4 12c0 4.4 3.6 7 8 7s8-2.6 8-7" />
          <ellipse cx="12" cy="12" rx="8" ry="2.2" />
          <path d="M8.5 12.3c1 .6 2 .6 3 0s2-.6 3 0 2 .6 3 0" />
        </symbol>
        <symbol id="i-pot" viewBox="0 0 24 24">
          <path d="M5 12h14l-1 6.3a2 2 0 0 1-2 1.7H8a2 2 0 0 1-2-1.7L5 12z" />
          <path d="M4.3 12.8c-1.2 0-2-.8-2-1.9M19.7 12.8c1.2 0 2-.8 2-1.9" />
          <path d="M9.5 8.3c-.3-1 .3-1.6.3-2.6M13.5 8.3c.3-1-.3-1.6-.3-2.6" />
        </symbol>
        <symbol id="i-milk" viewBox="0 0 24 24">
          <path d="M7 20V8.5l2-3h6l2 3V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
          <path d="M9 5.5h6" />
        </symbol>
        <symbol id="i-soap" viewBox="0 0 24 24">
          <rect x="4.5" y="9" width="15" height="8" rx="3.5" />
          <circle cx="8" cy="12.8" r=".5" fill="currentColor" stroke="none" />
          <circle cx="12" cy="12" r=".5" fill="currentColor" stroke="none" />
          <circle cx="16" cy="13.2" r=".5" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-bread" viewBox="0 0 24 24">
          <path d="M4 20V13c0-4 3.6-7.5 8-7.5s8 3.5 8 7.5v7z" />
          <path d="M9 8.5l1.5 3M14.5 8.2l-1.3 3.3" />
        </symbol>
        <symbol id="i-egg" viewBox="0 0 24 24">
          <path d="M12 4.5c3.4 2.6 5.5 7 5.5 10.2a5.5 5.5 0 1 1-11 0c0-3.2 2.1-7.6 5.5-10.2z" />
        </symbol>
        <symbol id="i-banana" viewBox="0 0 24 24">
          <path d="M6 18c1 1.6 3 2.4 5.2 2 4.5-.8 7.7-4 8.3-8.3" />
          <path d="M6 18c-.8-2 .4-5.4 3-8 2-2 4.5-3.3 6.6-3.5" />
          <path d="M15.8 6.3c1.2-.5 2.4-.3 3.2.4" />
        </symbol>
        <symbol id="i-carrot" viewBox="0 0 24 24">
          <path d="M12 9c2 2 3.3 4.6 2.6 7.3a2.8 2.8 0 0 1-5.4-1.5C9.9 12.2 10.8 10.2 12 9z" />
          <path d="M12 9c-.3-1.6.2-3 1.5-3.8M12 9c.4-1.8 1.8-2.8 3.4-2.7M12 9c-1-1.2-2.5-1.5-3.8-1" />
        </symbol>
        <symbol id="i-tomato" viewBox="0 0 24 24">
          <circle cx="12" cy="13.5" r="6.3" />
          <path d="M12 7.3V5M10.3 6.1 9 4.7M13.7 6.1 15 4.7" />
        </symbol>
        <symbol id="i-teacup" viewBox="0 0 24 24">
          <path d="M5 10h11v4.5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
          <path d="M16 11.3h1.3a2 2 0 0 1 0 4H16" />
          <path d="M3.5 19h14" />
          <path d="M8.5 8.2c-.3-.9.3-1.4.3-2.3M12 8.2c-.3-.9.3-1.4.3-2.3" />
        </symbol>
        <symbol id="i-onion" viewBox="0 0 24 24">
          <path d="M12 20c-3.5 0-6-2.7-6-6.3 0-3.6 2.7-6.4 5-8.2.6-.5 1.4-.5 2 0 2.3 1.8 5 4.6 5 8.2 0 3.6-2.5 6.3-6 6.3z" />
          <path d="M12 5.5V3M10.7 4l1.3-1.3 1.3 1.3" />
          <path d="M9.5 10c1 3 1 5.7 0 8.5M14.5 10c-1 3-1 5.7 0 8.5" />
        </symbol>
        <symbol id="i-potato" viewBox="0 0 24 24">
          <ellipse cx="12" cy="13" rx="7.5" ry="5.5" transform="rotate(-15 12 13)" />
          <circle cx="9.5" cy="12" r=".6" fill="currentColor" stroke="none" />
          <circle cx="14" cy="14.5" r=".6" fill="currentColor" stroke="none" />
          <circle cx="12.5" cy="10.5" r=".6" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-chicken" viewBox="0 0 24 24">
          <path d="M9 9c0-2.5 2-4.3 4.3-3.8 2 .4 3.2 2.4 2.7 4.4-.5 2.2-2.5 5-5.5 7.8l-3.6 3.6a1.6 1.6 0 0 1-2.3-2.3l3.6-3.6C10.9 12.7 9 10.8 9 9z" />
          <circle cx="5.2" cy="18.8" r="1.3" />
        </symbol>
        <symbol id="i-beans" viewBox="0 0 24 24">
          <ellipse cx="9" cy="10.5" rx="3.4" ry="2.3" transform="rotate(-25 9 10.5)" />
          <ellipse cx="14.5" cy="13.5" rx="3.4" ry="2.3" transform="rotate(-25 14.5 13.5)" />
          <ellipse cx="10.5" cy="16.5" rx="3.4" ry="2.3" transform="rotate(-25 10.5 16.5)" />
        </symbol>
        <symbol id="i-jar" viewBox="0 0 24 24">
          <path d="M9 4.5h6v2.3l1.3 1.3v11a1.7 1.7 0 0 1-1.7 1.7h-5.2A1.7 1.7 0 0 1 7.7 19.1v-11L9 6.8z" />
          <path d="M8.7 4.5h6.6" />
          <path d="M8.2 13h7.6" />
        </symbol>
        <symbol id="i-candle" viewBox="0 0 24 24">
          <rect x="9.5" y="11" width="5" height="10" rx="1" />
          <path d="M12 5.2c1.4 1.8 2.2 3.2 2.2 4.4a2.2 2.2 0 0 1-4.4 0c0-1.2.8-2.6 2.2-4.4z" />
          <path d="M12 11v-1" />
        </symbol>
        <symbol id="i-newspaper" viewBox="0 0 24 24">
          <rect x="4" y="6" width="16" height="13" rx="1" />
          <path d="M7 9.5h4.5M7 12h10M7 14.5h10M7 17h7" />
        </symbol>
        <symbol id="i-mango" viewBox="0 0 24 24">
          <path d="M6.5 11c0-3.4 3-6 7-6 3 0 4.8 1.8 4.8 4.3 0 5.5-4.8 10.2-9 10.2-3 0-4-2.2-4-4.8 0-1.4.5-2.6 1.2-3.7z" />
          <path d="M13.3 5c.3-1 1.1-1.6 2.1-1.6" />
        </symbol>
        <symbol id="i-coconut" viewBox="0 0 24 24">
          <circle cx="12" cy="13" r="7" />
          <circle cx="10.3" cy="9.3" r=".6" fill="currentColor" stroke="none" />
          <circle cx="12.5" cy="8.6" r=".6" fill="currentColor" stroke="none" />
          <circle cx="14" cy="9.6" r=".6" fill="currentColor" stroke="none" />
          <path d="M6.5 15c1.5 1 3 1.4 5.5 1.4s4-.4 5.5-1.4" />
        </symbol>
        <symbol id="i-apple" viewBox="0 0 24 24">
          <path d="M12 8.3c-1-1.4-2.7-2-4.2-1.4-2.3.9-3.3 3.7-2.2 6.4C6.7 16.8 9.3 20 12 20s5.3-3.2 6.4-6.7c1.1-2.7.1-5.5-2.2-6.4-1.5-.6-3.2 0-4.2 1.4z" />
          <path d="M12 8.3V5.5" />
          <path d="M12 6c.3-1.3 1.6-2 2.9-1.7" />
        </symbol>
        <symbol id="i-orange" viewBox="0 0 24 24">
          <circle cx="12" cy="13.5" r="7" />
          <path d="M12 6.5V5" />
          <path d="M12 5.5c.9-1 2.2-1.2 3.2-.5" />
          <path d="M8.5 10.5l.8.8M15.5 16l-.8-.8" />
        </symbol>
        <symbol id="i-cucumber" viewBox="0 0 24 24">
          <rect x="3.5" y="10.5" width="17" height="5" rx="2.5" transform="rotate(-18 12 13)" />
          <path d="M8 10.8l.6 2M11.5 9.9l.6 2.3M15 9l.6 2.3" transform="rotate(-18 12 13)" />
        </symbol>
        <symbol id="i-salt" viewBox="0 0 24 24">
          <path d="M9 9.5c0-2 1.3-3.3 3-3.3s3 1.3 3 3.3v9a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
          <path d="M8.3 9.5h7.4" />
          <circle cx="10.5" cy="7.8" r=".4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="7.2" r=".4" fill="currentColor" stroke="none" />
          <circle cx="13.5" cy="7.8" r=".4" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-butter" viewBox="0 0 24 24">
          <rect x="4" y="10" width="16" height="7" rx="1" />
          <path d="M4 10c0-2.3.2-4 2.3-4h11.4c2.1 0 2.3 1.7 2.3 4" />
          <path d="M9 10V7M15 10V7" />
        </symbol>
        <symbol id="i-honey" viewBox="0 0 24 24">
          <path d="M9 5h6l3 5v6l-3 5H9l-3-5V10z" />
          <path d="M15 3.5c1 1.4.6 2.6-.4 3.4" />
        </symbol>
        <symbol id="i-sunrise" viewBox="0 0 24 24">
          <path d="M6 15a6 6 0 0 1 12 0" />
          <path d="M3 15h18" />
          <path d="M12 6.5v2M6.5 9l1.4 1.4M17.5 9l-1.4 1.4" />
        </symbol>
        <symbol id="i-toothbrush" viewBox="0 0 24 24">
          <path d="M4.5 19.5 12.5 11.5" />
          <rect x="12" y="6.3" width="7" height="4.4" rx="1.6" transform="rotate(45 15.5 8.5)" />
          <path d="M13.3 7l1 1M15 5.3l1 1M16.7 7l1 1" transform="rotate(45 15.5 8.5)" />
        </symbol>
        <symbol id="i-bathtub" viewBox="0 0 24 24">
          <path d="M3.5 13h17v2.5a3.5 3.5 0 0 1-3.5 3.5H7a3.5 3.5 0 0 1-3.5-3.5z" />
          <path d="M5 13V9.5a2.5 2.5 0 0 1 2.5-2.5h1" />
          <path d="M3.5 19v1.3M20.5 19v1.3" />
          <path d="M8 15.3c.8.6 1.6.6 2.4 0s1.6-.6 2.4 0 1.6.6 2.4 0" />
        </symbol>
        <symbol id="i-pan" viewBox="0 0 24 24">
          <circle cx="10.5" cy="12.5" r="6" />
          <path d="M16.3 10.8 21 9.3" />
          <ellipse cx="10.5" cy="12.5" rx="2.6" ry="2" />
          <circle cx="10.5" cy="12.5" r=".9" fill="currentColor" stroke="none" />
        </symbol>
        <symbol id="i-sofa" viewBox="0 0 24 24">
          <path d="M5.5 17.5v-4a1.5 1.5 0 0 1 1.5-1.5h10a1.5 1.5 0 0 1 1.5 1.5v4" />
          <path d="M4 13.5v4M20 13.5v4" />
          <path d="M6 17.5h12" />
          <path d="M5 19.5v1.5M19 19.5v1.5" />
        </symbol>
        <symbol id="i-moon" viewBox="0 0 24 24">
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
        </symbol>
        <symbol id="i-lightbulb" viewBox="0 0 24 24">
          <path d="M8 10.5a4 4 0 1 1 8 0c0 1.9-1.1 2.9-1.9 3.8-.5.6-.9 1.1-.9 1.7H10.8c0-.6-.4-1.1-.9-1.7-.8-.9-1.9-1.9-1.9-3.8z" />
          <path d="M10.5 19h3M11 21.3h2" />
          <path d="M12 3.2v1.6M5.5 6.2l1.2 1.2M18.5 6.2l-1.2 1.2" />
        </symbol>
      </defs>
    </svg>
  );
}

export type IconName =
  | 'person'
  | 'family'
  | 'backspace'
  | 'flame'
  | 'home'
  | 'calendar'
  | 'settings'
  | 'pill'
  | 'book'
  | 'target'
  | 'clock'
  | 'flower'
  | 'sun'
  | 'trend'
  | 'sync'
  | 'butterfly'
  | 'play'
  | 'drop'
  | 'walk'
  | 'stethoscope'
  | 'leaf'
  | 'spark'
  | 'check'
  | 'elephant'
  | 'rhino'
  | 'tiger'
  | 'fish'
  | 'bird'
  | 'dog'
  | 'bamboo'
  | 'mountain'
  | 'tree'
  | 'boat'
  | 'jaapi'
  | 'drum'
  | 'guitar'
  | 'bicycle'
  | 'car'
  | 'umbrella'
  | 'chair'
  | 'key'
  | 'broom'
  | 'kettle'
  | 'needle'
  | 'basket'
  | 'hammer'
  | 'spoon'
  | 'sponge'
  | 'scissors'
  | 'bucket'
  | 'bottle'
  | 'flashlight'
  | 'trash'
  | 'paper-roll'
  | 'ball'
  | 'bowl'
  | 'pot'
  | 'milk'
  | 'soap'
  | 'bread'
  | 'egg'
  | 'banana'
  | 'carrot'
  | 'tomato'
  | 'teacup'
  | 'onion'
  | 'potato'
  | 'chicken'
  | 'beans'
  | 'jar'
  | 'candle'
  | 'newspaper'
  | 'mango'
  | 'coconut'
  | 'apple'
  | 'orange'
  | 'cucumber'
  | 'salt'
  | 'butter'
  | 'honey'
  | 'sunrise'
  | 'toothbrush'
  | 'bathtub'
  | 'pan'
  | 'sofa'
  | 'moon'
  | 'lightbulb';

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Icon({ name, size = 24, className = '', style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden
    >
      <use href={`#i-${name}`} />
    </svg>
  );
}
