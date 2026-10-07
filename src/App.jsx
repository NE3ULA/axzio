import { useCallback, useEffect, useState } from "react";
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

  return (
    <header
      className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5">
        <button
          onClick={() => go("deck")}
          className="flex items-center gap-3"
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

        <nav className="flex items-center gap-1 overflow-x-auto" aria-label="Views">
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

        <span className="hidden max-w-[160px] truncate text-[11px] uppercase tracking-[0.22em] text-white/40 sm:block">
          {name || "Traveler"}
        </span>
        <AccountControl />
      </div>
    </header>
  );
}
