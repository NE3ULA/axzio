import { useEffect, useRef, useState } from "react";
import {
  useAxzio,
  uid,
  resetSourceInfo,
  resetDraftIdFor,
  MANTRA,
  TAGS,
  LAUNCH_STAGES,
  RESET_FIELDS,
  BATTERY,
  FRICTION_READINGS,
  frictionReadingLabel,
  READINESS_DIMS,
  LIFEMOD_PLAIN_TYPES,
  lifemodPlainTypeLabel,
  INTEGRATE_CHOICES,
  integrateChoiceLabel,
  localDateKey,
  formatLongDate,
  getDayState,
  actionsOn,
  formatTime,
  QUADRANTS,
  TIMEFRAMES,
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
  // Live reset session once it is running.
  // { id, sourceKind, sourceId, sourceName, scratch, step, fresh }
  const [resetSession, setResetSession] = useState(null);
  // Per-source Resume / Start over prompt (launch from an item or star).
  // { kind, id, name, autofill, draft }
  const [sourcePrompt, setSourcePrompt] = useState(null);
  const [resetBooted, setResetBooted] = useState(false);
  const pendingSource = axzio.pendingResetSource;
  const drafts = axzio.state.resetDrafts || [];

  // A Focus item's "Explore in Guided Reset" (or a star's) lands here:
  // open the reset journey; the bootstrap below consumes the pending source.
  useEffect(() => {
    if (pendingSource && !active) setActive("reset");
  }, [pendingSource, active]);

  /** Begin (or resume) a reset session for a source. */
  const startSession = ({ sourceKind, sourceId, sourceName, autofill, draft }) => {
    if (draft) {
      setResetSession({
        id: draft.id,
        sourceKind: draft.sourceKind,
        sourceId: draft.sourceId,
        sourceName: draft.sourceName,
        // Stamp the draft id into the scratch so completion can clear it,
        // even for drafts saved before _draftId existed.
        scratch: { ...draft.scratch, _draftId: draft.id },
        step: draft.step || 0,
        fresh: false,
      });
    } else {
      const id =
        sourceKind === "general"
          ? `gen:${uid()}`
          : resetDraftIdFor(sourceKind, sourceId);
      setResetSession({
        id,
        sourceKind,
        sourceId: sourceId || null,
        sourceName: sourceName || "",
        scratch: {
          rsituation: autofill || "",
          _draftId: id,
          _sourceKind: sourceKind,
          _sourceId: sourceId || null,
        },
        step: 0,
        fresh: true,
      });
    }
    setSourcePrompt(null);
  };

  // Reset session bootstrap: when the reset journey opens without a live
  // session — a launch from an item/star jumps straight to that source's
  // draft (resume or start over); the plain Journeys entry shows the full
  // list of unfinished drafts, or starts fresh when there are none.
  useEffect(() => {
    if (active !== "reset" || resetSession || sourcePrompt) return;
    if (pendingSource) {
      const { kind, id } = pendingSource;
      const info = resetSourceInfo(axzio.state, kind, id);
      const draft =
        drafts.find((d) => d.sourceKind === kind && d.sourceId === id) || null;
      axzio.clearPendingResetSource();
      setResetBooted(true);
      if (draft || info) {
        setSourcePrompt({
          kind,
          id,
          name: info ? info.name : draft ? draft.sourceName : "Unknown",
          autofill: info ? info.situation : "",
          draft,
        });
        return;
      }
      // Source vanished before we got here — fall through to list/fresh.
    }
    if (resetBooted) return;
    setResetBooted(true);
    if (drafts.length === 0) {
      startSession({
        sourceKind: "general",
        sourceId: null,
        sourceName: "",
        autofill: "",
        draft: null,
      });
    }
    // Else: the draft list renders below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, resetSession, sourcePrompt, pendingSource, drafts.length, resetBooted]);

  const exitReset = () => {
    // A declined launch source must not linger, or it would reopen the
    // reset immediately after backing out.
    if (axzio.pendingResetSource) axzio.clearPendingResetSource();
    setActive(null);
    setResetSession(null);
    setSourcePrompt(null);
    setResetBooted(false);
  };

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      ) : active === "reset" && resetSession ? (
        <JourneyRunner
          key={resetSession.id}
          journey={JOURNEYS.find((j) => j.id === "reset")}
          onExit={exitReset}
          initialSession={resetSession}
        />
      ) : active === "reset" && sourcePrompt ? (
        <Card className="axzio-rise p-6 md:p-10">
          <MicroLabel className="mb-2">Reset passage</MicroLabel>
          <h3 className="text-2xl font-light tracking-wide md:text-3xl">
            {sourcePrompt.draft ? "Resume your reset?" : "Begin reset"}
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
            {sourcePrompt.draft ? (
              <>
                You have a reset in progress on{" "}
                <span className="text-white/85">“{sourcePrompt.name}”</span>{" "}
                (step {(sourcePrompt.draft.step || 0) + 1} of 8).
              </>
            ) : (
              <>
                Begin a reset on{" "}
                <span className="text-white/85">“{sourcePrompt.name}”</span>?
                The Situation will be pre-filled — you can refine it on step
                two.
              </>
            )}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {sourcePrompt.draft && (
              <Btn
                onClick={() =>
                  startSession({
                    sourceKind: sourcePrompt.kind,
                    sourceId: sourcePrompt.id,
                    sourceName: sourcePrompt.name,
                    autofill: sourcePrompt.autofill,
                    draft: sourcePrompt.draft,
                  })
                }
              >
                Resume
              </Btn>
            )}
            <Btn
              variant={sourcePrompt.draft ? "quiet" : undefined}
              onClick={() =>
                startSession({
                  sourceKind: sourcePrompt.kind,
                  sourceId: sourcePrompt.id,
                  sourceName: sourcePrompt.name,
                  autofill: sourcePrompt.autofill,
                  draft: null,
                })
              }
            >
              {sourcePrompt.draft ? "Start over" : "Begin"}
            </Btn>
            <Btn variant="quiet" onClick={exitReset}>
              Back to journeys
            </Btn>
          </div>
        </Card>
      ) : active === "reset" && (drafts.length > 0 || resetBooted) ? (
        <ResetDraftList
          drafts={drafts}
          onResume={(draft) =>
            startSession({
              sourceKind: draft.sourceKind,
              sourceId: draft.sourceId,
              sourceName: draft.sourceName,
              autofill: "",
              draft,
            })
          }
          onDiscard={(id) => axzio.clearResetDraft(id)}
          onNew={() =>
            startSession({
              sourceKind: "general",
              sourceId: null,
              sourceName: "",
              autofill: "",
              draft: null,
            })
          }
          onBack={exitReset}
        />
      ) : active === "reset" ? null : (
        <JourneyRunner
          key={active}
          journey={JOURNEYS.find((j) => j.id === active)}
          onExit={() => setActive(null)}
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
    id: "rbattery",
    field: "batteryNote",
    title: "Hear the instrument",
    phase: "Reveal",
    prompt:
      "Before forcing the performance, hear the instrument. Which dimension is asking for attention in this situation — and which remains available?",
    placeholder: "The dimension asking for attention is… what's available is…",
    help: {
      title: "Hear the instrument",
      what: "A 30-second read of your batteries before interpreting anything.",
      why: "Interpretation from an empty battery produces different answers than from a full one — and the reading belongs in the record.",
      example:
        "Physical at 3/10 with high priority: this situation may be exhaustion wearing a costume.",
    },
  },
  {
    id: "rsituation",
    field: "situation",
    title: "Name the situation",
    phase: "Reveal",
    prompt: "What situation are you bringing into this practice?",
    placeholder: "The situation is…",
    help: {
      title: "Name the situation",
      what: "One situation, named plainly.",
      why: "A reset works on one thing. Fog lifts when the situation has edges.",
      example:
        "“I keep postponing the pricing email” — not “work stress”.",
    },
  },
  {
    id: "rreveal",
    field: "reveal",
    title: "Reveal",
    phase: "Reveal",
    prompt:
      "What is happening? What pattern, signal, friction, or opportunity is present?",
    placeholder: "What is present…",
    help: {
      title: "Reveal",
      what: "What is actually happening — observation before story.",
      why: "Reveal separates what you can see from what you're telling yourself about it.",
      example:
        "“Third week I've moved the same task; I feel dread opening the laptop.”",
    },
  },
  {
    id: "rinterpret",
    field: "interpret",
    title: "Interpret",
    phase: "Interpret",
    prompt: "What may this be showing you? What story needs a wider reading?",
    placeholder: "A wider reading…",
    help: {
      title: "Interpret",
      what: "A wider reading of what the situation may be showing — then the friction check below.",
      why: "The story you tell about friction decides the response you choose.",
      example:
        "“Maybe the dread isn't laziness — it's the work asking for a boundary I haven't set.”",
    },
  },
  {
    id: "ralign",
    field: "align",
    title: "Align",
    phase: "Align",
    prompt: "Who are you choosing to become in relationship to this?",
    placeholder: "In relationship to this, I am choosing…",
    help: {
      title: "Align",
      what: "Who you are choosing to become, in relationship to this situation.",
      why: "Alignment is always relative to identity — the same situation asks different things of different people.",
      example:
        "“Someone who keeps promises to himself” — so the email goes today.",
    },
  },
  {
    id: "ract",
    field: "act",
    title: "Act",
    phase: "Act",
    prompt: "What is the next meaningful action you will take within 24 hours?",
    placeholder: "Within 24 hours I will…",
    help: {
      title: "Act",
      what: "One action: specific enough to perform, doable within 24 hours.",
      why: "Insight without a next move evaporates. The readiness check below asks whether you actually have what it needs right now.",
      example: "“Draft the pricing email before 10am tomorrow.”",
    },
  },
  {
    id: "rlifemod",
    field: "lifemod",
    title: "LifeMod",
    phase: "Act",
    prompt:
      "What condition will you change so this kind of action gets easier? Not another task — a change to the conditions around you.",
    placeholder: "The condition I will change is…",
    help: {
      title: "LifeMod",
      what: "A condition you change so aligned actions get easier — environment, boundary, scope, rhythm, support, or framing. Not a to-do.",
      why: "Willpower is finite; conditions compound. Change the setup and the behavior follows.",
      how: "Pick the kind of change, then name it. If what you wrote is a to-do (“call X”), it belongs in Act, not here.",
      example:
        "Action: “Call the accountant tomorrow.” LifeMod (Boundary): “No meetings before 10am, so deep work has a protected window.”",
    },
  },
  {
    id: "rintegrate",
    field: "integrate",
    title: "Integrate",
    phase: "Integrate",
    prompt:
      "Your best read right now: how should this reset land — and when will you check back? You'll confirm or adjust it at the review.",
    placeholder: "I will revisit this…",
    help: {
      title: "Integrate",
      what: "A provisional landing for this reset, plus the return point where you'll confirm it.",
      why: "A reset without a revisit evaporates. This isn't the final word — it's your best read today; the review is where you confirm, revise, or release it.",
      how: "Retain — keep living it as is. Revise — adjust it at review. Release — let it go at review. Repeat — run the practice again. When the revisit date arrives, it appears on the Deck under Reviews due.",
      example:
        "“Revise — revisit in a week to see whether the boundary held.”",
    },
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
      "Meet one real situation with eight movements and leave with an Action Card.",
    phaseLine:
      "Battery → Situation → Reveal → Interpret → Align → Act → LifeMod → Integrate",
    help: {
      title: "Guided Reset",
      what: "An eight-movement reset practice — battery scan, Situation, then Reveal → Interpret → Align → Act, a LifeMod, and Integrate — ending in an Action Card.",
      why: "Meet one real situation with the full Alchemist Path instead of letting it stay fog.",
      how: "Answer each movement; on completion you receive an Action Card you can copy. It can also be triggered from any Focus decision via “Explore in Guided Reset”. Private by default — stored only in this browser, nothing leaves this device.",
    },
    steps: RESET_STEPS.map((s) => ({
      id: s.id,
      title: s.title,
      phase: s.phase,
      render: s.id === "rintegrate" ? IntegrateStep : ResetFieldStep,
    })),
    done: {
      title: "The reset is sealed.",
      body: "One situation, met fully. The Action Card holds what you decided — revisit it when you said you would.",
    },
  },
];

/* Compact relative time for the draft list. */
function relativeTime(ts) {
  const s = Math.max(0, (Date.now() - (ts || 0)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/* The resume page: every unfinished reset, named by its source, with
   resume / discard per draft and a fresh start. Reached from the main
   Guided Reset entry; launches from an item jump straight to that
   source's draft instead. */
function ResetDraftList({ drafts, onResume, onDiscard, onNew, onBack }) {
  const sorted = [...drafts].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  return (
    <Card className="axzio-rise p-6 md:p-10">
      <MicroLabel className="mb-2">Reset passage</MicroLabel>
      <h3 className="text-2xl font-light tracking-wide md:text-3xl">
        Unfinished resets
      </h3>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
        Resets keep across sessions — pick one up where you left it, or
        begin a new one. Each holds its own source, so several can stay
        open at once.
      </p>
      <ul className="mt-6 space-y-3">
        {sorted.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-white/90">
                {d.sourceName || d.subject || "Untitled reset"}
              </p>
              <p className="mt-0.5 truncate text-[12px] tracking-wide text-white/40">
                {d.subject && d.subject !== (d.sourceName || "")
                  ? `${d.subject} · `
                  : ""}
                Step {(d.step || 0) + 1} of 8 · {relativeTime(d.savedAt)}
              </p>
            </div>
            <Btn
              variant="quiet"
              onClick={() => onResume(d)}
              className="shrink-0"
            >
              Resume
            </Btn>
            <button
              onClick={() => onDiscard(d.id)}
              aria-label={`Discard reset on ${d.sourceName || "untitled"}`}
              className="shrink-0 rounded p-1.5 text-white/25 transition-colors hover:text-white/80"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-3">
        <Btn onClick={onNew}>Start new reset</Btn>
        <Btn variant="quiet" onClick={onBack}>
          Back to journeys
        </Btn>
      </div>
    </Card>
  );
}

function JourneyRunner({ journey, onExit, initialSession, initialScratch, initialStep }) {
  const axzio = useAxzio();
  // A reset runs inside a session (draft id + source carried for the
  // persist below); other journeys keep the legacy scratch props.
  const session = initialSession || null;
  const [step, setStep] = useState(
    session ? session.step || 0 : initialStep || 0
  );
  const [finished, setFinished] = useState(false);
  // Per-journey transient inputs; a reset launched from a source arrives
  // with its Situation pre-filled (plus _draftId/_source threads).
  const [scratch, setScratch] = useState(
    session ? session.scratch : initialScratch || {}
  );
  const StepView = journey.steps[step].render;

  // Persist the in-progress Guided Reset into the synced drafts collection,
  // so an accidental navigation out can be resumed — on this device or
  // another. Cleared on completion (in the rintegrate commit), explicit
  // restart, or discard. A blank fresh session leaves no draft behind, so
  // "start over then immediately exit" can never wipe the previous draft.
  const drafts = axzio.state.resetDrafts || [];
  useEffect(() => {
    if (journey.id !== "reset" || !session || finished) return;
    const hasContent =
      step > 0 ||
      Object.keys(scratch).some((k) => {
        if (k.startsWith("_")) return false;
        const v = scratch[k];
        if (v == null || v === "") return false;
        if (typeof v === "object") return Object.keys(v).length > 0;
        return true;
      });
    const exists = drafts.some((d) => d.id === session.id);
    if (!hasContent && (session.fresh || !exists)) return;
    const subject = (scratch.rsituation || "").trim().slice(0, 90);
    axzio.saveResetDraft({
      id: session.id,
      sourceKind: session.sourceKind,
      sourceId: session.sourceId,
      sourceName: session.sourceName,
      savedAt: Date.now(),
      step,
      subject,
      scratch,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.id, scratch, step, finished]);

  // The reset's anchor, persistent across every step: the asset name
  // (source), the Situation text beneath it, and an expandable log of the
  // answers given so far. The name is the thread that keeps the reset's
  // focus visible when the questions get deep.
  const [recapOpen, setRecapOpen] = useState(false);
  const resetSubject =
    journey.id === "reset" ? (scratch.rsituation || "").trim() : "";
  const isSourced =
    !!session && session.sourceKind !== "general" && !!session.sourceName;
  const assetLabel = isSourced
    ? session.sourceName
    : resetSubject || "Untitled reset";
  const showAsset = journey.id === "reset" && !!session;
  const showSubject =
    resetSubject.length > 0 && journey.steps[step].id !== "rsituation";
  const subjectShort =
    resetSubject.length > 140
      ? resetSubject.slice(0, 140).trimEnd() + "…"
      : resetSubject;
  // Answers so far: every completed step's response, for the recap log.
  const recapSteps =
    journey.id === "reset"
      ? RESET_STEPS.slice(0, step).map((cfg) => {
          const raw = (scratch[cfg.id] || "").trim();
          let answer = raw.length > 120 ? raw.slice(0, 120).trimEnd() + "…" : raw;
          if (cfg.id === "rinterpret" && scratch.rfriction) {
            const fr = `Friction reads as ${frictionReadingLabel(scratch.rfriction)}.`;
            answer = answer ? `${answer} — ${fr}` : fr;
          }
          return { id: cfg.id, title: cfg.title, answer: answer || "—" };
        })
      : [];

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
    if (journey.id === "reset" && session) axzio.clearResetDraft(session.id);
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
          {showAsset && (
            <div className="mt-3 max-w-xl">
              <p className="flex items-baseline gap-2 text-[13px]">
                <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-white/30">
                  Reset on
                </span>
                <span
                  className="truncate text-white/85"
                  title={assetLabel}
                >
                  {assetLabel}
                </span>
              </p>
              {isSourced && showSubject && (
                <p
                  className="mt-1 truncate text-[12px] text-white/40"
                  title={resetSubject}
                >
                  {subjectShort}
                </p>
              )}
              {recapSteps.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRecapOpen((o) => !o)}
                  aria-expanded={recapOpen}
                  className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                    className={`transition-transform duration-200 ${
                      recapOpen ? "rotate-180" : ""
                    }`}
                  >
                    <path
                      d="M2 4l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.4"
                    />
                  </svg>
                  Your answers so far ({recapSteps.length})
                </button>
              )}
              {recapOpen && recapSteps.length > 0 && (
                <ul className="mt-3 space-y-2.5 border-l border-white/15 pl-4">
                  {recapSteps.map((r) => (
                    <li key={r.id}>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                        {r.title}
                      </p>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-white/65">
                        {r.answer}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
        // Completing the Guided Reset: persist all fields as one
        // reset, keeping the thread back to a triggering Focus decision
        // or Constellation seed. Integrate lands as a choice + review
        // date rather than free text.
        const entry = axzio.saveReset({
          situation: scratch.rsituation,
          batteryNote: scratch.rbattery,
          reveal: scratch.rreveal,
          interpret: scratch.rinterpret,
          align: scratch.ralign,
          act: scratch.ract,
          lifemod: scratch.rlifemod,
          integrate: "",
          frictionReading: scratch.rfriction || null,
          readiness: scratch.rreadiness || null,
          readinessNote: scratch.rreadinessNote?.trim() || null,
          lifemodType: scratch.rlifemodType || null,
          integrateChoice: scratch.rintegrateChoice || null,
          reviewDate: scratch.rintegrateDate || null,
          sourceItemId:
            (scratch._sourceKind === "focus" ? scratch._sourceId : null) ||
            scratch._sourceItemId ||
            null,
          sourceStarId:
            (scratch._sourceKind === "star" ? scratch._sourceId : null) ||
            scratch._sourceStarId ||
            null,
        });
        axzio.clearResetDraft(scratch._draftId);
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
    // Guided Reset steps: battery + text fields are required; interpret
    // also requires the friction reading; integrate requires the choice.
    if (stepId === "rinterpret") {
      return !!scratch.rinterpret?.trim() && !!scratch.rfriction;
    }
    if (stepId === "rintegrate") {
      return !!scratch.rintegrateChoice;
    }
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
        {cfg.prompt}{" "}
        {cfg.help && (
          <HelpBubble title={cfg.help.title} className="ml-1">
            <HelpText
              what={cfg.help.what}
              why={cfg.help.why}
              how={cfg.help.how}
              example={cfg.help.example}
            />
          </HelpBubble>
        )}
      </p>
      {stepId === "rbattery" && <BatteryScan />}
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
      {stepId === "rinterpret" && (
        <FrictionPills scratch={scratch} setScratch={setScratch} />
      )}
      {stepId === "ract" && (
        <ReadinessChips scratch={scratch} setScratch={setScratch} />
      )}
      {stepId === "rlifemod" && (
        <LifeModTypePills scratch={scratch} setScratch={setScratch} />
      )}
    </div>
  );
}

/* Battery scan — "hear the instrument before forcing the performance."
   Shows today's readings and lets them be corrected on the spot; edits
   write through setBattery, so the Deck's State card sees them too. */
function BatteryScan() {
  const axzio = useAxzio();
  const { state } = axzio;
  const today = localDateKey();
  const day = getDayState(state, today);
  const anySet = BATTERY.some((b) => Number.isFinite(day.battery?.[b.key]));
  return (
    <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>Today's instrument</MicroLabel>
        <HelpBubble title="Battery scan">
          <HelpText
            what="Your five batteries as they stand today — adjustable here if the reading is stale."
            why="Interpretation from an empty battery gives different answers than from a full one. Correct the instrument before reading the situation through it."
            how="Drag a slider; the change writes straight through to the Deck's State card."
          />
        </HelpBubble>
      </div>
      {!anySet ? (
        <p className="mb-3 text-[13px] leading-relaxed text-white/45">
          No battery reading today yet — set it here by feel; it counts as
          today's check.
        </p>
      ) : null}
      <ul className="space-y-3">
        {BATTERY.map((b) => {
          const v = day.battery?.[b.key];
          return (
            <li key={b.key}>
              <div className="mb-1 flex items-center justify-between gap-3 text-[13px]">
                <span className="text-white/60">{b.label}</span>
                <span className="text-white/85">
                  {Number.isFinite(v) ? `${v}/10` : "—"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={Number.isFinite(v) ? v : 5}
                onChange={(e) =>
                  axzio.setBattery(today, b.key, Number(e.target.value))
                }
                className="w-full accent-white"
                aria-label={`${b.label} battery`}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Friction reading — the required Eisenhower companion: is this friction
   evidence of misalignment, or the pressure of growth? */
function FrictionPills({ scratch, setScratch }) {
  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center gap-2">
        <MicroLabel>Friction check — misalignment or growth?</MicroLabel>
        <HelpBubble title="Friction check">
          <HelpText
            what="Name whether this friction signals misalignment or growth."
            why="Different friction, different medicine. Misalignment asks for realignment or release; growth asks for resourcing and persistence."
            how="Misalignment — off-path: wrong commitment, wrong environment, a violated boundary. Growth — the pressure of becoming: hard because it's new, stretching, or unfamiliar. Both — name the mix."
            example="Dreading the gym because you hate the program (misalignment) vs. because it's week three and your body is adapting (growth)."
          />
        </HelpBubble>
      </div>
      <div className="flex flex-wrap gap-2">
        {FRICTION_READINGS.map((f) => {
          const on = scratch.rfriction === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() =>
                setScratch((s) => ({ ...s, rfriction: on ? null : f.key }))
              }
              className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                on
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Readiness check — confidence as an activatable state, at action time. */
function ReadinessChips({ scratch, setScratch }) {
  const cur = scratch.rreadiness || {};
  const toggle = (key) =>
    setScratch((s) => ({
      ...s,
      rreadiness: { ...(s.rreadiness || {}), [key]: !s.rreadiness?.[key] },
    }));
  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center gap-2">
        <MicroLabel>
          Readiness — do you have what this action needs right now? (Tap all
          that apply)
        </MicroLabel>
        <HelpBubble title="Readiness check">
          <HelpText
            what="An honest inventory before you commit: which of these do you actually have for this action? This is multi-select — choose every one that's true."
            why="Acting without readiness is how actions stall. Naming what's missing tells you what to resupply first."
            how="Curious — genuine interest in doing it, not just duty. Competent — you have the skill, resources, and time. Congruent — it fits who you're choosing to become. Connected — you have the people or support it needs."
          />
        </HelpBubble>
      </div>
      <div className="flex flex-wrap gap-2">
        {READINESS_DIMS.map((d) => {
          const on = cur[d.key] === true;
          return (
            <button
              key={d.key}
              type="button"
              onClick={() => toggle(d.key)}
              aria-pressed={on}
              className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                on
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <Field
        value={scratch.rreadinessNote || ""}
        onChange={(e) =>
          setScratch((s) => ({ ...s, rreadinessNote: e.target.value }))
        }
        placeholder="Note on your readiness (optional) — what's missing, what would resupply it"
        maxLength={200}
        aria-label="Note on your readiness"
        className="mt-3 text-[14px]"
      />
    </div>
  );
}

/* LifeMod plain types — the capture surface; the 8 legend functions stay
   the deeper classification inside the LifeMod editor. */
function LifeModTypePills({ scratch, setScratch }) {
  return (
    <div className="mt-5">
      <div className="mb-2.5 flex items-center gap-2">
        <MicroLabel>What kind of change is it?</MicroLabel>
        <HelpBubble title="LifeMod types">
          <HelpText
            what="The kind of condition you're changing. A LifeMod is never a to-do — it's a change to the setup around you."
            why="Naming the kind keeps the change honest: a boundary problem solved with an action will just recur."
            how="Environment — change your surroundings: physical or digital. (Phone charges outside the bedroom.) Boundary — a rule about what you'll allow. (No meetings before 10am.) Scope — shrink or expand what you're carrying. (Three projects, not nine.) Rhythm — change timing or cadence. (Weekly review every Friday.) Support — add people, tools, or help. (Hire the bookkeeper.) Framing — change how you see or name it. (Training, not exercise.)"
          />
        </HelpBubble>
      </div>
      <div className="flex flex-wrap gap-2">
        {LIFEMOD_PLAIN_TYPES.map((t) => {
          const on = scratch.rlifemodType === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() =>
                setScratch((s) => ({
                  ...s,
                  rlifemodType: on ? null : t.key,
                }))
              }
              className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                on
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* Integrate — Retain / Revise / Release / Repeat + a scheduled return
   point carried on the Action Card. */
function IntegrateStep({ scratch, setScratch }) {
  const cfg = RESET_STEPS.find((s) => s.id === "rintegrate");
  // Default the revisit to tomorrow; the native date control opens the
  // system calendar picker (including on iPhone).
  useEffect(() => {
    if (scratch.rintegrateDate === undefined) {
      const t = new Date();
      t.setDate(t.getDate() + 1);
      setScratch((s) =>
        s.rintegrateDate === undefined
          ? { ...s, rintegrateDate: localDateKey(t) }
          : s
      );
    }
  }, []);
  return (
    <div>
      <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
        {cfg.prompt}{" "}
        {cfg.help && (
          <HelpBubble title={cfg.help.title} className="ml-1">
            <HelpText
              what={cfg.help.what}
              why={cfg.help.why}
              how={cfg.help.how}
              example={cfg.help.example}
            />
          </HelpBubble>
        )}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {INTEGRATE_CHOICES.map((c) => {
          const on = scratch.rintegrateChoice === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() =>
                setScratch((s) => ({
                  ...s,
                  rintegrateChoice: on ? null : c.key,
                }))
              }
              className={`rounded-xl border p-4 text-left transition-colors ${
                on
                  ? "border-white/40 bg-white/[0.06]"
                  : "border-white/10 hover:border-white/25"
              }`}
            >
              <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-white/90">
                {c.label}
              </div>
              <div className="mt-1 text-[12px] leading-relaxed text-white/45">
                {c.desc}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        <MicroLabel className="mb-1.5">Revisit on</MicroLabel>
        <input
          type="date"
          value={scratch.rintegrateDate || ""}
          onChange={(e) =>
            setScratch((s) => ({ ...s, rintegrateDate: e.target.value || null }))
          }
          className="w-full max-w-xs rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[14px] text-white focus:border-white/50 focus:outline-none [color-scheme:dark]"
        />
        <p className="mt-1.5 text-[12px] text-white/40">
          Defaults to tomorrow — tap to open the calendar.
        </p>
      </div>
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
  // Structured reading block.
  const reading = [];
  if (reset.frictionReading) {
    reading.push(`Friction: ${frictionReadingLabel(reset.frictionReading)}`);
  }
  if (reset.readiness) {
    const dims = READINESS_DIMS.filter((d) => reset.readiness[d.key]).map(
      (d) => d.label
    );
    if (dims.length) reading.push(`Readiness: ${dims.join(", ")}`);
  }
  if (reset.lifemodType) {
    reading.push(`LifeMod type: ${lifemodPlainTypeLabel(reset.lifemodType)}`);
  }
  if (reset.integrateChoice) {
    reading.push(
      `Integrate: ${integrateChoiceLabel(reset.integrateChoice)}${
        reset.reviewDate ? ` — revisit ${reset.reviewDate}` : ""
      }`
    );
  }
  if (reading.length) {
    lines.push("READING");
    lines.push(...reading);
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

        {/* Canonical reading block: friction, readiness, LifeMod type,
            and how the reset lands + its review date. */}
        {(reset.frictionReading ||
          reset.readiness ||
          reset.lifemodType ||
          reset.integrateChoice) && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <MicroLabel className="mb-3">Reading</MicroLabel>
            <ul className="space-y-1.5 text-[14px] leading-relaxed text-white/75">
              {reset.frictionReading && (
                <li>
                  Friction reads as{" "}
                  <span className="text-white">
                    {frictionReadingLabel(reset.frictionReading)}
                  </span>
                  .
                </li>
              )}
              {reset.readiness &&
                READINESS_DIMS.some((d) => reset.readiness[d.key]) && (
                  <li>
                    Readiness:{" "}
                    <span className="text-white">
                      {READINESS_DIMS.filter((d) => reset.readiness[d.key])
                        .map((d) => d.label.toLowerCase())
                        .join(", ")}
                    </span>
                    .
                    {reset.readinessNote ? (
                      <>
                        {" "}
                        <span className="text-white/60">
                          — {reset.readinessNote}
                        </span>
                      </>
                    ) : null}
                  </li>
                )}
              {reset.lifemodType && (
                <li>
                  LifeMod type:{" "}
                  <span className="text-white">
                    {lifemodPlainTypeLabel(reset.lifemodType)}
                  </span>
                  .
                </li>
              )}
              {reset.integrateChoice && (
                <li>
                  {integrateChoiceLabel(reset.integrateChoice)}
                  {reset.reviewDate
                    ? ` — revisit ${formatLongDate(reset.reviewDate)}`
                    : ""}
                  .
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Grow the LifeMod step into a real LifeMod. */}
        {reset.lifemod?.trim() && !reset.lifemodId && (
          <div>
            <Btn
              variant="quiet"
              onClick={() => {
                const lm = axzio.addLifeMod(reset.lifemod.trim().slice(0, 120), {
                  origin: "friction",
                  friction: reset.lifemod.trim(),
                  legendFunction: null,
                });
                if (lm) axzio.linkResetLifeMod(reset.id, lm.id);
              }}
            >
              Grow into a LifeMod
            </Btn>
          </div>
        )}
        {reset.lifemodId && (
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">
            Grown into a LifeMod — find it in the Constellation.
          </p>
        )}

        {/* Review — the Integrate step's return point, confirmed here. */}
        {reset.reviewDate && !reset.reviewedAt && (
          <div className="rounded-xl border border-white/15 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2">
              <MicroLabel>Review</MicroLabel>
              <HelpBubble title="Reviewing a reset">
                <HelpText
                  what="The Integrate step set this return point. Now it's due: look back at the reset with fresh eyes."
                  why="The landing you chose was provisional — your best read at the time. The review is where you confirm it, revise it, or release it."
                  how="Read the card, then mark it reviewed. If the landing changed, run a new Reset rather than editing the old one — the record stays honest."
                />
              </HelpBubble>
            </div>
            <p className="mb-3 text-[14px] leading-relaxed text-white/60">
              Revisit {formatLongDate(reset.reviewDate)}
              {reset.reviewDate <= localDateKey()
                ? " — this date has arrived"
                : ""}
              .
            </p>
            <Btn
              variant="quiet"
              onClick={() => axzio.markResetReviewed(reset.id)}
            >
              Mark reviewed
            </Btn>
          </div>
        )}
        {reset.reviewDate && reset.reviewedAt && (
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">
            Reviewed — this reset is closed.
          </p>
        )}

        {/* Thread the action into Focus as a linked item. */}
        <AddToFocusFromReset reset={reset} />
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

/* Add the reset's action to Focus as a linked item: the same capture
   fields (text, quadrant, timeframe), pre-filled from the Act step.
   The item carries sourceResetId so Focus can link back to this card. */
function AddToFocusFromReset({ reset }) {
  const axzio = useAxzio();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(reset.act || "");
  const [quadrant, setQuadrant] = useState("q1");
  const [timeframe, setTimeframe] = useState("day");
  const [createdId, setCreatedId] = useState(null);
  if (!reset.act?.trim() && !open && !createdId) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2">
        <MicroLabel>Add the action to Focus</MicroLabel>
        <HelpBubble title="Add to Focus">
          <HelpText
            what="Turns the Act step into a real Focus item, linked back to this Action Card."
            why="A reset action that never enters Focus is a wish. Linking keeps the thread: Focus item → this card, and back."
            how="Adjust the text, pick the quadrant and timeframe, add it. The Focus item will show a link to this Action Card."
          />
        </HelpBubble>
      </div>
      {!open && !createdId && (
        <Btn variant="quiet" onClick={() => setOpen(true)}>
          Add to Focus
        </Btn>
      )}
      {createdId && (
        <p className="text-[14px] leading-relaxed text-white/70">
          Added to Focus —{" "}
          <a href="#/focus" className="text-white underline">
            open Focus
          </a>{" "}
          to rank it.
        </p>
      )}
      {open && !createdId && (
        <div className="space-y-4">
          <Field
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="The action, as it should appear in Focus"
            maxLength={220}
          />
          <div>
            <MicroLabel className="mb-2">Quadrant</MicroLabel>
            <div className="flex flex-wrap gap-2">
              {QUADRANTS.map((q) => (
                <button
                  key={q.key}
                  type="button"
                  onClick={() => setQuadrant(q.key)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    quadrant === q.key
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:text-white"
                  }`}
                >
                  {q.key.toUpperCase()} · {q.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <MicroLabel className="mb-2">Timeframe</MicroLabel>
            <div className="flex flex-wrap gap-2">
              {TIMEFRAMES.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTimeframe(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    timeframe === t.key
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Btn
              onClick={() => {
                const item = axzio.addFocusItem(text, quadrant, {
                  timeframe,
                  sourceResetId: reset.id,
                });
                if (item) {
                  setCreatedId(item.id);
                  setOpen(false);
                }
              }}
              disabled={!text.trim()}
            >
              Add to Focus
            </Btn>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[11px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
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
