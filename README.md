# SmritiSetu — স্মৃতিসেতু — स्मृतिसेतु

**Smriti** (memory) + **Setu** (bridge) — a bridge to memory.

An offline-first, tablet-friendly cognitive-gaming and memory-assistance PWA for elderly
dementia patients in India's North Eastern Region (NER), with a companion caregiver
dashboard. Built for **SIH26003** — *AI-Based Cognitive Gaming and Memory Assistance
Platform for Elderly Dementia Patients in NER* (Smart India Hackathon, Ministry of
Development of North Eastern Region).

> **What this app is and isn't:** SmritiSetu supports cognitive engagement and gives
> families and clinicians a way to track changes over time. **It is not a diagnostic
> tool or a CDSCO/FDA-cleared medical device**, and it does not claim to slow or
> reverse dementia. Please consult a geriatric psychiatrist or neurologist for
> diagnosis and treatment. This line also appears as a persistent footer in the
> caregiver dashboard.

**Live demo:** deploys automatically from `main` via GitHub Actions
(`.github/workflows/deploy.yml`) to GitHub Pages — see the repo's "Deployments" or
Actions tab for the current URL once Pages is enabled (Settings → Pages → Source:
"GitHub Actions", a one-time manual step). CI (`ci.yml`) runs lint, the full test
suite, and a production build on every push and PR.

Deployment notes: link previews use `public/og-image.png` (1200×630) with absolute
URLs built from `SITE_URL` (set by the deploy workflow). A new deploy shows a
"New version available" toast to anyone with the old build open. **The very first
visit to the URL needs a connection** — nothing can be cached before then — after
which the app runs fully offline.

## SIH26003 requirement mapping

Every component the official problem statement asks for is implemented, not aspirational:

| Required (from the SIH26003 problem statement) | Implemented as |
|---|---|
| Interactive cognitive games: memory, attention, daily routine recall, pattern recognition | 14 games across exactly those 4 domains + a bonus orientation domain — see the clinical grounding table below |
| AI/ML algorithms adjusting difficulty based on patient performance | `engine/adaptiveEngine.ts` + `engine/bkt.ts` — explainable staircase fed by a Bayesian Knowledge Tracing mastery estimate, 10 levels |
| Cognitive performance analytics | `engine/trendAnalysis.ts` — linear-regression trend + z-score anomaly detection, on-device (see below) |
| Multilingual voice-assisted interaction, regional language support, culturally familiar themes | 9 languages (`src/i18n/`) incl. 6 NER-region languages (Manipuri, Khasi, Mizo, Nagamese, Kokborok, Nepali) covering 7 of the 8 official NER states; Web Speech API TTS in `src/lib/speech.ts` — automatically follows whichever language the patient profile is set to; game names rooted in Hindi/Sanskrit with real-language subtitles |
| Medication, hydration, activity, and appointment reminders | `src/reminders/` + the "Today" card on the patient home screen; opt-in local alerts (`notificationService.ts`) fire via the Notification API while the app is open |
| Caregiver monitoring dashboards tracking patient progress | `src/dashboard/` — trend charts, domain balance, adherence, adaptive log, cognitive insights, PDF/CSV export |
| Offline functionality for low-connectivity areas | Dexie/IndexedDB-first reads and writes everywhere, `vite-plugin-pwa` service worker, sync is opportunistic never required |
| Mobile/tablet accessibility with elderly-friendly interface | ≥64px tap targets, ≥18px body text, two high-contrast palettes, zero swipe/double-tap/hard-timer interactions |

## Why offline-first is the core constraint, not a feature

NER has some of the lowest neurologist/geriatric-psychiatrist-to-population ratios in
India, and much of the region's elderly population lives with patchy or no broadband.
Existing cognitive-training apps assume steady connectivity and English/Hindi
literacy — both fail the people this problem statement is about. So every read and
write in this app goes to a local IndexedDB store first; the network is something the
app *opportunistically* talks to when available, never something it depends on to
function.

## Architecture

