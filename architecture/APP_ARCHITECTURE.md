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
| `#/deck`          | Command Deck  | Overview dashboard: Who am I (top 3 commitments) / What's important today (day 1st/2nd/3rd priorities) / What mode am I in / State / Orientation (4 micro-practices) cards in an OVERVIEW zone; a separate CAPTURE zone below holds intention, action log, signals, stars |
| `#/focus`         | Focus         | Decision Engine home: doing-first voice, per-timeframe 1st/2nd/3rd priorities (1st = the One Thing), capture with commitment/mode/pillar tagging, Eisenhower 2×2 with Day/Week/Month/Year tabs, Q1 emphasized as where focus goes first. Items are living objects: tap to expand an inline editor (text, quadrant, timeframe + repeats, mode/pillar tags, commitment, attach-to nesting, notes, subtasks, priority); "Explore in Guided Reset" threads an action into a journey |
| `#/modes`         | Modes         | The three Modes of Energy (Production, Pleasure, People): primary + secondary per Day / Week / Month, with each mode's gift and risk |
| `#/constellation` | Constellation | 8-stage star map, detail readings, orbiting user stars       |
| `#/identity`      | Identity      | Identity Core (4 orientation statements, values, ordered commitments), Four Pillars (Mind, Body, Heart, Spirit), primitives sliders + radar, walkthrough replay, reset |
| `#/journeys`      | Journeys      | Morning Alignment, Evening Review, Ignite a Star, Guided Reset (phase-labeled) + Identity Launch Sequence locator + past reset Action Cards |

## Onboarding flow

`App.jsx` gates on `state.identity.onboarded` (persisted). The old bare
setup screen is gone; new users walk a 12-step flow in
`views/Onboarding.jsx`:

