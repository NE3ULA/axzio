import { useMemo, useState } from "react";
import {
  useAxzio,
  QUADRANTS,
  TIMEFRAMES,
  PRIORITY_RANKS,
  priorityLabel,
  timeframeLabel,
  modeLabel,
  pillarLabel,
  MODES,
  PILLARS,
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  commitmentText,
  describeSchedule,
  sortedCommitments,
  goalById,
  goalsForCommitment,
  effectiveServes,
  descendantIds,
  habitOccurrences,
  timeframeRange,
  localDateKey,
  QUEST_KINDS,
  formatLongDate,
} from "../store.jsx";
import {
  Card,
  MicroLabel,
  Btn,
  Field,
  TextArea,
  Pill,
  SectionHead,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* FOCUS — the Decision Engine home: name what needs doing, rank the   */
/* priorities per timeframe, and work the Eisenhower Matrix as a       */
/* prioritization lens.                                                */
/* ------------------------------------------------------------------ */

const QUAD_KEYS = ["q1", "q2", "q3", "q4"];
const VALID_MODES = MODES.map((m) => m.key);
const VALID_PILLARS = PILLARS.map((p) => p.key);

/* SessionRow — one scheduled practice session, derived live from a
   habit's schedule. Renders inside the habit's matrix quadrant; done
   state is toggled per date against the habit itself. */
function SessionRow({ session, showDate }) {
  const { state, toggleHabitSession } = useAxzio();
  const s = session;
  const minsLabel = (m) =>
    m >= 60 && m % 60 === 0 ? `${m / 60} h` : `${m} min`;
  const dayLabel = (dateKey) => {
    const [y, m, d] = dateKey.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
    });
  };
  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5">
      <button
        type="button"
        onClick={() => toggleHabitSession(s.habit.id, s.date)}
        aria-pressed={s.done}
        aria-label={s.done ? "Reopen session" : "Complete session"}
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
          s.done
            ? "border-white/70 bg-white text-black"
            : "border-white/30 hover:border-white/70"
        }`}
      >
        {s.done && (
          <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5.5l2.5 2.5 4.5-5.5"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[14px] leading-snug ${
            s.done ? "text-white/40 line-through" : "text-white/85"
          }`}
        >
          {s.habit.text}
        </p>
        <p className="mt-0.5 truncate text-[11px] tracking-[0.08em] text-white/40">
          {commitmentText(state, s.habit.commitmentId)} · {minsLabel(s.minutes)}
        </p>
      </div>
      {showDate && (
        <span className="shrink-0 text-[11px] tabular-nums tracking-[0.1em] text-white/45">
          {dayLabel(s.date)}
        </span>
      )}
      <Pill>Habit</Pill>
    </li>
  );
}

/* HabitSessionGroup — one consolidated row per habit on the week/month
   tabs, where a daily row per session would clutter the quadrant. Shows
   the habit, its rhythm and M/N progress; expanding reveals the
   individual session rows for checking off. */
