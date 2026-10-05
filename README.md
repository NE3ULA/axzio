# AXZIO

Application repository for the AXZIO navigation system.

## Purpose

- develop the app/interface layer
- define user flows and state systems
- build command deck, constellation view, and navigation mode

## Scope

This repo should contain:
- app architecture
- UI logic
- state models
- implementation code

This repo should not contain:
- broad philosophy archive
- website code
- unrelated legacy material

## Running the app

AXZIO v1 is a static single-page app (Vite + React 18 + Tailwind CSS v4).
All state lives in the browser's `localStorage` under `axzio-state-v1` —
no backend, no accounts.

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

Views: boot sequence → first-run identity setup → command deck
(`#/deck`), constellation (`#/constellation`), identity (`#/identity`),
journeys (`#/journeys`). See `architecture/APP_ARCHITECTURE.md` for the
stack, state model, and view map.
