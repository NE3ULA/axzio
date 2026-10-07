import { useCallback, useEffect, useRef, useState } from "react";
import { useAxzio } from "./store.jsx";
import { useCloud } from "./cloud.jsx";
import { AuthForm } from "./components/AccountControl.jsx";
import { Card, MicroLabel } from "./components/ui.jsx";
import Starfield from "./components/Starfield.jsx";
import Boot from "./views/Boot.jsx";
import Onboarding from "./views/Onboarding.jsx";
import SupabaseSetup from "./components/SupabaseSetup.jsx";
import AccountControl from "./components/AccountControl.jsx";
import Bridge from "./views/Bridge.jsx";
import Constellation from "./views/Constellation.jsx";
import Galaxy from "./views/Galaxy.jsx";
import Universe from "./views/Universe.jsx";
import Identity from "./views/Identity.jsx";
import Practices from "./views/Practices.jsx";
import Atlas from "./views/Atlas.jsx";
import Modes from "./views/Modes.jsx";

import Tribe from "./views/Tribe.jsx";
import Focus from "./views/Focus.jsx";


/* Hash-based routing — no react-router, works from static files.
   Four main tabs (Bridge · Nebula · Core · Focus); everything else lives
   in the Atlas drawer — the whiteboard for modules that are still being
   placed. Practices (Reset, Growth, rituals) live under the hood, opened
   contextually or from the drawer. */
/* Tab order follows the day: wake → Bridge (snapshot) → Focus (the
   day's work) → Nebula (capture and grow, later) → Core (the authored
   identity — most important, reviewed least). */
const ROUTES = [
  { key: "bridge", label: "Bridge", view: Bridge, main: true },
  { key: "focus", label: "Focus", view: Focus, main: true },
  { key: "nebula", label: "Nebula", view: Constellation, main: true },
  { key: "core", label: "Core", view: Identity, main: true },
  { key: "atlas", label: "Atlas", view: Atlas },
  { key: "galaxy", label: "Galaxy", view: Galaxy },
  { key: "universe", label: "Universe", view: Universe },
  { key: "practice", label: "Practice", view: Practices },
  { key: "modes", label: "Modes", view: Modes },
  { key: "tribe", label: "Tribe", view: Tribe },
];
const MAIN_ROUTES = ROUTES.filter((r) => r.main);
/* Legacy hashes from before the rename. */
const LEGACY_ROUTES = {
  deck: "bridge",
  constellation: "nebula",
  identity: "core",
  journeys: "practice",
  "identity-map": "nebula",
};

function routeFromHash() {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (ROUTES.some((r) => r.key === h)) return h;
  return LEGACY_ROUTES[h] || "bridge";
}

/* Full-page login gate: when cloud sync is configured but no session
   exists, the app's pages stay behind this screen until sign-in. Signing
   out now feels like locking the app — and no one can poke at (or create
   data in) an unsigned-in copy. Local-only users (sync never configured)
   are unaffected. */
function LoginGate() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Starfield />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-16">
        <MicroLabel className="mb-3">Command Deck</MicroLabel>
        <h1 className="text-4xl font-light tracking-wide">AXZIO</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/50">
          Sign in to enter your deck.
        </p>
        <Card className="mt-8 w-full p-7">
          <AuthForm onAuthenticated={() => {}} />
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  const axzio = useAxzio();
  const { state } = axzio;
  const { configured, user, authReady } = useCloud();
  const [phase, setPhase] = useState("boot"); // boot | main
  const [route, setRoute] = useState(routeFromHash());

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const bootDone = useCallback(() => {
    setPhase("main");
  }, []);

  const onboardingDone = useCallback(() => {
    window.location.hash = "#/bridge";
    // The walkthrough is a fixed overlay: the window keeps its scroll
    // position underneath, so without this the Deck would land mid-page
    // (e.g. down at Capture) after a replay.
    window.scrollTo(0, 0);
  }, []);

  if (phase === "boot") {
    return (
      <div className="h-full bg-black text-white">
        <Starfield count={90} />
        <Boot onDone={bootDone} />
      </div>
    );
  }

  // Signed-out gate: with sync configured, the pages stay locked behind
  // sign-in. While the session check is still in flight, hold a blank
  // screen rather than flashing the gate (or the app).
  if (configured && !authReady) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Starfield />
      </div>
    );
  }
  if (configured && authReady && !user) {
    return <LoginGate />;
  }

  // First-use walkthrough: rendered as a dismissible popup over the Deck
  // (not a page takeover) once the boot splash clears. Existing users
  // (old setupComplete) were migrated to onboarded=true. Replaying the
  // walkthrough from Identity re-opens the popup.
  const showIntro = !state.identity.onboarded;

  const Active = ROUTES.find((r) => r.key === route)?.view ?? Deck;

  return (
    <div className="min-h-full bg-black text-white">
      <Starfield />
      <TopNav route={route} name={state.identity.name} />
      <main
        key={route}
        className="relative z-10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Active />
      </main>
      {showIntro && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="First-use walkthrough"
        >
          <Onboarding onComplete={onboardingDone} />
        </div>
      )}
      <SupabaseSetup />
    </div>
  );
}

