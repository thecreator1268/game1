# SmritiSetu — engineering log (internal)

**Purpose:** a dated, technical accomplishment log for the team's own Q&A
prep before judging/demo day — "what did we build, what broke and how did we
fix it, why did we choose X over Y." Written for us, not for judges: it says
things plainly (including limitations and things we'd do differently) that
the pitch deck and README necessarily soften or omit. Pulled from `git log`
(27 commits, 16–23 Sept 2026) and the README/CLAUDE.md history; nothing here
should contradict either — if it does, the code and git log are the source
of truth, not this file's memory of them.

Total build window: **8 days**, 16–23 September 2026.

---

## 1. The one-paragraph answer, if asked "what did you build"

An offline-first PWA for elderly dementia patients in India's North Eastern
Region: 14 cognitive games across 5 clinically-grounded domains (Memory,
Attention, Routine, Pattern, Orientation — mapped to MoCA/ADAS-Cog/Clock
Drawing Test subtasks, not generic puzzles), an explainable adaptive
difficulty engine now driven by real Bayesian probabilistic inference (BKT)
instead of a rolling average, a second genuinely-statistical analytics layer
(linear regression + anomaly detection) for the caregiver dashboard, 9
languages including 6 North Eastern Region languages, and a caregiver
dashboard with trend/adherence/domain-balance charts, PDF/CSV export, and a
plain-language adaptive-engine log so every difficulty change is auditable.
Everything works fully offline via Dexie/IndexedDB and a service worker; the
`/sync` backend is honestly mocked, not real.

---

## 2. Architecture decisions, and why we made them (likely Q&A targets)

### Why BKT (Bayesian Knowledge Tracing) and not a Random Forest / neural net?

The problem statement asks for "AI/ML algorithms adjusting difficulty." A
trained model (Random Forest, logistic regression, a neural net) needs a
training dataset — we have zero deployed patients and zero session history
at build time. Any such model would either be trained on synthetic/made-up
data (meaningless) or shipped untrained (useless). BKT is **real Bayesian
inference**, not a rule-of-thumb: a genuine hidden-state probabilistic
model (Corbett & Anderson, 1995) with four parameters (prior, learn, slip,
guess probabilities) and closed-form Bayes-rule updates. It needs **no
training data** to run correctly — it starts from a literature-typical
prior and updates via math, not gradient descent — which is exactly what an
offline-first, pre-deployment, on-device app needs. We say this explicitly
in the README and in code comments: the four parameter *values* are
conventional starting priors, not fitted to this population, and
calibrating them from real patient data is a named next step once a
deployed cohort exists. If asked "is this really AI/ML" — yes, it's a named
probabilistic model from the learning-sciences literature, not a marketing
label on an if/else chain (that's what the *previous* rolling-accuracy-average
version honestly was, and we replaced it for exactly that reason).

### Why does level-up need BOTH the domain estimate AND the game's own window?

BKT's mastery estimate is **one number per patient per domain**, shared by
every game in that domain (e.g., Ginti Dhyan, Dhyan Dhaam and Awaaz Pehchan
all feed and read the same Attention estimate). We found via simulation that
this sharing has a real failure mode: a patient doing very well on an *easy*
game in a domain can drag the shared estimate above the level-up threshold
even while a genuinely *hard* game in the same domain is still failing —
the old accuracy-average rule would correctly hold the hard game, the naive
BKT-only rule would incorrectly promote it. We pinned this exact scenario in
a test (easy game at 100% alternating with a hard game at 45%) and fixed it
by requiring the game's own last-5-session accuracy to *also* clear 80%
before a level-up — the shared estimate alone is necessary but not
sufficient. Level-**down** deliberately doesn't have this second gate (a
demotion should be easy to trigger for patient comfort, a promotion should
be conservative). This is the single most technically interesting bug we
found and fixed ourselves, unprompted by any test failure — it came from
proactively simulating the model's behavior before shipping it, not from a
crash.

### Why an asymmetric-domain flag, and why is it gated so conservatively?

A caregiver benefits from knowing when one cognitive domain is quietly
falling behind the others — that's a genuinely useful, novel wellness
signal beyond what a standard chart shows. We built it to fire only when a
domain's BKT estimate lags the other four's average by 25+ percentage
points, **and** that same gap already existed 2 weeks ago using only the
data that existed at that earlier point in time — not just "is the gap
present right now." This means a single bad session, or a domain a patient
simply hasn't played yet, can never trigger it; it needs a real, sustained
pattern across real calendar time. We also required *every* domain to have
at least some data before comparing (the existing "not enough data yet"
gate), because "25 points below the average of the other four" is not a
meaningful sentence if some of those four have no data to average.

