# AXZIO v1 — App Architecture

AXZIO is the application / navigation layer of the NE3ULA ecosystem
(NovaLabsIO). It is the interface where signal becomes structure:
command deck, constellation, identity state, and guided journeys.

Conceptual grounding:

- **WE ARE ALCHEMY (E3 ebook V1, release 2026-08-18)** is now the primary
  vision source: `ne3ula-knowledge/WORKING_DOCS/public-surfaces/e3-ebook/`
  (manuscript + release PDF). App language is drawn from the book:
  the Alchemist Path (Reveal → Interpret → Align → Act → Integrate),
  the Human Battery, the four orientation statements, the Identity Launch
  Sequence, and the Direction lines ("Time is your frame…").
- Identity Core and the Four Primitives come from the E3 human engine
  (`ne3ula-knowledge/WORKING_DOCS/engine/E3/human-engine/identity-stack/`).
  The book confirms the primitives as Money, Engagement, Building, Being —
  distinct from the Four Pillars (Mind, Body, Heart, Spirit), which are
  not scored here.
- The Eisenhower Matrix concept comes from the decision engine
  (`…/decision-engine/eisenhower-matrix/README.md`): a practical
  prioritization lens — not the whole philosophy — most useful combined
  with Identity Core commitments, Mode awareness, friction mapping, and
  the One Thing focus question.
- The four daily anchors are the canonical 4-line mantra
  (`ne3ula-knowledge/WORKING_DOCS/world/4_LINE_MANTRA.md`):
  Be Grateful / See Beauty / Take Action / Give Love.
- The constellation renders the system's conceptual flow:
  CALL/SIGNAL → INITIATION → WORLD → ENGINE → INTERFACE → DOMAINS →
  SYSTEMS → LEGEND.
- Visual language matches `ne3ula-site`: pure black, white type,
  starfield, thin 1px borders, wide-tracked micro labels, no emojis.

## Stack

- Vite 6 + React 18 (plain JavaScript/JSX, no TypeScript)
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- No router — hash-based routing (`#/deck`, `#/constellation`,
  `#/identity`, `#/journeys`), so the built static files work on any host
- No backend — all state in `localStorage` under `axzio-state-v1`

## Folder structure

```
axzio/
├── index.html            # entry HTML
├── package.json          # scripts: dev / build / preview
├── vite.config.js        # react + tailwind plugins
├── src/
│   ├── main.jsx          # React root + provider wiring
│   ├── index.css         # Tailwind import, theme tokens, keyframes
│   ├── App.jsx           # boot → onboarding gate → shell, hash routing, top nav
│   ├── store.jsx         # single state store (context + localStorage)
│   ├── components/
│   │   ├── Starfield.jsx # decorative twinkling starfield background
│   │   ├── ModePicker.jsx# primary/secondary mode picker (shared)
│   │   └── ui.jsx        # Card, MicroLabel, Btn, Field, TextArea, Pill,
│   │                     # SectionHead, Empty, HelpBubble, HelpText…
│   └── views/
│       ├── Boot.jsx          # cinematic entry sequence
│       ├── Onboarding.jsx    # first-use walkthrough + setup sequence (11 steps)
│       ├── Deck.jsx          # command deck: overview dashboard of module cards
│       ├── Focus.jsx         # decision engine home: Eisenhower matrix + One Thing
│       ├── Modes.jsx         # the three Modes of Energy, per day/week/month
│       ├── Constellation.jsx # SVG star map of the 8 stages + user stars
│       ├── Identity.jsx      # Identity Core editor + primitives assessment
│       └── Journeys.jsx      # guided step-through flows + launch sequence locator
├── architecture/         # this doc; app-level architecture notes
├── systems/              # reserved for future system modules
├── assets/               # reserved for app assets
└── docs/                 # implementation docs
```

## View map

