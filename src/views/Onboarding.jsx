import { useEffect, useState } from "react";
import {
  useAxzio,
  BATTERY,
  localDateKey,
  getDayState,
} from "../store.jsx";
import { Card, MicroLabel, Btn, Field, TextArea } from "../components/ui.jsx";
import ModePicker from "../components/ModePicker.jsx";
import { ORIENTATION_STATEMENTS } from "./Identity.jsx";

/* ------------------------------------------------------------------ */
/* ONBOARDING — first-use walkthrough + setup sequence.                 */
/*                                                                     */
/* Every step is skippable. Inputs write live into the store, and the  */
/* current step is persisted, so reloading mid-walkthrough resumes      */
/* exactly where the user left off. Existing users (setupComplete)      */
/* never see this — the store migration marks them onboarded.           */
/* ------------------------------------------------------------------ */

const MODULES = [
  {
    key: "deck",
    label: "Command Deck",
    purpose:
      "Your daily overview: who you are, what matters today, what mode you are in, and the state of your battery.",
  },
  {
    key: "focus",
    label: "Focus",
    purpose:
      "The Decision Engine: sort everything that needs deciding, separate urgency from importance, and hold one single One Thing.",
  },
  {
    key: "modes",
    label: "Modes",
    purpose:
      "Your energy, organized three ways — Production, Pleasure, People — set per day, week, and month.",
  },
  {
    key: "constellation",
    label: "Constellation",
    purpose:
      "Your map: the eight stages of the system, plus the stars you ignite along the way.",
  },
  {
    key: "identity",
    label: "Identity",
    purpose:
      "Who you are becoming: the authored Identity Core the whole system reads against.",
  },
  {
    key: "journeys",
    label: "Journeys",
    purpose:
      "Guided practice passages: morning and evening rituals, ignition — and the Reset that turns a situation into an Action Card.",
  },
];

const IDENTITY_STEP = 1 + MODULES.length; // index of the identity step

