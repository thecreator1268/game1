# Build Prompt — Paste this into Claude Code (or any Claude coding extension)

Project: **SmritiSetu** — "Smriti" (memory) + "Setu" (bridge), a bridge to memory for elderly dementia patients in India's North Eastern Region (NER).
Problem Statement: SIH26003 — AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in NER (Smart India Hackathon 2026, Ministry of Development of North Eastern Region).

Copy everything below the line into Claude Code as your first instruction.

---

## Role and objective

You are building a working, demoable prototype of **SmritiSetu**, a tablet-first, offline-first cognitive-gaming and memory-assistance web app for elderly dementia patients in India's North Eastern Region, with a companion caregiver dashboard. Build it as a single deployable web app (installable as a PWA) so it can run on a low-cost Android tablet in a rural clinic or home with no reliable internet.

Optimize for: (1) a judge being able to click through a realistic, working demo in under 5 minutes, (2) visible clinical grounding (not just "AI-powered" marketing), (3) elderly-appropriate UI, (4) genuine offline behavior, (5) enough game variety that a patient isn't doing the same four exercises every day, (6) clean, well-organized code a judge or teammate can extend after the hackathon.

## Tech stack (use exactly this unless you hit a hard blocker — then tell me why before switching)

- **Frontend:** React + Vite, TypeScript
- **Styling:** Tailwind CSS, with a dedicated "elderly mode" design-token set (see Accessibility section)
- **Local/offline storage:** Dexie.js (IndexedDB wrapper) — all patient sessions, game scores, family-member data, and reminders are written locally first
- **PWA:** vite-plugin-pwa with a service worker that caches the app shell and all game/audio/photo assets for full offline use; a visible "Offline" / "Synced" badge in the UI
- **State management:** Zustand (lightweight, no boilerplate)
- **Charts (caregiver dashboard):** Recharts
- **i18n:** i18next + react-i18next, JSON translation files per language
- **Voice:** Web Speech API (`SpeechSynthesisUtterance` for TTS prompts/reminders, `SpeechRecognition` for voice answers where supported) with a graceful fallback to pre-recorded/looping audio prompts and tap-only interaction when speech APIs are unavailable — **never let a missing browser API block the patient**
- **Mock backend / sync target:** a small JSON server (or MSW mock) simulating a `/sync` endpoint, so you can demonstrate "queued while offline → synced when online" without needing real infra
- **Auth:** trivial PIN/QR-based caregiver login only; no patient-facing login (patients should never have to type a password)

## Why this matters (keep this framing in the README and in any pitch materials)

- NER has acute shortages of neurologists and geriatric psychiatrists relative to population, and many elderly patients live in areas with patchy or no broadband — so **offline-first is not a nice-to-have, it's the core constraint**.
- Existing cognitive-training apps assume English/Hindi literacy and steady connectivity, which excludes most elderly users in Assam, Meghalaya, Manipur, Mizoram, Nagaland, Tripura, Arunachal Pradesh, and Sikkim.
- A single repetitive exercise per domain gets monotonous fast for a daily user with dementia, and monotony is a real adherence killer — so each domain gets **2-3 distinct games** that exercise the same underlying skill in a different, culturally-grounded way.
- Digital cognitive training has real but *modest and domain-specific* evidence: randomized trials of serious-game cognitive training in MCI/early dementia show measurable gains in specific domains like attention (not a cure, not guaranteed to slow disease progression across the board). Do not oversell this in copy — say "supports cognitive engagement and enables longitudinal monitoring," not "reverses dementia" or "clinically proven treatment."

## Clinical grounding — map every game to a real assessment domain

Don't invent domains. Base every game on the four domains named in the problem statement, plus one bonus domain (orientation) that MoCA also screens for and that is unusually well-suited to a daily digital check-in. Build **12 core games + 2 bonus-domain games = 14 total**, so each domain has enough variety that a week of daily play doesn't feel repetitive.