function TopNav({ route, name }) {
  const go = (key) => {
    window.location.hash = `#/${key}`;
  };
  // The Atlas drawer: the whiteboard. Practices, index tables, and the
  // modules still being placed — one tap away on every screen size.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef(null);
  const closeDrawer = () => setDrawerOpen(false);

  useEffect(() => {
    closeDrawer();
  }, [route]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeDrawer();
    };
    const onPointer = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        closeDrawer();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [drawerOpen]);

  const drawerLink = (hash, label, sub) => (
    <button
      key={hash}
      onClick={() => {
        window.location.hash = hash;
        closeDrawer();
      }}
      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
    >
      <span className="text-[13px] uppercase tracking-[0.2em] text-white/70">
        {label}
      </span>
      {sub && (
        <span className="text-[11px] tracking-wide text-white/30">{sub}</span>
      )}
    </button>
  );

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3.5 sm:gap-3 sm:px-5">
        <button
          onClick={() => go("bridge")}
          className="flex shrink-0 items-center gap-3"
          aria-label="AXZIO home"
        >
          <svg width="22" height="22" viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <line x1="8" y1="36" x2="64" y2="36" stroke="white" strokeWidth="3" opacity="0.9" />
            <line x1="36" y1="8" x2="36" y2="64" stroke="white" strokeWidth="3" opacity="0.9" />
            <circle cx="36" cy="36" r="8" fill="white" />
          </svg>
          <span className="hidden text-sm font-medium uppercase tracking-[0.42em] sm:inline">
            Axzio
          </span>
        </button>

        {/* Desktop: the four main tabs */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Views">
          {MAIN_ROUTES.map((r) => (
            <button
              key={r.key}
              onClick={() => go(r.key)}
              aria-current={route === r.key ? "page" : undefined}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors md:px-4 ${
                route === r.key
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </nav>

        {/* Mobile: all four main tabs, compact — scrolls internally so it can
            never push the hamburger / settings off-screen on narrow phones */}
        <nav
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden"
          aria-label="Views"
        >
          {MAIN_ROUTES.map((r) => (
            <button
              key={r.key}
              onClick={() => go(r.key)}
              aria-current={route === r.key ? "page" : undefined}
              className={`shrink-0 rounded-lg px-2 py-2 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors ${
                route === r.key
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden max-w-[160px] truncate text-[11px] uppercase tracking-[0.22em] text-white/40 sm:block">
            {name || "Traveler"}
          </span>

          {/* The Atlas drawer — every screen size */}
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? "Close atlas" : "Open atlas"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white"
          >
            {drawerOpen ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            )}
          </button>

          <AccountControl />
        </div>
      </div>

      {/* The Atlas drawer */}
      {drawerOpen && (
        <nav
          className="border-t border-white/10 bg-black/95 px-5 py-4 backdrop-blur-md"
          aria-label="Atlas"
        >
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div>
              <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
                Views
              </p>
              {MAIN_ROUTES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => {
                    go(r.key);
                    closeDrawer();
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                >
                  <span className="text-[13px] uppercase tracking-[0.2em] text-white/70">
                    {r.label}
                  </span>
                  {route === r.key && (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                  )}
                </button>
              ))}
              {drawerLink("#/atlas", "Atlas", "index tables")}
            </div>
            <div>
              <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
                Zoom out
              </p>
              {drawerLink("#/galaxy", "Galaxy", "tribe systems")}
              {drawerLink("#/universe", "Universe", "curated external")}
            </div>
            <div>
              <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
                Practices
              </p>
              {drawerLink("#/practice?passage=reset", "Reset", "clear the fog")}
              {drawerLink("#/practice?passage=growth", "Growth Practice", "design the pursuit")}
              {drawerLink("#/practice?passage=morning", "Morning Alignment", "dawn")}
              {drawerLink("#/practice?passage=evening", "Evening Review", "dusk")}
            </div>
            <div>
              <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
                Index
              </p>
              {drawerLink("#/atlas?section=lifemods", "LifeMods", "designed changes")}
              {drawerLink("#/atlas?section=goals", "Goals", "outcomes")}
              {drawerLink("#/atlas?section=habits", "Habits", "practices")}
              {drawerLink("#/atlas?section=resets", "Past Resets", "action cards")}
            </div>
            <div>
              <p className="mb-2 px-3 text-[10px] uppercase tracking-[0.24em] text-white/35">
                Whiteboard
              </p>
              {drawerLink("#/modes", "Modes", "being placed")}
              {drawerLink("#/tribe", "Tribe", "being placed")}
              {drawerLink("#/atlas?section=launch", "Launch Sequence", "placeholder")}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
