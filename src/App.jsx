import { useCallback, useEffect, useState } from "react";
import { useAxzio } from "./store.jsx";
import Starfield from "./components/Starfield.jsx";
import Boot from "./views/Boot.jsx";
import Setup from "./views/Setup.jsx";
import Deck from "./views/Deck.jsx";
import Constellation from "./views/Constellation.jsx";
import Identity from "./views/Identity.jsx";
import Journeys from "./views/Journeys.jsx";

/* Hash-based routing — no react-router, works from static files. */
const ROUTES = [
  { key: "deck", label: "Deck", view: Deck },
  { key: "constellation", label: "Constellation", view: Constellation },
  { key: "identity", label: "Identity", view: Identity },
  { key: "journeys", label: "Journeys", view: Journeys },
];

function routeFromHash() {
  const h = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES.some((r) => r.key === h) ? h : "deck";
}

export default function App() {
  const { state } = useAxzio();
  const [phase, setPhase] = useState("boot"); // boot | setup | main
  const [route, setRoute] = useState(routeFromHash());

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const bootDone = useCallback(() => {
    setPhase("setup");
  }, []);

  const setupDone = useCallback(() => {
    window.location.hash = "#/deck";
    setPhase("main");
  }, []);

  // After setup completes, re-enter at the deck.
  useEffect(() => {
    if (phase === "setup" && state.identity.setupComplete) {
      setPhase("main");
    }
  }, [phase, state.identity.setupComplete]);

  if (phase === "boot") {
    return (
      <div className="h-full bg-black text-white">
        <Starfield count={90} />
        <Boot onDone={bootDone} />
      </div>
    );
  }

  if (phase === "setup" && !state.identity.setupComplete) {
    return (
      <div className="min-h-full bg-black text-white">
        <Starfield />
        <Setup onComplete={setupDone} />
      </div>
    );
  }

  const Active = ROUTES.find((r) => r.key === route)?.view ?? Deck;

  return (
    <div className="min-h-full bg-black text-white">
      <Starfield />
      <TopNav route={route} name={state.identity.name} />
      <main key={route} className="relative z-10">
        <Active />
      </main>
    </div>
  );
}

function TopNav({ route, name }) {
  const go = (key) => {
    window.location.hash = `#/${key}`;
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-md">
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
      </div>
    </header>
  );
}
