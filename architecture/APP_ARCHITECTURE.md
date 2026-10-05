# AXZIO v1 — App Architecture

AXZIO is the application / navigation layer of the NE3ULA ecosystem
(NovaLabsIO). It is the interface where signal becomes structure:
command deck, constellation, identity state, and guided journeys.

Conceptual grounding:

- Identity Core and the Four Primitives come from the E3 human engine
  (`ne3ula-knowledge/WORKING_DOCS/engine/E3/human-engine/identity-stack/`).
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
│   ├── App.jsx           # boot → setup → shell, hash routing, top nav
│   ├── store.jsx         # single state store (context + localStorage)
│   ├── components/
│   │   ├── Starfield.jsx # decorative twinkling starfield background
│   │   └── ui.jsx        # Card, MicroLabel, Btn, Field, TextArea, Pill…
│   └── views/
│       ├── Boot.jsx          # cinematic entry sequence
│       ├── Setup.jsx         # first-run identity authoring
│       ├── Deck.jsx          # command deck (daily home)
│       ├── Constellation.jsx # SVG star map of the 8 stages + user stars
│       ├── Identity.jsx      # Identity Core editor + primitives assessment
│       └── Journeys.jsx      # guided step-through flows
├── architecture/         # this doc; app-level architecture notes
├── systems/              # reserved for future system modules
├── assets/               # reserved for app assets
└── docs/                 # implementation docs
```

## View map

| Route             | View          | Purpose                                                      |
| ----------------- | ------------- | ------------------------------------------------------------ |
| (boot)            | Boot          | Cinematic mark + "initializing interface", ~2s               |
| (first run)       | Setup         | Display name + authored identity statement                   |
| `#/deck`          | Command Deck  | Mantra anchors, intention, action log, signals, stats, stars |
| `#/constellation` | Constellation | 8-stage star map, detail readings, orbiting user stars       |
| `#/identity`      | Identity      | Identity Core editor, primitives sliders + radar, reset      |
| `#/journeys`      | Journeys      | Morning Alignment, Evening Review, Ignite a Star             |

## State model (`axzio-state-v1`)

```js
{
  version: 1,
  identity: {
    name, authored, orientation,
    values: [], commitments: [],
    setupComplete: bool
  },
  days: {
    "YYYY-MM-DD": {
      mantra: { gratitude, beauty, action, love },  // booleans
      intention: string
    }
  },
  actions:     [{ id, date, ts, text, tag }],       // tag: mantra anchor or primitive
  signals:     [{ id, date, ts, text }],
  stars:       [{ id, name, note, created }],
  assessments: [{ id, date, ts, money, engagement, building, being }]  // 1–10
}
```

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