### Domain 1 — Memory improvement
*MoCA: delayed recall · ADAS-Cog: word recall & recognition*

| Game | Mechanic |
|---|---|
| **Smriti Cards** | Culturally-themed picture-pair memory match (tea leaves, bamboo baskets, festivals, regional animals) |
| **Smriti Katha** ("memory story") | Patient listens to (or reads, large-text) a short 3-5 sentence everyday story in a familiar setting, then answers 2-4 simple recall questions read aloud with picture-choice answers — tests episodic/verbal recall, not just visual matching |
| **Naam Yaad** ("remember the name") | Caregiver pre-loads family photos + names + relationship + an optional voice note; the game shows a photo and the patient picks the correct name/relation from large-tile options — the single most personally meaningful game in the set, and a genuine differentiator vs. generic memory apps |

### Domain 2 — Attention & concentration
*MoCA: attention/vigilance, digit span, serial subtraction · ADAS-Cog: number cancellation*

| Game | Mechanic |
|---|---|
| **Dhyan Dhaam** | Tap-the-target cancellation task (e.g., "tap every gamosa/mekhela pattern that matches") with controlled distractor density |
| **Ginti Dhyan** ("counting focus") | Simplified serial-counting task — count up/down by 1s or 2s through a sequence of tappable numbered tiles shown out of order; mirrors MoCA's serial-7 subtraction at an elderly-accessible difficulty |
| **Awaaz Pehchan** ("recognize the sound") | Purely audio-driven: a sequence of spoken words/sounds plays, patient taps a button only when the pre-announced target word/sound occurs — sustained auditory attention, and valuable for patients with limited reading ability |

### Domain 3 — Daily routine recall
*Grounded in instrumental activities of daily living (IADL) assessment practice*

| Game | Mechanic |
|---|---|
| **Dinacharya Sequence** | Drag daily-routine picture cards (wake, brush, breakfast, medicine, etc.) into correct order; doubles as reminder-priming |
| **Bazaar List** ("market list") | A short shopping/errand list is read aloud and shown briefly (e.g., "rice, soap, medicine"), then the patient must pick those exact items out of a larger grid of grocery/household icons — trains prospective memory & IADL planning |
| **Ghar ka Kaam** ("housework") | Match a household tool/action to the task it belongs to (broom → sweeping, kettle → tea) — reinforces routine-object associations that often erode early in dementia |

### Domain 4 — Pattern & object recognition
*MoCA: visuospatial/executive (clock draw, trail-making analogue) · ADAS-Cog: constructional praxis*

| Game | Mechanic |
|---|---|
| **Aakar Milan** | Pattern completion / odd-one-out using regional motifs (Naga shawl patterns, Assamese jaapi weave, Mizo puan patterns) |
| **Chaya Khoj** ("shadow search") | Match an everyday object to its correct silhouette/shadow among 3-4 similar-looking distractor shadows — pure visuospatial matching, no reading required at all |
| **Naksha Jodo** ("map/shape join") | Simple large-piece jigsaw / tangram-style assembly of a regional icon (a bamboo hut, a boat, a mountain outline) — a gentler, self-paced analogue of the clinical clock-drawing/figure-copy task |

### Domain 5 — Temporal & spatial orientation *(bonus domain, beyond the problem statement's four — flag this honestly as an added-value stretch goal, not a required deliverable)*
*MoCA: orientation subtest*

| Game | Mechanic |
|---|---|
| **Aaj Ka Din** ("today's day") | A once-daily gentle check-in: "What day is it? What season? Where are you right now?" with large picture/word options (not open text entry) — one of the simplest, most clinically direct exercises to build, and pairs naturally with the morning reminder flow |
| **Ghadi Dekho** ("look at the clock") | Read an analog clock face and tap the matching digital time from multiple choices — a close analogue of the Clock Drawing Test, one of the most widely used dementia-screening tasks. Unlike Aaj Ka Din it uses the adaptive engine, so the orientation domain has one leveled, repeatable game. |

