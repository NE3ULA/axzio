import { useMemo, useState } from "react";
import {
  useAxzio,
  ORIENTATION_PRACTICES,
  PRIORITY_RANKS,
  priorityLabel,
  TAGS,
  BATTERY,
  BATTERY_PRIORITIES,
  validBatteryPriority,
  CIRCLES,
  MODES,
  modeLabel,
  tagLabel,
  sortedCommitments,
  legendFunctionLabel,
  becomingStageLabel,
  localDateKey,
  formatLongDate,
  formatTime,
  getDayState,
  actionsOn,
  signalsOn,
  computeStreak,
} from "../store.jsx";
import {
  Card,
  MicroLabel,
  Btn,
  Field,
  TextArea,
  Pill,
  SectionHead,
  Empty,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";
import ModePicker from "../components/ModePicker.jsx";

/* ------------------------------------------------------------------ */
/* COMMAND DECK — overview dashboard: live summaries across modules,   */
/* each card expandable inline or routing to its module.                */
/* ------------------------------------------------------------------ */

export default function Deck() {
  const axzio = useAxzio();
  const { state } = axzio;
  const today = localDateKey();
  const day = getDayState(state, today);
  const todaysActions = actionsOn(state, today).slice().reverse();
  const todaysSignals = signalsOn(state, today).slice().reverse();
  const streak = useMemo(() => computeStreak(state), [state]);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      {/* header */}
      <header className="axzio-rise mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <MicroLabel className="mb-2">Command Deck</MicroLabel>
          <h2 className="text-3xl font-light tracking-wide md:text-4xl">
            {state.identity.name || "Traveler"}
          </h2>
          <p className="mt-2 text-sm tracking-wide text-white/45">
            {formatLongDate(today)}
          </p>
          <p className="mt-3 max-w-md text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/35">
            Time is your frame. Energy is your fuel. Identity is your
            direction. Purpose is your destination.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <Stat value={streak} label="day streak" />
          <Stat value={state.actions.length} label="total actions" />
        </div>
      </header>

      {/* zone: overview */}
      <div className="mb-5 flex items-center gap-4">
        <MicroLabel>Overview</MicroLabel>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <WhoAmICard />
        <WhatsImportantCard />
        <ModeCard />
        <StateCard />
        <OrientationCard day={day} today={today} />
        <LifeModsCard />
      </div>

      {/* zone: capture */}
      <div className="mb-5 mt-14 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <MicroLabel>Capture</MicroLabel>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      {/* intention */}
      <section className="axzio-rise axzio-rise-3">
        <Card className="p-6">
          <SectionHead
            label="Intention for the day"
            help={
              <HelpBubble title="Intention">
                <HelpText
                  what="One line naming what today is for."
                  why="A named intention gives the day a direction the system can read against."
                  how="Write or revise it any time; it stays with today's date."
                />
              </HelpBubble>
            }
          />
          <TextArea
            value={day.intention}
            onChange={(e) => axzio.setIntention(today, e.target.value)}
            placeholder="One line. What is today for?"
            rows={2}
            maxLength={220}
          />
        </Card>
      </section>

      {/* action log */}
      <section className="axzio-rise axzio-rise-4 mt-6">
        <Card className="p-6">
          <SectionHead
            label="Action log"
            help={
              <HelpBubble title="Action log">
                <HelpText
                  what="A running log of embodied action, tagged by mantra anchor or primitive."
                  why="Action is where identity becomes visible; the log is the evidence. Streaks count consecutive days with at least one action."
                  how="Log what you did. Delete with the × — the log is yours to keep honest."
                />
              </HelpBubble>
            }
          />
          <ActionForm />
          <div className="mt-5 space-y-2">
            {todaysActions.length === 0 && (
              <Empty>No actions logged today yet.</Empty>
            )}
            {todaysActions.map((a) => (
              <div
                key={a.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[15px] leading-snug">{a.text}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Pill>{tagLabel(a.tag)}</Pill>
                    <span className="text-[11px] tracking-[0.14em] text-white/35">
                      {formatTime(a.ts)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => axzio.deleteAction(a.id)}
                  aria-label="Delete action"
                  className="mt-1 shrink-0 text-white/25 transition-colors hover:text-white/80"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* signals */}
      <section className="axzio-rise axzio-rise-5 mt-6">
        <Card className="p-6">
          <SectionHead
            label="Signal feed"
            help={
              <HelpBubble title="Signal feed">
                <HelpText
                  what="Transmissions: notes, observations, vows — the unprocessed feed of a life being paid attention to."
                  why="Signal is what the Alchemist Path begins with: what is revealed before it is interpreted."
                  how="Transmit anything. Today's signals stay on the deck; the feed is the raw material of future reviews."
                />
              </HelpBubble>
            }
          />
          <SignalForm />
          <div className="mt-5 space-y-3">
            {todaysSignals.length === 0 && (
              <Empty>Nothing transmitted today. Send a signal.</Empty>
            )}
            {todaysSignals.map((s) => (
              <div key={s.id} className="border-l border-white/20 pl-4">
                <p className="text-[15px] leading-relaxed text-white/85">
                  {s.text}
                </p>
                <p className="mt-1 text-[11px] tracking-[0.14em] text-white/35">
                  {formatTime(s.ts)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* add a star */}
      <section className="axzio-rise axzio-rise-5 mt-6">
        <Card className="p-6">
          <SectionHead
            label="Ignite a star"
            help={
              <HelpBubble title="Ignite a star">
                <HelpText
                  what="Name an intention or project to place it in your constellation as an orbiting star."
                  why="Named things gain gravity; orbiting stars keep intentions visible across days."
                  how="Name the star, add an optional note, ignite. Find your stars in the Constellation."
                />
              </HelpBubble>
            }
          />
          <StarForm />
        </Card>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-3xl font-light">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
    </div>
  );
}

/** Small "open the module" affordance used on overview cards. */
function ModuleLink({ href, children }) {
  return (
    <a
      href={href}
      className="mt-5 inline-block text-[11px] uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-white"
    >
      {children} →
    </a>
  );
}

/* ------------------------- overview cards ------------------------- */

function WhoAmICard() {
  const { state } = useAxzio();
  const becoming = state.identity.becoming?.trim();
  const topCommitments = sortedCommitments(state).slice(0, 3);

  return (
    <Card className="axzio-rise axzio-rise-1 flex flex-col p-6">
      <SectionHead
        label="Who am I"
        help={
          <HelpBubble title="Who am I">
            <HelpText
              what="A mirror of your Identity Core: the person you are choosing to become, plus your top three commitments in priority order."
              why="AXZIO reads every day against your authored identity — not a mood, a role, or a performance."
              how="Open Identity to author the four orientation statements, values, and prioritized commitments."
            />
          </HelpBubble>
        }
      />
      <div className="flex-1">
        {becoming ? (
          <p className="line-clamp-3 text-[15px] leading-relaxed text-white/85">
            <span className="text-white/45">Becoming someone who </span>
            {becoming}
          </p>
        ) : (
          <p className="text-[15px] leading-relaxed text-white/40">
            No orientation statement yet — open Identity to author yours.
          </p>
        )}
        {topCommitments.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {topCommitments.map((c, i) => (
              <li key={c.id} className="flex items-baseline gap-3">
                <span className="shrink-0 text-[11px] tabular-nums tracking-[0.2em] text-white/40">
                  {i + 1}
                </span>
                <span className="line-clamp-1 text-[14px] leading-snug text-white/85">
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-[13px] leading-relaxed text-white/35">
            No commitments named yet.
          </p>
        )}
      </div>
      <ModuleLink href="#/identity">Open Identity</ModuleLink>
    </Card>
  );
}

function WhatsImportantCard() {
  const { state } = useAxzio();
  const openDay = state.focusItems.filter(
    (f) => !f.done && f.timeframe === "day" && !f.parentId
  );
  const priorities = PRIORITY_RANKS.map((r) => ({
    ...r,
    item: openDay.find((f) => f.priority === r.rank) || null,
  }));
  const q1 = openDay.filter((f) => f.quadrant === "q1").length;
  const q2 = openDay.filter((f) => f.quadrant === "q2").length;

  return (
    <Card className="axzio-rise axzio-rise-2 flex flex-col p-6">
      <SectionHead
        label="What's important today"
        help={
          <HelpBubble title="What's important today">
            <HelpText
              what="Today's three ranked priorities — 1st is the one thing to focus on — plus the open counts in Do and Decide."
              why="The matrix separates urgency from importance to preserve attention for aligned action; the ranks make the day's trade visible."
              how="Rank items 1st/2nd/3rd in Focus; the lists here update live."
            />
          </HelpBubble>
        }
      />
      <div className="flex-1">
        {/* rank 1 dominates: the one thing to focus on */}
        <div className="mb-3 rounded-xl border border-white/20 bg-white/[0.03] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            {priorityLabel(1)}
          </p>
          {priorities[0].item ? (
            <p className="mt-1.5 line-clamp-2 text-xl font-light leading-snug text-white">
              {priorities[0].item.text}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] tracking-wide text-white/30">
              Not set
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {priorities.slice(1).map((p) => (
            <div key={p.rank}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                {priorityLabel(p.rank)}
              </p>
              {p.item ? (
                <p className="mt-1 line-clamp-1 text-[15px] text-white">
                  {p.item.text}
                </p>
              ) : (
                <p className="mt-1 text-[13px] tracking-wide text-white/30">
                  Not set
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-6">
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
            Do{" "}
            <span className="ml-1 text-xl font-light normal-case tracking-normal text-white">
              {q1}
            </span>
          </p>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
            Decide{" "}
            <span className="ml-1 text-xl font-light normal-case tracking-normal text-white">
              {q2}
            </span>
          </p>
        </div>
      </div>
      <ModuleLink href="#/focus">Open Focus</ModuleLink>
    </Card>
  );
}

function ModeCard() {
  const axzio = useAxzio();
  const { state } = axzio;
  const current = (state.modes && state.modes.current) || null;
  const sel = (state.modes && state.modes.day) || {
    primary: null,
    secondary: null,
  };

  return (
    <Card className="axzio-rise axzio-rise-3 flex flex-col p-6">
      <SectionHead
        label="What mode am I in"
        help={
          <HelpBubble title="What mode am I in">
            <HelpText
              what="Two readings of your energy. IN: the mode you're in right now — descriptive, where your energy actually is. FOCUS: the modes you're pointing attention at today — prescriptive, where focus goes even when that's not where you are."
              why="Naming both keeps the tension honest: in Pleasure but focusing Production is a real, workable state — but only when it's named."
              how="Set your current mode with the three buttons; quick-switch today's focus inline, or open Modes for the full picture."
            />
          </HelpBubble>
        }
      />
      <div className="flex-1">
        {/* the mode you're IN — prominent */}
        {current ? (
          <p className="mb-3">
            <Pill tone="lit">In · {modeLabel(current)}</Pill>
          </p>
        ) : (
          <p className="mb-3 text-[15px] leading-relaxed text-white/40">
            Current mode not set — where is your energy right now?
          </p>
        )}
        <div className="mb-5 flex flex-wrap gap-2">
          {MODES.map((m) => {
            const isSel = current === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() =>
                  axzio.setCurrentMode(isSel ? null : m.key)
                }
                aria-pressed={isSel}
                aria-label={`I am in ${m.label} mode`}
                className={`rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-all duration-200 ${
                  isSel
                    ? "border-white/70 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        {/* where FOCUS goes today */}
        <MicroLabel className="mb-2">Focus today</MicroLabel>
        {sel.primary || sel.secondary ? (
          <p className="mb-4 flex flex-wrap gap-2">
            {sel.primary && (
              <Pill tone="lit">Focus · {modeLabel(sel.primary)}</Pill>
            )}
            {sel.secondary && (
              <Pill>{modeLabel(sel.secondary)}</Pill>
            )}
          </p>
        ) : (
          <p className="mb-4 text-[15px] leading-relaxed text-white/40">
            No focus set for today — where is attention going?
          </p>
        )}
        <ModePicker interval="day" compact />
      </div>
      <ModuleLink href="#/modes">Open Modes</ModuleLink>
    </Card>
  );
}

function StateCard() {
  const { state } = useAxzio();
  const today = localDateKey();
  const day = getDayState(state, today);
  const [expanded, setExpanded] = useState(false);

  const entries = BATTERY.map((b) => ({
    ...b,
    value: Number.isFinite(day.battery?.[b.key]) ? day.battery[b.key] : 5,
    priority: validBatteryPriority(day.batteryPriority?.[b.key]),
  }));
  /* Gap-aware reading: state vs. priority, not raw depletion. */
  const highPri = entries.filter((e) => e.priority === "high");
  const lowPri = entries.filter((e) => e.priority === "low");
  const needsAttention =
    highPri.length > 0
      ? highPri.reduce((a, b) => (a.value <= b.value ? a : b))
      : null;
  const charged = entries.reduce((a, b) => (a.value >= b.value ? a : b));
  const resting =
    lowPri.length > 0
      ? lowPri.reduce((a, b) => (a.value <= b.value ? a : b))
      : null;

  return (
    <Card className="axzio-rise axzio-rise-4 flex flex-col p-6">
      <SectionHead
        label="State"
        help={
          <HelpBubble title="State">
            <HelpText
              what="Your Human Battery: five dimensions of available capacity — physical, mental, emotional, social, purpose. Each dimension has a STATE (where the instrument is, 1–10) and a PRIORITY (how much attention it gets: low, medium, high)."
              why="State is not a work order. A low reading on a low priority is rest, not failure. The card reads the gap between state and priority — not raw depletion."
              how="Expand to slide each dimension's state — where the instrument is, 1–10 — then set its priority: how much attention it gets (Low/Med/High). 'Needs attention' is a low state on a high priority; 'Resting' is a low state on a low priority — intentional, not a problem."
            />
          </HelpBubble>
        }
        right={
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-expanded={expanded}
            className="text-[11px] uppercase tracking-[0.2em] text-white/55 transition-colors hover:text-white"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        }
      />
      <div className="flex-1">
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {needsAttention && (
            <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
              Needs attention{" "}
              <span className="ml-1 text-white">
                {needsAttention.label} · {needsAttention.value}/10
              </span>
            </p>
          )}
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
            Charged{" "}
            <span className="ml-1 text-white">
              {charged.label} · {charged.value}/10
            </span>
          </p>
          {resting && (
            <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
              Resting{" "}
              <span className="ml-1 text-white/70">
                {resting.label} · {resting.value}/10
              </span>
            </p>
          )}
        </div>
        {expanded && (
          <div className="axzio-rise mt-5 border-t border-white/10 pt-5">
            <BatteryCheck day={day} today={today} />
          </div>
        )}
      </div>
    </Card>
  );
}

function OrientationCard({ day, today }) {
  const doneCount = ORIENTATION_PRACTICES.filter(
    (p) => day.orientation?.[p.key]?.done
  ).length;

  return (
    <Card className="axzio-rise axzio-rise-1 p-6 md:col-span-2">
      <SectionHead
        label="Orientation"
        help={
          <HelpBubble title="Orientation">
            <HelpText
              what="The daily mantra as four micro-practices: a gratitude entry, a beauty noticed, one action for today, one thing for someone else."
              why="Named practices make the anchors concrete — each asks for something specific rather than a vague “done”."
              how="Expand a practice and write the entry; it saves for today and marks the practice complete. Unmark by hand any time. Take Action pulls from Focus — it shows your day's rank-1 item automatically, or lets you pick one to promote to rank 1. No duplicate entry needed. Give Love can tag someone from your Tribe."
            />
          </HelpBubble>
        }
        right={
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            {doneCount} / 4
          </span>
        }
      />
      <div className="space-y-2">
        {ORIENTATION_PRACTICES.map((p) =>
          p.key === "action" ? (
            <TakeActionRow
              key={p.key}
              practice={p}
              entry={day.orientation?.[p.key]}
              today={today}
            />
          ) : p.key === "love" ? (
            <GiveLoveRow
              key={p.key}
              practice={p}
              entry={day.orientation?.[p.key]}
              today={today}
            />
          ) : (
            <PracticeRow
              key={p.key}
              practice={p}
              entry={day.orientation?.[p.key]}
              today={today}
            />
          )
        )}
      </div>
    </Card>
  );
}

/* Compact summary of active LifeMods (they live in the Constellation).
   Full-width strip so the two-column grid stays balanced. */
function LifeModsCard() {
  const { state } = useAxzio();
  const lifemods = Array.isArray(state.lifemods) ? state.lifemods : [];
  const active = lifemods.filter((m) => m && m.active !== false);

  return (
    <Card className="axzio-rise axzio-rise-5 p-6 md:col-span-2">
      <SectionHead
        label="LifeMods"
        help={
          <HelpBubble title="LifeMods">
            <HelpText
              what="Designed life changes — seeds that matured, or frictions named directly — tracked through the Becoming Cycle."
              why="A LifeMod does not ask 'How do I force myself to comply?' It asks 'What could I change so the next aligned action becomes clearer?'"
              how="Open the Constellation to grow one from a seed or name a friction; each names a legend function and moves through Detect → Capture → Evaluate → Execute → Review → Evolve."
            />
          </HelpBubble>
        }
        right={
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            {active.length} active
          </span>
        }
      />
      {active.length === 0 ? (
        <p className="text-[15px] leading-relaxed text-white/40">
          No active LifeMods — grow one from a seed or name a friction.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {active.map((m) => (
            <li key={m.id} className="flex min-w-0 items-center gap-3">
              <span className="max-w-[220px] truncate text-[15px] text-white/85">
                {m.name || "Unnamed LifeMod"}
              </span>
              {legendFunctionLabel(m.legendFunction) && (
                <Pill>{legendFunctionLabel(m.legendFunction)}</Pill>
              )}
              {becomingStageLabel(m.becomingStage) && (
                <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">
                  {becomingStageLabel(m.becomingStage)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      <ModuleLink href="#/constellation">Open Constellation</ModuleLink>
    </Card>
  );
}

function PracticeRow({ practice, entry, today }) {  const { setOrientationText, setOrientationDone } = useAxzio();
  const [expanded, setExpanded] = useState(false);
  const text = entry?.text || "";
  const done = entry?.done === true;

  return (
    <div
      className={`rounded-xl border transition-colors ${
        done ? "border-white/30 bg-white/[0.03]" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOrientationDone(today, practice.key, !done)}
          aria-label={
            done
              ? `Unmark ${practice.label}`
              : `Mark ${practice.label} as practiced`
          }
          aria-pressed={done}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            done
              ? "border-white/70 bg-white text-black"
              : "border-white/30 hover:border-white/70"
          }`}
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5.5l2.5 2.5 4.5-5.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          )}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse practice" : "Expand practice"}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium tracking-wide">
              {practice.label}
            </span>
            <span className="block truncate text-[12px] text-white/40">
              {text.trim() || practice.prompt}
            </span>
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`shrink-0 text-white/40 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-2 text-[13px] leading-relaxed text-white/55">
            {practice.prompt}
          </p>
          <TextArea
            value={text}
            onChange={(e) =>
              setOrientationText(today, practice.key, e.target.value)
            }
            rows={2}
            maxLength={280}
            placeholder={practice.prompt}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              onClick={() => setOrientationDone(today, practice.key, !done)}
              className="text-[11px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
            >
              {done ? "Unmark" : "Mark as practiced"}
            </button>
            {practice.focusLink && (
              <a
                href="#/focus"
                className="text-[11px] uppercase tracking-[0.2em] text-white/55 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
              >
                Open in Focus →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TakeActionRow — the Take Action practice pulls from Focus instead of
 * duplicating it. Shows the day's rank-1 item when one exists (auto-
 * completes), otherwise offers open focus items to promote to rank 1,
 * otherwise links to Focus. Legacy free-text entries are preserved.
 */
function TakeActionRow({ practice, entry, today }) {
  const { state, setOrientationDone, setOrientationFocusItem } = useAxzio();
  const [expanded, setExpanded] = useState(false);
  const done = entry?.done === true;

  const openItems = (state.focusItems || []).filter((f) => !f.done);
  const linked = openItems.find((f) => f.id === entry?.focusItemId) || null;
  const dayOneThing =
    openItems.find((f) => f.timeframe === "day" && f.priority === 1) || null;
  const displayItem = dayOneThing || linked;
  const legacyText =
    !displayItem && entry?.text?.trim() ? entry.text.trim() : "";
  const candidates = [
    ...openItems.filter((f) => f.timeframe === "day"),
    ...openItems.filter((f) => f.timeframe !== "day"),
  ];

  const checkClass = `flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
    done
      ? "border-white/70 bg-white text-black"
      : "border-white/30 hover:border-white/70"
  }`;
  const toggleClass =
    "text-[11px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white";
  const focusLinkClass =
    "text-[11px] uppercase tracking-[0.2em] text-white/55 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white";

  return (
    <div
      className={`rounded-xl border transition-colors ${
        done ? "border-white/30 bg-white/[0.03]" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOrientationDone(today, practice.key, !done)}
          aria-label={
            done
              ? `Unmark ${practice.label}`
              : `Mark ${practice.label} as practiced`
          }
          aria-pressed={done}
          className={checkClass}
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5.5l2.5 2.5 4.5-5.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          )}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse practice" : "Expand practice"}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium tracking-wide">
              {practice.label}
            </span>
            <span className="block truncate text-[12px] text-white/40">
              {displayItem ? displayItem.text : legacyText || practice.prompt}
            </span>
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`shrink-0 text-white/40 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4">
          {displayItem ? (
            <>
              <MicroLabel className="mb-2">
                The one thing to focus on today
              </MicroLabel>
              <p className="text-[15px] leading-relaxed text-white">
                {displayItem.text}
              </p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  onClick={() => setOrientationDone(today, practice.key, !done)}
                  className={toggleClass}
                >
                  {done ? "Unmark" : "Mark as practiced"}
                </button>
                <a href="#/focus" className={focusLinkClass}>
                  Open in Focus →
                </a>
              </div>
            </>
          ) : (
            <>
              {legacyText && (
                <div className="mb-4">
                  <MicroLabel className="mb-1.5">Saved earlier</MicroLabel>
                  <p className="text-[14px] leading-relaxed text-white/70">
                    {legacyText}
                  </p>
                </div>
              )}
              {candidates.length > 0 ? (
                <>
                  <MicroLabel className="mb-2">
                    Choose today&apos;s one thing
                  </MicroLabel>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        setOrientationFocusItem(today, e.target.value);
                    }}
                    className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
                    aria-label="Choose today's one thing from Focus"
                  >
                    <option value="" disabled>
                      Select a focus item…
                    </option>
                    {candidates.map((f) => (
                      <option key={f.id} value={f.id}>
                        {(f.text.length > 64
                          ? f.text.slice(0, 64) + "…"
                          : f.text) +
                          (f.timeframe !== "day" ? ` · ${f.timeframe}` : "")}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/40">
                    Choosing one makes it rank 1 in Focus.
                  </p>
                </>
              ) : (
                <a href="#/focus" className={focusLinkClass}>
                  No focus items yet — capture one in Focus →
                </a>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  onClick={() => setOrientationDone(today, practice.key, !done)}
                  className={toggleClass}
                >
                  {done ? "Unmark" : "Mark as practiced"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * GiveLoveRow — the Give Love practice keeps its free-text entry and adds
 * an optional person tag ("For whom?") from the Tribe directory. The row
 * shows the person's name once tagged; their history gathers in Tribe.
 */
function GiveLoveRow({ practice, entry, today }) {
  const { state, setOrientationText, setOrientationDone, setLovePerson } =
    useAxzio();
  const [expanded, setExpanded] = useState(false);
  const text = entry?.text || "";
  const done = entry?.done === true;
  const people = Array.isArray(state.people) ? state.people : [];
  const tagged = people.find((p) => p.id === entry?.personId) || null;

  const preview = tagged
    ? `${tagged.name} · ${text.trim() || "…"}`
    : text.trim() || practice.prompt;

  return (
    <div
      className={`rounded-xl border transition-colors ${
        done ? "border-white/30 bg-white/[0.03]" : "border-white/10"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={() => setOrientationDone(today, practice.key, !done)}
          aria-label={
            done
              ? `Unmark ${practice.label}`
              : `Mark ${practice.label} as practiced`
          }
          aria-pressed={done}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            done
              ? "border-white/70 bg-white text-black"
              : "border-white/30 hover:border-white/70"
          }`}
        >
          {done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M1.5 5.5l2.5 2.5 4.5-5.5"
                stroke="currentColor"
                strokeWidth="1.6"
              />
            </svg>
          )}
        </button>
        <button
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse practice" : "Expand practice"}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-medium tracking-wide">
              {practice.label}
            </span>
            <span className="block truncate text-[12px] text-white/40">
              {preview}
            </span>
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`shrink-0 text-white/40 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>
      {expanded && (
        <div className="border-t border-white/10 px-4 py-4">
          <p className="mb-2 text-[13px] leading-relaxed text-white/55">
            {practice.prompt}
          </p>
          <TextArea
            value={text}
            onChange={(e) =>
              setOrientationText(today, practice.key, e.target.value)
            }
            rows={2}
            maxLength={280}
            placeholder={practice.prompt}
          />
          <div className="mt-4">
            <MicroLabel className="mb-2">For whom? — optional</MicroLabel>
            {people.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-white/40">
                No people yet —{" "}
                <a
                  href="#/tribe"
                  className="text-white/70 underline decoration-white/30 underline-offset-4 hover:text-white"
                >
                  add someone in Tribe
                </a>{" "}
                to tag them here.
              </p>
            ) : (
              <>
                <select
                  value={entry?.personId || ""}
                  onChange={(e) =>
                    setLovePerson(today, e.target.value || null)
                  }
                  className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
                  aria-label="Tag a person for this Give Love entry"
                >
                  <option value="">No one tagged</option>
                  {CIRCLES.map((c) => {
                    const members = people.filter(
                      (p) => p.circle === c.key
                    );
                    if (members.length === 0) return null;
                    return (
                      <optgroup key={c.key} label={c.label}>
                        {members.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <p className="mt-2 text-[12px] leading-relaxed text-white/40">
                  Tag who this is for — their Tribe history keeps the
                  thread.
                </p>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <button
              onClick={() => setOrientationDone(today, practice.key, !done)}
              className="text-[11px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
            >
              {done ? "Unmark" : "Mark as practiced"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BatteryCheck({ day, today }) {
  const { setBattery, setBatteryPriority } = useAxzio();
  const battery = day.battery || {};
  const priorities = day.batteryPriority || {};

  const entries = BATTERY.map((b) => ({
    ...b,
    value: Number.isFinite(battery[b.key]) ? battery[b.key] : 5,
    priority: validBatteryPriority(priorities[b.key]),
  }));

  return (
    <div>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {entries.map((b) => (
          <div key={b.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[15px] font-medium tracking-wide">
                {b.label}
              </span>
              <span className="text-2xl font-light tabular-nums">
                {b.value}
              </span>
            </div>
            <MicroLabel className="mb-1">Where it is</MicroLabel>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={b.value}
              onChange={(e) =>
                setBattery(today, b.key, Number(e.target.value))
              }
              className="axzio-range w-full"
              aria-label={`${b.label} battery level`}
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <MicroLabel>Priority</MicroLabel>
                <p className="mt-1 text-[11px] tracking-wide text-white/35">
                  How much attention this gets
                </p>
              </div>
              <div
                className="flex gap-0.5 rounded-full border border-white/10 p-0.5"
                role="group"
                aria-label={`${b.label} priority`}
              >
                {BATTERY_PRIORITIES.map((p) => {
                  const isSel = b.priority === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setBatteryPriority(today, b.key, p.key)}
                      aria-pressed={isSel}
                      aria-label={`${b.label} priority ${p.label}`}
                      className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                        isSel
                          ? "bg-white/15 text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-1.5 text-[13px] leading-snug text-white/45">
              {b.desc}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-white/40">
        Read the pattern, not only the total. State tells you where the
        instrument is; priority tells you how much attention it gets.
      </p>
    </div>
  );
}

function ActionForm() {
  const { addAction } = useAxzio();
  const [text, setText] = useState("");
  const [tag, setTag] = useState("action");

  const submit = (e) => {
    e.preventDefault();
    if (addAction(text, tag)) {
      setText("");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Log an action — what did you do?"
        maxLength={220}
        className="md:flex-1"
      />
      <select
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        aria-label="Action tag"
        className="rounded-xl border border-white/15 bg-black px-4 py-3 text-[13px] tracking-wide text-white outline-none focus:border-white/50"
      >
        <optgroup label="Mantra">
          {TAGS.filter((t) => t.group === "Mantra").map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Primitive">
          {TAGS.filter((t) => t.group === "Primitive").map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </optgroup>
      </select>
      <Btn type="submit" variant="ghost" disabled={!text.trim()}>
        Log
      </Btn>
    </form>
  );
}

function SignalForm() {
  const { addSignal } = useAxzio();
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (addSignal(text)) setText("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Transmit a signal — a note, an observation, a vow…"
        maxLength={280}
        className="md:flex-1"
      />
      <Btn type="submit" variant="ghost" disabled={!text.trim()}>
        Transmit
      </Btn>
    </form>
  );
}

function StarForm() {
  const { addStar, state } = useAxzio();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const star = addStar(name, note);
    if (star) {
      setName("");
      setNote("");
      setFlash(`“${star.name}” now orbits your constellation.`);
      setTimeout(() => setFlash(""), 4000);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Field
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Star name — e.g. “Ship the portfolio”"
          maxLength={60}
          className="md:flex-1"
        />
        <Btn type="submit" variant="ghost" disabled={!name.trim()}>
          Ignite
        </Btn>
      </div>
      <Field
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="A note on what this star means (optional)"
        maxLength={160}
      />
      {flash && (
        <p className="text-sm tracking-wide text-white/70">{flash}</p>
      )}
      {state.stars.length > 0 && (
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          {state.stars.length} star{state.stars.length === 1 ? "" : "s"} in orbit
        </p>
      )}
    </form>
  );
}
