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
import Deck from "./views/Deck.jsx";
import Constellation from "./views/Constellation.jsx";
import Identity from "./views/Identity.jsx";
import Journeys from "./views/Journeys.jsx";
import Modes from "./views/Modes.jsx";

import Tribe from "./views/Tribe.jsx";
import Focus from "./views/Focus.jsx";

/* Hash-based routing — no react-router, works from static files. */
const ROUTES = [
  { key: "deck", label: "Deck", view: Deck },
  { key: "focus", label: "Focus", view: Focus },
  { key: "modes", label: "Modes", view: Modes },
  { key: "tribe", label: "Tribe", view: Tribe },
  { key: "constellation", label: "Constellation", view: Constellation },
  { key: "identity", label: "Identity", view: Identity },
  { key: "journeys", label: "Journeys", view: Journeys },
];

function routeFromHash() {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES.some((r) => r.key === h) ? h : "deck";
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
    window.location.hash = "#/deck";
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
  // Mobile menu: the tab strip doesn't fit on a phone, so small screens
  // get a hamburger dropdown; Deck stays pinned on the bar as the
  // priority page. Desktop keeps the full tab strip.
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef(null);
  const closeMenu = () => setMenuOpen(false);

  // Close the dropdown on route change, Escape, or a tap outside it.
  useEffect(() => {
    closeMenu();
  }, [route]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeMenu();
    };
    const onPointer = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        closeMenu();
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
        <button
          onClick={() => go("deck")}
          className="flex shrink-0 items-center gap-3"
          aria-label="AXZIO home"
        >
          <svg width="22" height="22" viewBox="0 0 72 72" fill="none" aria-hidden="true">
            <line x1="8" y1="36" x2="64" y2="36" stroke="white" strokeWidth="3" opacity="0.9" />
            <line x1="36" y1="8" x2="36" y2="64" stroke="white" strokeWidth="3" opacity="0.9" />
            <circle cx="36" cy="36" r="8" fill="white" />
          </svg>
          <span className="text-sm font-medium uppercase tracking-[0.42em]">
            Axzio
          </span>
        </button>

        {/* Desktop: full tab strip */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Views">
          {ROUTES.map((r) => (
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

        {/* Mobile: Deck stays pinned on the bar as the priority page */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => go("deck")}
            aria-current={route === "deck" ? "page" : undefined}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-[11px] font-medium uppercase tracking-[0.2em] transition-colors md:hidden ${
              route === "deck"
                ? "bg-white/10 text-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            Deck
          </button>

          <span className="hidden max-w-[160px] truncate text-[11px] uppercase tracking-[0.22em] text-white/40 sm:block">
            {name || "Traveler"}
          </span>

          {/* Mobile: hamburger, just left of settings */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/70 transition-colors hover:border-white/40 hover:text-white md:hidden"
          >
            {menuOpen ? (
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

      {/* Mobile: hamburger dropdown */}
      {menuOpen && (
        <nav
          className="border-t border-white/10 bg-black/95 px-5 py-2 backdrop-blur-md md:hidden"
          aria-label="Views"
        >
          {ROUTES.map((r) => (
            <button
              key={r.key}
              onClick={() => go(r.key)}
              aria-current={route === r.key ? "page" : undefined}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-[13px] uppercase tracking-[0.2em] transition-colors ${
                route === r.key
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {r.label}
              {route === r.key && (
                <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
              )}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