Each game must log a **per-session score, response latency, and error type** to the local DB — these three numbers are what the adaptive-difficulty engine and the caregiver dashboard both consume. Every game screen carries an "About this game" info icon stating its clinical mapping from the tables above — your answer to the inevitable "is this clinically valid" question.

**Explicit non-claim to bake into the UI copy and README:** this app is a cognitive *engagement and monitoring* tool, not a diagnostic or FDA/CDSCO-cleared medical device. Recommend consultation with a geriatric psychiatrist/neurologist for actual diagnosis — add this as a persistent, non-intrusive footer line in caregiver mode.

## Adaptive difficulty algorithm (implement for real, not just a stub)

Implement a simple, explainable **staircase adaptive algorithm**, per game, with **10 discrete difficulty levels** (not 4 — enough resolution that progress feels gradual and visible rather than a couple of big jumps):

1. Track a rolling window of the last **N = 5** attempts at the current level, per game.
2. Rule: if accuracy ≥ 80% and median response time is trending down over the window → level up (max level 10). If accuracy < 40% over the window, or 2 consecutive sessions show rising error rate → level down (min level 1). Otherwise hold.
3. Store every level-change event with a timestamp and reason string ("leveled up: 4/5 correct, avg 3.2s") — surfaced in the caregiver dashboard's "Adaptive engine log" so the AI/ML claim is auditable, not a black box.
4. On reaching level 6+ in a game, show the patient a small, non-competitive "getting stronger at this!" acknowledgment — a private personal-best moment, never a leaderboard or score comparison against other patients.
5. Leave a clearly marked extension point (`/src/engine/adaptiveEngine.ts`) with a comment showing where a real ML model (e.g., a small logistic-regression or Bayesian knowledge-tracing model trained on aggregated, anonymized session data across the deployed base) would plug in later.

### Level-parameter tables (implement close to these; tune numbers as needed for playtesting)

**Smriti Cards** (pairs shown):
`L1=3 · L2=4 · L3=5 · L4=6 · L5=8 · L6=9 · L7=10 · L8=12 · L9=14 · L10=16`

**Smriti Katha** (story length in sentences / recall questions asked):
`L1=2/1 · L2=2/2 · L3=3/2 · L4=3/3 · L5=4/3 · L6=4/4 · L7=5/4 · L8=5/5 · L9=6/5 · L10=6/6`

**Naam Yaad** (family members shown per round / answer options per question):
`L1=2/2 · L2=3/2 · L3=3/3 · L4=4/3 · L5=4/4 · L6=5/4 · L7=5/5 · L8=6/5 · L9=6/6 · L10=7/6`

**Dhyan Dhaam** (grid size / distractor density %):
`L1=10/20 · L2=12/25 · L3=16/30 · L4=20/35 · L5=24/40 · L6=28/45 · L7=32/50 · L8=36/55 · L9=40/60 · L10=44/65`

**Ginti Dhyan** (sequence length / step size):
`L1=5,by1 · L2=6,by1 · L3=7,by1 · L4=8,by1 · L5=8,by2 · L6=10,by2 · L7=12,by2 · L8=12,by3 · L9=14,by3 · L10=15,by4`

**Awaaz Pehchan** (sequence length / target frequency %):
`L1=8/40 · L2=10/35 · L3=12/30 · L4=14/28 · L5=16/25 · L6=18/22 · L7=20/20 · L8=24/18 · L9=26/16 · L10=28/15`

**Dinacharya Sequence** (cards to order):
`L1=3 · L2=4 · L3=5 · L4=6 · L5=7 · L6=8 · L7=9 · L8=10 · L9=11 · L10=12`

**Bazaar List** (list length / grid size):
`L1=2/8 · L2=3/8 · L3=3/12 · L4=4/12 · L5=4/16 · L6=5/16 · L7=5/20 · L8=6/20 · L9=7/24 · L10=8/24`

