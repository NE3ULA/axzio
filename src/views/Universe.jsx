import { useState } from "react";
import { useAxzio } from "../store.jsx";
import {
  Card,
  MicroLabel,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* UNIVERSE — the curated external. Everything beyond your system and   */
/* tribe: platforms, tools, education, communities, ventures. The value  */
/* is curation: you decide what gets admitted into your universal        */
/* focus. What you allow in shapes what you orbit.                       */
/* ------------------------------------------------------------------ */

const KINDS = ["platform", "tool", "education", "community", "venture", "other"];

function kindLabel(k) {
  return (k || "other").charAt(0).toUpperCase() + (k || "other").slice(1);
}

export default function Universe() {
  const { state, addUniverseLink, updateUniverseLink, deleteUniverseLink } =
    useAxzio();
  const links = Array.isArray(state.universeLinks) ? state.universeLinks : [];
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("tool");
  const [confirmId, setConfirmId] = useState(null);

  const inFocus = links.filter((l) => l && l.inFocus);
  const shelved = links.filter((l) => l && !l.inFocus);

  const submit = (e) => {
    e.preventDefault();
    const entry = addUniverseLink(name, url, kind);
    if (entry) {
      setName("");
      setUrl("");
      setKind("tool");
    }
  };

  const row = (l) => (
    <div
      key={l.id}
      className="flex items-center gap-3 border-b border-white/5 px-1 py-3 last:border-0"
    >
      <span className="shrink-0 rounded-full border border-white/15 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
        {kindLabel(l.kind)}
      </span>
      {l.url ? (
        <a
          href={l.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate text-[15px] font-light text-white/90 hover:text-white hover:underline hover:underline-offset-4"
        >
          {l.name}
        </a>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[15px] font-light text-white/90">
          {l.name}
        </span>
      )}
      <button
        type="button"
        onClick={() => updateUniverseLink(l.id, { inFocus: !l.inFocus })}
        aria-pressed={!!l.inFocus}
        title={l.inFocus ? "Shelve — remove from your focus" : "Admit — allow into your focus"}
        className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
          l.inFocus
            ? "border-[#d8a94e]/60 text-[#d8a94e]"
            : "border-white/15 text-white/40 hover:border-white/40 hover:text-white/70"
        }`}
      >
        {l.inFocus ? "In focus" : "Shelved"}
      </button>
      {confirmId === l.id ? (
        <span className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => {
              deleteUniverseLink(l.id);
              setConfirmId(null);
            }}
            className="text-[12px] text-red-300/80 hover:text-red-200"
          >
            Remove
          </button>
          <button
            type="button"
            onClick={() => setConfirmId(null)}
            className="text-[12px] text-white/40 hover:text-white/70"
          >
            Keep
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmId(l.id)}
          aria-label={`Remove ${l.name}`}
          className="shrink-0 px-1 text-[16px] leading-none text-white/30 hover:text-white/70"
        >
          ×
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-8">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">Universe</MicroLabel>
          <HelpBubble title="Universe" className="mb-2">
            <HelpText
              what="Everything beyond your system and tribe: the platforms, tools, education, communities, and ventures in your world."
              why="What you allow in shapes what you orbit. An uncurated universe is noise; a curated one is fuel."
              how="Admit what earns a place in your focus; shelve the rest. Nothing here judges you — it just holds the door you chose."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Your Universal Focus
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Curate what you allow into your universe.{" "}
          <span className="text-white/80">
            {inFocus.length} admitted
            {shelved.length > 0 ? ` · ${shelved.length} shelved` : ""}
          </span>
        </p>
      </header>

      <Card className="axzio-rise axzio-rise-1 mb-6 p-6">
        <MicroLabel className="mb-3">Admit something</MicroLabel>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name — e.g. Readwise, YC Library"
              maxLength={80}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              aria-label="Kind"
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white focus:border-white/30 focus:outline-none [&>option]:bg-black"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {kindLabel(k)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link — https://… (optional)"
              inputMode="url"
              maxLength={300}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/30 focus:border-white/30 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!name.trim()}
              className="shrink-0 rounded-xl border border-[#d8a94e]/50 bg-[#d8a94e]/10 px-6 py-3 text-[13px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#d8a94e]/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Admit
            </button>
          </div>
        </form>
      </Card>

      {links.length === 0 ? (
        <Card className="axzio-rise axzio-rise-2 p-8 text-center">
          <p className="text-[15px] font-light text-white/70">
            Nothing admitted yet.
          </p>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-white/40">
            The platforms you build on, the tools you think with, the rooms
            you learn in, the ventures you&apos;re growing — curate them here,
            and they stop being noise.
          </p>
        </Card>
      ) : (
        <>
          {inFocus.length > 0 && (
            <section className="axzio-rise axzio-rise-2 mb-6">
              <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/35">
                In your focus
              </p>
              <Card className="px-4 py-2">{inFocus.map(row)}</Card>
            </section>
          )}
          {shelved.length > 0 && (
            <section className="axzio-rise axzio-rise-3">
              <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-white/35">
                Shelved
              </p>
              <Card className="px-4 py-2 opacity-70">{shelved.map(row)}</Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
