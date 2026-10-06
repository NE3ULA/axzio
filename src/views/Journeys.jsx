import { useEffect, useRef, useState } from "react";
import {
  useAxzio,
  MANTRA,
  TAGS,
  LAUNCH_STAGES,
  RESET_FIELDS,
  localDateKey,
  formatLongDate,
  getDayState,
  actionsOn,
  formatTime,
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

/* ------------------------------------------------------------------ */
/* JOURNEYS — guided step-through flows that write into the state        */
/* ------------------------------------------------------------------ */

export default function Journeys() {
  const axzio = useAxzio();
  const [active, setActive] = useState(null); // journey id
  const [viewingReset, setViewingReset] = useState(null); // reset id -> Action Card
  const prefill = axzio.resetPrefill;

  // A Focus item's "Explore in Guided Reset" lands here: open the reset
  // journey with its Situation pre-filled from the decision.
  useEffect(() => {
    if (prefill && !active) setActive("reset");
  }, [prefill, active]);

  // Scratch prefill for a freshly opened reset journey. Computed during
  // render while the prefill is still set; consumed (cleared) on mount.
  const resetInitial =
    active === "reset" && prefill
      ? {
          rsituation: prefill.situation,
          _sourceItemId: prefill.sourceItemId,
          _sourceStarId: prefill.sourceStarId,
        }
      : {};
  useEffect(() => {
    if (active === "reset" && prefill) axzio.clearResetPrefill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Deep link: #/journeys?reset=<id> opens that reset's Action Card.
  // Used by the Focus item editor's "Guided Reset" section.
  const resetsRef = useRef([]);
  resetsRef.current = axzio.state.resets;
  useEffect(() => {
    const openFromHash = () => {
      const m = window.location.hash.match(/[?&]reset=([^&]+)/);
      if (!m) return;
      const id = decodeURIComponent(m[1]);
      if (resetsRef.current.some((r) => r.id === id)) {
        setViewingReset(id);
        if (window.location.hash !== "#/journeys") {
          window.location.hash = "#/journeys";
        }
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">Navigation</MicroLabel>
          <HelpBubble
            title="Journeys"
            className="mb-2"
          >
            <HelpText
              what="Guided passages through the interface — morning and evening rituals, ignition, and the Reset."
              why="A journey turns a vague intention into a walked sequence; every passage writes into your log, signals, or constellation."
              how="Choose a passage, answer each step, continue to the end. Past Resets keep their Action Cards below."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Journeys
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Guided passages through the interface. Each step walks the Alchemist
          Path — Reveal → Interpret → Align → Act → Integrate — and writes
          into your log, your signals, or your constellation.
        </p>
      </header>

      {viewingReset ? (
        <ResetActionCard
          resetId={viewingReset}
          onBack={() => setViewingReset(null)}
          allowDelete
        />
      ) : !active ? (
        <>
          <LaunchSequenceLocator />
          <div className="mb-6 mt-10">
            <MicroLabel>Guided passages</MicroLabel>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {JOURNEYS.map((j, i) => (
              <button
                key={j.id}
                onClick={() => setActive(j.id)}
                className={`axzio-rise rounded-2xl border border-white/15 bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-white/40 hover:bg-white/[0.04] axzio-rise-${(i % 4) + 1}`}
              >
                <MicroLabel className="mb-3">{j.kicker}</MicroLabel>
                <h3 className="text-xl font-light tracking-wide">{j.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {j.blurb}
                </p>
                <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/40">
                  {j.phaseLine || j.steps.map((s) => s.phase).join(" → ")}
                </p>
              </button>
            ))}
          </div>
          <ResetHistory onOpen={(id) => setViewingReset(id)} />
        </>
      ) : (
        <JourneyRunner
          key={active}
          journey={JOURNEYS.find((j) => j.id === active)}
          onExit={() => setActive(null)}
          initialScratch={resetInitial}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Identity Launch Sequence locator                                      */
/* ------------------------------------------------------------------ */

function LaunchSequenceLocator() {
  const axzio = useAxzio();
  const { state } = axzio;
  const current = LAUNCH_STAGES.find((s) => s.key === state.launchStage) || null;

  return (
    <section className="axzio-rise mb-2">
      <Card className="p-6 md:p-8">
        <SectionHead
          label="Identity Launch Sequence"
          help={
            <HelpBubble title="Identity Launch Sequence">
              <HelpText
                what="A nine-stage map of transformation: Love → Hope → Dream → Believe → Begin → Build → Become → Live Your Legend → Forge the Myth."
                why="Transformation moves through a recognizable progression; naming your stage tells you what movement life is asking for."
                how="Choose where life is currently inviting your participation. This is a map of movement, not a measure of rank."
              />
            </HelpBubble>
          }
          right={
            current ? (
              <button
                onClick={() => axzio.setLaunchStage(null)}
                className="text-[11px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
              >
                Clear
              </button>
            ) : undefined
          }
        />
        <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/55">
          Transformation moves through a recognizable progression. This is a
          map of movement, not a measure of rank — choose where life is
          currently inviting your participation.
        </p>

        <div className="flex flex-wrap gap-2">
          {LAUNCH_STAGES.map((s) => {
            const isActive = state.launchStage === s.key;
            return (
              <button
                key={s.key}
                onClick={() =>
                  axzio.setLaunchStage(isActive ? null : s.key)
                }
                aria-pressed={isActive}
                className={`rounded-full border px-4 py-2 text-[12px] uppercase tracking-[0.16em] transition-all duration-200 ${
                  isActive
                    ? "border-white/70 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {current && (
          <div className="axzio-rise mt-6 border-t border-white/10 pt-6">
            <MicroLabel className="mb-2">
              {current.label} — {current.move}
            </MicroLabel>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/75">
              {current.desc}
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
              <span className="text-white/80">The movement: </span>
              {current.suggestion}
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}

/* The seven fields of the Guided Reset, mirroring the guided practice:
   a Situation, then the Alchemist Path with a LifeMod before Integrate. */
const RESET_STEPS = [
  {
    id: "rsituation",
    field: "situation",
    title: "Name the situation",
    phase: "Reveal",
    prompt: "What situation are you bringing into this practice?",
    placeholder: "The situation is…",
  },
  {
    id: "rreveal",
    field: "reveal",
    title: "Reveal",
    phase: "Reveal",
    prompt:
      "What is happening? What pattern, signal, friction, or opportunity is present?",
    placeholder: "What is present…",
  },
  {
    id: "rinterpret",
    field: "interpret",
    title: "Interpret",
    phase: "Interpret",
    prompt: "What may this be showing you? What story needs a wider reading?",
    placeholder: "A wider reading…",
  },
  {
    id: "ralign",
    field: "align",
    title: "Align",
    phase: "Align",
    prompt: "Who are you choosing to become in relationship to this?",
    placeholder: "In relationship to this, I am choosing…",
  },
  {
    id: "ract",
    field: "act",
    title: "Act",
    phase: "Act",
    prompt: "What is the next meaningful action you will take within 24 hours?",
    placeholder: "Within 24 hours I will…",
  },
  {
    id: "rlifemod",
    field: "lifemod",
    title: "LifeMod",
    phase: "Act",
    prompt: "What condition will you change to support the action?",
    placeholder: "The condition I will change is…",
  },
  {
    id: "rintegrate",
    field: "integrate",
    title: "Integrate",
    phase: "Integrate",
    prompt: "When will you revisit this Reset?",
    placeholder: "I will revisit this…",
  },
];

const JOURNEYS = [
  {
    id: "morning",
    kicker: "Dawn passage",
    title: "Morning Alignment",
    blurb: "Hold the anchors, name the day's intention, take the first action.",
    help: {
      title: "Morning Alignment",
      what: "A dawn passage: hold the mantra anchors, set the day's intention, take the first action.",
      why: "The first hour sets the frame — intention before input.",
      how: "Three steps, each writing into the deck. About two minutes.",
    },
    steps: [
      { id: "mantra", title: "Anchor the mantra", phase: "Reveal", render: MantraStep },
      { id: "intention", title: "Set the intention", phase: "Align", render: IntentionStep },
      { id: "action", title: "Take the first action", phase: "Act", render: FirstActionStep },
    ],
    done: {
      title: "The day is aimed.",
      body: "Anchors held, intention named, first action logged. The rest of the day is follow-through.",
    },
  },
  {
    id: "evening",
    kicker: "Dusk passage",
    title: "Evening Review",
    blurb: "Name a gratitude, review the day's actions, transmit a closing signal.",
    help: {
      title: "Evening Review",
      what: "A dusk passage: name one gratitude, review the day's actions, transmit a closing signal.",
      why: "The day is sealed consciously; review turns experience into pattern.",
      how: "Three steps. The gratitude and the closing signal become transmissions in your feed.",
    },
    steps: [
      { id: "gratitude", title: "Name one gratitude", phase: "Reveal", render: GratitudeStep },
      { id: "review", title: "Review today's actions", phase: "Interpret", render: ReviewStep },
      { id: "signal", title: "Transmit a closing signal", phase: "Integrate", render: ClosingSignalStep },
    ],
    done: {
      title: "The day is sealed.",
      body: "Gratitude named, actions reviewed, signal sent. Rest is part of the work.",
    },
  },
  {
    id: "star",
    kicker: "Ignition passage",
    title: "Ignite a Star",
    blurb: "Name an intention, give it meaning, commit the first action toward it.",
    help: {
      title: "Ignite a Star",
      what: "An ignition passage: name a star, give it meaning, commit the first action toward it.",
      why: "Named things gain gravity; momentum at ignition keeps stars burning.",
      how: "Three steps. The star orbits your constellation and the first action lands in your log.",
    },
    steps: [
      { id: "name", title: "Name the star", phase: "Reveal", render: StarNameStep },
      { id: "note", title: "Give it meaning", phase: "Interpret", render: StarNoteStep },
      { id: "push", title: "First action toward it", phase: "Act", render: StarActionStep },
    ],
    done: {
      title: "A new star burns.",
      body: "It now orbits your constellation — and it already has momentum behind it.",
    },
  },
  {
    id: "reset",
    kicker: "Reset passage",
    title: "Guided Reset",
    blurb:
      "Meet one real situation with seven movements and leave with an Action Card.",
    phaseLine:
      "Situation → Reveal → Interpret → Align → Act → LifeMod → Integrate",
    help: {
      title: "Guided Reset",
      what: "A seven-field reset practice — Situation, then Reveal → Interpret → Align → Act, a LifeMod, and Integrate — ending in an Action Card.",
      why: "Meet one real situation with the full Alchemist Path instead of letting it stay fog.",
      how: "Answer each field; on completion you receive an Action Card you can copy. It can also be triggered from any Focus decision via “Explore in Guided Reset”. Private by default — stored only in this browser, nothing leaves this device.",
    },
    steps: RESET_STEPS.map((s) => ({
      id: s.id,
      title: s.title,
      phase: s.phase,
      render: ResetFieldStep,
    })),
    done: {
      title: "The reset is sealed.",
      body: "One situation, met fully. The Action Card holds what you decided — revisit it when you said you would.",
    },
  },
];

function JourneyRunner({ journey, onExit, initialScratch }) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  // Per-journey transient inputs; a reset triggered from a Focus decision
  // arrives with its Situation pre-filled (plus a _sourceItemId thread).
  const [scratch, setScratch] = useState(initialScratch || {});
  const StepView = journey.steps[step].render;

  const go = (dir) => {
    if (dir > 0 && step === journey.steps.length - 1) {
      setFinished(true);
    } else {
      setStep((s) => Math.min(journey.steps.length - 1, Math.max(0, s + dir)));
    }
  };

  const restart = () => {
    setStep(0);
    setFinished(false);
    setScratch({});
  };

  return (
    <Card className="axzio-rise p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <MicroLabel className="mb-2">{journey.kicker}</MicroLabel>
            {journey.help && (
              <HelpBubble title={journey.help.title} className="mb-2">
                <HelpText
                  what={journey.help.what}
                  why={journey.help.why}
                  how={journey.help.how}
                />
              </HelpBubble>
            )}
          </div>
          <h3 className="text-2xl font-light tracking-wide md:text-3xl">
            {journey.title}
          </h3>
        </div>
        <button
          onClick={onExit}
          className="text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white"
        >
          Exit
        </button>
      </div>

      {!finished ? (
        <>
          {/* progress */}
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Step {step + 1} of {journey.steps.length}
              </span>
              <span className="flex items-center gap-2">
                <Pill tone="lit">{journey.steps[step].phase}</Pill>
                <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                  {journey.steps[step].title}
                </span>
              </span>
            </div>
            <div className="flex gap-2">
              {journey.steps.map((s, i) => (
                <div
                  key={s.id}
                  className={`h-px flex-1 transition-colors duration-500 ${
                    i <= step ? "bg-white/80" : "bg-white/12"
                  }`}
                />
              ))}
            </div>
          </div>

          <div key={journey.steps[step].id} className="axzio-rise">
            <StepView
              stepId={journey.steps[step].id}
              scratch={scratch}
              setScratch={setScratch}
            />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Btn variant="quiet" onClick={() => go(-1)} disabled={step === 0}>
              Back
            </Btn>
            <StepContinue
              stepId={journey.steps[step].id}
              scratch={scratch}
              setScratch={setScratch}
              onNext={() => go(1)}
              last={step === journey.steps.length - 1}
            />
          </div>
        </>
      ) : journey.id === "reset" ? (
        <ResetActionCard
          resetId={scratch.savedResetId}
          onBack={onExit}
          onRestart={restart}
        />
      ) : (
        <div className="axzio-rise py-6 text-center">
          <MicroLabel className="mb-3">Passage complete</MicroLabel>
          <h4 className="text-3xl font-light tracking-wide">{journey.done.title}</h4>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/60">
            {journey.done.body}
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Btn variant="ghost" onClick={restart}>
              Walk it again
            </Btn>
            <Btn onClick={onExit}>Return to journeys</Btn>
          </div>
        </div>
      )}
    </Card>
  );
}

/**
 * Continue buttons commit the step's input into the store, so every
 * passage leaves a trace in the log / signals / constellation.
 */
function StepContinue({ stepId, scratch, setScratch, onNext, last }) {
  const axzio = useAxzio();
  const today = localDateKey();

  const commit = () => {
    switch (stepId) {
      case "intention":
        if (scratch.intention?.trim()) axzio.setIntention(today, scratch.intention.trim());
        break;
      case "action":
        if (scratch.action?.trim()) axzio.addAction(scratch.action.trim(), scratch.actionTag || "action");
        break;
      case "gratitude":
        if (scratch.gratitude?.trim()) axzio.addSignal(`Grateful for: ${scratch.gratitude.trim()}`);
        break;
      case "signal":
        if (scratch.signal?.trim()) axzio.addSignal(scratch.signal.trim());
        break;
      case "name":
        // star name is kept in scratch for the note step; created there
        break;
      case "note":
        if (scratch.starName?.trim()) {
          axzio.addStar(scratch.starName.trim(), scratch.starNote?.trim() || "");
        }
        break;
      case "push":
        if (scratch.starAction?.trim()) axzio.addAction(scratch.starAction.trim(), "building");
        break;
      case "rintegrate": {
        // Completing the Guided Reset: persist all seven fields as one
        // reset, keeping the thread back to a triggering Focus decision.
        const entry = axzio.saveReset({
          situation: scratch.rsituation,
          reveal: scratch.rreveal,
          interpret: scratch.rinterpret,
          align: scratch.ralign,
          act: scratch.ract,
          lifemod: scratch.rlifemod,
          integrate: scratch.rintegrate,
          sourceItemId: scratch._sourceItemId || null,
          sourceStarId: scratch._sourceStarId || null,
        });
        if (setScratch) {
          setScratch((s) => ({ ...s, savedResetId: entry.id }));
        }
        break;
      }
      default:
        break;
    }
    onNext();
  };

  const canContinue = (() => {
    switch (stepId) {
      case "mantra":
      case "review":
        return true;
      case "intention":
        return !!scratch.intention?.trim();
      case "action":
        return !!scratch.action?.trim();
      case "gratitude":
        return !!scratch.gratitude?.trim();
      case "signal":
        return !!scratch.signal?.trim();
      case "name":
        return !!scratch.starName?.trim();
      case "note":
        return true; // note optional
      case "push":
        return !!scratch.starAction?.trim();
      default:
        break;
    }
    // Guided Reset steps: each field is required to continue.
    if (RESET_STEPS.some((s) => s.id === stepId)) {
      return !!scratch[stepId]?.trim();
    }
    return true;
  })();

  return (
    <Btn onClick={commit} disabled={!canContinue}>
      {last ? "Complete" : "Continue"}
    </Btn>
  );
}

/* ---------------- step views ---------------- */

function MantraStep() {
  const axzio = useAxzio();
  const today = localDateKey();
  const day = getDayState(axzio.state, today);
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        The four anchors of the day. Hold the ones you have practiced — or
        practice one now, then hold it.
      </p>
      <div className="grid grid-cols-2 gap-3">
        {MANTRA.map((m) => (
          <button
            key={m.key}
            onClick={() => axzio.setMantra(today, m.key, !day.mantra[m.key])}
            aria-pressed={day.mantra[m.key]}
            className={`rounded-2xl border p-5 text-left transition-all duration-300 ${
              day.mantra[m.key]
                ? "border-white/60 bg-white/[0.07]"
                : "border-white/15 hover:border-white/35"
            }`}
          >
            <span className="block text-[15px] font-medium tracking-wide">
              {m.label}
            </span>
            <span className="mt-1 block text-[12px] text-white/40">{m.hint}</span>
            <span className="mt-3 block text-[11px] uppercase tracking-[0.22em] text-white/45">
              {day.mantra[m.key] ? "Held" : "Not yet held"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function IntentionStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        One line. What is today for? This becomes the day's intention on the
        command deck.
      </p>
      <TextArea
        value={scratch.intention || ""}
        onChange={(e) => setScratch((s) => ({ ...s, intention: e.target.value }))}
        placeholder="Today is for…"
        rows={3}
        maxLength={220}
        autoFocus
      />
    </div>
  );
}

function FirstActionStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        Momentum beats planning. Log the first concrete action of the day —
        it lands in your action log.
      </p>
      <Field
        value={scratch.action || ""}
        onChange={(e) => setScratch((s) => ({ ...s, action: e.target.value }))}
        placeholder="The first action is…"
        maxLength={220}
        autoFocus
      />
      <div className="mt-4">
        <MicroLabel className="mb-2">Tag it</MicroLabel>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((t) => (
            <button
              key={t.key}
              onClick={() =>
                setScratch((s) => ({ ...s, actionTag: t.key }))
              }
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                (scratch.actionTag || "action") === t.key
                  ? "border-white/70 bg-white/10 text-white"
                  : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GratitudeStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        Be grateful. Name one thing — concrete, specific, from today.
      </p>
      <Field
        value={scratch.gratitude || ""}
        onChange={(e) => setScratch((s) => ({ ...s, gratitude: e.target.value }))}
        placeholder="Today I am grateful for…"
        maxLength={220}
        autoFocus
      />
    </div>
  );
}

function ReviewStep() {
  const { state } = useAxzio();
  const today = localDateKey();
  const actions = actionsOn(state, today);
  const mantraDone = MANTRA.filter(
    (m) => getDayState(state, today).mantra[m.key]
  ).length;
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        Look at the day honestly. What moved?
      </p>
      <div className="mb-5 flex gap-6">
        <div>
          <p className="text-2xl font-light">{actions.length}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">
            actions
          </p>
        </div>
        <div>
          <p className="text-2xl font-light">{mantraDone}/4</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">
            anchors held
          </p>
        </div>
      </div>
      {actions.length === 0 ? (
        <Empty>No actions logged today — tomorrow is another orbit.</Empty>
      ) : (
        <ul className="space-y-2">
          {actions.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-2.5 text-sm"
            >
              <span>{a.text}</span>
              <span className="shrink-0 text-[11px] tracking-[0.14em] text-white/35">
                {formatTime(a.ts)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ClosingSignalStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        Transmit a closing signal — a lesson, a release, a vow for tomorrow.
      </p>
      <TextArea
        value={scratch.signal || ""}
        onChange={(e) => setScratch((s) => ({ ...s, signal: e.target.value }))}
        placeholder="Closing signal…"
        rows={3}
        maxLength={280}
        autoFocus
      />
    </div>
  );
}

function StarNameStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        Every star begins as a name. What intention or project are you
        igniting?
      </p>
      <Field
        value={scratch.starName || ""}
        onChange={(e) => setScratch((s) => ({ ...s, starName: e.target.value }))}
        placeholder="Star name — e.g. “Ship the portfolio”"
        maxLength={60}
        autoFocus
      />
    </div>
  );
}

function StarNoteStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        Give <span className="text-white">“{scratch.starName}”</span> its
        meaning — why does this star burn? (Optional.)
      </p>
      <TextArea
        value={scratch.starNote || ""}
        onChange={(e) => setScratch((s) => ({ ...s, starNote: e.target.value }))}
        placeholder="This star means…"
        rows={3}
        maxLength={160}
        autoFocus
      />
    </div>
  );
}

function StarActionStep({ scratch, setScratch }) {
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        A star without momentum fades. What is the first concrete action
        toward <span className="text-white">“{scratch.starName}”</span>?
      </p>
      <Field
        value={scratch.starAction || ""}
        onChange={(e) =>
          setScratch((s) => ({ ...s, starAction: e.target.value }))
        }
        placeholder="The first action is…"
        maxLength={220}
        autoFocus
      />
      <p className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/40">
        <Pill>Building</Pill> tagged to the Building primitive
      </p>
    </div>
  );
}

/* ---------------- Guided Reset views ---------------- */

/** One field of the Guided Reset, driven by the RESET_STEPS config. */
function ResetFieldStep({ stepId, scratch, setScratch }) {
  const cfg = RESET_STEPS.find((s) => s.id === stepId);
  if (!cfg) return null;
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        {cfg.prompt}
      </p>
      <TextArea
        value={scratch[stepId] || ""}
        onChange={(e) =>
          setScratch((s) => ({ ...s, [stepId]: e.target.value }))
        }
        placeholder={cfg.placeholder}
        rows={4}
        maxLength={600}
        autoFocus
      />
    </div>
  );
}

/** Plain-text rendering of a reset, for the copy-to-clipboard action. */
function formatResetCard(reset, sourceLine) {
  const lines = [
    "E3 RESET — ACTION CARD",
    reset.date ? formatLongDate(reset.date) : "",
    "",
  ];
  if (sourceLine) {
    lines.push(sourceLine, "");
  }
  for (const f of RESET_FIELDS) {
    const text = (reset[f.key] || "").trim();
    if (!text) continue;
    lines.push(f.label.toUpperCase());
    lines.push(text);
    lines.push("");
  }
  return lines.join("\n").trim();
}

/**
 * The Action Card: a clean summary of one completed reset, with a
 * copy-to-clipboard button. Used both right after completing the
 * journey and when opening a past reset from history.
 */
function ResetActionCard({ resetId, onBack, onRestart, allowDelete = false }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const reset = state.resets.find((r) => r.id === resetId);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Thread back to the Focus decision this reset was triggered from.
  const sourceItem = reset?.sourceItemId
    ? state.focusItems.find((f) => f.id === reset.sourceItemId)
    : null;
  // Thread back to the Constellation star (seed) this reset was triggered from.
  const sourceStar = reset?.sourceStarId
    ? state.stars.find((s) => s.id === reset.sourceStarId)
    : null;

  if (!reset) {
    return (
      <Card className="axzio-rise p-6 md:p-10">
        <Empty>This reset could not be found — it may have been deleted.</Empty>
        <div className="mt-6 text-center">
          <Btn variant="ghost" onClick={onBack}>
            Return to journeys
          </Btn>
        </div>
      </Card>
    );
  }

  const copyCard = async () => {
    const text = formatResetCard(
      reset,
      sourceStar
        ? `From seed: ${sourceStar.name}`
        : sourceItem
          ? `From decision: ${sourceItem.text}`
          : null
    );
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for contexts without clipboard permission.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {
        /* copy unavailable */
      }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const doDelete = () => {
    axzio.deleteReset(reset.id);
    onBack();
  };

  return (
    <Card className="axzio-rise p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <MicroLabel className="mb-2">E3 Reset — Action Card</MicroLabel>
            <HelpBubble title="Action Card" className="mb-2">
              <HelpText
                what="The sealed record of one Guided Reset: your seven responses, laid out cleanly."
                why="A reset you cannot revisit is a ritual; a card you can revisit is a commitment."
                how="Copy the card to carry it elsewhere. It is private by default — stored only in this browser, nothing leaves this device."
              />
            </HelpBubble>
          </div>
          <h3 className="text-2xl font-light tracking-wide md:text-3xl">
            Action Card
          </h3>
          {reset.date && (
            <p className="mt-2 text-sm tracking-wide text-white/45">
              {formatLongDate(reset.date)}
            </p>
          )}
          {sourceStar && (
            <p className="mt-2 text-sm tracking-wide text-white/55">
              From seed:{" "}
              <a
                href="#/constellation"
                className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white/80"
              >
                {sourceStar.name}
              </a>
            </p>
          )}
          {sourceItem && !sourceStar && (
            <p className="mt-2 text-sm tracking-wide text-white/55">
              From decision:{" "}
              <a
                href="#/focus"
                className="text-white underline decoration-white/30 underline-offset-4 transition-colors hover:decoration-white/80"
              >
                {sourceItem.text}
              </a>
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white"
        >
          {allowDelete ? "Back" : "Exit"}
        </button>
      </div>

      <div className="space-y-6">
        {RESET_FIELDS.map((f) => {
          const text = (reset[f.key] || "").trim();
          if (!text) return null;
          return (
            <div key={f.key}>
              <MicroLabel className="mb-2">{f.label}</MicroLabel>
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/85">
                {text}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-8 border-t border-white/10 pt-4 text-[12px] leading-relaxed tracking-wide text-white/40">
        Private by default — stored only in this browser. Nothing leaves this
        device.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Btn variant="ghost" onClick={copyCard}>
          {copied ? "Copied" : "Copy card"}
        </Btn>
        {onRestart && (
          <Btn variant="quiet" onClick={onRestart}>
            Start another
          </Btn>
        )}
        {!allowDelete && (
          <Btn onClick={onBack}>Return to journeys</Btn>
        )}
        {allowDelete &&
          (!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="ml-auto text-[11px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-white/80"
            >
              Delete
            </button>
          ) : (
            <span className="ml-auto flex items-center gap-3">
              <button
                onClick={doDelete}
                className="text-[11px] uppercase tracking-[0.2em] text-red-200/80 transition-colors hover:text-red-100"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[11px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
              >
                Cancel
              </button>
            </span>
          ))}
      </div>
    </Card>
  );
}

/** Past completed resets, newest first. Each opens its Action Card. */
function ResetHistory({ onOpen }) {
  const { state } = useAxzio();
  const resets = state.resets.slice().reverse();
  if (resets.length === 0) return null;

  return (
    <section className="axzio-rise mt-10">
      <div className="mb-4 flex items-center gap-3">
        <MicroLabel>Past resets</MicroLabel>
        <HelpBubble title="Past resets">
          <HelpText
            what="Every Guided Reset you have completed, newest first."
            why="A reset gains power when revisited — open a card to re-read what you decided, or copy it elsewhere."
            how="Select a reset to open its Action Card."
          />
        </HelpBubble>
      </div>
      <div className="space-y-2">
        {resets.map((r) => (
          <button
            key={r.id}
            onClick={() => onOpen(r.id)}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-white/35"
          >
            <span className="min-w-0">
              <span className="block truncate text-[15px] text-white/85">
                {r.situation || "Untitled reset"}
              </span>
              <span className="mt-1 block text-[11px] tracking-[0.14em] text-white/35">
                {r.date ? formatLongDate(r.date) : "Undated"}
              </span>
            </span>
            <span className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-white/40">
              Card →
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