### Why is the CDSCO citation load-bearing, and what did we actually verify?

We are explicitly designing to stay inside CDSCO's "General Wellness
Software" exclusion (Guidance Document on Medical Device Software, MDR-2017,
Doc No. CDSCO/MD/GD/MDSW/01/2026, issued 21 July 2026) rather than
Software-as-a-Medical-Device (SaMD) territory: no disease/disorder/condition
reference, no screening, staging or severity assessment of dementia or
anything else. This is *why* the asymmetric-domain flag's copy is worded the
way it is ("lower," never "severity"/"stage"/"decline"/a named condition) —
it's not a copywriting nicety, it's the regulatory line itself. One honest
note for Q&A: we could not independently confirm the exact document number
we were originally given (it had a ".1" suffix we couldn't verify), so we
cross-checked it against 4 independent secondary sources before citing it
and used the number they converge on. If a judge asks for the primary PDF
text, we have not been able to parse it as text ourselves (it's an
image-based/scanned PDF) — we're citing secondary legal-industry summaries
that quote the same exclusion language, not the primary source directly.

### Why is the cognitive-analytics layer (trend/anomaly) a *separate* thing from BKT?

The problem statement asks for both "AI/ML algorithms adjusting difficulty"
*and* "cognitive performance analytics" as two distinct requirements. We
built two genuinely different statistical methods rather than one thing
wearing two names: BKT (Bayesian inference) drives in-game difficulty;
ordinary least-squares linear regression (with R² surfaced, so a noisy
trend never gets reported with false confidence) plus rolling z-score
anomaly detection against each patient's *own* baseline (never a population
norm — this app never sees another patient's data) drives the caregiver's
"Improving / Stable / Declining / Gathering data" per-domain read. Both are
real, on-device, and need no training phase — that's a deliberate
consistency across the whole app, not a coincidence.

### Why 5 domains but the problem statement names 4?

The SIH26003 statement asks for memory, attention, daily-routine recall and
pattern recognition. We added a 5th (Orientation) because it's one of the
most clinically standard cognitive domains (time/place/person orientation)
and let us build a genuine Clock Drawing Test analogue (Ghadi Dekho) — one
of the most globally recognized dementia-screening tasks — which is a
strong, recognizable addition to point to, not a required box to check.

---

## 3. Chronological build log

### Day 1 — 16 Sept: initial prototype
- Initial commit: 13 games across 5 domains, an 8-level adaptive engine
  (unit-tested), the "Today's Set" daily session composer, Dexie/IndexedDB
  offline storage with a mock sync queue, the caregiver dashboard's first
  version, the elderly-accessible design system, i18n for English/Hindi/
  Assamese plus honest partial stubs for 4 NER languages, and the PWA
  service worker.
- Extended every game to **10** difficulty levels (from 8), made TTS
  strictly opt-in (removed two auto-narrate-on-load calls that duplicated an
  existing "Listen" button), added a shared `PinPad` with a 5-attempt
  lockout, built the Admin Panel (patient/caregiver management, language
  completeness overview, data export/reset), and brought 4 partial-stub
  languages up to full structural parity.
- **Bug found via our own code-review pass, not a user report:** "Play
  Again" after manually picking a level ignored the adaptive engine's own
  level-up/down decision from the session just played — it kept silently
  replaying the same manually-picked level forever, so a summary screen
  could say "Level 6" while the next round started back at 5. Fixed
  identically across all 12 leveled games. Also fixed a crash-on-invalid-
  gameId in the level-select screen and a stale-response race condition in
  its "recommended level" fetch.
- Ran a full security-focused review of the day's diff and a separate
  supply-chain/secrets/XSS audit of the whole repo: clean.

### Day 2 — 17 Sept: SIH-readiness gaps, accessibility, a 14th game
- **A real on-device ML/analytics layer** (`trendAnalysis.ts`) — see
  Architecture Decisions above.
- SIH26003 idea-submission pitch content, grounded in verified sources (a
  LASI dementia-prevalence study, Neurology India workforce papers, a DEF
  India/ORF NER-connectivity report, the official problem statement) rather
  than invented statistics.
- **Closed the highest-severity gaps from an internal gap audit:** an
  uncaught render error could previously white-screen the *entire app* for
  a dementia patient mid-session (no error boundary existed) — added a
  global + game-scoped `ErrorBoundary` with a recoverable fallback,
  localized across all 7 languages at the time. Caregiver/admin PINs were
  hashed with **unsalted** SHA-256 — added per-caregiver salting. Added an
  explicit data-storage consent step to onboarding. Added CI (lint/test/
  build on every push) and a live GitHub Pages deploy — before this, there
  was no URL a judge could open without cloning the repo.
- Branded splash screen (the app's first-ever frame had been a blank white
  screen while a Dexie query resolved) and a real welcome intro on the
  onboarding language step (previously just a heading and a button grid).
- Fixed theme-1's blue focus ring — research on age-related lens yellowing
  flags blue specifically as a poor focus/selection color; switched to the
  same amber theme-2 already used. Added opt-in local reminder notifications
  (explicit permission from Settings, never automatic).
- `<html lang>` never updated when the app's language changed (a WCAG 3.1.1
  violation) — fixed centrally via i18next's `languageChanged` event.
  Uploaded family photos were stored as raw, unresized data URLs (a phone
  photo, often 3–8MB, for what only ever renders as a small avatar) — added
  client-side downscaling, cutting size by roughly one to two orders of
  magnitude with no visible quality loss.
