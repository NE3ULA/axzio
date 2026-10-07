import { useState } from "react";
import {
  useAxzio,
  sortedCommitments,
  formatLongDate,
  localDateKey,
} from "../store.jsx";
import { MicroLabel, Field, Btn, HelpBubble, HelpText } from "./ui.jsx";

/* GoalCapture — compact goal entry. A goal is a finishable outcome with
   an optional horizon (done-by date); the work rhythm lives on habits.
   A goal always serves exactly one commitment (no orphan goals, per the
   identity-first rule): pass `commitmentId` to lock it, or omit it to show
   the commitment picker. `initialText` pre-fills from a seed or LifeMod;
   `onCreated` fires with the new goal. */
export default function GoalCapture({
  commitmentId = null,
  initialText = "",
  ctaLabel = null,
  onCreated = null,
  compact = false,
  sourceLifeModId = null,
  sourceStarId = null,
}) {
  const axzio = useAxzio();
  const { state } = axzio;
  const commitments = sortedCommitments(state);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialText);
  const [cid, setCid] = useState(commitmentId);
  const [newCommitment, setNewCommitment] = useState("");
  const [horizon, setHorizon] = useState("");

  const locked = commitmentId != null;
  const creatingCommitment = !locked && cid === "__new__";
  const effectiveCid = locked ? commitmentId : creatingCommitment ? null : cid;

  const submit = () => {
    let targetCid = effectiveCid;
    if (creatingCommitment) {
      const nc = axzio.addCommitment(newCommitment);
      if (!nc) return;
      targetCid = nc.id;
    }
    const g = axzio.addGoal(text, targetCid, {
      horizon: horizon || null,
      sourceLifeModId,
      sourceStarId,
    });
    if (g) {
      setText("");
      setHorizon("");
      setNewCommitment("");
      if (!locked) setCid(null);
      setOpen(false);
      if (onCreated) onCreated(g);
    }
  };

  const canSubmit =
    text.trim() && (effectiveCid || (creatingCommitment && newCommitment.trim()));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setText(initialText);
          setCid(commitmentId);
          setHorizon("");
          setNewCommitment("");
          setOpen(true);
        }}
        className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
      >
        {ctaLabel || (initialText ? "Set as goal" : "Add goal")}
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/15 bg-white/[0.02] ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <MicroLabel>New goal</MicroLabel>
        <HelpBubble title="Goals">
          <HelpText
            what="A defined outcome with a horizon, living inside a commitment. Goals complete; commitments are kept."
            why="The ladder runs task → goal → commitment → identity. A goal that can't name the commitment it serves doesn't belong here."
            how="Name the outcome plainly, set an optional horizon. Pick the commitment it serves — or name a new one right here; it is created with the goal. Completing it honors the goal and feeds the commitment it serves."
            example="“Beta live by December” — serving the AXZIO commitment."
          />
        </HelpBubble>
      </div>
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="The outcome, plainly stated"
        maxLength={80}
        aria-label="Goal text"
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
        Keep it crisp — if it needs paragraphs, it needs refining.
      </p>
      <div className={`mt-3 grid gap-3 ${locked ? "" : "sm:grid-cols-2"}`}>
        {!locked && (
          <div>
            <MicroLabel className="mb-1.5">Serves commitment</MicroLabel>
            <select
              value={cid || ""}
              onChange={(e) => setCid(e.target.value || null)}
              aria-label="Commitment this goal serves"
              className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
            >
              <option value="">Choose a commitment…</option>
              {commitments.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.text.length > 48 ? c.text.slice(0, 48) + "…" : c.text}
                </option>
              ))}
              <option value="__new__">New commitment…</option>
            </select>
            {creatingCommitment && (
              <Field
                value={newCommitment}
                onChange={(e) => setNewCommitment(e.target.value)}
                placeholder="Name the new commitment — it is created with the goal"
                maxLength={120}
                aria-label="New commitment name"
                className="mt-2"
              />
            )}
          </div>
        )}
        <div>
          <MicroLabel className="mb-1.5">Horizon — optional</MicroLabel>
          <input
            type="date"
            value={horizon}
            onChange={(e) => setHorizon(e.target.value)}
            aria-label="Goal horizon"
            className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white outline-none transition-colors hover:border-white/30 [color-scheme:dark]"
          />
          <p className="mt-1.5 text-[12px] leading-relaxed text-white/35">
            The done-by date. The work rhythm lives on habits, below.
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Btn onClick={submit} disabled={!canSubmit}>
          Add goal
        </Btn>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
        >
          Cancel
        </button>
      </div>
      {!effectiveCid && !creatingCommitment && (
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          Every goal serves a commitment — choose one to place it.
        </p>
      )}
    </div>
  );
}

