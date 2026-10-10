import { useEffect, useRef, useState } from "react";
import { useAxzio, commitmentText } from "../store.jsx";
import {
  Card,
  MicroLabel,
  HelpBubble,
  HelpText,
  Field,
  Btn,
  Empty,
} from "../components/ui.jsx";
import { LifeModRow } from "../components/LifeMod.jsx";
import { ResetHistory, ResetActionCard } from "./Practices.jsx";
import { ReflectionCard } from "../components/Reflection.jsx";

/* The Atlas — the whiteboard. Index tables for everything that doesn't
   live on the four main tabs, plus the modules still being placed.
   Sections: ?section=lifemods|goals|habits|resets|launch */

function SectionShell({ id, kicker, title, help, children }) {
  return (
    <section id={`atlas-${id}`} className="axzio-rise mt-10 scroll-mt-24">
      <div className="mb-4 flex items-center gap-2">
        <MicroLabel>{kicker}</MicroLabel>
        {help}
      </div>
      <h3 className="text-xl font-light tracking-wide">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function LifeModsIndex() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [frictionText, setFrictionText] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const lifemods = Array.isArray(state.lifemods) ? state.lifemods : [];
  const active = lifemods.filter((m) => m.active !== false);
  const archived = lifemods.filter((m) => m.active === false);

  const create = (e) => {
    e.preventDefault();
    const t = frictionText.trim();
    if (!t) return;
    const m = axzio.addLifeMod(t, { origin: "friction" });
    if (m) {
      setFrictionText("");
      setExpandedId(m.id);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={create} className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Name a friction</MicroLabel>
          <HelpBubble title="Name a friction">
            <HelpText
              what="Name a preexisting circumstance that creates drag — no seed required."
              why="Not every LifeMod starts as inspiration. Friction-born LifeMods remove drag; seed-born ones build lift."
              example="“My sleep schedule is wrecking my mornings.”"
            />
          </HelpBubble>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field
            value={frictionText}
            onChange={(e) => setFrictionText(e.target.value)}
            placeholder="What repeatedly creates drag?"
            maxLength={120}
            aria-label="Name a friction"
            className="flex-1"
          />
          <Btn type="submit" disabled={!frictionText.trim()}>
            Create LifeMod
          </Btn>
        </div>
      </form>
      <div className="border-t border-white/10 pt-5">
        <MicroLabel className="mb-3">Active · {active.length}</MicroLabel>
        {active.length === 0 ? (
          <Empty>No active LifeMods.</Empty>
        ) : (
          <div className="space-y-2">
            {active.map((m) => (
              <LifeModRow
                key={m.id}
                lifemod={m}
                expanded={expandedId === m.id}
                onToggle={() =>
                  setExpandedId(expandedId === m.id ? null : m.id)
                }
              />
            ))}
          </div>
        )}
      </div>
      {archived.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            aria-expanded={showArchived}
            className="text-[11px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
          >
            {showArchived ? "Hide archived" : `Show archived · ${archived.length}`}
          </button>
          {showArchived && (
            <div className="mt-3 space-y-2">
              {archived.map((m) => (
                <LifeModRow
                  key={m.id}
                  lifemod={m}
                  expanded={expandedId === m.id}
                  onToggle={() =>
                    setExpandedId(expandedId === m.id ? null : m.id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function GoalsIndex() {
  const axzio = useAxzio();
  const { state } = axzio;
  const goals = (state.goals || []).filter(Boolean);
  if (goals.length === 0) return <Empty>No goals yet — grow one from a thread.</Empty>;
  return (
    <Card className="p-6">
      <ul className="space-y-1.5">
        {goals.map((g) => (
          <li
            key={g.id}
            className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-2.5"
          >
            <button
              type="button"
              onClick={() => axzio.updateGoal(g.id, { done: !g.done })}
              aria-label={g.done ? "Reopen goal" : "Complete goal"}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[12px] ${
                g.done ? "border-white/60 text-white" : "border-white/25 text-transparent"
              }`}
            >
              ✓
            </button>
            <span className="min-w-0 flex-1">
              <span className={`text-[14px] ${g.done ? "text-white/40 line-through" : "text-white/85"}`}>
                {g.text}
              </span>
              <span className="block truncate text-[11px] tracking-[0.08em] text-white/40">
                {commitmentText(state, g.commitmentId) || "No commitment"}
                {g.horizon ? ` · ${g.horizon}` : ""}
              </span>
            </span>
            <a
              href="#/focus"
              className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/45 hover:text-white"
            >
              In Focus →
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HabitsIndex() {
  const axzio = useAxzio();
  const { state } = axzio;
  const habits = (state.habits || []).filter(Boolean);
  if (habits.length === 0) return <Empty>No habits yet — grow one from a thread.</Empty>;
  return (
    <Card className="p-6">
      <ul className="space-y-1.5">
        {habits.map((h) => (
          <li
            key={h.id}
            className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-2.5"
          >
            <span className="min-w-0 flex-1">
              <span className="text-[14px] text-white/85">{h.text}</span>
              <span className="block truncate text-[11px] tracking-[0.08em] text-white/40">
                {commitmentText(state, h.commitmentId) || "No commitment"}
              </span>
            </span>
            <a
              href="#/focus"
              className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/45 hover:text-white"
            >
              In Focus →
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LaunchPlaceholder() {
  const { state } = useAxzio();
  const crossings = state.launchCrossings || [];
  const done = crossings.length;
  const total = 9;
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[15px] text-white/85">
            {done === 0
              ? "The journey hasn't begun."
              : done >= total
                ? "Nine of nine — the myth is forged."
                : `${done} of ${total} thresholds crossed.`}
          </p>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/50">
            Love → Hope → Dream → Believe → Begin → Build → Become → Live Your
            Legend → Forge the Myth.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.hash = "#/launch";
          }}
          className="shrink-0 rounded-xl border border-[#d8a94e]/50 px-4 py-2.5 text-[11px] uppercase tracking-[0.16em] text-[#d8a94e] transition-colors hover:bg-[#d8a94e]/10"
        >
          {done === 0 ? "Begin" : done >= total ? "Revisit" : "Continue"} →
        </button>
      </div>
      {done > 0 && (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#d8a94e]"
              style={{ width: `${Math.min(100, (done / total) * 100)}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

export default function Atlas() {
  const [viewingReset, setViewingReset] = useState(null);
  const sectionsRef = useRef({});
  useEffect(() => {
    const m = window.location.hash.match(/[?&]section=([a-z]+)/);
    if (m) {
      const el = document.getElementById(`atlas-${m[1]}`);
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8" ref={sectionsRef}>
      <header className="axzio-rise">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">The whiteboard</MicroLabel>
          <HelpBubble title="Atlas" className="mb-2">
            <HelpText
              what="The index of everything not on the main tabs — plus the modules still being placed."
              why="Four tabs stay clean because the inventory lives here: every LifeMod, goal, habit, and past reset, one tap away."
              how="Browse the tables below, or jump straight in from the drawer."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">Atlas</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Everything, indexed. The main tabs stay quiet because it all lives
          here.
        </p>
      </header>

      {viewingReset && (
        <div className="mt-8">
          <ResetActionCard
            resetId={viewingReset}
            onBack={() => setViewingReset(null)}
            allowDelete
          />
        </div>
      )}

      <SectionShell
        id="lifemods"
        kicker="Index · LifeMods"
        title="Designed life changes"
        help={
          <HelpBubble title="LifeMods index">
            <HelpText
              what="Every LifeMod — grown from a seed or named from a friction."
              why="LifeMods are worked from their threads; this table is the full inventory."
              how="Expand a row for the full editor."
            />
          </HelpBubble>
        }
      >
        <LifeModsIndex />
      </SectionShell>

      <SectionShell
        id="goals"
        kicker="Index · Goals"
        title="Outcomes"
        help={
          <HelpBubble title="Goals index">
            <HelpText
              what="Every goal across all commitments."
              why="Goals live under commitments in Focus; this is the flat view."
              how="Tap the circle to complete; manage fully in Focus."
            />
          </HelpBubble>
        }
      >
        <GoalsIndex />
      </SectionShell>

      <SectionShell
        id="habits"
        kicker="Index · Habits"
        title="Practices"
        help={
          <HelpBubble title="Habits index">
            <HelpText
              what="Every habit across all commitments."
              why="Habits are practiced from Focus; this is the flat view."
              how="Manage rhythms fully in Focus."
            />
          </HelpBubble>
        }
      >
        <HabitsIndex />
      </SectionShell>

      <SectionShell
        id="resets"
        kicker="Index · Past resets"
        title="Action cards"
        help={
          <HelpBubble title="Past resets">
            <HelpText
              what="Every completed Reset with its Action Card."
              why="The evidence of fog faced — kept, not just done."
              how="Open a card to revisit or mark reviewed."
            />
          </HelpBubble>
        }
      >
        <ResetHistory onOpen={(id) => setViewingReset(id)} />
      </SectionShell>

      <SectionShell
        id="reflection"
        kicker="Whiteboard"
        title="Weekly Reflection"
        help={
          <HelpBubble title="Weekly Reflection">
            <HelpText
              what="The manual readings loop — what the last 7 days say, with no AI."
              why="Parked here until it wraps into the evening review and the weekly/monthly reviews."
              how="Read it weekly; sit with the questions."
            />
          </HelpBubble>
        }
      >
        <ReflectionCard />
      </SectionShell>

      <SectionShell
        id="launch"
        kicker="Journey"
        title="Launch Sequence"
        help={
          <HelpBubble title="Launch Sequence">
            <HelpText
              what="The identity launch journey — nine thresholds from Love to Forge the Myth."
              why="Becoming has an arc. Crossings are written into your legend and your Nebula."
              how="Open the journey to begin or continue."
            />
          </HelpBubble>
        }
      >
        <LaunchPlaceholder />
      </SectionShell>
    </div>
  );
}