- **Accessibility fixes found by deliberately auditing, not by a report:**
  5 games announced "Correct!"/"Try again" with no `aria-live` region at all
  — a screen-reader user got zero signal. Extracted a shared `RoundFeedback`
  component so the fix landed once, not five times, and future games get it
  free. Separately, 3 more games signaled correct/wrong entirely through
  tile *border color* with no text or announcement — a real "use of color"
  violation, and one this app's own users are statistically more likely to
  hit (age-related color-vision changes). Checked the remaining 4 games
  explicitly and confirmed none needed the same fix.
- `Modal` had `role="dialog"` but none of the real behavior — focus never
  moved in, Tab could escape to the page behind it, Escape did nothing,
  closing didn't restore focus. Fixed once, in one place, benefiting both
  existing consumers automatically.
- **Ghadi Dekho** (14th game): read an analog clock, tap the matching
  digital time — a Clock Drawing Test analogue, one of the most recognized
  dementia-screening tasks worldwide, and the first *leveled, adaptive*
  game in the Orientation domain (which previously had only a non-adaptive
  daily check-in). Added Kokborok and Nepali, bringing NER-region language
  coverage to 7 of 8 official NER states.

### Day 3 — 19 Sept: motion system, deployment polish, spec settlement
- Built the Tier-1/Tier-2 motion system (route transitions, skeletons,
  level-up celebration, typewriter/count-up effects, the splash reveal, a
  `/showcase` demo mode for recording without a seeded account) and gated
  `/admin` behind a build flag after realizing "Forgot PIN" had no identity
  check at all.
- Deployment polish: theme-color/manifest colors, Open Graph/Twitter link
  previews, replacing the default Vite favicon, an update-available toast,
  and an inline boot-failure message instead of a blank page on a load
  error.
- **Settled the spec to match the shipped app** (14 games, 10 levels) after
  finding the build prompt still said otherwise in places, and fixed
  `PatientHome`'s pip-dot rendering, which read a stray hardcoded `8`
  instead of the engine's actual `MAX_LEVEL` — levels 9 and 10 were
  rendering visually identical to level 8. Also found that Ghadi Dekho's
  hardest levels (9–10) used 1-minute clock-face granularity, meaning the
  test was measuring eyesight (can you see a ~6° hand difference), not
  cognition — raised the granularity floor to 5 minutes.
- Added delete-confirmation modals (typed-word confirmation for the most
  destructive action, a two-tap "arm then confirm" for smaller ones) and
  inline form success/error states for Add Reminder / Add Family Member.

### Day 4 — 20–21 Sept: BKT, RouteTransition fix, evidence-based UX, agents
- Installed scoped animation/design-taste skills (each with a project-scope
  preamble: the locked design-system/accessibility-checklist/motion-system
  skills always win) and added GSAP, used narrowly for caregiver-only
  timelines and lazy-loaded so it never touches the eager patient-mode
  bundle.
