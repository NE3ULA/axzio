/* The Forge — where pursuits become quests.
 *
 * A quest is a goal with a story: named stages walked in the world, not
 * tasks managed on a list. Completing a quest crowns its linked Nebula
 * thread — progression writes into the constellation, not a separate
 * points economy. (Game systems proper live in ne3ulaverse; the Forge is
 * the command-deck surface: quest state, not game logic.)
 *
 * Entry: #/forge, plus #/forge?from=goal:<id> to forge a quest from a goal.
 */
import { useEffect, useMemo, useState } from "react";
import { useAxzio } from "../store.jsx";
import {
  Card,
  MicroLabel,
  HelpBubble,
  HelpText,
  Field,
  TextArea,
  Btn,
  Empty,
  SectionHead,
} from "../components/ui.jsx";

function questProgress(q) {
  const stages = q.stages || [];
  const done = stages.filter((s) => s.done).length;
  return { done, total: stages.length };
}

function QuestCard({ quest }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [newStage, setNewStage] = useState("");
  const { done, total } = questProgress(quest);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const thread = (state.stars || []).find((s) => s.id === quest.threadId);
  const isComplete = quest.status === "complete";

  const addStage = () => {
    const n = newStage.trim();
    if (!n) return;
    axzio.addQuestStage(quest.id, n);
    setNewStage("");
  };

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        quest.status === "active"
          ? "border-[#d8a94e]/30 bg-white/[0.02]"
          : "border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span
            className={`block truncate text-[16px] ${
              isComplete ? "text-white/45 line-through" : "text-white/90"
            }`}
          >
            {quest.name}
          </span>
          {quest.why && (
            <span className="mt-0.5 block truncate text-[12px] text-white/40">
              {quest.why}
            </span>
          )}
        </span>
        <span className="hidden shrink-0 text-[11px] tabular-nums tracking-[0.14em] text-white/40 sm:block">
          {done}/{total}
        </span>
        <span className="w-20 shrink-0">
          <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
            <span
              className="block h-full rounded-full bg-[#d8a94e]"
              style={{ width: `${pct}%` }}
            />
          </span>
        </span>
        {quest.status === "paused" && (
          <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/35">
            Paused
          </span>
        )}
        <span className="shrink-0 text-white/35">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-5">
          {/* Stages */}
          {total === 0 ? (
            <p className="text-[13px] text-white/40">
              No stages yet — name the chapters of this quest below.
            </p>
          ) : (
            <ul className="space-y-1">
              {(quest.stages || []).map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => axzio.toggleQuestStage(quest.id, s.id)}
                    disabled={isComplete}
                    aria-pressed={s.done}
                    aria-label={s.done ? `Reopen stage ${s.name}` : `Complete stage ${s.name}`}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      s.done
                        ? "border-[#d8a94e] bg-[#d8a94e] text-black"
                        : "border-white/30 hover:border-[#d8a94e]"
                    } ${isComplete ? "opacity-60" : ""}`}
                  >
                    {s.done && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5.5l2.5 2.5 4.5-5.5" stroke="currentColor" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                  <span
                    className={`flex-1 text-[14px] ${
                      s.done ? "text-white/40 line-through" : "text-white/80"
                    }`}
                  >
                    {s.name}
                  </span>
                  {!isComplete && (
                    <button
                      type="button"
                      onClick={() => axzio.deleteQuestStage(quest.id, s.id)}
                      aria-label={`Remove stage ${s.name}`}
                      className="shrink-0 text-[13px] text-white/25 transition-colors hover:text-white/60"
                    >
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!isComplete && (
            <div className="mt-3 flex gap-2">
              <Field
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addStage();
                }}
                placeholder="Name the next stage…"
                maxLength={140}
                aria-label="New stage name"
                className="!py-2.5 text-[14px]"
              />
              <button
                type="button"
                onClick={addStage}
                disabled={!newStage.trim()}
                className="shrink-0 rounded-xl border border-white/20 px-4 text-[12px] uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-white/50 hover:text-white disabled:opacity-40"
              >
                Add
              </button>
            </div>
          )}

          {/* Thread link */}
          <div className="mt-4">
            <MicroLabel className="mb-2">Linked thread</MicroLabel>
            {isComplete ? (
              <p className="text-[13px] text-white/45">
                {thread ? `Crowned: ${thread.name}` : "No thread linked."}
              </p>
            ) : (
              <select
                value={quest.threadId || ""}
                onChange={(e) =>
                  axzio.updateQuest(quest.id, { threadId: e.target.value || null })
                }
                aria-label="Thread this quest crowns on completion"
                className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
              >
                <option value="">No thread — completion just closes the quest</option>
                {(state.stars || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.crowned ? " (crowned)" : ""}
                  </option>
                ))}
              </select>
            )}
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/35">
              Completing the quest crowns the linked thread — the reward is
              written into your Nebula.
            </p>
          </div>

          {/* Actions */}
          {!isComplete && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {confirmComplete ? (
                <>
                  <span className="text-[13px] text-white/60">
                    Complete this quest{thread ? ` and crown "${thread.name}"` : ""}?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      axzio.completeQuest(quest.id);
                      setConfirmComplete(false);
                    }}
                    className="rounded-lg bg-[#d8a94e] px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-black"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmComplete(false)}
                    className="text-[12px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
                  >
                    Keep going
                  </button>
                </>
              ) : (
                <>
                  <Btn
                    variant="primary"
                    onClick={() => setConfirmComplete(true)}
                    className="!px-4 !py-2 !text-[11px]"
                  >
                    Complete quest
                  </Btn>
                  <button
                    type="button"
                    onClick={() =>
                      axzio.setQuestStatus(
                        quest.id,
                        quest.status === "paused" ? "active" : "paused"
                      )
                    }
                    className="rounded-lg border border-white/20 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
                  >
                    {quest.status === "paused" ? "Resume" : "Pause"}
                  </button>
                </>
              )}
              <span className="flex-1" />
              {confirmDelete ? (
                <span className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => axzio.deleteQuest(quest.id)}
                    className="text-[11px] uppercase tracking-[0.14em] text-red-200/80 hover:text-red-100"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-[11px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
                  >
                    Keep
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[11px] uppercase tracking-[0.14em] text-white/30 hover:text-white/70"
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestForm({ prefill, onDone }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const [name, setName] = useState(prefill?.name || "");
  const [why, setWhy] = useState(prefill?.why || "");
  const [stagesText, setStagesText] = useState("");
  const [threadId, setThreadId] = useState("");

  const create = () => {
    const q = axzio.addQuest({
      name,
      why,
      commitmentId: prefill?.commitmentId || null,
      goalId: prefill?.goalId || null,
      sourceKind: prefill?.sourceKind || null,
      sourceId: prefill?.sourceId || null,
      threadId: threadId || null,
      stages: stagesText,
    });
    if (q && onDone) onDone(q);
  };

  return (
    <Card className="p-6">
      <MicroLabel className="mb-4">Forge a new quest</MicroLabel>
      <div className="space-y-4">
        <div>
          <MicroLabel className="mb-1.5">Quest name</MicroLabel>
          <Field
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name the quest — a story, not a task"
            maxLength={140}
            aria-label="Quest name"
          />
        </div>
        <div>
          <MicroLabel className="mb-1.5">Why this quest</MicroLabel>
          <Field
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="What commitment does it serve?"
            maxLength={300}
            aria-label="Why this quest"
          />
        </div>
        <div>
          <MicroLabel className="mb-1.5">Stages — one per line</MicroLabel>
          <TextArea
            value={stagesText}
            onChange={(e) => setStagesText(e.target.value)}
            placeholder={"Trust\nFirst impression\nPrivate beta"}
            rows={4}
            aria-label="Quest stages, one per line"
          />
          <p className="mt-1.5 text-[12px] text-white/35">
            Stages are chapters, not todos — "Private beta", not "send 5 emails".
          </p>
        </div>
        <div>
          <MicroLabel className="mb-1.5">Thread it crowns (optional)</MicroLabel>
          <select
            value={threadId}
            onChange={(e) => setThreadId(e.target.value)}
            aria-label="Thread this quest crowns on completion"
            className="w-full appearance-none rounded-xl border border-white/15 bg-black px-4 py-3 text-[14px] text-white/85 outline-none transition-colors hover:border-white/30"
          >
            <option value="">None yet</option>
            {(state.stars || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.crowned ? " (crowned)" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <Btn variant="primary" onClick={create} disabled={!name.trim()}>
            Forge it
          </Btn>
          <Btn variant="ghost" onClick={onDone}>
            Cancel
          </Btn>
        </div>
      </div>
    </Card>
  );
}

export default function Forge() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState(null);

  // Deep link: #/forge?from=goal:<id> — forge a quest from a goal.
  useEffect(() => {
    const m = window.location.hash.match(/[?&]from=goal:([^&]+)/);
    if (!m) return;
    const goalId = decodeURIComponent(m[1]);
    const goal = (state.goals || []).find((g) => g.id === goalId);
    if (goal) {
      const c = (state.identity.commitments || []).find(
        (x) => x.id === goal.commitmentId
      );
      setPrefill({
        name: goal.text,
        why: c ? `Serves ${c.text}` : "",
        commitmentId: goal.commitmentId || null,
        goalId: goal.id,
        sourceKind: "goal",
        sourceId: goal.id,
      });
      setFormOpen(true);
    }
    window.location.hash = "#/forge";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const quests = useMemo(
    () =>
      (state.quests || [])
        .slice()
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)),
    [state.quests]
  );
  const active = quests.filter((q) => q.status === "active");
  const paused = quests.filter((q) => q.status === "paused");
  const complete = quests.filter((q) => q.status === "complete");

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <SectionHead
        label="The Forge"
        help={
          <HelpBubble title="The Forge">
            <HelpText
              what="Where pursuits become quests — goals with a story, walked in stages."
              why="A quest is a narrative arc, not a task list. Stages are chapters; completing the quest crowns its thread in your Nebula."
              how="Forge a quest from a goal, name its stages, walk them. Pause anytime — no streaks, no penalties."
            />
          </HelpBubble>
        }
        right={
          !formOpen && (
            <button
              type="button"
              onClick={() => {
                setPrefill(null);
                setFormOpen(true);
              }}
              className="rounded-xl border border-[#d8a94e]/50 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-[#d8a94e] transition-colors hover:bg-[#d8a94e]/10"
            >
              + Forge a quest
            </button>
          )
        }
      />
      <h1 className="text-3xl font-light tracking-wide">Your life is the game.</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
        Quests are <span className="text-white/85">goals with a story</span> —
        grown from what matters, walked in stages, finished in the world.
        You are the main character.
      </p>

      {formOpen && (
        <div className="mt-8">
          <QuestForm prefill={prefill} onDone={() => setFormOpen(false)} />
        </div>
      )}

      <div className="mt-10 space-y-3">
        {active.length === 0 && paused.length === 0 && complete.length === 0 ? (
          <Empty>
            No quests yet. Forge one from a goal — or name a pursuit of your own.
          </Empty>
        ) : (
          <>
            {active.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))}
            {paused.length > 0 && (
              <div className="pt-4">
                <MicroLabel className="mb-3">Paused</MicroLabel>
                <div className="space-y-3 opacity-70">
                  {paused.map((q) => (
                    <QuestCard key={q.id} quest={q} />
                  ))}
                </div>
              </div>
            )}
            {complete.length > 0 && (
              <div className="pt-4">
                <MicroLabel className="mb-3">Completed — legend</MicroLabel>
                <div className="space-y-3">
                  {complete.map((q) => (
                    <QuestCard key={q.id} quest={q} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
