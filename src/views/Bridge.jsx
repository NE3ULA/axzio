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
  integrateChoiceLabel,
  goalsForCommitment,
  habitsForCommitment,
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

export default function Bridge() {
  const axzio = useAxzio();
  const { state } = axzio;
  const today = localDateKey();
  const day = getDayState(state, today);
  const todaysSignals = signalsOn(state, today).slice().reverse();
  const streak = useMemo(() => computeStreak(state), [state]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const saveName = () => {
    const v = nameDraft.trim();
    if (v) axzio.updateIdentity({ name: v });
    setEditingName(false);
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      {/* header */}
      <header className="axzio-rise mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <MicroLabel className="mb-2">Bridge</MicroLabel>
          <h2 className="flex items-center gap-3 text-3xl font-light tracking-wide md:text-4xl">
            {editingName ? (
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                onBlur={saveName}
                autoFocus
                maxLength={40}
                aria-label="Your name"
                placeholder="Your name"
                className="w-56 rounded-lg border border-white/20 bg-black px-3 py-1 text-3xl font-light tracking-wide text-white placeholder:text-white/25 focus:border-white/50 focus:outline-none md:text-4xl"
              />
            ) : (
              <>
                {state.identity.name || "Traveler"}
                <button
                  type="button"
                  onClick={() => {
                    setNameDraft(state.identity.name || "");
                    setEditingName(true);
                  }}
                  aria-label="Edit name"
                  title="Edit name"
                  className="rounded-lg p-1.5 text-white/30 transition-colors hover:text-white"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                </button>
              </>
            )}
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <StateCard />
        <OrientationCard day={day} today={today} />
        <ReviewsDueCard today={today} />
      </div>

      {/* zone: reflection */}
      <div className="mb-5 mt-14 flex items-center gap-4">
        <MicroLabel>Reflection</MicroLabel>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <ReflectionCard />

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

      {/* sparks — the rawest capture; each can ignite into a seed */}
      <section className="axzio-rise axzio-rise-5 mt-6">
        <Card className="p-6">
          <SectionHead
            label="Sparks"
            help={
              <HelpBubble title="Sparks">
                <HelpText
                  what="Raw sparks: notes, observations, vows — captured before they're anything."
                  why="Not every spark is a seed yet. Sparks are the pre-seed: the raw material that either ignites or composts."
                  how="Capture anything. Ignite a spark to turn it into a star seed in the Nebula."
                />
              </HelpBubble>
            }
          />
          <SignalForm />
          <div className="mt-5 space-y-3">
            {todaysSignals.length === 0 && (
              <Empty>No sparks today. Capture the raw stuff.</Empty>
            )}
            {todaysSignals.map((sg) => (
              <div key={sg.id} className="border-l border-white/20 pl-4">
                <p className="text-[15px] leading-relaxed text-white/85">
                  {sg.text}
                </p>
                <p className="mt-1.5 flex items-center gap-3">
                  <span className="text-[11px] tracking-[0.14em] text-white/35">
                    {formatTime(sg.ts)}
                  </span>
                  <button
                    type="button"
                    onClick={() => axzio.addStar(sg.text, "")}
                    className="text-[11px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-[#d8a94e]"
                  >
                    Ignite as seed →
                  </button>
                </p>
              </div>
            ))}
          </div>
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
          <>
            <MicroLabel className="mb-2 mt-4">Top commitments</MicroLabel>
            <ul className="space-y-2">
            {topCommitments.map((c, i) => {
              const openGoals = goalsForCommitment(state, c.id).filter(
                (g) => !g.done
              ).length;
              const activeHabits = habitsForCommitment(state, c.id).filter(
                (h) => h.active !== false
              ).length;
              return (
                <li key={c.id} className="flex items-baseline gap-3">
                  <span className="shrink-0 text-[11px] tabular-nums tracking-[0.2em] text-white/40">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 line-clamp-1 text-[14px] leading-snug text-white/85">
                    {c.text}
                  </span>
                  {(openGoals > 0 || activeHabits > 0) && (
                    <span className="shrink-0 text-[11px] tracking-[0.14em] text-white/40">
                      {[
                        openGoals > 0
                          ? `${openGoals} goal${openGoals === 1 ? "" : "s"}`
                          : null,
                        activeHabits > 0
                          ? `${activeHabits} habit${activeHabits === 1 ? "" : "s"}`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  )}
                </li>
              );
            })}
            </ul>
          </>
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
              why="The checkmark means practiced — the thing was done, not just named. For gratitude and beauty, writing the entry is the practice. For Take Action and Give Love, the doing happens in the world."
              how="Take Action pulls from Focus: it shows your day's rank-1 item, or lets you pick one to promote to rank 1 — choosing aims it, completing the item in Focus (or marking by hand) practices it. Give Love can tag someone from your Tribe; mark it when you've done the thing."
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

/** Resets whose revisit date has arrived and haven't been reviewed.
    Closes the loop the Integrate step opens. */
function ReviewsDueCard({ today }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const due = useMemo(() => {
    const resets = Array.isArray(state.resets) ? state.resets : [];
    const growth = Array.isArray(state.growthSessions)
      ? state.growthSessions
      : [];
    const items = [
      ...resets
        .filter(
          (r) =>
            r &&
            typeof r.reviewDate === "string" &&
            r.reviewDate &&
            r.reviewDate <= today &&
            !r.reviewedAt
        )
        .map((r) => ({
          id: r.id,
          title: r.situation || "Unnamed reset",
          sub: `Revisit ${r.reviewDate === today ? "today" : r.reviewDate}${
            r.integrateChoice ? ` · ${integrateChoiceLabel(r.integrateChoice)}` : ""
          }`,
          href: `#/journeys?reset=${r.id}`,
          reviewDate: r.reviewDate,
        })),
      ...growth
        .filter(
          (g) =>
            g &&
            typeof g.reviewDate === "string" &&
            g.reviewDate &&
            g.reviewDate <= today &&
            !g.reviewedAt
        )
        .map((g) => ({
          id: g.id,
          title: g.subjectName || "Untitled pursuit",
          sub: `Review ${g.reviewDate === today ? "today" : g.reviewDate} · growth practice`,
          href: `#/journeys?growth=${g.id}`,
          reviewDate: g.reviewDate,
        })),
    ];
    return items.sort((a, b) => (a.reviewDate < b.reviewDate ? -1 : 1));
  }, [state.resets, state.growthSessions, today]);
  if (due.length === 0) return null;
  return (
    <Card className="axzio-rise axzio-rise-5 border-white/25 p-6 md:col-span-2">
      <SectionHead
        label="Reviews due"
        help={
          <HelpBubble title="Reviews due">
            <HelpText
              what="Resets and growth practices whose revisit date has arrived, waiting for their review."
              why="The Integrate step — and the Growth Practice's commit step — set a return point; this is where it lands. Reviewing closes the loop."
              how="Open the card to revisit it, then mark it reviewed to clear it from this list."
            />
          </HelpBubble>
        }
        right={
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            {due.length} due
          </span>
        }
      />
      <ul className="space-y-3">
        {due.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-[15px] text-white/85">{r.title}</p>
              <p className="mt-0.5 text-[12px] text-white/40">{r.sub}</p>
            </div>
            <a
              href={r.href}
              className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-white/55 transition-colors hover:text-white"
            >
              Open →
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Weekly reflection — the manual readings loop (no AI).
   Derived transparently from the last 7 days of entries:
   what we notice (descriptive) → a possible pattern (hedged) →
   questions to sit with → rituals to try. Reflections, not verdicts.  */
/* ------------------------------------------------------------------ */

function last7Keys() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(localDateKey(d));
  }
  return out;
}

function ReflectionCard() {
  const { state } = useAxzio();
  const keys = last7Keys();
  const weekAgo = Date.now() - 7 * 86400000;

  const days = keys
    .map((k) => state.days?.[k])
    .filter((d) => d && typeof d === "object");

  // Battery: weekly averages + low-state/high-priority gaps.
  const agg = {};
  for (const b of BATTERY) agg[b.key] = { sum: 0, n: 0, gap: 0 };
  for (const d of days) {
    for (const b of BATTERY) {
      const v = d.battery?.[b.key];
      if (!Number.isFinite(v)) continue;
      agg[b.key].sum += v;
      agg[b.key].n += 1;
      if (v <= 4 && d.batteryPriority?.[b.key] === "high") agg[b.key].gap += 1;
    }
  }
  const avg = (k) => (agg[k].n ? agg[k].sum / agg[k].n : null);
  const withData = BATTERY.filter((b) => agg[b.key].n >= 2);
  const lowest = withData.length
    ? withData.reduce((a, b) => (avg(b.key) < avg(a.key) ? b : a))
    : null;
  const gapDim = BATTERY.find((b) => agg[b.key].gap > 0);

  // Focus: created vs completed in the last 7 days.
  const created = (state.focusItems || []).filter((f) => f && f.created >= weekAgo);
  const completed = (state.actions || []).filter(
    (a) => a && a.tag === "focus" && a.ts >= weekAgo && /^Completed:/.test(a.text || "")
  );
  const openQ1 = (state.focusItems || []).filter(
    (f) => f && !f.done && f.quadrant === "q1"
  ).length;
  const rate = created.length ? completed.length / created.length : null;

  // Orientation: days with at least 3 of 4 practices held.
  const grounded = days.filter((d) => {
    const m = d.mantra || {};
    return ["gratitude", "beauty", "action", "love"].filter((k) => m[k]).length >= 3;
  }).length;

  // Reset sessions in the last 7 days.
  const resets = (state.resets || []).filter((r) => r && r.ts >= weekAgo).length;

  // Modes: current (descriptive) vs day focus (prescriptive).
  const curMode = state.modes?.current ? modeLabel(state.modes.current) : null;
  const focusMode = state.modes?.day?.primary ? modeLabel(state.modes.day.primary) : null;

  const hasData =
    days.length > 0 || created.length > 0 || resets > 0 || (state.actions || []).length > 0;

  if (!hasData) {
    return (
      <Card className="axzio-rise axzio-rise-3 p-6">
        <SectionHead
          label="Reflection"
          help={
            <HelpBubble title="Reflection">
              <HelpText
                what="A weekly reading of your own patterns — derived transparently from your entries, never asserted as truth."
                why="Drift is normal and return is learnable; seeing the pattern is the first half of return."
                how="Use AXZIO for a week and your first reflection grows here."
              />
            </HelpBubble>
          }
        />
        <p className="text-[15px] leading-relaxed text-white/40">
          A week of entries will grow your first reflection here — what the
          system notices, a possible pattern, and questions to sit with.
        </p>
      </Card>
    );
  }

  const notices = [];
  if (lowest) {
    notices.push(
      `${lowest.label} averaged ${avg(lowest.key).toFixed(0)}/10 — your lowest battery this week.`
    );
  }
  if (gapDim) {
    notices.push(
      `${gapDim.label} ran low while flagged high priority — it was promised attention it didn't get.`
    );
  }
  if (curMode || focusMode) {
    notices.push(
      curMode && focusMode && curMode !== focusMode
        ? `You're in ${curMode} mode, with focus set on ${focusMode}.`
        : `Mode: ${curMode || focusMode}.`
    );
  }
  if (created.length || completed.length) {
    notices.push(
      `${created.length} focus action${created.length === 1 ? "" : "s"} created, ${completed.length} completed.`
    );
  }
  if (days.length) {
    notices.push(`Practices held ${grounded} of the last ${days.length} days with entries.`);
  }
  if (resets) {
    notices.push(`${resets} Reset session${resets === 1 ? "" : "s"} this week.`);
  }

  let pattern =
    "One read: the week looks steady — the signal to watch is whatever repeats.";
  if (openQ1 > 0 && rate !== null && rate < 0.5) {
    pattern =
      "One read: urgent items are aging while new ones keep arriving — the one thing may need re-choosing.";
  } else if (gapDim) {
    pattern =
      "One read: a flagged battery keeps running low — either the priority or the load wants renegotiating.";
  } else if (resets >= 2) {
    pattern =
      "One read: repeated Resets on similar ground — there may be a friction worth naming as a LifeMod.";
  }

  const prompts = [
    "What drained the most energy this week — and was it friction, or the pressure of growth?",
  ];
  if (created.length - completed.length >= 3) {
    prompts.push("Which open item is heaviest — and what would finishing it unlock?");
  } else {
    prompts.push("Which commitment received the least of you?");
  }

  const rituals = [];
  if (openQ1 > 0) rituals.push("Run a Guided Reset on the heaviest open item.");
  if (gapDim) rituals.push(`Give ${gapDim.label.toLowerCase()} one deliberate act of care today.`);
  rituals.push("Name one friction as a LifeMod — remove drag or build lift.");
  if (resets >= 2 && !openQ1) rituals.push("Revisit your oldest open seed: does it still deserve orbit?");

  return (
    <Card className="axzio-rise axzio-rise-3 p-6">
      <SectionHead
        label="Reflection"
        help={
          <HelpBubble title="Reflection">
            <HelpText
              what="A weekly reading of your own patterns — derived transparently from your entries, never asserted as truth."
              why="Drift is normal and return is learnable; seeing the pattern is the first half of return."
              how="Read it, correct it, ignore it — it's a mirror, not a verdict."
            />
          </HelpBubble>
        }
        right={
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Last 7 days
          </span>
        }
      />

      <div className="mb-5">
        <MicroLabel className="mb-2">What we notice</MicroLabel>
        <ul className="space-y-1.5">
          {notices.slice(0, 4).map((n, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-white/75">
              {n}
            </li>
          ))}
        </ul>
      </div>

      <p className="mb-5 border-l border-white/15 pl-4 text-[14px] italic leading-relaxed text-white/65">
        {pattern}
      </p>

      <div className="mb-5">
        <MicroLabel className="mb-2">Questions to sit with</MicroLabel>
        <ul className="space-y-1.5">
          {prompts.map((p, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-white/75">
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <MicroLabel className="mb-2">Rituals to try</MicroLabel>
        <ul className="space-y-1.5">
          {rituals.slice(0, 2).map((r, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-white/75">
              {r}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-white/35">
        Derived from your entries. Correct it freely — reflections are evidence
        of pattern, not identity labels.
      </p>
    </Card>
  );
}

function PracticeRow({ practice, entry, today }) {  const { setOrientationText, setOrientationDone } = useAxzio();  const [expanded, setExpanded] = useState(false);
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
              <p className="mt-2 text-[12px] leading-relaxed text-white/40">
                Choosing aimed it — the practice completes when the action
                is taken. Completing it in Focus marks this automatically.
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
              {candidates.filter((f) => f.id !== displayItem.id).length > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <MicroLabel className="mb-2">
                    Choose a different action
                  </MicroLabel>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value)
                        setOrientationFocusItem(today, e.target.value);
                    }}
                    className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
                    aria-label="Choose a different action from Focus"
                  >
                    <option value="" disabled>
                      Select a focus item…
                    </option>
                    {candidates
                      .filter((f) => f.id !== displayItem.id)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {(f.text.length > 64
                            ? f.text.slice(0, 64) + "…"
                            : f.text) +
                            (f.timeframe !== "day" ? ` · ${f.timeframe}` : "")}
                        </option>
                      ))}
                  </select>
                  <p className="mt-2 text-[12px] leading-relaxed text-white/40">
                    Choosing one makes it rank 1 in Focus. The check marks when it's taken — completing the item in Focus marks it automatically.
                  </p>
                </div>
              )}
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
                    Choosing one makes it rank 1 in Focus. The check marks when it's taken — completing the item in Focus marks it automatically.
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
      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
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