/* GoalsList — the goals serving one commitment, with done toggles.
   The commitment's health reads through its goals. */export function GoalsList({ commitmentId }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const goals = (state.goals || [])
    .filter((g) => g && g.commitmentId === commitmentId)
    .slice()
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) || (a.created || 0) - (b.created || 0)
    );
  const [confirmId, setConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editHorizon, setEditHorizon] = useState("");
  const [editCommitmentId, setEditCommitmentId] = useState(null);
  const [editNewCommitment, setEditNewCommitment] = useState("");
  // Roadmap order: parents first, children nested beneath (one level shown
  // indented; deeper chains flatten under their top parent).
  const ordered = [];
  {
    const ids = new Set(goals.map((g) => g.id));
    const kids = new Map();
    for (const g of goals) {
      if (g.parentId && ids.has(g.parentId)) {
        if (!kids.has(g.parentId)) kids.set(g.parentId, []);
        kids.get(g.parentId).push(g);
      }
    }
    const walk = (g, depth) => {
      ordered.push({ g, depth });
      for (const k of kids.get(g.id) || []) walk(k, depth + 1);
    };
    for (const g of goals) {
      if (!(g.parentId && ids.has(g.parentId))) walk(g, 0);
    }
  }
  const growGoal = (id) => {
    if (axzio.requestGrowthFrom("goal", id)) window.location.hash = "#/journeys";
  };

  const editCommitments = sortedCommitments(state);

  const startEdit = (g) => {
    setConfirmId(null);
    setEditingId(g.id);
    setEditText(g.text || "");
    setEditHorizon(g.horizon || "");
    setEditCommitmentId(g.commitmentId || null);
    setEditNewCommitment("");

  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditHorizon("");
    setEditCommitmentId(null);
    setEditNewCommitment("");

  };
  const editCreatingCommitment = editCommitmentId === "__new__";
  const canSaveEdit =
    editText.trim() &&
    (editCreatingCommitment ? editNewCommitment.trim() : editCommitmentId);
  const saveEdit = () => {
    if (!canSaveEdit) return;
    let targetCid = editCommitmentId;
    if (editCreatingCommitment) {
      const nc = axzio.addCommitment(editNewCommitment);
      if (!nc) return;
      targetCid = nc.id;
    }
    axzio.updateGoal(editingId, {
      text: editText,
      horizon: editHorizon || null,
      commitmentId: targetCid,
    });
    cancelEdit();
  };

  if (goals.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {ordered.map(({ g, depth }) =>
        editingId === g.id ? (
          <li
            key={g.id}
            className="rounded-lg border border-white/25 bg-white/[0.03] px-3 py-2"
          >
            <Field
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={80}
              aria-label="Goal text"
            />
            <div className="mt-2">
              <div>
                <MicroLabel className="mb-1.5">Serves commitment</MicroLabel>
                <select
                  value={editCommitmentId || ""}
                  onChange={(e) => setEditCommitmentId(e.target.value || null)}
                  aria-label="Commitment this goal serves"
                  className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
                >
                  {editCommitments.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.text.length > 48 ? c.text.slice(0, 48) + "…" : c.text}
                    </option>
                  ))}
                  <option value="__new__">New commitment…</option>
                </select>
                {editCreatingCommitment && (
                  <Field
                    value={editNewCommitment}
                    onChange={(e) => setEditNewCommitment(e.target.value)}
                    placeholder="Name the new commitment"
                    maxLength={120}
                    aria-label="New commitment name"
                    className="mt-2"
                  />
                )}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={editHorizon}
                onChange={(e) => setEditHorizon(e.target.value)}
                aria-label="Goal horizon"
                className="rounded-lg border border-white/15 bg-black px-3 py-2 text-[13px] text-white outline-none transition-colors hover:border-white/30 [color-scheme:dark]"
              />
              <span className="flex-1" />
              <button
                type="button"
                onClick={saveEdit}
                disabled={!canSaveEdit}
                className="rounded-lg border border-white/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/80 transition-colors hover:border-white/60 hover:text-white disabled:opacity-40"
              >
                Save
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          </li>
        ) : (
        <li
          key={g.id}
          className={`flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 ${
            depth > 0 ? "ml-6 border-white/[0.07]" : ""
          }`}
        >
          {depth > 0 && (
            <span className="shrink-0 text-white/25" aria-hidden="true">
              ↳
            </span>
          )}
          <button
            type="button"
            onClick={() => axzio.toggleGoalDone(g.id)}
            aria-pressed={g.done}
            aria-label={g.done ? "Reopen goal" : "Complete goal"}
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors ${
              g.done
                ? "border-white/70 bg-white text-black"
                : "border-white/30 hover:border-white/70"
            }`}
          >
            {g.done && (
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1.5 5.5l2.5 2.5 4.5-5.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => startEdit(g)}
            title="Edit goal"
            className="min-w-0 flex-1 cursor-text text-left"
          >
            <span
              className={`block text-[14px] leading-snug ${
                g.done ? "text-white/40 line-through" : "text-white/85"
              }`}
            >
              {g.text}
            </span>
          </button>
          {g.horizon && (
            <span className="shrink-0 text-[11px] tracking-[0.14em] text-white/35">
              {formatLongDate(g.horizon)}
            </span>
          )}
          <button
            type="button"
            onClick={() => growGoal(g.id)}
            title="Grow this goal in the Growth Practice"
            className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/70"
          >
            Grow
          </button>
          {confirmId === g.id ? (
            <span className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  axzio.deleteGoal(g.id);
                  setConfirmId(null);
                }}
                className="text-[11px] uppercase tracking-[0.14em] text-red-200/80 hover:text-red-100"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="text-[11px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmId(g.id)}
              aria-label="Delete goal"
              className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/70"
            >
              ×
            </button>
          )}
        </li>
        )
      )}
    </ul>
  );
}

/* GrownGoalsList — goals that grew from one seed or LifeMod, shown at
   the source. Pass sourceLifeModId or sourceStarId. */
export function GrownGoalsList({ sourceLifeModId = null, sourceStarId = null }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const goals = (state.goals || []).filter(
    (g) =>
      g &&
      ((sourceLifeModId && g.sourceLifeModId === sourceLifeModId) ||
        (sourceStarId && g.sourceStarId === sourceStarId))
  );
  if (goals.length === 0) return null;
  const save = (id) => {
    if (draft.trim()) axzio.updateGoal(id, { text: draft.trim().slice(0, 80) });
    setEditingId(null);
  };
  return (
    <ul className="mb-3 space-y-1.5">
      {goals.map((g) => (
        <li
          key={g.id}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2"
        >
          {editingId === g.id ? (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save(g.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
                maxLength={80}
                className="min-w-0 flex-1 rounded border border-white/20 bg-black px-2 py-1 text-[14px] text-white outline-none focus:border-white/50"
              />
              <button
                type="button"
                onClick={() => save(g.id)}
                className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/60 hover:text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/35 hover:text-white/70"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <span
                className={`min-w-0 flex-1 text-[14px] leading-snug ${
                  g.done ? "text-white/40 line-through" : "text-white/85"
                }`}
              >
                {g.text}
              </span>
              <button
                type="button"
                aria-label="Edit goal"
                onClick={() => {
                  setEditingId(g.id);
                  setDraft(g.text);
                }}
                className="shrink-0 text-white/30 transition-colors hover:text-white/70"
              >
                ✎
              </button>
              <button
                type="button"
                aria-label="Delete goal"
                onClick={() => {
                  if (window.confirm(`Delete “${g.text}”?`)) axzio.deleteGoal(g.id);
                }}
                className="shrink-0 text-white/30 transition-colors hover:text-white/70"
              >
                ×
              </button>
              <a
                href="#/identity"
                className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white"
              >
                In Identity →
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

const SCHEDULE_KINDS = [
  { key: "none", label: "No schedule" },
  { key: "once", label: "One day" },
  { key: "weekly", label: "Weekly" },
];
const WEEKDAY_PICKER = [
  { d: 1, label: "M" },
  { d: 2, label: "T" },
  { d: 3, label: "W" },
  { d: 4, label: "T" },
  { d: 5, label: "F" },
  { d: 6, label: "S" },
  { d: 0, label: "S" },
];

/* GoalScheduleEditor — when the habit gets practiced and for how long.
   value: a schedule object or null. onChange receives the edited
   schedule (or null). The store normalizes on write. */
export function GoalScheduleEditor({ value, onChange }) {
  const s = value || {};
  const kind = s.kind || "none";

  const set = (patch) => {
    const next = { ...s, ...patch };
    if (next.kind === "none") return onChange(null);
    // Keep the draft — and its kind — through transiently invalid states.
    // Clearing a field mid-edit (backspace to retype) must not collapse
    // the form; the store normalizes on write and drops anything invalid.
    onChange(next);
  };

  const toggleDay = (d) => {
    const days = Array.isArray(s.days) ? s.days : [];
    set({
      days: days.includes(d) ? days.filter((x) => x !== d) : [...days, d],
    });
  };

  return (
    <div className="mt-3">
      <div className="mb-2 flex items-center gap-2">
        <MicroLabel>Work sessions</MicroLabel>
        <HelpBubble title="Work sessions">
          <HelpText
            what="When this habit gets practiced, and for how long each time."
            why="A habit with no rhythm is a wish. Scheduling the sessions turns the practice into a rhythm — and Focus pre-fills from it, so the days start populated instead of blank."
            how="One day: a single dated session. Weekly: pick weekdays, minutes per session, a start date and how many weeks it runs. Sessions appear in Focus's day, week and month views, ready to be worked and checked off."
          />
        </HelpBubble>
      </div>
      <div className="mb-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Schedule kind">
        {SCHEDULE_KINDS.map((k) => (
          <button
            key={k.key}
            type="button"
            role="radio"
            aria-checked={kind === k.key}
            onClick={() => {
              if (k.key === "none") return onChange(null);
              set({
                kind: k.key,
                date: s.date || localDateKey(),
                days: Array.isArray(s.days) && s.days.length ? s.days : [1, 2, 3, 4, 5],
                start: s.start || localDateKey(),
                weeks: s.weeks ?? 4,
                minutes: s.minutes || 30,
              });
            }}
            className={`rounded-full border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              kind === k.key
                ? "border-white/70 bg-white/10 text-white"
                : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {kind === "once" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <MicroLabel className="mb-1.5">Day</MicroLabel>
            <input
              type="date"
              value={s.date || ""}
              onChange={(e) => set({ date: e.target.value })}
              aria-label="Session day"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white outline-none transition-colors hover:border-white/30 [color-scheme:dark]"
            />
          </div>
          <div>
            <MicroLabel className="mb-1.5">Minutes</MicroLabel>
            <input
              type="number"
              min={5}
              max={480}
              step={5}
              value={s.minutes ?? 30}
              onChange={(e) =>
                set({
                  minutes: e.target.value === "" ? "" : Number(e.target.value),
                })
              }
              aria-label="Minutes per session"
              className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white outline-none transition-colors hover:border-white/30"
            />
          </div>
        </div>
      )}

      {kind === "weekly" && (
        <div className="space-y-3">
          <div>
            <MicroLabel className="mb-1.5">Weekdays</MicroLabel>
            <div className="flex gap-1.5">
              {WEEKDAY_PICKER.map(({ d, label }) => {
                const on = Array.isArray(s.days) && s.days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleDay(d)}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-[12px] font-medium transition-colors ${
                      on
                        ? "border-white/70 bg-white/15 text-white"
                        : "border-white/15 text-white/40 hover:border-white/40 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <MicroLabel className="mb-1.5">Minutes</MicroLabel>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={s.minutes ?? 30}
                onChange={(e) =>
                  set({
                    minutes:
                      e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                aria-label="Minutes per session"
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white outline-none transition-colors hover:border-white/30"
              />
            </div>
            <div>
              <MicroLabel className="mb-1.5">Starts</MicroLabel>
              <input
                type="date"
                value={s.start || ""}
                onChange={(e) => set({ start: e.target.value })}
                aria-label="Schedule start date"
                className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white outline-none transition-colors hover:border-white/30 [color-scheme:dark]"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <MicroLabel>Duration</MicroLabel>
                <button
                  type="button"
                  onClick={() => set({ weeks: s.weeks == null ? 4 : null })}
                  aria-pressed={s.weeks == null}
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    s.weeks == null
                      ? "border-white/70 bg-white/10 text-white"
                      : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
                  }`}
                >
                  Ongoing
                </button>
              </div>
              {s.weeks == null ? (
                <div className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/60">
                  Ongoing — until paused
                </div>
              ) : (
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={s.weeks ?? 4}
                  onChange={(e) =>
                    set({
                      weeks: e.target.value === "" ? "" : Number(e.target.value),
                    })
                  }
                  aria-label="Duration in weeks"
                  className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white outline-none transition-colors hover:border-white/30"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
