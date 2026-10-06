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
}) {
  const axzio = useAxzio();
  const { state } = axzio;
  const commitments = sortedCommitments(state);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(initialText);
  const [cid, setCid] = useState(commitmentId);
  const [horizon, setHorizon] = useState("");

  const locked = commitmentId != null;
  const effectiveCid = locked ? commitmentId : cid;

  const submit = () => {
    const g = axzio.addGoal(text, effectiveCid, { horizon: horizon || null });
    if (g) {
      setText("");
      setHorizon("");
      if (!locked) setCid(null);
      setOpen(false);
      if (onCreated) onCreated(g);
    }
  };

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
            how="Name the outcome plainly, set an optional horizon. Completing it honors the goal and feeds the commitment it serves."
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
            </select>
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
        <Btn onClick={submit} disabled={!text.trim() || !effectiveCid}>
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
      {!effectiveCid && (
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          Every goal serves a commitment — choose one to place it.
        </p>
      )}
    </div>
  );
}

/* GoalsList — the goals serving one commitment, with done toggles.
   The commitment's health reads through its goals. */
export function GoalsList({ commitmentId }) {
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

  if (goals.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1.5">
      {goals.map((g) => (
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
          <span
            className={`min-w-0 flex-1 text-[14px] leading-snug ${
              g.done ? "text-white/40 line-through" : "text-white/85"
            }`}
          >
            {g.text}
          </span>
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
      ))}
    </ul>
  );
}