1. **Welcome** — what AXZIO is ("the interface layer — where signal becomes
   structure").
2. **Module tour** — one screen per module (Deck, Focus, Modes,
   Constellation, Identity, Journeys) with a single-sentence purpose each.
3. **Setup sequence** — display name + the 4 orientation statements;
   Human Battery baseline sliders; today's primary + secondary mode;
   first intention; **"What's important today?"** — capture up to 3 focus
   items (Day timeframe, Q2 default). The step's helper notes that once
   accounts exist it will be able to pull from history; for now it is a
   fresh capture.

Every step is skippable ("Skip for now"; tour screens also offer "Skip the
tour"). Inputs write live into the store and the current step is persisted
(`identity.onboardingStep`), so reloading mid-walkthrough resumes exactly
where the user left off. Completing sets `onboarded` + `setupComplete`.
A "Replay the walkthrough" button in Identity re-opens it for existing
users (their data is kept).

## Command Deck as overview

The Deck reads as **overview up top, capture down below** — two visually
distinct zones separated by a labeled divider:

- **OVERVIEW** — five cards in a grid: Who am I (becoming-statement + top 3
  commitments in priority order) / What's important today (the day's
  1st/2nd/3rd priorities + open Do/Decide counts) / What mode am I in
  (inline quick-switch) / State (battery most-depleted / most-available,
  expandable sliders) / Orientation (the 4 micro-practices, n/4 + entry
  previews).
- **CAPTURE** — its own zone below the divider: intention for the day,
  action log, signal feed, ignite-a-star.

Each overview card shows a live summary of its module and offers an inline
expansion or a route to the module. 2-column grid on desktop, stacked on
phone.

## Orientation as micro-practices

The old 4 mantra toggles are now 4 expandable practice rows on the Deck's
Orientation card, one per anchor:

- **Be Grateful** → "What are you grateful for right now?"
- **See Beauty** → "What beauty did you notice today?"
- **Take Action** → "One action you will take today" (+ "Open in Focus →")
- **Give Love** → "One thing you will do today for someone else"

Entries save per day under `days[date].orientation = { <anchor>:
{ text, done } }`. A row counts as complete when it has text (entering
text auto-marks it); the check can also be set/cleared by hand. The card
shows n/4 with a one-line preview of each entry. The legacy `mantra`
boolean map is kept in sync so the Morning Alignment journey step and the
Constellation's "anchors held" count keep working; old held-anchors
migrate into the new done flags.

## Four Pillars

The Identity view carries a **Four Pillars** section (WE ARE ALCHEMY, ch.
INTEGRATION): Mind (what you understand, believe, and perceive), Body
(what you sense, carry, enact, and physically require), Heart (what you
feel, love, grieve, fear, and need in relationship), Spirit (what gives
experience meaning, direction, connection, or sacred weight). The help
bubble draws the book's distinction: **Pillars read the person;
Primitives read the life** — together the pillars prevent transformation
from collapsing into thought alone. This section grounds the pillar tags
on Focus items.

## Commitment ordering

Commitments on the Identity page are an **ordered list** —
`[{ id, text, order }]`; position IS the priority, numbered 1..n, with
up/down arrows to reorder. New commitments append at the lowest priority;
deleting one re-numbers the rest. Focus items link to commitments **by
id, never by position**, so reordering never breaks their "Serves:" links
(deleting a commitment clears its links). The Deck's "Who Am I" card
reads the top three. Plain-string commitments from older states migrate
to objects with their position preserved as priority.

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
editor (text, quadrant, timeframe + repeats, mode/pillar tags, commitment
link, attach-to nesting, notes, subtasks, priority rank). Edits apply on
Save, discard on Cancel. Collapsed items show tag pills for
timeframe/mode/pillar/priority, an "n subtasks · x/y done" line when
subtasks exist, and a "Serves: <commitment>" pill when linked.

The page's voice is doing-first: capture asks "What needs doing?", the
intro copy emphasizes action over deliberation, and **Q1 (Do — urgent +
important) carries visual primacy** as "where focus goes first". Q2 keeps
its "Decide" name — it is accurate there.

**Decision → journey thread** (the first module interconnection): each
expanded item offers "Explore in Guided Reset". It saves pending edits,
sets a transient (never persisted) `resetPrefill` in the store, and routes
to `#/journeys`, where the Guided Reset opens with its Situation
pre-filled from the action's text (+ notes). Completing the reset stores
`sourceItemId` on it; the Action Card renders a "From decision: <text>"
line linking back to `#/focus`, and the copied card includes it.

### Priorities per timeframe (replaces the single One Thing)

Each item holds `priority: null | 1 | 2 | 3`, **unique within its
timeframe** — setting rank N clears rank N from every other item in the
same timeframe; day/week/month/year each hold independent 1/2/3 sets.
Rank 1 keeps the book's "One Thing" language ("1st — the One Thing").
The top strip shows the three slots for the active timeframe tab with
per-slot clear; the editor offers a None/1st/2nd/3rd selector and each
collapsed row a compact rank control. The Deck's "What's important today"
card lists the day's three priorities. Old `oneThing: true` items migrate
to `priority: 1` in their timeframe.

### Timeframes + tagging (feeds future AI.D effort analysis)

The matrix carries Day | Week | Month | Year tabs filtering items by
`item.timeframe` (default `'day'`); the capture form includes a timeframe
select defaulting to the active tab. Week items take `daysOfWeek` [0–6]
(Mon–Sun multi-select for repeating); month items take `months` [0–11]
(Jan–Dec multi-select). Items are taggable by mode
(`production|pleasure|people`) and pillar (`mind|body|heart|spirit`) —
this tagging exists so effort can be analyzed across dimensions over time
(the future AI.D nudges read these tags). Old items default to timeframe
`'day'`, empty repeat arrays, and null tags.

### Subtask nesting (attach-to)

Beyond the free-text subtasks, any item can be **attached to** another
open item via `parentId`: it leaves the top-level quadrant lists and
renders nested (indented) inside its parent's card. The picker's
candidates exclude the item itself and its descendants (`descendantIds`),
and `updateFocusItem` re-guards against cycles — a refused attach leaves
the item where it was. "Move to top level" detaches; deleting a parent
detaches (not orphans) its children.

### Commitment at capture

The capture form's commitment select lists existing commitments plus an
inline "New commitment…" option that reveals a text input; the
commitment is created on Place and linked by its new id.

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
    values: [],
    // Ordered commitments [{ id, text, order }]; position IS priority
    // (order 0 = highest). Focus items link by commitment id.
    commitments: [],
    setupComplete: bool,
    onboarded: bool,        // first-use walkthrough completed
    onboardingStep: number, // walkthrough resume position
  },
  days: {
    "YYYY-MM-DD": {
      mantra: { gratitude, beauty, action, love },  // booleans (legacy, kept in sync)
      // Orientation micro-practices: one text entry per mantra anchor.
      orientation: {
        gratitude: { text, done }, beauty: { text, done },
        action: { text, done },    love: { text, done },
      },
      intention: string,
      battery: { physical, mental, emotional, social, purpose }  // 1–10
    }
  },
  actions:     [{ id, date, ts, text, tag }],       // tag: mantra anchor or primitive
  signals:     [{ id, date, ts, text }],
  stars:       [{ id, name, note, created }],
  assessments: [{ id, date, ts, money, engagement, building, being }],  // 1–10
  focusItems:  [{ id, text, quadrant, commitmentId, priority, done,
                 notes, subtasks: [{ id, text, done }],
                 // timeframe layer (feeds future AI.D effort analysis):
                 timeframe,            // 'day'|'week'|'month'|'year'
                 daysOfWeek: [0-6], months: [0-11],
                 mode,                 // production|pleasure|people|null
                 pillar,               // mind|body|heart|spirit|null
                 parentId,             // linked-subtask nesting | null
                 created }],
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
Round-3 migrations: days gain `orientation` micro-practice entries (old
held `mantra` booleans migrate into their done flags; the `mantra` map
stays in sync afterwards); focus items gain `timeframe: 'day'`,
`daysOfWeek: []`, `months: []`, `mode: null`, `pillar: null`,
`parentId: null`, and `priority: null` — except old `oneThing: true`
items, which become `priority: 1` in their timeframe; plain-string
commitments migrate to `{ id, text, order }` objects (position preserved
as priority), and focus-item `commitmentId` links holding old text remap
to the new ids (unmatched links drop to null).

- One React context (`AxzioProvider` in `src/store.jsx`) owns all
  mutations; every mutation persists the whole state to localStorage.
- Corrupted storage is quarantined to `<key>.corrupt-<timestamp>` and the
  app starts clean instead of crashing.
- Derived data (streak, today's actions, orientation count) is computed from
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
