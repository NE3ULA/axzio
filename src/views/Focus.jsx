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
  sortedCommitments,
  descendantIds,
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

export default function Focus() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [timeframe, setTimeframe] = useState("day");
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
                what="Three ranked priorities per timeframe — 1st is the One Thing. Day, week, month, and year each hold their own independent 1/2/3."
                why="Ranking forces the trade: if everything is priority one, nothing is. The rank makes the choice visible."
                how="Set a rank from any item's editor or its priority control. Each rank holds exactly one item per timeframe — setting it moves the rank here."
              />
            </HelpBubble>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {priorities.map((p) => (
              <PrioritySlot key={p.rank} slot={p} />
            ))}
          </div>
        </Card>
      </section>

      {/* capture */}
      <section className="axzio-rise axzio-rise-2 mb-8">
        <Card className="p-6">
          <SectionHead label="Capture" />
          <AddFocusForm key={timeframe} initialTimeframe={timeframe} />
        </Card>
      </section>

      {/* the matrix */}
      <section className="axzio-rise axzio-rise-3">
        <SectionHead
          label="The Matrix"
          help={
            <HelpBubble title="The Matrix">
              <HelpText
                what="The Eisenhower Matrix: a prioritization lens inside the Decision Engine — urgency on one axis, importance on the other."
                why="Urgency shouts; importance compounds. The matrix protects attention for aligned action instead of reactive motion."
                how="Capture items, place each in a quadrant and timeframe, tag mode and pillar, move them as reality changes, link commitments, and rank the 1/2/3 priorities."
              />
            </HelpBubble>
          }
          right={
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              {openCount} open
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
        <div className="grid gap-4 md:grid-cols-2">
          {QUADRANTS.map((q, i) => (
            <QuadrantCard
              key={q.key}
              quadrant={q}
              items={byQuadrant[q.key]}
              index={i}
              emphasized={q.key === "q1"}
            />
          ))}
        </div>
      </section>
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

function CommitmentOptions({ commitments, allowNew }) {
  return (
    <>
      <option value="">No commitment</option>
      {commitments.map((c) => (
        <option key={c.id} value={c.id}>
          {c.text.length > 40 ? c.text.slice(0, 40) + "…" : c.text}
        </option>
      ))}
      {allowNew && <option value="__new__">New commitment…</option>}
    </>
  );
}

function AddFocusForm({ initialTimeframe }) {
  const { state, addFocusItem, addCommitment } = useAxzio();
  const commitments = sortedCommitments(state);
  const [text, setText] = useState("");
  const [quadrant, setQuadrant] = useState("q2");
  const [tf, setTf] = useState(initialTimeframe);
  const [mode, setMode] = useState("");
  const [pillar, setPillar] = useState("");
  const [commitmentId, setCommitmentId] = useState("");
  const [newCommitment, setNewCommitment] = useState("");

  const submit = (e) => {
    e.preventDefault();
    let cid = null;
    if (commitmentId === "__new__") {
      const nc = addCommitment(newCommitment);
      cid = nc ? nc.id : null;
    } else if (commitmentId) {
      cid = commitmentId;
    }
    if (
      addFocusItem(text, quadrant, {
        timeframe: tf,
        mode: mode || null,
        pillar: pillar || null,
        commitmentId: cid,
      })
    ) {
      setText("");
      setCommitmentId("");
      setNewCommitment("");
      setMode("");
      setPillar("");
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="flex flex-col gap-3 md:flex-row">
        <Field
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs doing? — name it plainly"
          maxLength={160}
          className="md:flex-1"
        />
        <Btn type="submit" variant="ghost" disabled={!text.trim()}>
          Place
        </Btn>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
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
          aria-label="Commitment"
          className={`${selectClass} max-w-[220px]`}
        >
          <CommitmentOptions commitments={commitments} allowNew />
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
    </form>
  );
}

function QuadrantCard({ quadrant, items, index, emphasized }) {
  const open = items.filter((f) => !f.done).length;
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
        {items.length === 0 && (
          <p className="py-4 text-center text-sm tracking-wide text-white/30">
            Empty quadrant.
          </p>
        )}
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
      parentId: item.parentId || "",
      notes: item.notes || "",
      subtasks: (item.subtasks || []).map((s) => ({ ...s })),
      priority: item.priority || null,
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
          parentId: draft.parentId || null,
          notes: draft.notes,
          subtasks: draft.subtasks,
          priority: draft.priority,
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

  const subCount = (item.subtasks || []).length;
  const subDone = (item.subtasks || []).filter((s) => s.done).length;
  const servesText = commitmentText(state, item.commitmentId);

  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        item.done
          ? "border-white/8 bg-transparent opacity-50"
          : "border-white/12 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => axzio.toggleFocusDone(item.id)}
          aria-label={item.done ? "Reopen item" : "Mark done"}
          aria-pressed={item.done}
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
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
            className={`text-[15px] leading-snug ${
              item.done ? "text-white/50 line-through" : ""
            }`}
          >
            {item.text}
          </p>
          <p className="mt-1.5 flex flex-wrap gap-1.5">
            <Pill>{timeframeLabel(item.timeframe)}</Pill>
            {item.mode && <Pill>{modeLabel(item.mode)}</Pill>}
            {item.pillar && <Pill>{pillarLabel(item.pillar)}</Pill>}
            {item.priority && (
              <Pill tone="lit">{priorityLabel(item.priority)}</Pill>
            )}
          </p>
          {subCount > 0 && (
            <p className="mt-1 text-[11px] tracking-[0.14em] text-white/35">
              {subCount} subtask{subCount === 1 ? "" : "s"} · {subDone}/{subCount} done
            </p>
          )}
          {servesText && (
            <p className="mt-1.5">
              <Pill>Serves: {servesText}</Pill>
            </p>
          )}
        </button>

        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`mt-1.5 shrink-0 text-white/40 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>

      {!expanded && !item.done && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 pl-8">
          {/* move between quadrants */}
          <select
            value={item.quadrant}
            onChange={(e) => axzio.moveFocusItem(item.id, e.target.value)}
            aria-label="Move to quadrant"
            className="rounded-lg border border-white/12 bg-black px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/60 outline-none focus:border-white/40"
          >
            {QUADRANTS.map((q, i) => (
              <option key={q.key} value={q.key}>
                Q{i + 1} {q.label}
              </option>
            ))}
          </select>

          {/* link a commitment */}
          <select
            value={item.commitmentId || ""}
            onChange={(e) =>
              axzio.linkFocusCommitment(item.id, e.target.value || null)
            }
            aria-label="Link to a commitment"
            className="max-w-[190px] rounded-lg border border-white/12 bg-black px-2.5 py-1.5 text-[11px] tracking-wide text-white/60 outline-none focus:border-white/40"
          >
            <option value="">No commitment</option>
            {commitments.map((c) => (
              <option key={c.id} value={c.id}>
                {c.text.length > 34 ? c.text.slice(0, 34) + "…" : c.text}
              </option>
            ))}
          </select>

          {/* priority rank */}
          <select
            value={item.priority || ""}
            onChange={(e) =>
              axzio.setPriority(
                item.id,
                e.target.value === "" ? null : Number(e.target.value)
              )
            }
            aria-label="Priority rank"
            title="Priority rank — 1st is the One Thing"
            className={`rounded-lg border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] outline-none transition-colors ${
              item.priority
                ? "border-white/60 bg-white/10 text-white"
                : "border-white/12 text-white/45 hover:border-white/40 hover:text-white"
            } bg-black focus:border-white/40`}
          >
            <option value="">No priority</option>
            {PRIORITY_RANKS.map((r) => (
              <option key={r.rank} value={r.rank}>
                {priorityLabel(r.rank)}
              </option>
            ))}
          </select>

          <button
            onClick={() => axzio.deleteFocusItem(item.id)}
            aria-label="Delete item"
            className="ml-auto text-white/25 transition-colors hover:text-white/80"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>
      )}

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

      <div className="grid gap-4 md:grid-cols-2">
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
          <MicroLabel className="mb-2">Mode tag</MicroLabel>
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
          <MicroLabel className="mb-2">Pillar tag</MicroLabel>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <MicroLabel className="mb-2">Serves commitment</MicroLabel>
          <select
            value={draft.commitmentId || ""}
            onChange={(e) => set({ commitmentId: e.target.value || null })}
            aria-label="Link to a commitment"
            className={`${selectClass} w-full`}
          >
            <CommitmentOptions commitments={commitments} />
          </select>
        </div>
        <div>
          <MicroLabel className="mb-2">Attach to…</MicroLabel>
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
        <MicroLabel className="mb-2">Priority</MicroLabel>
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExplore}
          className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          Explore in Guided Reset →
        </button>
      </div>

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