| Route             | View          | Purpose                                                      |
| ----------------- | ------------- | ------------------------------------------------------------ |
| (boot)            | Boot          | Cinematic mark + "initializing interface", ~2s               |
| (first run)       | Onboarding    | 11-step walkthrough: welcome → 6 module tour screens → identity (name + 4 orientation statements) → Human Battery baseline → today's modes → first intention. Every step skippable; progress persisted |
| `#/deck`          | Command Deck  | Overview dashboard: Who am I / What's important today / What mode am I in / State / Orientation cards (live summaries, expand inline or route to modules) + intention, action log, signals, stars |
| `#/focus`         | Focus         | Decision Engine home: the two questions, Eisenhower 2×2, One Thing, commitment links. Items are living objects: tap to expand an inline editor (text, quadrant, commitment, notes, subtasks, One Thing); "Explore in Guided Reset" threads a decision into a journey |
| `#/modes`         | Modes         | The three Modes of Energy (Production, Pleasure, People): primary + secondary per Day / Week / Month, with each mode's gift and risk |
| `#/constellation` | Constellation | 8-stage star map, detail readings, orbiting user stars       |
| `#/identity`      | Identity      | Identity Core (4 orientation statements, values, commitments), primitives sliders + radar, walkthrough replay, reset |
| `#/journeys`      | Journeys      | Morning Alignment, Evening Review, Ignite a Star, Guided Reset (phase-labeled) + Identity Launch Sequence locator + past reset Action Cards |

## Onboarding flow

`App.jsx` gates on `state.identity.onboarded` (persisted). The old bare
setup screen is gone; new users walk an 11-step flow in
`views/Onboarding.jsx`:

