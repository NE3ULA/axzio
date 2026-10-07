import { useState } from "react";
import {
  useAxzio,
  sortedCommitments,
  describeSchedule,
  habitsForCommitment,
  QUADRANTS,
} from "../store.jsx";
import { MicroLabel, Field, Btn, HelpBubble, HelpText } from "./ui.jsx";
import { GoalScheduleEditor } from "./GoalCapture.jsx";

/* HabitCapture — compact habit entry. A habit is a repeating practice with
   a work schedule (not a finishable outcome): it is kept, not completed.
   A habit always serves exactly one commitment (no orphan habits, per the
   identity-first rule): pass `commitmentId` to lock it, or omit it to show
   the commitment picker. A schedule is required — the rhythm is what makes
   it a habit. `initialText` pre-fills from a seed or LifeMod; `onCreated`
   fires with the new habit. */
export default function HabitCapture({
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
  const [schedule, setSchedule] = useState(null);
  const [quadrant, setQuadrant] = useState("q2");

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
    const h = axzio.addHabit(text, targetCid, {
      schedule,
      quadrant,
      sourceLifeModId,
      sourceStarId,
    });
    if (h) {
      setText("");
      setSchedule(null);
      setNewCommitment("");
      setQuadrant("q2");
      if (!locked) setCid(null);
      setOpen(false);
      if (onCreated) onCreated(h);
    }
  };

  // A habit without a rhythm isn't a habit — schedule is required.
  const canSubmit =
    text.trim() &&
    schedule &&
    (effectiveCid || (creatingCommitment && newCommitment.trim()));

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${compact ? "text-[11px]" : "text-[12px]"} uppercase tracking-[0.18em] text-white/45 transition-colors hover:text-white`}
      >
        {ctaLabel || "+ New habit…"}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>New habit</MicroLabel>
        <HelpBubble title="New habit">
          <HelpText
            what="A repeating practice with a rhythm, living inside a commitment. Habits are kept, not finished — the schedule is the practice."
            why="Outcomes complete; practices continue. Giving the rhythm its own home keeps goals honest: if it has sessions instead of a finish line, it's a habit."
            how="Name the practice plainly, set when it happens and for how long. Pick the commitment it serves — or name a new one right here; it is created with the habit. Sessions appear in Focus, ready to be worked and checked off."
          />
        </HelpBubble>
      </div>
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="The practice, plainly stated"
        maxLength={80}
        aria-label="Habit text"
      />
      <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
        Keep it crisp — if it needs paragraphs, it needs refining.
      </p>
      <GoalScheduleEditor value={schedule} onChange={setSchedule} />
      {!schedule && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">
          A rhythm is required — a practice without sessions is a wish.
        </p>
      )}
      <div className={`mt-3 grid gap-3 ${locked ? "" : "sm:grid-cols-2"}`}>
        {!locked && (
          <div>
            <MicroLabel className="mb-1.5">Serves commitment</MicroLabel>
            <select
              value={cid || ""}
              onChange={(e) => setCid(e.target.value || null)}
              aria-label="Commitment this habit serves"
              className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
            >
              <option value="">Choose…</option>
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
                placeholder="Name the new commitment — it is created with the habit"
                maxLength={120}
                aria-label="New commitment name"
                className="mt-2"
              />
            )}
          </div>
        )}
        <div>
          <MicroLabel className="mb-1.5">Quadrant</MicroLabel>
          <select
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value)}
            aria-label="Matrix quadrant for practice sessions"
            className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
          >
            {QUADRANTS.map((q) => (
              <option key={q.key} value={q.key}>
                Q{q.key.slice(1)} — {q.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <Btn onClick={submit} disabled={!canSubmit}>
          Add habit
        </Btn>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* HabitsList — habits serving one commitment, with inline edit. */
export function HabitsList({ commitmentId }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const habits = habitsForCommitment(state, commitmentId);
  const [confirmId, setConfirmId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSchedule, setEditSchedule] = useState(null);
  const [editCommitmentId, setEditCommitmentId] = useState(null);
  const [editNewCommitment, setEditNewCommitment] = useState("");
  const [editQuadrant, setEditQuadrant] = useState("q2");
  const editCommitments = sortedCommitments(state);

  const startEdit = (h) => {
    setConfirmId(null);
    setEditingId(h.id);
    setEditText(h.text || "");
    setEditSchedule(h.schedule || null);
    setEditCommitmentId(h.commitmentId || null);
    setEditNewCommitment("");
    setEditQuadrant(h.quadrant || "q2");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditSchedule(null);
    setEditCommitmentId(null);
    setEditNewCommitment("");
    setEditQuadrant("q2");
  };
  const ordered = [];
  {
    const ids = new Set(habits.map((h) => h.id));
    const kids = new Map();
    for (const h of habits) {
      if (h.parentId && ids.has(h.parentId)) {
        if (!kids.has(h.parentId)) kids.set(h.parentId, []);
        kids.get(h.parentId).push(h);
      }
    }
    const walk = (h, depth) => {
      ordered.push({ h, depth });
      for (const k of kids.get(h.id) || []) walk(k, depth + 1);
    };
    for (const h of habits) {
      if (!(h.parentId && ids.has(h.parentId))) walk(h, 0);
    }
  }
  const growHabit = (id) => {
    if (axzio.requestGrowthFrom("habit", id)) window.location.hash = "#/journeys";
  };
  const editCreatingCommitment = editCommitmentId === "__new__";
  const canSaveEdit =
    editText.trim() &&
    editSchedule &&
    (editCreatingCommitment ? editNewCommitment.trim() : editCommitmentId);
  const saveEdit = () => {
    if (!canSaveEdit) return;
    let targetCid = editCommitmentId;
    if (editCreatingCommitment) {
      const nc = axzio.addCommitment(editNewCommitment);
      if (!nc) return;
      targetCid = nc.id;
    }
    axzio.updateHabit(editingId, {
      text: editText,
      schedule: editSchedule,
      commitmentId: targetCid,
      quadrant: editQuadrant,
    });
    cancelEdit();
  };

  if (habits.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {ordered.map(({ h, depth }) =>
        editingId === h.id ? (
          <li
            key={h.id}
            className="rounded-lg border border-white/25 bg-white/[0.03] px-3 py-2"
          >
            <Field
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={80}
              aria-label="Habit text"
            />
            <div className="mt-2">
              <GoalScheduleEditor
                value={editSchedule}
                onChange={setEditSchedule}
              />
            </div>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div>
                <MicroLabel className="mb-1.5">Serves commitment</MicroLabel>
                <select
                  value={editCommitmentId || ""}
                  onChange={(e) => setEditCommitmentId(e.target.value || null)}
                  aria-label="Commitment this habit serves"
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
              <div>
                <MicroLabel className="mb-1.5">Quadrant</MicroLabel>
                <select
                  value={editQuadrant}
                  onChange={(e) => setEditQuadrant(e.target.value)}
                  aria-label="Matrix quadrant for practice sessions"
                  className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
                >
                  {QUADRANTS.map((q) => (
                    <option key={q.key} value={q.key}>
                      Q{q.key.slice(1)} — {q.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
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
            key={h.id}
            className={`flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2 ${
              h.active === false ? "opacity-45" : ""
            }${depth > 0 ? " ml-6 border-white/[0.07]" : ""}`}
          >
            {depth > 0 && (
              <span className="shrink-0 text-white/25" aria-hidden="true">
                ↳
              </span>
            )}
            <button
              type="button"
              onClick={() => startEdit(h)}
              className="min-w-0 flex-1 text-left"
              aria-label={`Edit habit “${h.text}”`}
            >
              <span className="block truncate text-[14px] leading-snug text-white/85">
                {h.text}
              </span>
              <span className="mt-0.5 block truncate text-[11px] tracking-[0.08em] text-white/40">
                {describeSchedule(h.schedule)}
                {h.active === false ? " · paused" : ""}
              </span>
            </button>
            <span className="shrink-0 text-[11px] tabular-nums tracking-[0.1em] text-white/45">
              {Object.keys(h.sessions || {}).length} done
            </span>
            <button
              type="button"
              onClick={() => axzio.setHabitActive(h.id, h.active === false)}
              className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-white"
              aria-label={h.active === false ? "Resume habit" : "Pause habit"}
            >
              {h.active === false ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={() => growHabit(h.id)}
              title="Grow this habit in the Growth Practice"
              className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/30 transition-colors hover:text-white/70"
            >
              Grow
            </button>
            {confirmId === h.id ? (
              <span className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    axzio.deleteHabit(h.id);
                    setConfirmId(null);
                  }}
                  className="text-[11px] uppercase tracking-[0.14em] text-white/80 transition-colors hover:text-white"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmId(null)}
                  className="text-[11px] uppercase tracking-[0.14em] text-white/40 transition-colors hover:text-white"
                >
                  Keep
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmId(h.id)}
                className="shrink-0 rounded p-1 text-white/25 transition-colors hover:text-white/80"
                aria-label={`Delete habit “${h.text}”`}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1.5 1.5l9 9M10.5 1.5l-9 9"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </button>
            )}
          </li>
        )
      )}
    </ul>
  );
}

/* GrownHabitsList — habits that grew from one seed or LifeMod, shown at
   the source. Pass sourceLifeModId or sourceStarId. */
export function GrownHabitsList({ sourceLifeModId = null, sourceStarId = null }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");
  const habits = (state.habits || []).filter(
    (h) =>
      h &&
      ((sourceLifeModId && h.sourceLifeModId === sourceLifeModId) ||
        (sourceStarId && h.sourceStarId === sourceStarId))
  );
  if (habits.length === 0) return null;
  const save = (id) => {
    if (draft.trim()) axzio.updateHabit(id, { text: draft.trim().slice(0, 80) });
    setEditingId(null);
  };
  return (
    <ul className="mb-3 space-y-1.5">
      {habits.map((h) => (
        <li
          key={h.id}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2"
        >
          {editingId === h.id ? (
            <>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save(h.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                autoFocus
                maxLength={80}
                className="min-w-0 flex-1 rounded border border-white/20 bg-black px-2 py-1 text-[14px] text-white outline-none focus:border-white/50"
              />
              <button
                type="button"
                onClick={() => save(h.id)}
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
              <span className="min-w-0 flex-1 text-[14px] leading-snug text-white/85">
                {h.text}
                <span className="mt-0.5 block truncate text-[11px] tracking-[0.08em] text-white/40">
                  {describeSchedule(h.schedule)}
                </span>
              </span>
              <button
                type="button"
                aria-label="Edit habit"
                onClick={() => {
                  setEditingId(h.id);
                  setDraft(h.text);
                }}
                className="shrink-0 text-white/30 transition-colors hover:text-white/70"
              >
                ✎
              </button>
              <button
                type="button"
                aria-label="Delete habit"
                onClick={() => {
                  if (window.confirm(`Delete “${h.text}”?`)) axzio.deleteHabit(h.id);
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
