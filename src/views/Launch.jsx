/* Launch Sequence — the identity launch journey.
 *
 * Nine thresholds: Love → Hope → Dream → Believe → Begin → Build →
 * Become → Live Your Legend → Forge the Myth. An arc, not a checklist:
 * each stage is crossed by doing something real, in the traveler's own
 * words. Crossings write evidence to the journey thread in the Nebula.
 *
 * Entry: #/launch (also linked from the Atlas index).
 */
import { useState } from "react";
import { useAxzio, LAUNCH_STAGES } from "../store.jsx";
import {
  Card,
  MicroLabel,
  HelpBubble,
  HelpText,
  TextArea,
  Btn,
  SectionHead,
} from "../components/ui.jsx";

function JourneyMap({ crossings, currentKey }) {
  const crossed = new Set((crossings || []).map((c) => c.stageKey));
  const currentIdx = LAUNCH_STAGES.findIndex((s) => s.key === currentKey);
  return (
    <div className="relative mt-2 pl-2">
      <div
        className="absolute bottom-3 left-[23px] top-3 w-[2px] bg-white/10"
        aria-hidden="true"
      />
      <div
        className="absolute left-[23px] top-3 w-[2px] bg-gradient-to-b from-[#d8a94e] to-[#d8a94e]/20"
        style={{
          height: `calc(${(crossed.size / LAUNCH_STAGES.length) * 100}% - 12px)`,
          maxHeight: "calc(100% - 24px)",
        }}
        aria-hidden="true"
      />
      {LAUNCH_STAGES.map((s, i) => {
        const isDone = crossed.has(s.key);
        const isNow = s.key === currentKey;
        return (
          <div key={s.key} className="relative flex gap-4 py-3">
            <span
              className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-black text-[13px] ${
                isNow
                  ? "border-[#d8a94e] bg-[#d8a94e] font-bold text-black shadow-[0_0_18px_rgba(216,169,78,0.5)]"
                  : isDone
                    ? "border-[#d8a94e]/70 text-[#d8a94e]"
                    : "border-white/20 text-white/35"
              }`}
            >
              {isDone ? "✓" : i + 1}
            </span>
            <span className="pt-0.5">
              <span
                className={`block text-[15px] ${
                  isNow ? "text-white" : isDone ? "text-white/75" : "text-white/35"
                }`}
              >
                {s.label}
              </span>
              <span
                className={`mt-0.5 block text-[12.5px] leading-relaxed ${
                  isNow ? "text-[#d8a94e]/80" : "text-white/40"
                }`}
              >
                {s.move}
              </span>
              {isNow && (
                <span className="mt-1 block text-[11px] uppercase tracking-[0.18em] text-[#d8a94e]">
                  You are here
                </span>
              )}
            </span>
          </div>
        );
      })}
      {currentIdx === -1 && crossed.size === 0 && (
        <span className="sr-only">Journey not yet begun</span>
      )}
    </div>
  );
}

export default function Launch() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [words, setWords] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const crossings = state.launchCrossings || [];
  const crossed = new Set(crossings.map((c) => c.stageKey));
  const isComplete = crossed.size >= LAUNCH_STAGES.length;
  const notStarted = crossings.length === 0 && !state.launchStage;
  const current =
    !isComplete && !notStarted
      ? LAUNCH_STAGES.find((s) => s.key === state.launchStage)
      : null;

  const cross = () => {
    const c = axzio.crossLaunchStage(words);
    if (c) setWords("");
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <SectionHead
        label="Launch Sequence"
        help={
          <HelpBubble title="Launch Sequence">
            <HelpText
              what="The identity launch journey — nine thresholds from Love to Forge the Myth."
              why="Becoming has an arc. Each stage is crossed by doing something real, in your own words — the app witnesses, the world is where it happens."
              how="Begin at Love. When a stage is lived, write what it meant and cross the threshold. No streaks — the sequence waits."
            />
          </HelpBubble>
        }
      />
      <h1 className="text-3xl font-light tracking-wide">Becoming, in nine moves.</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
        Not a checklist — <span className="text-white/85">an arc</span>. Each
        stage is a threshold: you cross it by doing something real. Crossings
        are written into your legend and seed a thread in your Nebula.
      </p>

      {notStarted && (
        <Card className="mt-8 border-[#d8a94e]/30 p-8 text-center">
          <MicroLabel className="mb-3 text-[#d8a94e]/80">Stage 1 of 9 · Love</MicroLabel>
          <h2 className="text-2xl font-light">Every legend starts with love.</h2>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/55">
            Before direction becomes strategy, something matters. Name what
            you care for — and the sequence begins.
          </p>
          <Btn
            variant="primary"
            onClick={() => axzio.beginLaunch()}
            className="mt-6"
          >
            Begin the sequence
          </Btn>
        </Card>
      )}

      {isComplete && (
        <Card className="mt-8 border-[#d8a94e]/30 p-8 text-center">
          <MicroLabel className="mb-3 text-[#d8a94e]/80">Nine of nine</MicroLabel>
          <h2 className="text-2xl font-light">The myth is forged.</h2>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/55">
            You walked the whole arc. What you lived is now something others
            can follow — and the journey thread in your Nebula holds every
            crossing, in your own words.
          </p>
          {confirmReset ? (
            <div className="mt-6 flex items-center justify-center gap-3">
              <span className="text-[13px] text-white/60">
                Walk the sequence again from Love?
              </span>
              <button
                type="button"
                onClick={() => {
                  axzio.resetLaunch();
                  axzio.beginLaunch();
                  setConfirmReset(false);
                }}
                className="rounded-lg bg-[#d8a94e] px-4 py-2 text-[12px] font-medium uppercase tracking-[0.14em] text-black"
              >
                Walk again
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-[12px] uppercase tracking-[0.14em] text-white/40 hover:text-white"
              >
                Stay
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="mt-6 text-[12px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
            >
              Walk it again →
            </button>
          )}
        </Card>
      )}

      {!notStarted && !isComplete && (
        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_1.2fr]">
          <Card className="p-6">
            <MicroLabel className="mb-2">The journey</MicroLabel>
            <JourneyMap crossings={crossings} currentKey={state.launchStage} />
          </Card>

          {current && (
            <Card className="border-[#d8a94e]/30 p-6">
              <MicroLabel className="mb-2 text-[#d8a94e]/80">
                Stage {LAUNCH_STAGES.indexOf(current) + 1} of {LAUNCH_STAGES.length} ·{" "}
                {current.label}
              </MicroLabel>
              <h2 className="text-2xl font-light">{current.move}.</h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-white/60">
                {current.desc}
              </p>
              <div className="mt-5 rounded-xl border border-[#d8a94e]/20 bg-[#d8a94e]/5 p-4">
                <MicroLabel className="mb-2 text-[#d8a94e]/80">The practice</MicroLabel>
                <p className="text-[14px] leading-relaxed text-white/70">
                  {current.suggestion}
                </p>
                <TextArea
                  value={words}
                  onChange={(e) => setWords(e.target.value)}
                  placeholder="What did this stage mean, in your own words?"
                  rows={3}
                  maxLength={500}
                  aria-label={`What ${current.label} meant to you`}
                  className="mt-3 !bg-black/40 text-[14px]"
                />
              </div>
              <Btn variant="primary" onClick={cross} className="mt-5 w-full">
                Cross the threshold — {current.label}
              </Btn>
              <p className="mt-3 text-center text-[12px] text-white/35">
                Crossing writes to your legend and your Nebula thread.
              </p>
            </Card>
          )}
        </div>
      )}

      {crossings.length > 0 && (
        <div className="mt-10">
          <MicroLabel className="mb-3">Crossings — in your words</MicroLabel>
          <div className="space-y-2">
            {crossings
              .slice()
              .reverse()
              .map((c) => {
                const s = LAUNCH_STAGES.find((x) => x.key === c.stageKey);
                return (
                  <div
                    key={c.id}
                    className="rounded-xl border border-white/10 px-4 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#d8a94e]/70">
                      {s ? s.label : c.stageKey} ·{" "}
                      {new Date(c.at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {c.words && (
                      <p className="mt-1 text-[14px] leading-relaxed text-white/70">
                        {c.words}
                      </p>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