1. **Welcome** — what AXZIO is ("the interface layer — where signal becomes
   structure").
2. **Module tour** — one screen per module (Deck, Focus, Modes,
   Constellation, Identity, Journeys) with a single-sentence purpose each.
3. **Setup sequence** — display name + the 4 orientation statements;
   Human Battery baseline sliders; today's primary + secondary mode;
   first intention.

Every step is skippable ("Skip for now"; tour screens also offer "Skip the
tour"). Inputs write live into the store and the current step is persisted
(`identity.onboardingStep`), so reloading mid-walkthrough resumes exactly
where the user left off. Completing sets `onboarded` + `setupComplete`.
A "Replay the walkthrough" button in Identity re-opens it for existing
users (their data is kept).

## Command Deck as overview

The Deck is a dashboard, not a scroll of inputs. Each overview card shows a
live summary of its module and offers an inline expansion or a route to the
module:

- **WHO AM I** — becoming-statement + top commitment → `#/identity`
- **WHAT'S IMPORTANT TODAY** — the One Thing + open Q1/Q2 counts → `#/focus`
- **WHAT MODE AM I IN** — today's primary/secondary mode with inline
  quick-switch (shared `ModePicker`) → `#/modes`
- **STATE** — battery most-depleted / most-available; expands inline to the
  sliders
- **ORIENTATION** — the daily mantra (4 toggles); "Take Action" carries an
  "Open in Focus →" link. Future weaving is noted in its help bubble:
  Grateful → gratitude practice, Beauty → attention practice, Give Love →
  people practice (coming); Take Action → Focus (live).

Below the grid: intention field, action log, signal feed, ignite-a-star —
kept, tightened. 2-column grid on desktop, stacked on phone.

## Help bubbles

`HelpBubble` (`components/ui.jsx`) is a small "?" button opening a centered
dialog card: title + WHAT / WHY / HOW (`HelpText`). The dialog auto-sizes
to its content up to `max-h-[calc(100dvh-3rem)]`, then scrolls internally —
so long copy never clips, including on narrow phone viewports. Copy is
grounded in the e-book and decision-engine docs — concrete, no fluff.
Every major section carries one: each Deck card, Focus (matrix + One
Thing), Constellation, Identity (core + primitives), the Journeys header +
launch locator + each journey runner + past resets, each Modes interval
card + the three-mode overview, and every Action Card.

## Focus items as living objects

Matrix items are editable in place: tapping an item expands an inline
editor (text, quadrant, commitment link, notes textarea, subtasks with
add/check-off/delete, One Thing toggle). Edits apply on Save, discard on
Cancel. Collapsed items show a subtle "n subtasks · x/y done" line when
subtasks exist.

**Decision → journey thread** (the first module interconnection): each
expanded item offers "Explore in Guided Reset". It saves pending edits,
sets a transient (never persisted) `resetPrefill` in the store, and routes
to `#/journeys`, where the Guided Reset opens with its Situation
pre-filled from the decision's text (+ notes). Completing the reset stores
`sourceItemId` on it; the Action Card renders a "From decision: <text>"
line linking back to `#/focus`, and the copied card includes it.

**Planned (not built):** SMART goal structuring on items. The schema is
kept extensible for it — notes/subtasks are the first layer; future fields
(e.g. measurable outcomes, deadlines, review dates) can extend the item
shape with the same migration pattern.

## Modes

The three Modes of Energy (WE ARE ALCHEMY, ch. TUNING) — Production,
Pleasure, People — each with what it organizes energy around, its gift,
and its risk. No mode is superior; problems arise when one claims the
whole system. For each interval (Day, Week, Month) the user picks a
PRIMARY and a SECONDARY mode (tapping a selected mode clears it; the newly
set value wins a primary/secondary conflict). The Deck's mode card reads
the Day interval. `state.modes = { day: {primary, secondary}, week: {...},
month: {...} }`; `MODES` / `MODE_INTERVALS` constants live in the store.

## Guided Reset

A fourth journey mirroring the guided practice at
`ne3ula.com/e3-reset/guided`: seven fields — Situation → Reveal →
Interpret → Align → Act → LifeMod → Integrate — each answered in turn.
Completing saves to `state.resets[]` (`{ id, ts, date, situation, reveal,
interpret, align, act, lifemod, integrate }`) and opens an **Action Card**:
the responses laid out cleanly with a copy-to-clipboard button. Past
resets list newest-first under the journey cards; each re-opens its card
(which also offers delete). Private by default — local only, like
everything else; the help bubble says so.

## State model (`axzio-state-v1`)

```js
{
  version: 1,
  identity: {
    name,
    // Four orientation statements (WE ARE ALCHEMY, ch. AUTHORSHIP):
    becoming,       // "I am choosing to become someone who…"
    standFor,       // "I stand for…"
    practice,       // "I practice…"
    returnThrough,  // "When I drift, I return through…"
    values: [], commitments: [],
    setupComplete: bool,
    onboarded: bool,        // first-use walkthrough completed
    onboardingStep: number, // walkthrough resume position
  },
  days: {
    "YYYY-MM-DD": {
      mantra: { gratitude, beauty, action, love },  // booleans
      intention: string,
      battery: { physical, mental, emotional, social, purpose }  // 1–10
    }
  },
  actions:     [{ id, date, ts, text, tag }],       // tag: mantra anchor or primitive
  signals:     [{ id, date, ts, text }],
  stars:       [{ id, name, note, created }],
  assessments: [{ id, date, ts, money, engagement, building, being }],  // 1–10
  focusItems:  [{ id, text, quadrant, commitmentId, oneThing, done,
                 notes, subtasks: [{ id, text, done }], created }],
  launchStage: string | null,  // Identity Launch Sequence stage key
  // Modes of Energy (production | pleasure | people | null):
  modes: {
    day:   { primary, secondary },
    week:  { primary, secondary },
    month: { primary, secondary },
  },
  // Guided Reset completions (private, local only):
  resets: [{ id, ts, date, situation, reveal, interpret, align, act, lifemod,
             integrate, sourceItemId }],  // sourceItemId: Focus item id | null
  // Transient (never persisted): resetPrefill { situation, sourceItemId }
  // set by "Explore in Guided Reset", consumed once by the Journeys view.
}
```

**Migration:** v1 saved states keep working. On load, the old
`identity.authored` / `identity.orientation` fields migrate into the
`becoming` / `standFor` statements (old keys removed), days gain a
default 5/5/5/5/5 battery, and `focusItems` / `launchStage` default to
`[]` / `null`. Focus items with unknown quadrants fall back to Q2.
`identity.onboarded` defaults to the old `setupComplete` value, so
existing users never see the new walkthrough. `modes` and `resets`
default to empty selections / `[]`, with unknown mode keys normalized to
`null` (primary wins a primary/secondary conflict). Older focus items gain
`notes: ""` and `subtasks: []`; older resets gain `sourceItemId: null`.

- One React context (`AxzioProvider` in `src/store.jsx`) owns all
  mutations; every mutation persists the whole state to localStorage.
- Corrupted storage is quarantined to `<key>.corrupt-<timestamp>` and the
  app starts clean instead of crashing.
- Derived data (streak, today's actions, mantra count) is computed from
  state, never stored.

## How to run

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Deliberately left for v2

- **Backend sync** — state is local-only; a sync layer (account,
  multi-device) is stubbed out, not designed.
- **ne3ulaverse quest integration** — the constellation's LEGEND stage and
  journey completions are natural hooks for quest/progression systems;
  no game logic lives here per repo boundaries.
- **Richer constellation** — force-directed layout, zoom/pan, more than
  the 8 canonical stages + user stars.
- **Notifications/reminders** — daily check-in nudges.
- **Data export/import** — JSON backup of `axzio-state-v1`.