- **Replaced the rolling-accuracy-average adaptive engine with BKT** — see
  Architecture Decisions above for the full reasoning, including the
  per-game level-up gate we added after finding the shared-estimate failure
  mode ourselves via simulation before it could bite a real demo.
- **Found and fixed a real motion bug, not a cosmetic one:** `AnimatePresence
  initial={false}` on `RouteTransition` was reaching every *descendant*
  `motion.*` component through React context, not just suppressing its own
  entrance — meaning dashboard bars, the level-up badge and other mount
  animations were silently skipped on any directly-loaded route. Fixed by
  suppressing only the wrapper's own first entrance instead.
- Evidence-based UX changes citing two peer-reviewed sources (an ADRD
  scoping review, a JMIR Aging participatory-design paper): periodic
  spoken-instruction repeats for patients who miss them the first time
  (capped, never looping forever), a 3-screen skippable first-launch intro,
  a 4-point caregiver "Getting started" checklist. Automatic speech was
  then switched off pending further review, with all the plumbing left
  wired for when it's turned back on.
- Added the final 6 of 12 planned Claude Code subagents (motion-verifier,
  docs-sync-checker, i18n-checker, citation-integrity-checker, offline-
  asset-checker, calm-copy-checker) for repo-specific automated review.

### Day 5 — 22 Sept: CDSCO grounding, the asymmetric-domain flag, cleanup
- **CDSCO regulatory-boundary citation + the asymmetric-domain flag** — see
  Architecture Decisions above.
- Found and fixed 5 leftover references to the old "8-level" spec (in a
  skill file, an agent description, and a CSS comment) that had survived
  the Day-3 spec settlement — caught incidentally while running our own
  docs-sync-checker agent for unrelated work, fixed because it was quick
  and unambiguous.
- Wrote a seed script (`scripts/seed-asymmetry-demo-patient.mjs`) for a
  realistic multi-domain demo patient, because our existing long-running
  manual test patient only has data in one domain — meaning the new flag
  correctly never fires for them, which is *correct* behavior but also
  meant there was no account where a judge could actually see the card
  render. Verified the seeded data trips the flag using the real production
  function, not by eyeballing the UI.

### Day 6 — 23 Sept: exhaustive motion pass (in progress at time of writing)
- Full pass over every interactive element category app-wide (buttons,
  toggles/segmented controls, inputs, the PIN pad, modals, toasts, list/grid
  entrances, chart legends) against one shared set of timing/easing tokens,
  replacing several places where a slightly different hand-tuned duration
  or easing curve had crept in over the previous 5 days of independent
  feature work. Found and fixed some real, non-cosmetic issues along the
  way: a reminder-category chip row and a caregiver-settings button group
  with **no minimum tap-target size at all** (a genuine accessibility
  violation, not just a missing animation), and `Modal`'s complete lack of
  an entrance/exit animation (it popped/vanished instantly with no backdrop
  fade). Not yet committed at time of writing — see git log for the actual
  landed state.

---

## 4. Known gaps, said plainly (for when a judge finds one first)

- **`/sync` is mocked.** It simulates latency and a received-count, fully
  demoable offline→online, but there's no real backend persisting data
  across devices. Said explicitly in the README, not glossed over.
- **PIN auth is a lightweight gate, not a security boundary.** It keeps a
  patient from wandering into the dashboard, not a defense against a
  determined adult with device access. Salted+hashed, with lockout, but
  that's the honest ceiling.
- **BKT's four parameters are uncalibrated priors**, not fitted to any real
  population (we have no deployed cohort to fit them from). Calibration is
  a named roadmap item.
- **The asymmetric-domain flag's known blind spot:** the underlying
  mastery estimate is shared per domain, not per game — a weak game can
  still drag down the estimate another game in the same domain is judged
  by. Level-ups are guarded against the mirror-image problem; level-downs
  and this flag are not, by design trade-off, documented in the README.
- **Translation confidence varies honestly by language.** English/Hindi/
  Assamese are high-resource and reviewed; the other 6 languages are
  AI-assisted structural-parity drafts flagged as needing native review
  before real deployment — Kokborok most urgently, given how few digital
  resources exist for it.
- **No real-device or real-voice testing done.** Everything is verified via
  Vitest/RTL, Playwright/chrome-devtools browser automation, and manual
  desktop-Chrome checks — not a physical Android tablet in the field.
