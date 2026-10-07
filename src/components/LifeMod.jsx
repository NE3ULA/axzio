import { useState } from "react";
import { useAxzio, legendFunctionLabel, becomingStageLabel } from "../store.jsx";
import {
  Pill,
  Field,
  Btn,
  TextArea,
  MicroLabel,
  HelpBubble,
  HelpText,
} from "./ui.jsx";

/* LifeModRow + LifeModEditor — the full LifeMod view. Used inline in the
   Atlas index and as an overlay inside the thread view. */

export function LifeModRow({ lifemod, expanded, onToggle }) {
  const fnLabel = legendFunctionLabel(lifemod.legendFunction);
  const stageLabel = becomingStageLabel(lifemod.becomingStage);
  return (
    <div
      className={`rounded-xl border transition-colors ${
        expanded ? "border-white/30 bg-white/[0.02]" : "border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[15px] text-white/90">
          {lifemod.name || "Unnamed LifeMod"}
        </span>
        {fnLabel && <Pill>{fnLabel}</Pill>}
        {stageLabel && <Pill tone="lit">{stageLabel}</Pill>}
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          {lifemod.origin === "seed" ? "Grown from a seed" : "Named from friction"}
        </span>
      </button>
      {expanded && <LifeModEditor lifemod={lifemod} />}
    </div>
  );
}

export function LifeModEditor({ lifemod }) {
  const axzio = useAxzio();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const m = lifemod;
  const set = (patch) => axzio.updateLifeMod(m.id, patch);
  const growLifeMod = () => {
    if (axzio.requestGrowthFrom("lifemod", m.id)) {
      window.location.hash = "#/journeys";
    }
  };

  return (
    <div className="border-t border-white/10 px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={growLifeMod}
          className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          Grow — design pursuit →
        </button>
        <p className="text-[12px] leading-relaxed text-white/35">
          Design the pursuit this condition change serves.
        </p>
      </div>
      {/* name */}
      <div className="mb-5">
        <MicroLabel className="mb-2">Name</MicroLabel>
        <Field
          value={m.name}
          onChange={(e) => set({ name: e.target.value })}
          maxLength={120}
          aria-label="LifeMod name"
        />
      </div>

      {/* the book's five elements */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <MicroLabel className="mb-2">Friction</MicroLabel>
          <TextArea
            value={m.friction}
            onChange={(e) => set({ friction: e.target.value })}
            placeholder="What is creating drag?"
            rows={2}
            maxLength={600}
            aria-label="Friction"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Current state</MicroLabel>
            <HelpBubble title="Current state">
              <HelpText
                what="Where this is right now, honestly described — the starting point the LifeMod moves from."
                why="A LifeMod travels from current to desired. Without an honest starting point there's nothing to measure the change against."
                example="“I check my phone in bed for 40 minutes most nights.”"
              />
            </HelpBubble>
          </div>
          <TextArea
            value={m.currentState}
            onChange={(e) => set({ currentState: e.target.value })}
            placeholder="Where it is now."
            rows={2}
            maxLength={600}
            aria-label="Current state"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Desired state</MicroLabel>
            <HelpBubble title="Desired state">
              <HelpText
                what="Where this wants to be — the condition you're designing toward."
                why="The desired state is what the Becoming Cycle works toward and what Review measures against."
                how="Describe the condition, not the action. It's a state of life, not a to-do."
                example="“Phone charges in the kitchen; the bedroom is for sleep and reading.”"
              />
            </HelpBubble>
          </div>
          <TextArea
            value={m.desiredState}
            onChange={(e) => set({ desiredState: e.target.value })}
            placeholder="Where it wants to be."
            rows={2}
            maxLength={600}
            aria-label="Desired state"
          />
        </div>
        <div>
          <MicroLabel className="mb-2">Next action</MicroLabel>
          <Field
            value={m.nextAction}
            onChange={(e) => set({ nextAction: e.target.value })}
            placeholder="The smallest concrete action that begins the modification."
            maxLength={280}
            aria-label="Next action"
          />
          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Impact
                </p>
                <HelpBubble title="Impact vs effort">
                  <HelpText
                    what="A rough read on the LifeMod: how much it matters (impact) versus how much it costs to make (effort)."
                    why="High impact, low effort changes are the obvious first moves. The read keeps ambition honest."
                    how="Set each by feel — it's a compass, not a calculation."
                  />
                </HelpBubble>
              </div>
              <TriState
                value={m.impact}
                onChange={(v) => set({ impact: v })}
              />
            </div>
            <TriState
              label="Effort"
              value={m.effort}
              onChange={(v) => set({ effort: v })}
            />
          </div>
        </div>
      </div>

      {/* legend function */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Legend function</MicroLabel>
          <HelpBubble title="Legend functions">
            <HelpText
              what="The eight jobs a LifeMod can do for your legend — what this change is for."
              why="Naming the function keeps the LifeMod honest: a change meant to Simplify that keeps Expanding is off-course."
              how="Pick the one that fits. Friction-born LifeMods usually Repair or Remove; seed-born ones usually Unlock or Expand."
            />
          </HelpBubble>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {LEGEND_FUNCTIONS.map((f) => {
            const sel = m.legendFunction === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => set({ legendFunction: sel ? null : f.key })}
                aria-pressed={sel}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  sel
                    ? "border-white/60 bg-white/10"
                    : "border-white/10 hover:border-white/35"
                }`}
              >
                <p
                  className={`text-[12px] uppercase tracking-[0.16em] ${
                    sel ? "text-white" : "text-white/70"
                  }`}
                >
                  {f.label}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-white/45">
                  {f.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* becoming cycle stepper */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Becoming Cycle</MicroLabel>
          <HelpBubble title="Becoming Cycle">
            <HelpText
              what="The six-stage journey every LifeMod travels: Detect → Capture → Evaluate → Execute → Review → Evolve."
              why="A LifeMod is a change to living conditions, not a task — it needs its own cycle, with Review built in before it Evolves."
              how="Move the LifeMod along as it matures. Review asks whether it's working; Evolve carries the lesson into the next change."
            />
          </HelpBubble>
        </div>
        <div className="flex flex-wrap gap-2">
          {BECOMING_STAGES.map((s, i) => {
            const sel = m.becomingStage === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => set({ becomingStage: s.key })}
                aria-pressed={sel}
                title={sel ? "Current stage" : `Move to ${s.label}`}
                className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  sel
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                <span className="mr-1.5 text-white/30">{i + 1}</span>
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          Placement is yours to declare — the cycle does not advance on its
          own.
        </p>
      </div>

      {/* crystallize the desired state into a goal */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Goals grown from this LifeMod</MicroLabel>
          <HelpBubble title="LifeMod becomes a goal">
            <HelpText
              what="Crystallizes this LifeMod's desired state into a goal — a defined outcome with a horizon, serving one of your commitments."
              why="A LifeMod changes conditions; a goal names the destination those conditions serve. They stay linked: the condition and the outcome, each visible from the other."
              how="Read your desired state above, then distill it into a crisp outcome — name it in a breath, choose the commitment, set an optional horizon. The LifeMod keeps living here; the goal lives under its commitment on Identity."
            />
          </HelpBubble>
        </div>
        <GrownGoalsList sourceLifeModId={m.id} />
        {m.desiredState?.trim() && (
          <blockquote className="mb-3 border-l-2 border-white/20 pl-3 text-[13px] italic leading-relaxed text-white/55">
            “{m.desiredState.trim().length > 220
              ? m.desiredState.trim().slice(0, 220) + "…"
              : m.desiredState.trim()}”
          </blockquote>
        )}
        <div className="mt-3">
          <GoalCapture
            ctaLabel="Set a goal"
            sourceLifeModId={m.id}
            compact
          />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          Distill the desired state above into one crisp outcome — a LifeMod
          may grow several goals over its life.
        </p>
      </div>

      {/* grow the desired state into a habit */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Habits grown from this LifeMod</MicroLabel>
          <HelpBubble title="LifeMod grows a habit">
            <HelpText
              what="Turns this LifeMod's desired state into a habit — a repeating practice with a rhythm, serving one of your commitments."
              why="A LifeMod changes conditions; a habit rehearses the new condition until it holds. They stay linked: the condition and the practice, each visible from the other."
              how="Read your desired state above, then name the practice that would grow it — set when it happens and for how long, choose the commitment. The LifeMod keeps living here; the habit lives under its commitment on Identity."
            />
          </HelpBubble>
        </div>
        <GrownHabitsList sourceLifeModId={m.id} />
        <div className="mt-3">
          <HabitCapture
            ctaLabel="Start a habit"
            sourceLifeModId={m.id}
            compact
          />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          Name the practice that would grow this condition — a LifeMod may
          grow several habits over its life.
        </p>
      </div>

      {/* archive / delete */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
        <Btn
          variant="ghost"
          onClick={() => axzio.setLifeModActive(m.id, !m.active)}
        >
          {m.active ? "Archive" : "Restore"}
        </Btn>
        {!confirmDelete ? (
          <Btn variant="quiet" onClick={() => setConfirmDelete(true)} className="px-0">
            Delete
          </Btn>
        ) : (
          <span className="flex items-center gap-3">
            <Btn variant="ghost" onClick={() => axzio.deleteLifeMod(m.id)}>
              Confirm delete
            </Btn>
            <Btn variant="quiet" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Btn>
          </span>
        )}
        <span className="text-[12px] text-white/35">
          {m.active
            ? "Archiving keeps the record; deleting removes it."
            : "Archived — restore to work it again."}
        </span>
      </div>
    </div>
  );
}

/** Quiet Low / Med / High segmented control; tapping the selected clears it. */