**Ghar ka Kaam** (pairs to match / distractor tools):
`L1=3/1 · L2=3/2 · L3=4/2 · L4=4/3 · L5=5/3 · L6=5/4 · L7=6/4 · L8=6/5 · L9=7/5 · L10=7/6`

**Aakar Milan** (pattern grid size / option count):
`L1=2x2/3 · L2=2x2/4 · L3=3x3/3 · L4=3x3/4 · L5=3x3/5 · L6=4x4/4 · L7=4x4/5 · L8=4x4/6 · L9=5x5/6 · L10=5x5/6`

**Chaya Khoj** (distractor shadows shown):
`L1=2 · L2=2 · L3=3 · L4=3 · L5=4 · L6=4 · L7=5 · L8=5 · L9=6 · L10=6`

**Naksha Jodo** (pieces in the assembly):
`L1=4 · L2=6 · L3=8 · L4=10 · L5=12 · L6=15 · L7=18 · L8=21 · L9=24 · L10=28`

**Ghadi Dekho** (time granularity in minutes / answer options / decoy spread in minutes — granularity never goes below 5, since the face draws hour ticks only and finer differences test eyesight, not cognition):
`L1=60/3/180 · L2=60/3/120 · L3=30/3/90 · L4=30/4/60 · L5=15/4/45 · L6=15/4/30 · L7=5/5/20 · L8=5/5/15 · L9=5/5/10 · L10=5/6/15`

