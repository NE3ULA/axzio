import { useMemo, useState } from "react";
import {
  useAxzio,
  ORIENTATION_PRACTICES,
  PRIORITY_RANKS,
  priorityLabel,
  TAGS,
  BATTERY,
  modeLabel,
  tagLabel,
  sortedCommitments,
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
        <ul className="space-y-2.5">
          {priorities.map((p) => (
            <li key={p.rank} className="flex items-baseline gap-3">
              <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/40">
                {priorityLabel(p.rank)}
              </span>
              {p.item ? (
                <span className="line-clamp-1 text-[15px] text-white">
                  {p.item.text}
                </span>
              ) : (
                <span className="text-[13px] tracking-wide text-white/30">
                  Not set
                </span>
              )}
            </li>
          ))}
        </ul>
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
  const { state } = useAxzio();
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
              what="The energy mode organizing today: Production, Pleasure, or People — a primary and a secondary."
              why="No mode is superior; problems arise when one mode claims the whole system."
              how="Quick-switch today's modes inline, or open Modes to set the day, week, and month."
            />
          </HelpBubble>
        }
      />
      <div className="flex-1">
        {sel.primary || sel.secondary ? (
          <p className="mb-4 flex flex-wrap gap-2">
            {sel.primary && (
              <Pill tone="lit">Primary · {modeLabel(sel.primary)}</Pill>
            )}
            {sel.secondary && (
              <Pill>Secondary · {modeLabel(sel.secondary)}</Pill>
            )}
          </p>
        ) : (
          <p className="mb-4 text-[15px] leading-relaxed text-white/40">
            No mode set for today — choose how energy is organizing.
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
  }));
  const depleted = entries.reduce((a, b) => (a.value <= b.value ? a : b));
  const available = entries.reduce((a, b) => (a.value >= b.value ? a : b));

  return (
    <Card className="axzio-rise axzio-rise-4 flex flex-col p-6">
      <SectionHead
        label="State"
        help={
          <HelpBubble title="State">
            <HelpText
              what="Your Human Battery: five dimensions of available capacity — physical, mental, emotional, social, purpose."
              why="State is not identity. Hear the instrument before trying to force the performance."
              how="Expand to slide each dimension; begin with the one asking most clearly for attention."
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
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
            Most depleted{" "}
            <span className="ml-1 text-white">
              {depleted.label} · {depleted.value}/10
            </span>
          </p>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
            Most available{" "}
            <span className="ml-1 text-white">
              {available.label} · {available.value}/10
            </span>
          </p>
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
              how="Expand a practice and write the entry; it saves for today and marks the practice complete. Unmark by hand any time. Take Action links into Focus — live now; the other three are standalone practices."
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
        {ORIENTATION_PRACTICES.map((p) => (
          <PracticeRow
            key={p.key}
            practice={p}
            entry={day.orientation?.[p.key]}
            today={today}
          />
        ))}
      </div>
    </Card>
  );
}

function PracticeRow({ practice, entry, today }) {
  const { setOrientationText, setOrientationDone } = useAxzio();
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

function BatteryCheck({ day, today }) {
  const { setBattery } = useAxzio();
  const battery = day.battery || {};

  const entries = BATTERY.map((b) => ({
    ...b,
    value: Number.isFinite(battery[b.key]) ? battery[b.key] : 5,
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
            <p className="mt-1.5 text-[13px] leading-snug text-white/45">
              {b.desc}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-white/40">
        Read the pattern, not only the total. Begin with the dimension asking
        most clearly for attention.
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