```mermaid
flowchart TB
    subgraph Client["Browser / Installed PWA (offline-capable)"]
        UI["React UI<br/>Patient Mode · Caregiver Dashboard"]
        Zustand["Zustand stores<br/>active patient · caregiver auth · sync state · fatigue"]
        Engine["Adaptive Engine + Session Composer<br/>src/engine/*"]
        Dexie["Dexie (IndexedDB)<br/>patients · sessions · levelChanges · masteryEstimates · reminders · familyMembers"]
        SW["Service Worker<br/>precached app shell + game/audio/photo assets"]
        SyncQ["Sync Queue<br/>src/sync/queue.ts"]
    end
    MockAPI["Mock /sync endpoint<br/>src/sync/mockServer.ts"]

    UI --> Zustand
    UI --> Engine
    Engine --> Dexie
    UI --> Dexie
    Dexie -. unsynced rows .-> SyncQ
    SyncQ -- "when navigator.onLine" --> MockAPI
    SW -. serves app + assets fully offline .-> UI
```

Every game session writes a `GameSession` row (score, accuracy, response latency, error
types) straight to Dexie and updates that domain's BKT mastery estimate
(`masteryEstimates`). The adaptive engine reads the last 5 attempts at the patient's
current level plus that estimate and decides the next level, logging a human-readable
reason to `levelChanges` — that log is what the caregiver dashboard's "Adaptive Engine
Log" shows, so the level-up/down behavior is auditable rather than a black box.

## Tech stack

React + Vite + TypeScript · Tailwind CSS (custom elderly-accessible design tokens) ·
Dexie.js (IndexedDB) + dexie-react-hooks · Zustand · React Router · Recharts ·
i18next/react-i18next · Web Speech API (TTS + optional speech recognition) · jsPDF
(lazy-loaded, caregiver-only) · `motion` (screen transitions, level-up celebration,
dashboard bar/count-up/typewriter effects — every effect respects
`prefers-reduced-motion`; the spec lives in `.claude/skills/motion-system/SKILL.md`) ·
vite-plugin-pwa · Vitest.

**Dev environment runs in Docker** (`docker-compose.yml` / `Dockerfile.dev`) at the
user's request, so the host machine only needs Docker Desktop, not a matching Node
version.

```bash
docker compose up        # dev server at http://localhost:5173
docker compose run --rm web npm run build   # production build -> dist/
docker compose run --rm web npm run test    # vitest
docker compose run --rm web npm run lint    # oxlint
```

## Clinical grounding — every game maps to a real assessment domain

Each game logs **per-session score, accuracy, average response latency, and error
type** to Dexie — the three numbers the adaptive engine and caregiver dashboard both
consume. Every game screen has an "About this game" (ⓘ) button showing the row below
for that game.

### Domain 1 — Memory *(MoCA delayed recall · ADAS-Cog word recall/recognition)*

| Game | Mechanic | Clinical mapping |
|---|---|---|
| **Smriti Cards** | Culturally-themed picture-pair matching | Visual pair matching → delayed recall & recognition |
| **Smriti Katha** | Listen to a short story, answer recall questions | Episodic/verbal recall via an everyday spoken story, not a word list |
| **Naam Yaad** | See a real family photo, pick the correct name | Personally-meaningful recognition memory, using the patient's own family |

### Domain 2 — Attention & concentration *(MoCA attention/vigilance, digit span, serial subtraction · ADAS-Cog number cancellation)*

| Game | Mechanic | Clinical mapping |
|---|---|---|
| **Dhyan Dhaam** | Tap every tile matching a target pattern, with distractor density | Visual cancellation task |
| **Ginti Dhyan** | Tap numbered tiles in ascending counting order | Digit span / serial subtraction, at an accessible pace |
| **Awaaz Pehchan** | Voice-only: tap only when the pre-announced target word is spoken | Sustained auditory attention/vigilance |

### Domain 3 — Daily routine recall *(instrumental activities of daily living, IADL)*

| Game | Mechanic | Clinical mapping |
|---|---|---|
| **Dinacharya Sequence** | Arrange daily-routine cards into the right order | IADL planning & sequencing |
| **Bazaar List** | Hear a short shopping list, then find those items in a larger grid | Prospective memory & IADL planning |
| **Ghar ka Kaam** | Match a household tool to the task it's used for | Routine-object association |