**Aaj Ka Din** (questions per check-in / options per question — this game intentionally stays low-difficulty-range since it's a daily orientation check, not a challenge exercise):
`L1-L10 constant: 3 questions / 3 options` — this game does not use the staircase algorithm; log correct/incorrect only, no level changes.

## Session composition — avoid daily monotony

- On opening Patient Mode, show a **"Today's Set"** of 3 games — one drawn from each of 3 different domains, rotated day-to-day (simple round-robin over the last-played timestamp per game is enough logic) — plus free access to every unlocked game underneath for anyone who wants to play more or repeat a favorite.
- **Aaj Ka Din** (orientation) always appears once per day at the top of Today's Set if not yet completed today, since it's meant as a daily check-in, not a repeatable drill.
- Never force a game the patient hasn't unlocked yet — new games start at Level 1 the first time they're opened; a game unlocks by simply being tapped, no artificial gating.

## Multilingual & voice support

- Ship complete UI translations for: **English, Hindi, Assamese**. Add **stub/partial** translation files (a handful of key strings + game instructions) for **Manipuri (Meitei Mayek or Bengali script — pick one and state your choice), Khasi, Mizo, and Nagamese**, with a comment that full translation requires native-speaker review before production — do not machine-translate an entire language and present it as complete.
- Every screen's instructions must have a speaker-icon button that reads the instruction aloud via TTS in the selected language (fall back to English audio if TTS voice unavailable for that language — flag this limitation honestly in your pitch).
- Language selection happens once, at caregiver setup, via large flag/script buttons — never a small dropdown.
- **Smriti Katha**, **Awaaz Pehchan**, and **Aaj Ka Din** are voice-first by design (built for patients who can't or don't want to read) — make sure these three work end-to-end with audio alone, tap-only responses, and zero required reading, as your strongest accessibility talking point.

## Elderly-first accessibility (this is a hard requirement, not polish)

- Minimum body font size **18px**, primary actions **22-24px**, with a caregiver-toggleable "extra large" mode going up to 28px.
- Minimum tap target **64x64px**, spaced at least 16px apart.
- High-contrast theme by default (WCAG AAA where feasible — 7:1 contrast for text); provide a caregiver toggle for a second high-contrast palette for common colour-vision changes in elderly users.
- **No swipe gestures, no double-tap, no drag-and-drop with a timeout, no auto-advancing carousels.** Use single large taps everywhere except the two deliberate exceptions (Dinacharya Sequence and Naksha Jodo, both drag-based), and for those make drag forgiving (large drop zones, no time pressure, undo always available).
- No hard timers that fail the patient — use gentle pacing indicators, never a countdown that ends the game.
- One task/screen at a time; no nested menus deeper than 2 levels; a single, always-visible "home" button.
- Session length nudges: after ~10-12 minutes (roughly 3-4 games), show a friendly "take a break?" prompt — cognitive fatigue in dementia patients is real and should be designed for, not treated as an engagement metric to maximize.

## Reminders module (memory-assistance side, separate from the games)

Implement local, offline notification-style reminders (Notifications API where granted, plus an in-app "Today" card as the reliable fallback since background notifications on installed PWAs are inconsistent on budget Android tablets) for the four categories named in the problem statement:
- Medicines (with a "mark as taken" large button, logged with timestamp)
- Hydration (simple periodic nudge)
- Daily activities (tied into the Dinacharya Sequence and Bazaar List game content so features reinforce each other)
- Medical appointments (caregiver-entered, with a family-photo + voice-note reminder: "Dr. Sharma, Tuesday 10am")

All reminders are caregiver-configured (patients never author their own reminders) and stored locally; queue any that need eventual family/clinician notification for sync when connectivity returns.

## Caregiver dashboard

- PIN or QR-code caregiver login (separate from patient's single-tap entry into game mode).
- Per-domain score trend lines (5 lines now, one per cognitive domain including the bonus orientation domain) over the last 30/90 days — Recharts line chart.
- A **domain-balance view** (simple radar/bar chart) showing how evenly the patient is playing across all 5 domains, so a caregiver can notice "they've only ever played memory games" and nudge variety.
- Adaptive-engine log (see above) so level changes are explainable, not opaque.
- Family-member manager for **Naam Yaad**: add/edit photos, names, relationships, optional voice notes — this is caregiver-authored data, never patient-entered.
- Medicine/hydration/activity adherence — simple bar chart + streak counter.
- A plain-language weekly summary sentence auto-generated from the data (e.g., "Attention scores improved this week; medicine adherence dropped on 2 days") — template-based, not an LLM call, so it works fully offline.
- Export button: generate a PDF/CSV summary a caregiver could bring to a doctor's visit.
- An honest "what this dashboard is and isn't" note: trend data for conversation with a clinician, not a diagnosis.

## Offline-first architecture — implement and demo this explicitly

- All reads/writes go to Dexie (IndexedDB) first; nothing blocks on network.
- A background sync queue (`/src/sync/queue.ts`) batches unsynced session/reminder records and pushes them to the mock `/sync` endpoint when `navigator.onLine` is true, with retry/backoff.
- Build a visible, demoable "Airplane mode" toggle in a debug/demo panel so you can show judges: play a game offline → scores save locally → toggle "online" → watch the sync badge flip to "Synced" and a mock request fire.
- Cache all game assets (images, audio, family photos) in the service worker precache list — verify the app is fully playable with devtools "Offline" checked, not just theoretically offline.

## Data model (Dexie schema — implement close to this)

```
patients: id, name, preferredLanguage, dateOfBirth?, photoUrl, caregiverIds[]
familyMembers: id, patientId, name, relation, photoUrl, voiceNoteUrl   -- for Naam Yaad
sessions: id, patientId, gameId, domain, level, score, accuracy, avgResponseMs, startedAt, endedAt, synced(bool)
levelChanges: id, patientId, gameId, fromLevel, toLevel, reason, timestamp
reminders: id, patientId, category(medicine|hydration|activity|appointment), label, schedule, lastAcknowledgedAt
caregivers: id, name, relation, pinHash, patientIds[]
```

`gameId` enum: `smriti-cards | smriti-katha | naam-yaad | dhyan-dhaam | ginti-dhyan | awaaz-pehchan | dinacharya-sequence | bazaar-list | ghar-ka-kaam | aakar-milan | chaya-khoj | naksha-jodo | aaj-ka-din`

## Repo structure

```
smriti-setu/
  src/
    app/                # routing, layout, PatientHome, CaregiverHome, TodaysSet
    games/
      smriti-cards/
      smriti-katha/
      naam-yaad/
      dhyan-dhaam/
      ginti-dhyan/
      awaaz-pehchan/
      dinacharya-sequence/
      bazaar-list/
      ghar-ka-kaam/
      aakar-milan/
      chaya-khoj/
      naksha-jodo/
      aaj-ka-din/
    engine/adaptiveEngine.ts
    engine/sessionComposer.ts   # "Today's Set" rotation logic
    sync/queue.ts
    db/schema.ts (Dexie)
    i18n/{en,hi,as,...}.json
    components/          # large-tap-target Button, VoicePrompt, ElderlyCard, etc.
    dashboard/           # caregiver charts, domain-balance view, adherence, log view, family-member manager
  public/audio/          # pre-recorded prompt fallbacks
  public/images/silhouettes/   # for Chaya Khoj
  README.md              # problem statement, architecture diagram (mermaid), clinical grounding table, known limitations, roadmap
```

## Non-functional requirements

- Must run smoothly on a low/mid-range Android tablet (assume 2GB RAM, older Chrome/WebView) — avoid heavy animation libraries; keep bundle size lean; lazy-load each game independently (14 games means lazy-loading matters even more than before).
- Every user-facing string goes through i18n — no hardcoded English in components.
- Write basic unit tests for `adaptiveEngine.ts` (the level-up/level-down rules across the 10-level range) and for `sessionComposer.ts` (the daily rotation logic) — these are the two pieces judges are most likely to probe with "what if" questions.

## What to build first (order of operations)

1. Scaffold the Vite+React+TS+Tailwind app, Dexie schema, i18n setup, and the shared "elderly" component kit (Button, Card, VoicePrompt) — get the accessibility baseline right before any game logic.
2. Build **Smriti Cards** end-to-end (game → session logging → 10-level adaptive engine → dashboard line for that one domain) as the vertical slice that proves the whole architecture.
3. Build one more game per domain (Dhyan Dhaam, Dinacharya Sequence, Aakar Milan, Aaj Ka Din) reusing the same session/adaptive/dashboard plumbing — this gets you full 5-domain coverage fastest.
4. Build the remaining games (Smriti Katha, Naam Yaad, Ginti Dhyan, Awaaz Pehchan, Bazaar List, Ghar ka Kaam, Chaya Khoj, Naksha Jodo) — these round out variety but matter less than having all 5 domains covered if time is short.
5. Build the reminders module, the family-member manager, and the caregiver dashboard (including the domain-balance view).
6. Build the "Today's Set" session composer.
7. Wire up the offline/sync demo panel.
8. Write the README with the architecture diagram, full clinical grounding table (all 14 games), known limitations, and roadmap — judges trust teams more when they name their own gaps first.

If you're short on hackathon time, steps 1-3 alone (5 games, one per domain, full plumbing) already satisfy every bullet in the official problem statement — treat steps 4 onward as the "we built more than asked" differentiator, not a blocker to a working demo.

## Trust & compliance — the "don't get caught with nothing to say" checklist

Judges and any real deployment partner (a district health centre, an NGO) will ask what happens to a patient's and caregiver's data. Build these in from the start — they are cheap now and expensive to retrofit:

- **A real Privacy Policy screen** (caregiver mode) stating in plain language: what's stored (sessions, family photos, reminders), that it's local-first, what syncs and when, and that it's never sold or shared outside the care circle. Not a lorem-ipsum placeholder — write the actual policy for what the app actually does.
- **A short Terms of Use screen** covering the non-diagnostic disclaimer (already required elsewhere in this spec) plus who's responsible for the account (the caregiver, not the patient).
- **Data export & delete, caregiver-facing**: a "Download my data" (JSON/CSV) button and a "Delete this patient's data" button that actually wipes Dexie + the sync queue. This is the single highest-value item on this list — an elderly-care app with no delete option is a real red flag, not just a legal one.
- **No dark patterns anywhere**: the data-delete button must be as easy to find as any "add" or "start game" button — never buried in a submenu or gated behind a support request. If a subscription, paid tier, or account-cancellation flow is ever added post-hackathon, its cancel path must be equally one-tap-findable, not a "contact us to cancel" dead end.
- **An explicit unsubscribe/opt-out control** for every notification-style touchpoint that exists today — reminders and any future caregiver email/SMS digest — a single toggle per category in the "Privacy & Data" menu, not a support-ticket process.
- **Age check — deliberately not applicable, state this rather than silently skip it**: SmritiSetu's account holder is always the adult caregiver (patients never self-register), so there's no under-13/COPPA-style signup flow to gate. Note this explicitly in the Privacy Policy screen ("this app is not intended for use by children; accounts are created and managed by an adult caregiver") so the question is answered rather than left open.
- **Cookies Policy — reframed for what this app actually does**: SmritiSetu is a local-storage/IndexedDB PWA, not a cookie-based or ad-tracking site, so a traditional cookies policy doesn't apply as written. Cover the equivalent ground instead, in the same Privacy Policy screen: what's stored on-device (IndexedDB via Dexie), that there are no third-party trackers or analytics cookies, and exactly what leaves the device on sync (see the offline-sync section above). This is the honest, accurate version of what a "cookies policy" is trying to disclose, and it's a stronger answer to a judge than a boilerplate cookie banner bolted onto an app that doesn't use cookies.
- **Consent, not assumption**: the family-member manager (Naam Yaad) and any future cloud sync should have an explicit one-time consent toggle in caregiver setup ("I consent to storing family photos on this device / syncing anonymised session data"), not silent collection.
- Surface all of the above from one "Privacy & Data" menu item in caregiver mode — a single findable place beats scattering it across screens.

None of this needs its own slide in the pitch deck, but have the Privacy Policy and delete-data button actually working in the demo — it's a fast, concrete answer if a judge asks about data handling, and most competing teams won't have one.

## Animated, polished UI — a Claymorphic gaming design system

The visual direction is **Claymorphism**: soft, puffy "clay pillow" surfaces with a consistent dual-light-source shadow (light from top-left, shadow to bottom-right) that make every element look physically pressable — a genuine accessibility win here, not just a style choice, since it helps a patient with cognitive decline recognize "this is a button" without reading. It's also a deliberately less-common choice than glassmorphism/neumorphism/flat-material, which is why it reads as modern rather than templated. A live reference mockup implementing this on the patient home screen and the Smriti Cards game is at: https://claude.ai/artifact/5MveEBwQU62H33Ud5pzpjw — match its look and feel.

**Token system**
```
Background:      #EAF3EF (light)   /   #12201C (dark)
Clay surface:     #F4FAF7 (light)   /   #1B2E28 (dark)
Ink (text):       #1D3B35 (light)   /   #EAF3EF (dark)
Muted ink:        #7C948C

Domain clay tints (one per game domain — used consistently so patients can
navigate by color/shape, not just reading):
  Memory      — Teal   #3FA88C
  Attention   — Amber  #F0A64E
  Routine     — Sage   #7FAE63
  Pattern     — Coral  #E8735A
  Orientation — Lavender #8E8FD8
```

**The clay shadow recipe** (use exactly this pattern on every raised surface — cards, tiles, buttons, chips):
```css
box-shadow:
  8px 8px 18px rgba(30, 60, 52, 0.22),   /* dark shadow, bottom-right */
  -7px -7px 16px rgba(255, 255, 255, 0.9); /* light highlight, top-left */
border-radius: 24px; /* 32px for large tiles, 16px for small chips */
```

**Pressed state** (on `:active` / tap-down — this is the interaction that sells the whole aesthetic):
```css
box-shadow:
  inset 6px 6px 12px rgba(30, 60, 52, 0.25),
  inset -6px -6px 12px rgba(255, 255, 255, 0.6);
transform: scale(0.96);
```

**Typography:** display/headings in a rounded, chunky display face (Baloo 2), body and buttons in a rounded, warm sans (Nunito) — both legible at the 18-24px+ sizes the accessibility spec requires, and both reinforce the "soft clay" personality instead of a generic system sans.

**Principles**
- One consistent light source app-wide — never mix shadow directions on different cards on the same screen.
- Color-code every game tile by its domain tint (table above) so the app is navigable by shape/color alone, reinforcing the accessibility goal, not just decorating it.
- Motion is the reward layer, layered on top of these clay surfaces exactly as specified below (level-up pop, correct-match glow, animated sync badge, etc.) — the clay press-feedback and the motion spec work together, not as two separate systems.
- Reuse the general motion timing/easing rules below (200-250ms transitions, no forced-duration blocking animations) — Claymorphism changes what things look like, not the accessibility or pacing rules already specified elsewhere in this document.

"Working" and "looks professional" are different bars — the second one is mostly about motion. The Claymorphism above defines the *surfaces*; this defines how they *move*. It must never conflict with the elderly-first accessibility rules (no motion that adds cognitive load, delay, or risk of missed information for the patient).

**Motion principles**
- Motion communicates state changes (level up, correct match, sync complete) — it is feedback, never decoration for its own sake.
- Every animation has a purpose and an exit: nothing loops forever, nothing blocks input, nothing is required to sit through before the next tap works.
- Patient-mode motion is calm and reassuring (soft eases, no bounce-heavy or jittery effects that could disorient someone with cognitive decline). Caregiver-mode motion can be snappier/more "dashboard-like."

**Concrete spec to implement (Framer Motion for React, or CSS transitions if keeping it lighter)**
- **Screen transitions:** 200-250ms cross-fade + slight slide (12-16px), same direction logic every time (forward = slide left, back = slide right) so the elderly user builds a spatial mental model of the app.
- **Card/tile taps:** 100ms scale-down (0.97) on press, spring back on release — the same tactile pattern on every tappable element (games grid, reminder rows, dashboard cards) for consistency.
- **Correct/incorrect feedback in games:** a soft green glow + checkmark scale-in for correct (400ms), a gentle amber shake (not red/alarming) for incorrect — never a harsh flash or sound.
- **Level-up moment:** a brief (900ms–1.2s), skippable-by-next-tap celebration — subtle confetti or a badge scale-in with the "getting stronger at this!" text — then auto-dismiss. Never blocks the next action longer than that.
- **Adaptive-engine log / dashboard charts:** animate chart lines drawing in on first load (600-800ms ease-out) and bar/radar values growing from 0 — makes the caregiver dashboard feel alive instead of a static report.
- **Offline/sync badge:** an animated pulsing dot while "queued," morphing to a checkmark on "synced" — this is your single best 3-second proof of the offline-first claim in a demo video, make it visually satisfying.
- **Loading/empty states:** skeleton-screen shimmer (not spinners) while Dexie reads — feels faster and more modern, and never leaves a blank white flash between screens.
- **Micro-details that read as "polished":** consistent 12-16px corner radius across all cards, soft layered shadows (not flat), a single consistent icon set (already specified via the shared component kit), and a limited, deliberate color palette per the accessibility section — polish comes from consistency far more than from any single flashy effect.

**Explicitly avoid:** auto-playing carousels, parallax scrolling, infinite marquees, more than one attention-grabbing animation on screen at once, and anything with a fixed duration longer than ~1.2s that the patient can't skip by simply tapping. These break the "no timer, no forced pacing" accessibility rule elsewhere in this spec.

If your team has a specific reference design (a Dribbble shot, a competitor app, a Figma file) you want SmritiSetu's look matched to more closely, share the link or screenshots and this section can be made more specific to it — the above is a solid, safe default in the absence of one.

Ask me clarifying questions only if something above is genuinely ambiguous or contradictory. Otherwise, start scaffolding.
