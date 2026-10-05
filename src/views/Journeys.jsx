import { useState } from "react";
import {
  useAxzio,
  MANTRA,
  TAGS,
  localDateKey,
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
  Empty,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* JOURNEYS — guided step-through flows that write into the state        */
/* ------------------------------------------------------------------ */

export default function Journeys() {
  const [active, setActive] = useState(null); // journey id

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <MicroLabel className="mb-2">Navigation</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Journeys
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Guided passages through the interface. Each step writes into your
          log, your signals, or your constellation.
        </p>
      </header>

      {!active && (
        <div className="grid gap-4 md:grid-cols-3">
          {JOURNEYS.map((j, i) => (
            <button
              key={j.id}
              onClick={() => setActive(j.id)}
              className={`axzio-rise rounded-2xl border border-white/15 bg-white/[0.02] p-6 text-left transition-all duration-300 hover:border-white/40 hover:bg-white/[0.04] axzio-rise-${i + 1}`}
            >
              <MicroLabel className="mb-3">{j.kicker}</MicroLabel>
              <h3 className="text-xl font-light tracking-wide">{j.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {j.blurb}
              </p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-white/40">
                {j.steps.length} steps
              </p>
            </button>
          ))}
        </div>
      )}

      {active && (
        <JourneyRunner
          journey={JOURNEYS.find((j) => j.id === active)}
          onExit={() => setActive(null)}
        />
      )}
    </div>
  );
}

const JOURNEYS = [
  {
    id: "morning",
    kicker: "Dawn passage",
    title: "Morning Alignment",
    blurb: "Hold the anchors, name the day's intention, take the first action.",
    steps: [
      { id: "mantra", title: "Anchor the mantra", render: MantraStep },
      { id: "intention", title: "Set the intention", render: IntentionStep },
      { id: "action", title: "Take the first action", render: FirstActionStep },
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
    steps: [
      { id: "gratitude", title: "Name one gratitude", render: GratitudeStep },
      { id: "review", title: "Review today's actions", render: ReviewStep },
      { id: "signal", title: "Transmit a closing signal", render: ClosingSignalStep },
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
    steps: [
      { id: "name", title: "Name the star", render: StarNameStep },
      { id: "note", title: "Give it meaning", render: StarNoteStep },
      { id: "push", title: "First action toward it", render: StarActionStep },
    ],
    done: {
      title: "A new star burns.",
      body: "It now orbits your constellation — and it already has momentum behind it.",
    },
  },
];

function JourneyRunner({ journey, onExit }) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [scratch, setScratch] = useState({}); // per-journey transient inputs
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
          <MicroLabel className="mb-2">{journey.kicker}</MicroLabel>
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
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                Step {step + 1} of {journey.steps.length}
              </span>
              <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                {journey.steps[step].title}
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
            <StepView scratch={scratch} setScratch={setScratch} />
          </div>

          <div className="mt-8 flex items-center justify-between">
            <Btn variant="quiet" onClick={() => go(-1)} disabled={step === 0}>
              Back
            </Btn>
            <StepContinue
              stepId={journey.steps[step].id}
              scratch={scratch}
              onNext={() => go(1)}
              last={step === journey.steps.length - 1}
            />
          </div>
        </>
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
function StepContinue({ stepId, scratch, onNext, last }) {
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
        return true;
    }
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