### Domain 4 — Pattern & object recognition *(MoCA visuospatial/executive · ADAS-Cog constructional praxis)*

| Game | Mechanic | Clinical mapping |
|---|---|---|
| **Aakar Milan** | Pick the shape that completes a repeating pattern | Visuospatial/executive pattern completion |
| **Chaya Khoj** | Match an object to its silhouette among distractor shadows | Pure visuospatial matching, no reading required |
| **Naksha Jodo** | Assemble a picture from large colored pieces | Constructional praxis, a gentler analogue of clock-drawing/figure-copy |

### Domain 5 — Orientation *(bonus domain beyond the problem statement's four; MoCA orientation subtest)*

| Game | Mechanic | Clinical mapping |
|---|---|---|
| **Aaj Ka Din** | Once-daily check-in: what day, what time of day, what season | Temporal orientation. **Does not use the adaptive engine** — it logs correct/incorrect only, since it's a daily check-in, not a difficulty drill |
| **Ghadi Dekho** | Read an analog clock, tap the matching digital time from multiple choices | Visuospatial + temporal orientation — a close analogue of the Clock Drawing Test, one of the most widely used dementia-screening tasks. **Does use the adaptive engine** — the domain's only leveled, repeatable game |

## Adaptive difficulty engine (`src/engine/adaptiveEngine.ts`, `src/engine/bkt.ts`)

An explainable staircase algorithm, **10 discrete levels** per game. What feeds its
level-up / level-down thresholds is a **Bayesian Knowledge Tracing (BKT)** mastery
estimate, a real probabilistic model that needs no training data.

