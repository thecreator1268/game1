# SmritiSetu — Possible Enhancements (build these only after the core app from
the main build prompt is working end-to-end; treat this as a menu to pick
from based on remaining time, not a required checklist)

## Quick wins (a few hours each, no new dependencies)

- Dark mode toggle in caregiver settings, using the same claymorphic dark
  tokens already defined in the design system — the CSS variables exist,
  this is mostly wiring a toggle to `data-theme`.
- Printable weekly report: a clean, single-page print stylesheet for the
  caregiver dashboard's PDF/CSV export, so a caregiver can literally print
  it from the browser to bring to a doctor's visit without needing the
  export button to work perfectly.
- "Streak" indicator on the patient home screen — how many days in a row
  they've played at least one game — using data already logged in
  `sessions`. Purely additive, no new schema.
- A second high-contrast color-blind-friendly palette, toggleable in
  caregiver settings, reusing the existing design-token structure.
- Multi-patient support in caregiver mode: one caregiver account, a simple
  patient switcher at the top of the dashboard. The Dexie schema already
  supports multiple `patients` — this is mostly UI, not new data modeling.

## Medium lift (doable in a focused day, still fits the existing stack)

- A "garden growing" visual metaphor for the caregiver dashboard: a simple
  SVG plant that grows a stage with each week of consistent play, sitting
  alongside (not replacing) the real score-trend charts — an easy,
  emotionally resonant way to show progress at a glance.
- On-device camera OCR for medicine labels (using the browser's
  `getUserMedia` + a lightweight OCR library) so a caregiver can snap a
  photo of a medicine strip instead of typing the reminder text by hand.
  Keep it fully offline — no cloud OCR API — to stay consistent with the
  offline-first architecture.
- A simple in-app "explain this to a doctor" one-pager generator: pulls the
  auto-generated weekly summary, the domain-balance chart, and the
  adherence stats into a single shareable image (canvas-rendered), so a
  caregiver can send it over WhatsApp without needing a PDF viewer.
- Sibling/family co-viewing: a read-only, PIN-free link (or QR code) a
  caregiver can generate so another family member can view (not edit) the
  dashboard on their own phone — still fully local, generated as a signed
  local export rather than requiring a real backend.

## Ambitious (real post-hackathon roadmap items — mention in Q&A, don't build live)

- ABDM/ABHA health-ID integration for clinical record linkage.
- A caregiver-facing chat assistant (Claude API) trained on dementia-care
  basics and this app's own data, to answer "is this normal?"-type
  questions — flag clearly as informational, not medical advice.
- Telemedicine hand-off: a "Talk to a doctor" button that opens a
  video-call link with a partnered clinic network.
- Wearable integration (heart rate / activity) to enrich the attention and
  fatigue signals the adaptive engine already uses.
- Calibrating the Bayesian Knowledge Tracing parameters (`src/engine/bkt.ts`
  currently uses literature-typical defaults) per domain, and moving to per-game
  or per-level estimates, once real, anonymised session data exists across a
  deployed patient base.

## Evaluated and declined

- **A public Indian holidays/festivals API, to enrich Aaj Ka Din with real
  regional dates when online.** Investigated (Sept 2026) and declined for
  now — not because the idea is bad, but because every option surveyed has
  a real problem for this specific app's architecture:
  - **Calendarific / AbstractAPI** (the two mainstream options, with proper
    state/region-level India coverage) both require an API key on their
    free tier. This app has **no backend** (the `/sync` server is a mock;
    see README) to hold that key confidentially — a client-side PWA can
    only ship a key inside its own public JS bundle, where anyone can read
    it, scrape it, and exhaust the free quota for every user of the
    deployed app. Fixing that properly means standing up a real serverless
    proxy just to hide one key, which is a genuine backend the project
    doesn't otherwise need.
  - **The one no-auth-key option found** (a community FastAPI project on
    GitHub, `pyapril15/indian-festivals-api`) avoids the key problem but
    trades it for a worse one: an unvetted, single-maintainer hobby API
    with no uptime guarantee and no way to verify the accuracy of the
    religious/regional festival dates it returns. Getting a festival date
    wrong in a multi-religious, multi-region NER context is a real
    correctness/sensitivity risk, not a cosmetic bug, and there's no way to
    audit that source's data pipeline.
  - **Benefit is genuinely modest.** Aaj Ka Din's existing 3 categories
    (day of week, time of day, season) already exercise real-world
    orientation every single day; a holiday/festival question would only
    add value on the small number of calendar days that are actually a
    named festival, and would sit idle (or need graceful "no festival
    today" handling) the rest of the year.
  - This matches the brief given for this evaluation almost exactly: skip
    when an optional online enhancement adds meaningful complexity
    (API-key security, an offline-cache/expiry layer, regional filtering
    across NER states, a fallback UX for "unreachable") for a modest,
    seasonal benefit. Revisit only if this project ever grows a real
    backend for other reasons (see the `/sync` roadmap item above) — at
    that point, proxying Calendarific through it removes the key-exposure
    problem and this becomes a small, genuinely low-risk addition.

For anything you build from the Quick wins or Medium lift sections, follow
the same rules as the rest of this project: offline-first, elderly-safe
motion/accessibility rules, and the claymorphic design tokens already
defined — don't introduce a second visual style.