export default function Onboarding({ onComplete }) {
  const axzio = useAxzio();
  const { state, setOnboardingStep, completeOnboarding } = axzio;

  const total = 1 + MODULES.length + 4; // welcome + tour + identity/battery/modes/intention
  const [step, setStep] = useState(() => {
    const s = state.identity.onboardingStep;
    return Number.isInteger(s) && s >= 0 && s < total ? s : 0;
  });

  // Persist progress so a reload resumes mid-walkthrough.
  useEffect(() => {
    setOnboardingStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const go = (n) => setStep(Math.min(total - 1, Math.max(0, n)));
  const isTour = step >= 1 && step <= MODULES.length;
  const isLast = step === total - 1;

  const finish = () => {
    completeOnboarding();
    onComplete();
  };

  return (
    <div className="relative z-10 flex min-h-full items-center justify-center px-5 py-10">
      <Card className="axzio-rise w-full max-w-xl p-8 md:p-12">
        {/* progress */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <MicroLabel>First use</MicroLabel>
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              Step {step + 1} of {total}
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className={`h-px flex-1 transition-colors duration-500 ${
                  i <= step ? "bg-white/80" : "bg-white/12"
                }`}
              />
            ))}
          </div>
        </div>

        <div key={step} className="axzio-rise">
          {step === 0 && <WelcomeStep />}
          {isTour && <TourStep module={MODULES[step - 1]} index={step - 1} />}
          {step === IDENTITY_STEP && <IdentityStep />}
          {step === IDENTITY_STEP + 1 && <BatteryStep />}
          {step === IDENTITY_STEP + 2 && <ModesStep />}
          {step === IDENTITY_STEP + 3 && <IntentionStep />}
        </div>

        {/* nav */}
        <div className="mt-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <Btn variant="quiet" onClick={() => go(step - 1)}>
                Back
              </Btn>
            ) : (
              <span />
            )}
            {isTour && (
              <button
                onClick={() => go(IDENTITY_STEP)}
                className="text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white"
              >
                Skip the tour
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!isLast && (
              <Btn variant="quiet" onClick={() => go(step + 1)}>
                Skip for now
              </Btn>
            )}
            {isLast ? (
              <Btn onClick={finish}>Enter the deck</Btn>
            ) : (
              <Btn onClick={() => go(step + 1)}>Continue</Btn>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ steps ------------------------------ */

function WelcomeStep() {
  return (
    <div>
      <MicroLabel className="mb-3">Welcome</MicroLabel>
      <h2 className="text-3xl font-light tracking-wide md:text-4xl">
        This is AXZIO.
      </h2>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
        AXZIO is the interface layer of NE3ULA —{" "}
        <span className="text-white">where signal becomes structure</span>. It
        reads every day against the identity you are authoring, and turns
        attention into aligned action.
      </p>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/65">
        First, a short tour of the six modules — then a few setup steps, each
        skippable. Nothing here is permanent; everything can be revised later.
      </p>
    </div>
  );
}

function TourStep({ module, index }) {
  return (
    <div>
      <MicroLabel className="mb-3">
        The modules — {index + 1} of {MODULES.length}
      </MicroLabel>
      <h2 className="text-3xl font-light tracking-wide md:text-4xl">
        {module.label}
      </h2>
      <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/65">
        {module.purpose}
      </p>
      <p className="mt-4 text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/35">
        #/{module.key}
      </p>
    </div>
  );
}

function IdentityStep() {
  const { state, updateIdentity } = useAxzio();
  return (
    <div>
      <MicroLabel className="mb-3">Setup — identity</MicroLabel>
      <h2 className="text-3xl font-light tracking-wide md:text-4xl">
        Who is entering?
      </h2>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
        AXZIO reads everything against your Identity Core — the identity you
        are <span className="text-white">consciously authoring</span>, not a
        mood, a role, or a performance. Name it plainly.
      </p>
      <div className="mt-7 space-y-6">
        <div>
          <MicroLabel className="mb-2">Display name</MicroLabel>
          <Field
            value={state.identity.name || ""}
            onChange={(e) => updateIdentity({ name: e.target.value })}
            placeholder="What should the interface call you?"
            maxLength={40}
            autoFocus
          />
        </div>
        {ORIENTATION_STATEMENTS.map((s) => (
          <div key={s.key}>
            <MicroLabel className="mb-2">
              {s.prompt}{" "}
              <span className="text-white/30">(optional)</span>
            </MicroLabel>
            <TextArea
              value={state.identity[s.key] || ""}
              onChange={(e) =>
                updateIdentity({ [s.key]: e.target.value })
              }
              placeholder={s.placeholder}
              rows={2}
              maxLength={280}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function BatteryStep() {
  const { state, setBattery } = useAxzio();
  const today = localDateKey();
  const day = getDayState(state, today);
  return (
    <div>
      <MicroLabel className="mb-3">Setup — baseline</MicroLabel>
      <h2 className="text-3xl font-light tracking-wide md:text-4xl">
        Hear the instrument.
      </h2>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
        The Human Battery reads five dimensions of available capacity. Set a
        baseline for today — <span className="text-white">state is not
        identity</span>; a low reading is a condition to meet, not a verdict.
      </p>
      <div className="mt-7 space-y-6">
        {BATTERY.map((b) => {
          const value = Number.isFinite(day.battery?.[b.key])
            ? day.battery[b.key]
            : 5;
          return (
            <div key={b.key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[15px] font-medium tracking-wide">
                  {b.label}
                </span>
                <span className="text-2xl font-light tabular-nums">
                  {value}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) =>
                  setBattery(today, b.key, Number(e.target.value))
                }
                className="axzio-range w-full"
                aria-label={`${b.label} battery level`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModesStep() {
  return (
    <div>
      <MicroLabel className="mb-3">Setup — modes</MicroLabel>
      <h2 className="text-3xl font-light tracking-wide md:text-4xl">
        Where is energy going?
      </h2>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
        Three modes organize energy —{" "}
        <span className="text-white">Production, Pleasure, People</span>.
        Choose today's primary and secondary. No mode is superior; problems
        arise when one claims the whole system. You can set the week and
        month later in Modes.
      </p>
      <div className="mt-7">
        <ModePicker interval="day" />
      </div>
    </div>
  );
}

function IntentionStep() {
  const { state, setIntention } = useAxzio();
  const today = localDateKey();
  const day = getDayState(state, today);
  return (
    <div>
      <MicroLabel className="mb-3">Setup — first line</MicroLabel>
      <h2 className="text-3xl font-light tracking-wide md:text-4xl">
        What is today for?
      </h2>
      <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
        One line. This becomes today's intention on the Command Deck — the
        first entry in the interface.
      </p>
      <div className="mt-7">
        <TextArea
          value={day.intention || ""}
          onChange={(e) => setIntention(today, e.target.value)}
          placeholder="Today is for…"
          rows={3}
          maxLength={220}
          autoFocus
        />
      </div>
    </div>
  );
}