- **Mastery estimate (`bkt.ts`).** One probability of mastery, pL, per patient per domain
  (Memory, Attention, Routine, Pattern, Orientation), stored in Dexie
  (`masteryEstimates`: patientId, domain, pL, updatedAt). After every finished game it is
  updated with the standard BKT equations, from a prior pL0 = 0.3, with learning
  pT = 0.1, slip pS = 0.1 and guess pG = 0.2
  (Corbett & Anderson, [*Knowledge tracing: Modeling the acquisition of procedural
  knowledge*](https://link.springer.com/article/10.1007/BF01099821), User Modeling and
  User-Adapted Interaction 4(4):253–278, 1995).
- **Parameters are priors, not fitted values.** BKT parameters are currently set to
  literature-typical defaults (Corbett & Anderson-style priors); calibrating per-domain
  parameters from real patient data is a named next step once a deployed cohort exists.
  They are conventional starting values and were not learned from this population.
- **Rules around it.** A rolling window of the last **5 attempts** at the patient's
  current level. **Level up** only when all three hold: the domain's mastery estimate is
  ≥ 0.80, *this game's own* last 5 sessions average ≥ 80%, and response time is trending
  down (median of the later half of the window ≤ median of the earlier half). **Level down** when the estimate is < 0.40, **or** immediately if error rate rose
  for 2 consecutive sessions (doesn't wait for a full window, so a struggling patient
  isn't left failing repeatedly while data accumulates). Otherwise holds.
- **Every change is logged in plain language**, e.g. *"leveled up: domain mastery
  estimate 0.91 (at least 0.80) and this game's own last 5 sessions averaged 84% (at
  least 80%); avg 3.2s"*, and shown in the caregiver
  dashboard's Adaptive Engine Log, so the decision is auditable rather than a black box.
- **One observation per session, weighted by its accuracy.** Games report a session
  accuracy, not per-round right/wrong, so the update mixes the "correct" and "incorrect"
  posteriors by that accuracy. At 0% or 100% this is exactly the standard update. We
  compared it with a hard right/wrong cut-off against the previous accuracy-average
  rule: a 50% cut-off would level up a patient steady at 55%, and an 80% cut-off would
  level down one steady at 70%; the accuracy-weighted form keeps the same three bands
  (tests in `bkt.test.ts` and `adaptiveEngine.test.ts` pin this).
- **Honest limits.** There is one estimate per domain, shared by that domain's games and
  levels (it is not game- or level-specific). That means strong results in one game can
  raise the estimate that another game in the same domain is judged by: in a simulation,
  alternating an easy game at 100% with a harder one at 45% lifts the shared estimate
  above 0.80 within a few rounds. For **level-ups** this is guarded: the game's own last 5
  sessions must also average ≥ 80% (pinned by a test on exactly that scenario), so the
  harder game holds. The **level-down** side has no such guard, and the estimate is still
  shared, so a weak game can pull down the estimate another game is judged by (a demotion
  needs the estimate below 0.40, which takes a long run of low results). Known, not
  hidden; a per-game estimate would remove it. Also, because a learning probability above zero
  is part of the model, a long run of wrong answers levels off near 0.11 rather than
  reaching 0.
- **Shown to caregivers** as "NN% mastery estimate" under each domain in the Domain
  Balance view, with a note that it is a model estimate on standard starting values, not
  a clinical score. A domain with no attempts yet shows "No attempts yet" instead of the
  prior.
- Reaching level 6+ shows a private "you're getting stronger at this!" acknowledgment
  — never a leaderboard or a comparison against other patients.

Unit-tested: `src/engine/bkt.test.ts` (25 cases: hand-checked equations, direction of
change, convergence, bounds), `src/engine/adaptiveEngine.test.ts` (24 cases),
`src/engine/masteryService.test.ts` (14 cases: persistence, replay, the full session path)
and `src/engine/sessionComposer.test.ts` (6 cases for the "Today's Set" rotation).
## Cognitive analytics (`src/engine/trendAnalysis.ts`)

The adaptive engine above decides *in-game* difficulty. This is a separate, real
statistical-learning layer that answers the caregiver-facing question the problem
statement calls out explicitly — "cognitive performance analytics" — using two
classical, well-established techniques rather than a black box:

- **Ordinary least-squares linear regression** of accuracy over time, per cognitive
  domain, so "is this person actually declining" is answered from the *slope of a
  fitted trend line across all their sessions*, not a fragile today-vs-yesterday
  comparison. The R² of the fit is surfaced alongside the slope, so a noisy, low-R²
  trend is never presented with false confidence.
- **Rolling z-score anomaly detection**, flagging a session that's a statistical
  outlier (|z| ≥ 2) against *that patient's own* recent baseline — never a population
  norm, since this app never sees another patient's data.

Both run instantly on-device against a few dozen data points, need no training phase,
no external dataset, and no network call — the same explainability and offline-first
constraints as the adaptive engine, applied to analytics instead of difficulty. The
caregiver dashboard's **Cognitive Insights** card shows, per domain: Improving /
Stable / Declining / Gathering data, the plain-language reason string the model
computed, and any flagged sessions with a one-line explanation of why they stood out.

Unit-tested in `src/engine/trendAnalysis.test.ts` (9 cases: trend direction, R²
confidence, order-independence, anomaly detection against a stable baseline, and
windowed-vs-whole-history behavior).

## "Today's Set" — avoiding daily monotony

`src/engine/sessionComposer.ts` picks 3 games from 3 different domains each day,
purely off last-played timestamps (no day-of-week math): the domain whose games were
touched longest ago gets picked, and within it, the specific game played longest ago
is featured. This naturally adapts if a patient skips days, rather than assuming daily
play. **Aaj Ka Din** is pinned separately at the top once per day until completed,
since it's a check-in, not part of the rotation.

## Accessibility (hard requirements, not polish)

- Body text ≥ 18px, primary actions 22–24px, with a caregiver-toggleable extra-large
  mode up to ~28px (implemented by scaling the document root font-size, so every
  rem-based size — including tap targets — scales together).
- Minimum 64×64px tap targets, 16px+ spacing.
- Two WCAG-AAA-targeted high-contrast palettes (`src/index.css`): a default warm
  cream/teal/saffron palette, and an alternate blue/amber palette that avoids
  red/green cues for common elderly color-vision changes. Both palettes' focus
  indicator is amber, deliberately never blue — age-related lens yellowing reduces
  blue discrimination, making blue one of the worse choices for a focus ring in
  this specific population.
- No swipe gestures, no double-tap, no auto-advancing carousels, no hard timers that
  fail the patient. The two placement-style games (Dinacharya Sequence, Naksha Jodo)
  use **tap-to-place with tap-to-undo** rather than continuous drag — a deliberate
  accessibility call: sustained drag tracking is measurably harder than a discrete tap
  for users with tremor or motor-precision changes, while the task (arrange items
  correctly, forgiving, no time pressure, undo always available) is unchanged.
- One task per screen, no menu nested more than 2 levels, an always-visible home
  button (`GameShell`).
- Session-length nudge: after ~11 minutes or 4 games since the patient last chose to
  keep playing, a gentle "take a break?" prompt appears (`BreakPromptWatcher` +
  `fatigueStore`) — this is patient-fatigue protection, not an engagement metric, and
  is never reported to the caregiver dashboard as a KPI.
- Instructions can be re-offered, not just available once: every game's spoken instruction
  is offered again after ~22 seconds with no input (`useInactivityRepeat`), at most three
  times per idle stretch, never over other speech, and any tap restarts the window. A due
  reminder is spoken once and replayed once, 10 minutes later, if still unacknowledged
  (`reminderVoice.ts`). Same voice and pace as a manual tap. **This automatic speech is
  built and tested but currently switched off** (`AUTO_SPEAK_ENABLED` in
  `src/lib/voiceConfig.ts`); the speaker button next to every instruction always works.
- A three-screen intro (read aloud when automatic speech is on; the speaker button always works) for the patient on first launch (one sentence and one
  picture per screen; Skip is as large as Next; a caregiver can replay it from Settings),
  and a four-point, text-only "Getting started" checklist for the caregiver's first login.

### Evidence base for the dementia-specific UX

These choices follow published findings rather than preference. The full references also
live in `src/lib/evidence.ts`, which code comments point to.

- **Limited information, repeated instructions, one simple step at a time.** Engelsma T,
  Jaspers MWM, Peute LW. *Considerate mHealth design for older adults with Alzheimer's
  disease and related dementias (ADRD): a scoping review on usability barriers and design
  suggestions.* Int J Med Inform. 2021;152:104494.
  [sciencedirect.com/science/article/pii/S1386505621001209](https://www.sciencedirect.com/science/article/pii/S1386505621001209).
  The review lists these among its design suggestions; they shaped the inactivity repeat,
  the reminder replay, the three-screen intro, and the short caregiver checklist.
- **Participatory, staged development with clinicians, caregivers and people living with
  dementia.** Brown EL, Ruggiano N, Allala SC, Clarke PJ, Davis D, Roberts L, Framil CV,
  Muñoz MTH, Hough MS, Bourgeois MS. *Developing a Memory and Communication App for Persons
  Living With Dementia: An 8-Step Process.* JMIR Aging. 2023;6:e44007.
  [doi:10.2196/44007](https://aging.jmir.org/2023/1/e44007/). In that paper, clinical experts
  review the prototype, including whether its icons are appropriate for people living with
  dementia (step 4), before a user study with a person living with dementia and a caregiver
  (step 5). This is our target process for the validation described in the Roadmap.

These sources inform the design; SmritiSetu has not itself been clinically validated, and
nothing here is a diagnosis or a treatment claim.

## Multilingual & voice support

- **High-resource, native-quality UI translations:** English, Hindi, Assamese
  (`src/i18n/{en,hi,as}.json`).
- **Full-structure translations for six North Eastern Region languages** — Manipuri
  (Bengali script — see that file's `_meta.scriptChoice` for why, and why it isn't
  settled), Khasi, Mizo, Nagamese, Kokborok, Nepali
  (`src/i18n/{mni,kha,lus,nsm,kok,ne}.json`), covering 7 of the 8 official NER
  states (only Arunachal Pradesh, whose extreme linguistic diversity makes a single
  representative language a genuinely hard call, is left to the English/Hindi
  fallback). Every key in the UI (including all 14 game names/taglines/instructions)
  has a translation, but each file is flagged with a `_meta.status` note: these are
  AI-assisted best-effort drafts, not yet reviewed by a native speaker or community
  linguist — confidence varies within the group too (Nepali is comparatively
  well-documented; Kokborok has far fewer digital resources and its `_meta.status`
  says so explicitly). Any key that's still missing anywhere falls back to English
  automatically (`i18n/index.ts`).
- **The selected language drives TTS automatically, not just UI text.** Changing a
  patient's `preferredLanguage` (onboarding, or Settings) changes both at once —
  `VoicePrompt` always speaks in `patient.preferredLanguage`, and `<html lang>` stays
  in sync too (`i18n/index.ts`'s `languageChanged` listener) — there's no separate
  "TTS language" setting to keep in sync by hand, by construction.
- **TTS is opt-in everywhere, never automatic.** A speaker-icon button next to the
  relevant text reads it aloud on tap via `SpeechSynthesisUtterance`; it never plays
  on its own when a screen loads. If no matching voice is installed (Nepali has
  genuine broad device support; most of the other NER-region languages don't yet),
  it falls back to a pre-recorded clip path and then to English TTS — audio never
  blocks the tap targets underneath it (`src/lib/speech.ts`).
- **Smriti Katha, Awaaz Pehchan, and Aaj Ka Din are voice-first**: fully playable with
  audio alone and tap-only responses, zero required reading.
- **Known limitation:** bespoke game *content* (the 3 Smriti Katha stories, the word
  pool for Awaaz Pehchan) is English-only in this build — translating narrative
  content well needs native-speaker review, not machine translation, so it's flagged
  here rather than shipped silently. UI chrome around that content is fully
  localized.

## Offline-first, demoable

- All reads/writes hit Dexie first; nothing blocks on network.
- `src/sync/queue.ts` batches unsynced `sessions`/`reminderLogs`, retries with
  exponential backoff, and fires opportunistically (interval, `online` event, and
  once on load).
- The caregiver dashboard's **Offline / Sync Demo panel** has an "airplane mode"
  toggle that overrides `navigator.onLine` for the whole app — play a game or mark a
  reminder while it's on, then flip it off and watch the badge go
  Offline → Syncing → Synced and a mock request actually land
  (`src/sync/mockServer.ts`, with a running received-count so it's visibly not a
  no-op).
- All game assets are code-split per game and precached by the service worker
  (`vite-plugin-pwa`), verified via `docker compose run --rm web npm run build`
  producing per-game chunks (see build output — each game is ~2–6KB gzipped).

## Admin Panel (`/admin`, `src/admin/AdminOverview.tsx`)

A third, PIN-gated role alongside patient and caregiver, for the person who set up
a device or manages several patients (a family running more than one profile on a
shared tablet, or a clinic/NGO deployment):

- The caregiver who completes first-time onboarding on a device is automatically
  the admin for that install (`role: 'admin'` on their `Caregiver` record) — there's
  no separate signup step. Auth is a separate in-memory session
  (`store/adminAuthStore.ts`) from the caregiver dashboard's, gated by its own PIN
  entry (`/admin/login`), reusing the same `PinPad` component (with the same
  5-attempt lockout) as caregiver login.
- **Patients:** every patient record on the device, with a session count and a
  one-tap "Set Active" switch — this is what turns the "single active patient"
  limitation into a real multi-patient switcher. "Add Patient" creates another
  profile without re-running onboarding.
- **Caregivers:** every caregiver record, their role, and a "Reset PIN" action that
  generates a new random PIN, hashes and stores it, and shows the plaintext PIN once
  (never persisted or logged in the clear).
- **Languages:** a read-only status view of `SUPPORTED_LANGUAGES`, useful for a
  deployment to quickly see which languages are fully wired up.
- **Data tools:** a one-click JSON export of every table (caregiver PIN hashes are
  deliberately excluded from the export — a backup file is not the place for auth
  material), and a "Danger Zone" full data reset gated behind typing a literal
  confirmation word, not just a click, before it does anything irreversible.

The entry point is a small, deliberately unobtrusive text link on the role-select
screen (`RoleSelect.tsx`) — not a third big button next to "I want to play" /
"I am a caregiver", so it doesn't add a confusing extra choice to the one screen a
patient with cognitive impairment sees on every app launch.

**The panel is off in production builds by default.** The `/admin` routes and that
link are only registered when `ADMIN_ENABLED` is true (`src/lib/featureFlags.ts`):
always in the dev server, and in a production build only if it was built with
`VITE_ENABLE_ADMIN=true`. The reason is the "Forgot PIN" flow, which (like the
caregiver one) lets anyone on the device set a new PIN with no proof of identity —
acceptable for the caregiver gate, not for a panel that can reset every caregiver
PIN and wipe all data. In a build without the flag, `/admin` falls through to the
catch-all and redirects home.

**This repo's own public demo is an accepted exception.** `.github/workflows/deploy.yml`
sets `VITE_ENABLE_ADMIN=true`, at the site owner's explicit request, so the deployed
demo URL does expose `/admin` — anyone with the link can reach it and reset a PIN
unverified. That's a known, chosen trade-off for demoing the panel itself, not an
oversight; don't copy this setting into a build that will hold real patient data
without first giving `ForgotPinReset` a real identity check.

## Data model (Dexie, `src/db/schema.ts` / `src/db/types.ts`)

Matches the brief closely, with two small additions: a `reminderLogs` table (so
adherence can be computed per-day, not just "last acknowledged"), and per-patient
`highContrastPalette`/`textScale` fields (the caregiver-toggleable accessibility
settings need somewhere to live).

## Known limitations (naming our own gaps)

- **Regulatory boundary: general wellness, not SaMD** (adjacent to the non-diagnostic
  disclaimer at the top of this README). SmritiSetu is designed to stay within CDSCO's
  "General Wellness Software" exclusion (Guidance Document on Medical Device Software,
  MDR-2017, July 2026 — Doc No. CDSCO/MD/GD/MDSW/01/2026, issued 21 July 2026): it
  supports and reports on general engagement and activity patterns only, and deliberately
  makes no reference to any disease, disorder, or pathological condition, and performs no
  screening, staging, or severity assessment of dementia or any other condition. Any
  feature that would estimate condition severity would fall outside this exclusion and
  require CDSCO registration as Software as a Medical Device (SaMD) — a regulatory
  pathway out of scope for this project. This boundary is a deliberate design constraint,
  not an oversight. (Full citation: `src/lib/evidence.ts`'s `CDSCO_MDSW_GUIDANCE_2026`.)
- **Placeholder art, not commissioned regional artwork.** Smriti Cards' culturally-themed
  pairs are line icons from the shared SVG sprite (`IconSprite.tsx` — the app uses no
  emoji); Aakar Milan uses geometric glyphs; Chaya Khoj derives "shadows" by
  CSS-blackening (`brightness(0)`) the same sprite icons; Naksha Jodo assembles a generated
  radial color mosaic rather than a literal bamboo-hut/boat/mountain illustration.
  All are functionally real cognitive tasks, but the visuals are a hackathon
  stand-in for hand-drawn or photographed regional motifs (gamosa/jaapi/Naga shawl
  patterns, real silhouette photography, a real tangram of a bamboo hut).
- **Single active patient per device at a time**, matching the primary use case in
  the problem statement, but the data model always supported more than one patient
  record — the Admin Panel (below) now exposes that as a real patient switcher for
  households or institutions running SmritiSetu across several patients on one
  tablet.
- **PIN auth is a lightweight gate**, not a security boundary — it keeps a patient
  from wandering into the dashboard or admin panel, not a defense against a
  determined adult. PINs are salted (per-caregiver, via `crypto.getRandomValues`)
  and hashed (SHA-256) before storage (`src/lib/pin.ts`), and a short lockout after 5
  wrong attempts discourages idle keypad-mashing, but this is still not meant to
  resist a determined attacker with device access.
- **The `/sync` backend is mocked** (`src/sync/mockServer.ts`) — it simulates
  latency and keeps a local received-count, so the offline→online flow is fully
  demoable, but there's no real server persisting data across devices yet.
- **No encryption at rest.** IndexedDB (via Dexie) stores patient data in plaintext
  on-device — reasonable for a single-device hackathon prototype, but a real clinical
  deployment handling health-adjacent data under India's DPDP Act 2023 would need
  device-level encryption (OS full-disk encryption today; app-level encryption as a
  roadmap item).
- **Component/integration test coverage is representative, not exhaustive.**
  `engine/` has full unit coverage; a cross-section of the riskiest UI surfaces
  (the error boundary, the onboarding consent gate, the cognitive-insights card, and
  one full game end-to-end) has component tests via React Testing Library, but not
  all 14 games do yet.
- **TTS voice coverage depends entirely on the device.** Hindi and English are
  reliable on most Android/Chrome devices; Assamese support is inconsistent; the four
  North Eastern Region languages fall back to English audio (flagged, not hidden).
- **The in-game adaptive engine uses Bayesian Knowledge Tracing with uncalibrated
  priors.** BKT is real Bayesian inference and needs no training data, which is why it
  fits an offline, on-device app with no patient cohort yet. Its four parameters are
  literature-typical starting values, not fitted to this population, and there is one
  estimate per domain rather than per game or level (details above). No neural network
  or trained model is claimed anywhere. The separate cognitive-analytics layer
  (`trendAnalysis.ts`) is genuine statistical learning (linear regression + anomaly
  detection) — the two are complementary, not the same thing wearing different names.
- **Open items to close in a final pre-submission pass:**
  - *Not yet played through the real UI.* The BKT path is covered by tests on a real
    Dexie (fake-indexeddb) and by a browser check that the v1→v2 database upgrade keeps
    existing sessions, but a game has not been played to completion in the browser to see
    a level change and its log line end to end. Do this at least once before the demo.
  - *Aaj Ka Din feeds Ghadi Dekho's estimate.* Aaj Ka Din is not adaptive, yet its
    results update the Orientation estimate that Ghadi Dekho is judged by (the same
    shared-estimate cause as above; level-ups are guarded, level-downs are not).
  - *Long zero-accuracy runs.* After roughly 30 straight zero-accuracy sessions in one
    domain the estimate reaches a numeric edge; low-impact, left unfixed for now.

## Roadmap

1. Native-speaker/community review of the six North Eastern Region language
   translation files (they're structurally complete but AI-assisted and unreviewed —
   Kokborok most urgently, given how few digital resources exist for it), and a
   decision (with community input, not just engineering convenience) on Meitei
   Mayek vs. Bengali script for Manipuri.
2. Replace placeholder visuals with commissioned regional artwork per game.
3. Real backend for `/sync` with per-clinic or per-family account boundaries, feeding
   the same multi-patient Admin Panel that already exists client-side.
4. **Partially done:** local (non-push) reminder alerts now exist
   (`src/reminders/notificationService.ts`, opt-in from Settings) — they fire via the
   Notification API while the app/tab is open, including backgrounded, but can't wake
   a fully closed browser. True background push (via a real `/sync` backend) is the
   remaining step for a reminder to arrive even after the tablet's browser was closed.
5. **Calibrate the BKT parameters.** BKT is live in `bkt.ts` on literature-typical
   defaults; once a deployed cohort exists, fit pL0/pT/pS/pG per domain from a small
   aggregated, anonymized cross-patient dataset (with consent), and consider per-game or
   per-level estimates and per-round evidence from the games.
6. A real clinical pilot with a geriatric psychiatrist partner to validate the
   domain mappings and adaptive thresholds against MoCA/ADAS-Cog scores over time —
   the dashboard's trend data is designed for exactly this conversation.
7. **Field validation, following a participatory-design process.** Planned field-testing with a clinician and a small cohort of patients and caregivers, following a participatory-design process similar to Brown et al. 2023 ([JMIR Aging 6:e44007](https://aging.jmir.org/2023/1/e44007/)), including validating icon/mascot appropriateness directly with people living with dementia before wider rollout. Until then, the voice-repeat timing, intro copy and mascots are informed by the literature above, not yet tested with patients.