function HabitSessionGroup({ sessions, showDate }) {
  const { state } = useAxzio();
  const [expanded, setExpanded] = useState(false);
  const h = sessions[0].habit;
  const done = sessions.filter((s) => s.done).length;
  return (
    <li className="rounded-lg border border-white/10">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse sessions" : "Expand sessions"}
          className="shrink-0 rounded p-1 text-white/40 transition-colors hover:text-white"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path
              d="M4.5 2.5l3.5 3.5-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] leading-snug text-white/85">
            {h.text}
          </p>
          <p className="mt-0.5 truncate text-[11px] tracking-[0.08em] text-white/40">
            {commitmentText(state, h.commitmentId)} · {describeSchedule(h.schedule)}
          </p>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums tracking-[0.1em] text-white/45">
          {done}/{sessions.length}
        </span>
        <Pill>Habit</Pill>
      </div>
      {expanded && (
        <ul className="space-y-1.5 px-3 pb-3">
          {sessions.map((s) => (
            <SessionRow key={s.key} session={s} showDate={showDate} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ScheduledYearSummary — per-habit session progress for the year tab,
   where individual session rows would be noise. */
function ScheduledYearSummary() {
  const { state } = useAxzio();
  const { fromKey, toKey } = timeframeRange("year");
  const habits = (state.habits || []).filter(
    (h) => h && h.active !== false && h.schedule
  );

  const byHabit = new Map();
  for (const h of habits) {
    for (const occ of habitOccurrences(h, fromKey, toKey)) {
      if (!byHabit.has(h.id)) byHabit.set(h.id, { habit: h, total: 0, done: 0 });
      const agg = byHabit.get(h.id);
      agg.total += 1;
      if (h.sessions && h.sessions[occ.date]) agg.done += 1;
    }
  }
  if (byHabit.size === 0) return null;
  return (
    <section className="mb-8">
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-3">
          <MicroLabel>Scheduled — Year</MicroLabel>
          <HelpBubble title="Scheduled sessions">
            <HelpText
              what="The year's scheduled practice, per habit — sessions your habits placed on the calendar."
              why="The year view reads the load your habits committed to: what's scheduled, what's done, what's drifting."
              how="Set a work schedule on any habit, under its commitment on the Identity page. Sessions land in their quadrant on the day, week and month tabs."
            />
          </HelpBubble>
        </div>
        <ul className="space-y-4">
          {[...byHabit.values()].map(({ habit, total, done }) => (
            <li key={habit.id}>
              <div className="mb-1.5 flex items-baseline gap-3">
                <span className="min-w-0 flex-1 truncate text-[14px] text-white/85">
                  {habit.text}
                </span>
                <span className="shrink-0 text-[11px] tabular-nums tracking-[0.14em] text-white/40">
                  {done}/{total} sessions
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-white/60 transition-all"
                  style={{
                    width: `${total ? Math.round((done / total) * 100) : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

export default function Focus() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [timeframe, setTimeframe] = useState("day");
  /* Capture form's progressive layer (1 = text line, 2 = fields, 3 = quest).
     Held here so the preference survives timeframe tab switches. */
  const [captureLayer, setCaptureLayer] = useState(1);
  const items = state.focusItems;

  const byId = useMemo(() => new Map(items.map((f) => [f.id, f])), [items]);

  /** Top-level items (children nest under parents) in the active timeframe. */
  const visible = useMemo(
    () =>
      items.filter((f) => {
        const topLevel = !f.parentId || !byId.has(f.parentId);
        return topLevel && f.timeframe === timeframe;
      }),
    [items, byId, timeframe]
  );

  const byQuadrant = useMemo(() => {
    const map = { q1: [], q2: [], q3: [], q4: [] };
    for (const f of visible) {
      if (map[f.quadrant]) map[f.quadrant].push(f);
      else map.q2.push(f);
    }
    // open first, ranked priorities first, oldest first
    for (const k of QUAD_KEYS) {
      map[k].sort(
        (a, b) =>
          Number(a.done) - Number(b.done) ||
          (a.priority || 99) - (b.priority || 99) ||
          a.created - b.created
      );
    }
    return map;
  }, [visible]);

  const openCount = visible.filter((f) => !f.done).length;

  /** Goal sessions derived into the active timeframe, bucketed by the
      goal's quadrant. Unscheduled goals never appear here — they aren't
      on the day's matrix until given a work rhythm (or linked manually
      from a captured item via Serves). */
  const sessionsByQuadrant = useMemo(() => {
    const map = { q1: [], q2: [], q3: [], q4: [] };
    if (timeframe === "year") return map;
    const { fromKey, toKey } = timeframeRange(timeframe);
    const habits = (state.habits || []).filter(
      (h) => h && h.active !== false && h.schedule
    );
    for (const h of habits) {
      const q = map[h.quadrant] ? h.quadrant : "q2";
      for (const occ of habitOccurrences(h, fromKey, toKey)) {
        map[q].push({
          key: `${h.id}:${occ.date}`,
          habit: h,
          date: occ.date,
          minutes: occ.minutes,
          done: !!(h.sessions && h.sessions[occ.date]),
        });
      }
    }
    for (const k of QUAD_KEYS) {
      map[k].sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0
      );
    }
    return map;
  }, [state.habits, timeframe]);

  const openSessionCount = QUAD_KEYS.reduce((n, k) => {
    const ss = sessionsByQuadrant[k];
    if (timeframe === "day") return n + ss.filter((s) => !s.done).length;
    return n + new Set(ss.filter((s) => !s.done).map((s) => s.habit.id)).size;
  }, 0);

  /** The 1st/2nd/3rd priorities for the active timeframe. */
  const priorities = useMemo(
    () =>
      PRIORITY_RANKS.map((r) => ({
        ...r,
        item:
          items.find(
            (f) =>
              f.timeframe === timeframe && f.priority === r.rank && !f.done
          ) || null,
      })),
    [items, timeframe]
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <MicroLabel className="mb-2">Decision Engine</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Focus
        </h2>
        <p className="mt-4 text-xl font-light leading-relaxed text-white/85 md:text-2xl">
          What matters now?
        </p>
        <p className="mt-1 text-xl font-light leading-relaxed text-white/85 md:text-2xl">
          What should I do next?
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
          Name what needs doing — plainly, as action. The Eisenhower Matrix
          separates urgency from importance so attention lands on{" "}
          <span className="text-white/80">doing, not deliberating</span>. Most
          of your focus belongs in{" "}
          <span className="text-white/80">Q1 — urgent and important</span>,
          the work that cannot wait; Q2 protects what matters over time.
        </p>
      </header>

      {/* priorities for the active timeframe */}
      <section className="axzio-rise axzio-rise-1 mb-6">
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <MicroLabel>Priorities — {timeframeLabel(timeframe)}</MicroLabel>
            <HelpBubble title="Priorities">
              <HelpText
                what="Three ranked priorities per timeframe — 1st is the one thing to focus on. Day, week, month, and year each hold their own independent 1/2/3."
                why="Ranking forces the trade: if everything is priority one, nothing is. The rank makes the choice visible."
                how="Set a rank from any item's editor or its priority control. Each rank holds exactly one item per timeframe — setting it moves the rank here."
              />
            </HelpBubble>
          </div>
          <div className="space-y-3">
            <PrioritySlotHero slot={priorities[0]} />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {priorities.slice(1).map((p) => (
                <PrioritySlot key={p.rank} slot={p} />
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* capture */}
      <section className="axzio-rise axzio-rise-2 mb-8">
        <Card className="p-6">
          <SectionHead
            label="Capture"
            help={
              <HelpBubble title="Capture">
                <HelpText
                  what="Three layers of capture: a text line, then fields (quadrant, timeframe, mode and pillar tags, repeats, commitments), then the optional Quest layer."
                  why="Capture is cheap and fast — the thinking happens later, in the matrix. Getting it out of your head is the whole job here."
                  how="Type the action plainly. Expand the layers only when the item needs them; most items live happily as a single line."
                />
              </HelpBubble>
            }
          />
          <AddFocusForm
            key={timeframe}
            initialTimeframe={timeframe}
            layer={captureLayer}
            setLayer={setCaptureLayer}
          />
        </Card>
      </section>

      {/* goal-scheduled work sessions for the active timeframe */}
      {timeframe === "year" && <ScheduledYearSummary />}

      {/* the matrix */}
      <section className="axzio-rise axzio-rise-3">
        <SectionHead
          label="The Matrix"
          help={
            <HelpBubble title="The Matrix">
              <HelpText
                what="The Eisenhower Matrix: a prioritization lens inside the Decision Engine — urgency on one axis, importance on the other."
                why="Urgency shouts; importance compounds. The matrix protects attention for aligned action instead of reactive motion."
                how="Capture items, place each in a quadrant and timeframe, tag mode and pillar, move them as reality changes, link commitments, and rank the 1/2/3 priorities. Habits place their practice sessions in their quadrant on their own — the Habit pill marks them."
              />
            </HelpBubble>
          }
          right={
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              {openCount + openSessionCount} open
            </span>
          }
        />
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Timeframe"
        >
          {TIMEFRAMES.map((t) => {
            const active = timeframe === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTimeframe(t.key)}
                className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.2em] transition-colors ${
                  active
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {QUADRANTS.map((q, i) => (
            <QuadrantCard
              key={q.key}
              quadrant={q}
              items={byQuadrant[q.key]}
              sessions={sessionsByQuadrant[q.key]}
              showSessionDates={timeframe !== "day"}
              consolidate={timeframe !== "day"}
              index={i}
              emphasized={q.key === "q1"}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/**
 * Rank 1, large: the one thing to focus on takes roughly the space of
 * ranks 2 and 3 combined — the hierarchy is visual, not just ordinal.
 */
function PrioritySlotHero({ slot }) {
  const { setPriority } = useAxzio();
  return (
    <div
      className={`rounded-xl border p-6 ${
        slot.item ? "border-white/40 bg-white/[0.04]" : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <MicroLabel>{priorityLabel(slot.rank)}</MicroLabel>
        {slot.item && (
          <button
            onClick={() => setPriority(slot.item.id, null)}
            aria-label={`Clear ${priorityLabel(slot.rank)}`}
            className="text-white/25 transition-colors hover:text-white/80"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        )}
      </div>
      {slot.item ? (
        <p className="mt-3 line-clamp-3 text-xl font-light leading-snug text-white md:text-2xl">
          {slot.item.text}
        </p>
      ) : (
        <p className="mt-3 text-[15px] tracking-wide text-white/30">
          Not set — rank an item 1st to name the one thing to focus on.
        </p>
      )}
    </div>
  );
}

function PrioritySlot({ slot }) {
  const { setPriority } = useAxzio();
  return (
    <div
      className={`rounded-xl border p-4 ${
        slot.item
          ? "border-white/30 bg-white/[0.03]"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <MicroLabel>{priorityLabel(slot.rank)}</MicroLabel>
        {slot.item && (
          <button
            onClick={() => setPriority(slot.item.id, null)}
            aria-label={`Clear ${priorityLabel(slot.rank)}`}
            className="text-white/25 transition-colors hover:text-white/80"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        )}
      </div>
      {slot.item ? (
        <p className="mt-2 line-clamp-2 text-[15px] leading-snug text-white">
          {slot.item.text}
        </p>
      ) : (
        <p className="mt-2 text-[13px] tracking-wide text-white/30">
          Not set
        </p>
      )}
    </div>
  );
}

const selectClass =
  "rounded-xl border border-white/15 bg-black px-4 py-3 text-[13px] tracking-wide text-white outline-none focus:border-white/50";


/**
 * Capture in three progressive layers:
 *   1 — just the text input line (default, fully collapsed)
 *   2 — quadrant, timeframe, commitment, mode, pillar
 *   3 — quest fields (Make Quest, brief, help kinds)
 * The expand icon toggles 1 ↔ 2; a distinct button opens 3.
 */
function AddFocusForm({ initialTimeframe, layer, setLayer }) {
  const { state, addFocusItem, addCommitment } = useAxzio();
  const commitments = sortedCommitments(state);
  const [text, setText] = useState("");
  const [quadrant, setQuadrant] = useState("q2");
  const [tf, setTf] = useState(initialTimeframe);
  const [mode, setMode] = useState("");
  const [pillar, setPillar] = useState("");
  const [commitmentId, setCommitmentId] = useState("");
  const [newCommitment, setNewCommitment] = useState("");
  const [isQuest, setIsQuest] = useState(false);
  const [brief, setBrief] = useState("");
  const [kinds, setKinds] = useState([]);

  const toggleKind = (key) =>
    setKinds((ks) =>
      ks.includes(key) ? ks.filter((k) => k !== key) : [...ks, key]
    );

  const submit = (e) => {
    e.preventDefault();
    let cid = null;
    let gid = null;
    if (commitmentId === "__new__") {
      const nc = addCommitment(newCommitment);
      cid = nc ? nc.id : null;
    } else if (commitmentId.startsWith("g:")) {
      gid = commitmentId.slice(2);
    } else if (commitmentId.startsWith("c:")) {
      cid = commitmentId.slice(2);
    } else if (commitmentId) {
      cid = commitmentId;
    }
    if (
      addFocusItem(text, quadrant, {
        timeframe: tf,
        mode: mode || null,
        pillar: pillar || null,
        commitmentId: cid,
        goalId: gid,
        quest: { isQuest, brief, kinds },
      })
    ) {
      setText("");
      setCommitmentId("");
      setNewCommitment("");
      setMode("");
      setPillar("");
      setIsQuest(false);
      setBrief("");
      setKinds([]);
    }
  };

  return (
    <form onSubmit={submit}>
      {/* Layer 1 — the text line, always visible */}
      <div className="flex items-center gap-2">
        <Field
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing? — name it plainly"
          maxLength={160}
          className="flex-1"
          aria-label="New action"
        />
        <Btn type="submit" variant="ghost" disabled={!text.trim()}>
          Place
        </Btn>
        <button
          type="button"
          onClick={() => setLayer(layer >= 2 ? 1 : 2)}
          aria-expanded={layer >= 2}
          aria-label={layer >= 2 ? "Fewer capture options" : "More capture options"}
          title={layer >= 2 ? "Collapse options" : "Expand options"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 text-white/50 transition-colors hover:border-white/40 hover:text-white"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${
              layer >= 2 ? "rotate-180" : ""
            }`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      {/* Layer 2 — placement fields */}
      {layer >= 2 && (
        <div className="axzio-rise mt-3">
          <div className="flex flex-wrap gap-3">
            <select
              value={quadrant}
              onChange={(e) => setQuadrant(e.target.value)}
              aria-label="Quadrant"
              className={selectClass}
            >
              {QUADRANTS.map((q, i) => (
                <option key={q.key} value={q.key}>
                  Q{i + 1} {q.label} — {q.sub}
                </option>
              ))}
            </select>
            <select
              value={tf}
              onChange={(e) => setTf(e.target.value)}
              aria-label="Timeframe"
              className={selectClass}
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              aria-label="Mode tag"
              className={selectClass}
            >
              <option value="">No mode tag</option>
              {VALID_MODES.map((m) => (
                <option key={m} value={m}>
                  {modeLabel(m)}
                </option>
              ))}
            </select>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value)}
              aria-label="Pillar tag"
              className={selectClass}
            >
              <option value="">No pillar tag</option>
              {VALID_PILLARS.map((p) => (
                <option key={p} value={p}>
                  {pillarLabel(p)}
                </option>
              ))}
            </select>
            <select
              value={commitmentId}
              onChange={(e) => setCommitmentId(e.target.value)}
              aria-label="Serves — goal or commitment"
              className={`${selectClass} max-w-[220px]`}
            >
              <option value="">Serves…</option>
              {commitments.map((c) => {
                const goals = goalsForCommitment(state, c.id).filter(
                  (g) => !g.done
                );
                return (
                  <optgroup
                    key={c.id}
                    label={
                      c.text.length > 40 ? c.text.slice(0, 40) + "…" : c.text
                    }
                  >
                    <option value={`c:${c.id}`}>
                      {c.text.length > 30 ? c.text.slice(0, 30) + "…" : c.text}
                    </option>
                    {goals.map((g) => (
                      <option key={g.id} value={`g:${g.id}`}>
                        ◦{" "}
                        {g.text.length > 28
                          ? g.text.slice(0, 28) + "…"
                          : g.text}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
              <option value="__new__">New commitment…</option>
            </select>
          </div>
          {commitmentId === "__new__" && (
            <div className="axzio-rise mt-3">
              <Field
                value={newCommitment}
                onChange={(e) => setNewCommitment(e.target.value)}
                placeholder="Name the new commitment — it is created on Place"
                maxLength={120}
                aria-label="New commitment"
              />
            </div>
          )}
          {/* Layer 3 — distinct expander for quest fields */}
          <button
            type="button"
            onClick={() => setLayer(layer >= 3 ? 2 : 3)}
            aria-expanded={layer >= 3}
            className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/55 transition-colors hover:border-white/50 hover:text-white"
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className={`transition-transform duration-200 ${
                layer >= 3 ? "rotate-45" : ""
              }`}
            >
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            {layer >= 3 ? "Hide quest options" : "Quest options"}
          </button>
        </div>
      )}

      {/* Layer 3 — quest fields */}
      {layer >= 3 && (
        <div className="axzio-rise mt-3 rounded-xl border border-white/10 p-4">
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Quest</MicroLabel>
            <HelpBubble title="Quest">
              <HelpText
                what="Posting a quest turns this action into an invitation: here's how someone could help. Only quested items can ever be picked up by your tribe — everything else stays yours."
                why="Writing the brief clarifies the task for you too: naming the help you need often reveals the real next move."
                how="Flip Make Quest on, write the brief, pick the kinds of help. Tribe grabbing and sharing arrive later with accounts."
              />
            </HelpBubble>
          </div>
          <button
            type="button"
            onClick={() => setIsQuest((q) => !q)}
            aria-pressed={isQuest}
            className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              isQuest
                ? "border-white/70 bg-white/10 text-white"
                : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
            }`}
          >
            {isQuest ? "Quested" : "Make Quest"}
          </button>
          {isQuest && (
            <div className="mt-3 space-y-4">
              <TextArea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={3}
                maxLength={600}
                placeholder="How could someone help with this?"
                aria-label="Quest brief — how someone could help"
              />
              <div>
                <MicroLabel className="mb-2">What kind of help?</MicroLabel>
                <div className="flex flex-wrap gap-2">
                  {QUEST_KINDS.map((k) => {
                    const on = kinds.includes(k.key);
                    return (
                      <button
                        type="button"
                        key={k.key}
                        onClick={() => toggleKind(k.key)}
                        aria-pressed={on}
                        title={k.desc}
                        className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                          on
                            ? "border-white/70 bg-white/10 text-white"
                            : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                        }`}
                      >
                        {k.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function QuadrantCard({ quadrant, items, sessions = [], showSessionDates, consolidate, index, emphasized }) {
  const openItems = items.filter((f) => !f.done).length;
  const openSessions = consolidate
    ? new Set(sessions.filter((s) => !s.done).map((s) => s.habit.id)).size
    : sessions.filter((s) => !s.done).length;
  const open = openItems + openSessions;
  // Week/month: one row per habit (sorted by first session); day keeps
  // the individual rows.
  const sessionGroups = [];
  if (consolidate) {
    const byHabit = new Map();
    for (const s of sessions) {
      if (!byHabit.has(s.habit.id)) byHabit.set(s.habit.id, []);
      byHabit.get(s.habit.id).push(s);
    }
    sessionGroups.push(
      ...[...byHabit.values()].sort((a, b) => (a[0].date < b[0].date ? -1 : 1))
    );
  }
  return (
    <Card
      className={`axzio-rise axzio-rise-${(index % 4) + 1} p-6 ${
        emphasized ? "border-white/40 bg-white/[0.03]" : ""
      }`}
    >
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-medium tracking-[0.14em]">
          <span className="mr-2 text-white/40">Q{index + 1}</span>
          {quadrant.label.toUpperCase()}
        </h3>
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          {open} open
        </span>
      </div>
      {emphasized && (
        <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-white/60">
          Where focus goes first
        </p>
      )}
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
        {quadrant.sub}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        {quadrant.desc}
      </p>

      <div className="mt-4 space-y-2">
        {items.length === 0 && sessions.length === 0 && (
          <p className="py-4 text-center text-sm tracking-wide text-white/30">
            Empty quadrant.
          </p>
        )}
        {consolidate
          ? sessionGroups.map((g) => (
              <HabitSessionGroup
                key={g[0].habit.id}
                sessions={g}
                showDate={showSessionDates}
              />
            ))
          : sessions.map((s) => (
              <SessionRow key={s.key} session={s} showDate={showSessionDates} />
            ))}
        {items.map((f) => (
          <FocusRow key={f.id} item={f} depth={0} />
        ))}
      </div>
    </Card>
  );
}

function FocusRow({ item, depth }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const commitments = sortedCommitments(state);
  const [expanded, setExpanded] = useState(false);
  // Draft for the expanded editor — edits apply on Save, discard on Cancel.
  const [draft, setDraft] = useState(null);

  const children = state.focusItems.filter((f) => f.parentId === item.id);
  const hasChildren = children.length > 0 && depth < 4;

  const openEditor = () => {
    setDraft({
      text: item.text,
      quadrant: item.quadrant,
      timeframe: item.timeframe || "day",
      daysOfWeek: [...(item.daysOfWeek || [])],
      months: [...(item.months || [])],
      mode: item.mode || "",
      pillar: item.pillar || "",
      commitmentId: item.commitmentId,
      goalId: item.goalId || null,
      parentId: item.parentId || "",
      notes: item.notes || "",
      subtasks: (item.subtasks || []).map((s) => ({ ...s })),
      priority: item.priority || null,
      quest: {
        isQuest: !!(item.quest && item.quest.isQuest),
        brief: (item.quest && item.quest.brief) || "",
        kinds: [...((item.quest && item.quest.kinds) || [])],
      },
    });
    setExpanded(true);
  };
  const closeEditor = () => {
    setExpanded(false);
    setDraft(null);
  };
  const collectPatch = () =>
    draft
      ? {
          text: draft.text,
          quadrant: draft.quadrant,
          timeframe: draft.timeframe,
          daysOfWeek: draft.daysOfWeek,
          months: draft.months,
          mode: draft.mode || null,
          pillar: draft.pillar || null,
          commitmentId: draft.commitmentId,
          goalId: draft.goalId || null,
          parentId: draft.parentId || null,
          notes: draft.notes,
          subtasks: draft.subtasks,
          priority: draft.priority,
          quest: draft.quest,
        }
      : {};
  const saveEditor = () => {
    if (!draft) return;
    axzio.updateFocusItem(item.id, collectPatch());
    closeEditor();
  };
  /** Save any pending edits, then open a Guided Reset from this action. */
  const exploreInReset = () => {
    if (draft) axzio.updateFocusItem(item.id, collectPatch());
    if (axzio.requestResetFromDecision(item.id)) {
      closeEditor();
      window.location.hash = "#/journeys";
    }
  };

  // Quick priority bubbles on the collapsed row: tapping a rank assigns it
  // (store exclusivity switches it off whoever held it); tapping the
  // active rank clears it. An open editor draft is updated too, so Save
  // can't clobber the tap.
  const setPriorityRank = (r) => {
    const next = item.priority === r ? null : r;
    axzio.setPriority(item.id, next);
    if (draft) setDraft((d) => ({ ...d, priority: next }));
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        item.done
          ? "border-white/8 bg-transparent opacity-50"
          : "border-white/12 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => axzio.toggleFocusDone(item.id)}
          aria-label={item.done ? "Reopen item" : "Mark done"}
          aria-pressed={item.done}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            item.done
              ? "border-white/70 bg-white text-black"
              : "border-white/30 hover:border-white/70"
          }`}
        >
          {item.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5.5l2.5 2.5 4.5-5.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </button>

        <button
          onClick={() => (expanded ? closeEditor() : openEditor())}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse editor" : "Expand editor"}
          className="min-w-0 flex-1 text-left"
        >
          <p
            className={`truncate text-[15px] leading-snug ${
              item.done ? "text-white/50 line-through" : ""
            }`}
          >
            {item.text}
          </p>
        </button>

        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label="Priority rank"
        >
          {[1, 2, 3].map((r) => {
            const on = item.priority === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setPriorityRank(r)}
                aria-pressed={on}
                aria-label={
                  on ? `Remove priority ${r}` : `Set priority ${r}`
                }
                title={
                  on
                    ? `Priority ${r} — tap to remove`
                    : `Set as priority ${r}`
                }
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-medium transition-colors ${
                  on
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/15 text-white/35 hover:border-white/40 hover:text-white"
                }`}
              >
                {r}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => (expanded ? closeEditor() : openEditor())}
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse editor" : "Expand editor"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className={`transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </button>
      </div>

      {expanded && draft && (
        <FocusItemEditor
          item={item}
          draft={draft}
          setDraft={setDraft}
          commitments={commitments}
          onSave={saveEditor}
          onCancel={closeEditor}
          onExplore={exploreInReset}
          onDelete={() => {
            axzio.deleteFocusItem(item.id);
            closeEditor();
          }}
        />
      )}

      {/* linked subtasks nest inside the parent card */}
      {hasChildren && (
        <div className="mt-2 space-y-2 border-l border-white/15 pl-3">
          {children.map((c) => (
            <FocusRow key={c.id} item={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The expanded inline editor for a focus item: text, quadrant,
 * timeframe (+ repeats), mode/pillar tags, commitment, attach-to,
 * notes, subtasks, priority — Save applies the draft, Cancel discards.
 */
function FocusItemEditor({
  item,
  draft,
  setDraft,
  commitments,
  onSave,
  onCancel,
  onExplore,
  onDelete,
}) {
  const { state } = useAxzio();
  const [newSub, setNewSub] = useState("");
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  // Inheritance: a nested item with no explicit link serves what its
  // parent serves. The select's empty value means "inherit" when the
  // parent serves something, "nothing" otherwise.
  const parentItem = item.parentId
    ? state.focusItems.find((f) => f.id === item.parentId)
    : null;
  const inheritedServes = parentItem
    ? effectiveServes(state, parentItem)
    : { goalId: null, commitmentId: null };
  const inheritedGoal = inheritedServes.goalId
    ? goalById(state, inheritedServes.goalId)
    : null;
  const inheritedLabel = inheritedGoal
    ? inheritedGoal.text
    : commitmentText(state, inheritedServes.commitmentId);

  const updateSub = (id, patch) =>
    set({
      subtasks: draft.subtasks.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  const removeSub = (id) =>
    set({ subtasks: draft.subtasks.filter((s) => s.id !== id) });
  const addSub = () => {
    const t = newSub.trim();
    if (!t) return;
    set({
      subtasks: [
        ...draft.subtasks,
        { id: `sub-${Date.now()}-${draft.subtasks.length}`, text: t, done: false },
      ],
    });
    setNewSub("");
  };

  const toggleInList = (list, key) =>
    setDraft((d) => ({
      ...d,
      [list]: d[list].includes(key)
        ? d[list].filter((k) => k !== key)
        : [...d[list], key],
    }));

  // Attach-to candidates: open items, excluding self and descendants
  // (attaching there would create a cycle).
  const blocked = new Set([item.id, ...descendantIds(state.focusItems, item.id)]);
  const attachCandidates = state.focusItems.filter(
    (f) => !f.done && !blocked.has(f.id)
  );

  return (
    <div className="mt-4 space-y-5 border-t border-white/10 pt-4">
      <div>
        <MicroLabel className="mb-2">Action</MicroLabel>
        <Field
          value={draft.text}
          onChange={(e) => set({ text: e.target.value })}
          maxLength={160}
          placeholder="Name it plainly"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <MicroLabel className="mb-2">Quadrant</MicroLabel>
          <select
            value={draft.quadrant}
            onChange={(e) => set({ quadrant: e.target.value })}
            aria-label="Quadrant"
            className={`${selectClass} w-full`}
          >
            {QUADRANTS.map((q, i) => (
              <option key={q.key} value={q.key}>
                Q{i + 1} {q.label} — {q.sub}
              </option>
            ))}
          </select>
        </div>
        <div>
          <MicroLabel className="mb-2">Timeframe</MicroLabel>
          <select
            value={draft.timeframe}
            onChange={(e) => set({ timeframe: e.target.value })}
            aria-label="Timeframe"
            className={`${selectClass} w-full`}
          >
            {TIMEFRAMES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Mode tag</MicroLabel>
            <HelpBubble title="Mode tag">
              <HelpText
                what="Which mode this action belongs to — People, Pleasure, or Production."
                why="Tagging reveals where your actions actually land versus where you intended your focus to go."
                how="Optional. Over time the tags feed the readings about your modes."
              />
            </HelpBubble>
          </div>
          <select
            value={draft.mode}
            onChange={(e) => set({ mode: e.target.value })}
            aria-label="Mode tag"
            className={`${selectClass} w-full`}
          >
            <option value="">No mode tag</option>
            {VALID_MODES.map((m) => (
              <option key={m} value={m}>
                {modeLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Pillar tag</MicroLabel>
            <HelpBubble title="Pillar tag">
              <HelpText
                what="Which pillar this action serves — Mind, Body, Heart, or Spirit."
                why="The tags show whether your doing is balanced across the four dimensions or collapsing into one."
                how="Optional. Read a task through its pillar: a Body-tagged item is about the body, not just productivity."
              />
            </HelpBubble>
          </div>
          <select
            value={draft.pillar}
            onChange={(e) => set({ pillar: e.target.value })}
            aria-label="Pillar tag"
            className={`${selectClass} w-full`}
          >
            <option value="">No pillar tag</option>
            {VALID_PILLARS.map((p) => (
              <option key={p} value={p}>
                {pillarLabel(p)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {draft.timeframe === "week" && (
        <div>
          <MicroLabel className="mb-2">Repeats on</MicroLabel>
          <TogglePills
            options={DAYS_OF_WEEK}
            selected={draft.daysOfWeek}
            onToggle={(k) => toggleInList("daysOfWeek", k)}
          />
        </div>
      )}
      {draft.timeframe === "month" && (
        <div>
          <MicroLabel className="mb-2">Repeats in</MicroLabel>
          <TogglePills
            options={MONTHS_OF_YEAR}
            selected={draft.months}
            onToggle={(k) => toggleInList("months", k)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Serves</MicroLabel>
            <HelpBubble title="Serves">
              <HelpText
                what="Links this action to a goal or a commitment. A goal implies its commitment — the ladder runs task → goal → commitment → identity."
                why="This is the thread that makes Focus more than a to-do list: every action can be read as serving — or drifting from — who you're choosing to become."
                how="Pick the goal this action moves forward, or the commitment directly. A nested item with no link of its own inherits its parent's — choose explicitly to override. Goals always live inside a commitment — never floating free."
              />
            </HelpBubble>
          </div>
          <select
            value={
              draft.goalId
                ? `g:${draft.goalId}`
                : draft.commitmentId
                  ? `c:${draft.commitmentId}`
                  : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              if (v.startsWith("g:")) {
                const gid = v.slice(2);
                const g = goalById(state, gid);
                set({
                  goalId: gid,
                  commitmentId: g ? g.commitmentId : null,
                });
              } else if (v.startsWith("c:")) {
                set({ goalId: null, commitmentId: v.slice(2) || null });
              } else {
                set({ goalId: null, commitmentId: null });
              }
            }}
            aria-label="Link to a goal or commitment"
            className={`${selectClass} w-full`}
          >
            <option value="">
              {inheritedLabel
                ? `Inherit from parent — ${inheritedLabel.length > 30 ? inheritedLabel.slice(0, 30) + "…" : inheritedLabel}`
                : "Nothing"}
            </option>
            {commitments.map((c) => {
              const goals = goalsForCommitment(state, c.id).filter(
                (g) => !g.done
              );
              return (
                <optgroup
                  key={c.id}
                  label={
                    c.text.length > 40 ? c.text.slice(0, 40) + "…" : c.text
                  }
                >
                  <option value={`c:${c.id}`}>Commitment — {c.text.length > 30 ? c.text.slice(0, 30) + "…" : c.text}</option>
                  {goals.map((g) => (
                    <option key={g.id} value={`g:${g.id}`}>
                      Goal —{" "}
                      {g.text.length > 34 ? g.text.slice(0, 34) + "…" : g.text}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Attach to…</MicroLabel>
            <HelpBubble title="Attach to">
              <HelpText
                what="Makes this item a subtask of another open item."
                why="Some actions are really steps of a larger one. Nesting keeps the top-level lists honest about what the actual units of work are."
                how="Choose the parent item; this one nests inside it and leaves the top-level list. Choose “Top level” to detach."
              />
            </HelpBubble>
          </div>
          <select
            value={draft.parentId}
            onChange={(e) => set({ parentId: e.target.value })}
            aria-label="Attach to another item"
            className={`${selectClass} w-full`}
          >
            <option value="">Top level — no parent</option>
            {attachCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.text.length > 44 ? c.text.slice(0, 44) + "…" : c.text}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="-mt-3 text-[12px] leading-relaxed text-white/35">
        Attached items nest inside their parent as linked subtasks and leave
        the top-level lists. Choose “Top level” to detach.
      </p>

      <div>
        <MicroLabel className="mb-2">Notes</MicroLabel>
        <TextArea
          value={draft.notes}
          onChange={(e) => set({ notes: e.target.value })}
          rows={3}
          maxLength={2000}
          placeholder="Why does this matter? What is it connected to?"
        />
      </div>

      <div>
        <MicroLabel className="mb-2">Subtasks</MicroLabel>
        {draft.subtasks.length === 0 && (
          <p className="mb-3 text-[13px] tracking-wide text-white/35">
            None yet — break the action into its next moves.
          </p>
        )}
        <ul className="mb-3 space-y-2">
          {draft.subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateSub(s.id, { done: !s.done })}
                aria-label={s.done ? "Reopen subtask" : "Complete subtask"}
                aria-pressed={s.done}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  s.done
                    ? "border-white/70 bg-white text-black"
                    : "border-white/30 hover:border-white/70"
                }`}
              >
                {s.done && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5.5l2.5 2.5 4.5-5.5" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                )}
              </button>
              <Field
                value={s.text}
                onChange={(e) => updateSub(s.id, { text: e.target.value })}
                maxLength={160}
                aria-label="Subtask"
                className={`!py-2 text-[14px] ${s.done ? "text-white/40 line-through" : ""}`}
              />
              <button
                type="button"
                onClick={() => removeSub(s.id)}
                aria-label="Delete subtask"
                className="shrink-0 text-white/25 transition-colors hover:text-white/80"
              >
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Field
            value={newSub}
            onChange={(e) => setNewSub(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSub();
              }
            }}
            placeholder="Add a subtask…"
            maxLength={160}
            aria-label="New subtask"
            className="!py-2 text-[14px]"
          />
          <Btn variant="ghost" onClick={addSub} disabled={!newSub.trim()} className="!px-4 !py-2">
            Add
          </Btn>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <MicroLabel>Priority</MicroLabel>
          <HelpBubble title="Priority ranks">
            <HelpText
              what="The 1st, 2nd, and 3rd priorities for this item's timeframe — 1st is the one thing to focus on."
              why="Ranking forces the trade: if everything is priority one, nothing is. Day, week, month, and year each hold their own independent 1/2/3."
              how="Each rank holds exactly one item per timeframe — setting it here moves the rank to this item."
            />
          </HelpBubble>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => set({ priority: null })}
            aria-pressed={draft.priority === null}
            className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              draft.priority === null
                ? "border-white/70 bg-white/10 text-white"
                : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
            }`}
          >
            None
          </button>
          {PRIORITY_RANKS.map((r) => (
            <button
              type="button"
              key={r.rank}
              onClick={() =>
                set({ priority: draft.priority === r.rank ? null : r.rank })
              }
              aria-pressed={draft.priority === r.rank}
              className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                draft.priority === r.rank
                  ? "border-white/70 bg-white/10 text-white"
                  : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
              }`}
            >
              {priorityLabel(r.rank)}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          Each rank holds one item per timeframe — setting it here moves the
          rank to this item.
        </p>
      </div>

      <div>
        <div className="mb-2 flex items-center gap-2">
          <MicroLabel>Quest</MicroLabel>
          <HelpBubble title="Quest">
            <HelpText
              what="Posting a quest turns this action into an invitation: here's how someone could help. Only quested items can ever be picked up by your tribe — everything else stays yours."
              why="Writing the brief clarifies the task for you too: naming the help you need often reveals the real next move."
              how="Flip Make Quest on, write the brief, pick the kinds of help. Unposting keeps your brief saved. Tribe grabbing and sharing arrive later with accounts."
            />
          </HelpBubble>
        </div>
        <button
          type="button"
          onClick={() =>
            setDraft((d) => ({
              ...d,
              quest: { ...d.quest, isQuest: !d.quest.isQuest },
            }))
          }
          aria-pressed={draft.quest.isQuest}
          className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            draft.quest.isQuest
              ? "border-white/70 bg-white/10 text-white"
              : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
          }`}
        >
          {draft.quest.isQuest ? "Quested" : "Make Quest"}
        </button>
        {draft.quest.isQuest && (
          <div className="mt-3 space-y-4">
            <TextArea
              value={draft.quest.brief}
              onChange={(e) => {
                const v = e.target.value;
                setDraft((d) => ({ ...d, quest: { ...d.quest, brief: v } }));
              }}
              rows={3}
              maxLength={600}
              placeholder="How could someone help with this?"
              aria-label="Quest brief — how someone could help"
            />
            <div>
              <MicroLabel className="mb-2">What kind of help?</MicroLabel>
              <div className="flex flex-wrap gap-2">
                {QUEST_KINDS.map((k) => {
                  const on = draft.quest.kinds.includes(k.key);
                  return (
                    <button
                      type="button"
                      key={k.key}
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          quest: {
                            ...d.quest,
                            kinds: d.quest.kinds.includes(k.key)
                              ? d.quest.kinds.filter((x) => x !== k.key)
                              : [...d.quest.kinds, k.key],
                          },
                        }))
                      }
                      aria-pressed={on}
                      title={k.desc}
                      className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                        on
                          ? "border-white/70 bg-white/10 text-white"
                          : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                      }`}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-white/35">
                Hands — do it with me · Eyes — feedback, a second brain ·
                Funds — money toward it
              </p>
            </div>
          </div>
        )}
        {!draft.quest.isQuest &&
          (draft.quest.brief || draft.quest.kinds.length > 0) && (
            <p className="mt-2 text-[12px] leading-relaxed text-white/35">
              Brief saved — flip Make Quest on to post it again.
            </p>
          )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExplore}
          className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          Explore in Guided Reset →
        </button>
      </div>

      <LinkedResetCard item={item} />

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={onDelete}
          className="text-[11px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-red-200/90"
        >
          Delete
        </button>
        <div className="flex gap-3">
          <Btn variant="quiet" onClick={onCancel}>
            Cancel
          </Btn>
          <Btn variant="ghost" onClick={onSave} disabled={!draft.text.trim()}>
            Save
          </Btn>
        </div>
      </div>
    </div>
  );
}

/**
 * The Guided Reset(s) threaded to this focus item, in both directions:
 * resets triggered FROM the item (via sourceItemId, "Explore in Guided
 * Reset") and the reset this item was created FROM (via sourceResetId,
 * "Add to Focus" on the Action Card). Derived live from state.resets.
 */
function LinkedResetCard({ item }) {
  const { state } = useAxzio();
  const linked = (state.resets || [])
    .filter((r) => r.sourceItemId === item.id)
    .sort((a, b) => b.ts - a.ts);
  const sourceReset = item.sourceResetId
    ? state.resets.find((r) => r.id === item.sourceResetId)
    : null;
  if (linked.length === 0 && !sourceReset) return null;

  return (
    <div>
      <MicroLabel className="mb-2">Guided Reset</MicroLabel>
      {sourceReset && (
        <ResetLinkCard reset={sourceReset} caption="Created from this card" />
      )}
      {linked.length > 0 && (
        <div className={sourceReset ? "mt-3" : ""}>
          <ResetLinkCard
            reset={linked[0]}
            caption={linked.length > 1 ? `${linked.length} resets — most recent` : null}
          />
        </div>
      )}
    </div>
  );
}

/** One Action Card summary linking out to the full card on Journeys. */
function ResetLinkCard({ reset, caption }) {
  return (
    <div className="rounded-xl border border-white/12 bg-white/[0.02] p-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
        Action Card
      </p>
      {reset.act && reset.act.trim() ? (
        <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">
          {reset.act}
        </p>
      ) : (
        <p className="mt-1.5 text-[13px] tracking-wide text-white/40">
          No action recorded on this card.
        </p>
      )}
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <span className="text-[11px] tracking-[0.14em] text-white/35">
          {reset.date ? formatLongDate(reset.date) : ""}
          {caption ? `${reset.date ? " · " : ""}${caption}` : ""}
        </span>
        <a
          href={`#/journeys?reset=${reset.id}`}
          className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-white/60 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white hover:decoration-white/80"
        >
          Open Action Card →
        </a>
      </div>
    </div>
  );
}

function TogglePills({ options, selected, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = selected.includes(o.key);
        return (
          <button
            type="button"
            key={o.key}
            aria-pressed={active}
            onClick={() => onToggle(o.key)}
            className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              active
                ? "border-white/70 bg-white/10 text-white"
                : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
