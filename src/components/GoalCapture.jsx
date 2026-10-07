import { useState } from "react";
import { useAxzio, sortedCommitments, formatLongDate } from "../store.jsx";
import { MicroLabel, Field, Btn, HelpBubble, HelpText } from "./ui.jsx";

/* GoalCapture — compact goal entry. A goal always serves exactly one
   commitment (no orphan goals, per the identity-first rule): pass
   `commitmentId` to lock it, or omit it to show the commitment picker.
   `initialText` pre-fills from a seed or LifeMod; `onCreated` fires
   with the new goal. */
export default function GoalCapture({
  commitmentId = null,
  initialText = "",
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
          setOpen(true);
        }}
        className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
      >
        {initialText ? "Set as goal" : "Add goal"}
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
        maxLength={140}
        aria-label="Goal text"
      />
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

  const startEdit = (g) => {
    setConfirmId(null);
    setEditingId(g.id);
    setEditText(g.text || "");
    setEditHorizon(g.horizon || "");
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditHorizon("");
  };
  const saveEdit = () => {
    if (!editText.trim()) return;
    axzio.updateGoal(editingId, {
      text: editText,
      horizon: editHorizon || null,
    });
    cancelEdit();
  };

  if (goals.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {goals.map((g) =>
        editingId === g.id ? (
          <li
            key={g.id}
            className="rounded-lg border border-white/25 bg-white/[0.03] px-3 py-2"
          >
            <Field
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              maxLength={140}
              aria-label="Goal text"
            />
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
                disabled={!editText.trim()}
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
          className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2"
        >
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
            className={`min-w-0 flex-1 cursor-text text-left text-[14px] leading-snug ${
              g.done ? "text-white/40 line-through" : "text-white/85"
            }`}
          >
            {g.text}
          </button>
          {g.horizon && (
            <span className="shrink-0 text-[11px] tracking-[0.14em] text-white/35">
              {formatLongDate(g.horizon)}
            </span>
          )}
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
  const goals = (state.goals || []).filter(
    (g) =>
      g &&
      ((sourceLifeModId && g.sourceLifeModId === sourceLifeModId) ||
        (sourceStarId && g.sourceStarId === sourceStarId))
  );
  if (goals.length === 0) return null;
  return (
    <ul className="mb-3 space-y-1.5">
      {goals.map((g) => (
        <li
          key={g.id}
          className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2"
        >
          <span
            className={`min-w-0 flex-1 text-[14px] leading-snug ${
              g.done ? "text-white/40 line-through" : "text-white/85"
            }`}
          >
            {g.text}
          </span>
          <a
            href="#/identity"
            className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white"
          >
            In Identity →
          </a>
        </li>
      ))}
    </ul>
  );
}
