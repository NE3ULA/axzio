import {
  useAxzio,
  MODES,
  MODE_INTERVALS,
  modeLabel,
} from "../store.jsx";
import {
  Card,
  MicroLabel,
  SectionHead,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";
import ModePicker from "../components/ModePicker.jsx";

/* ------------------------------------------------------------------ */
/* MODES — the three Modes of Energy (WE ARE ALCHEMY, ch. TUNING):      */
/* Production, Pleasure, People. Two readings: the mode you're IN      */
/* right now (descriptive, single) and the modes to FOCUS on per        */
/* interval (prescriptive, primary + secondary).                       */
/* ------------------------------------------------------------------ */

export default function Modes() {
  const axzio = useAxzio();
  const { state } = axzio;
  const current = (state.modes && state.modes.current) || null;
  const dayModes = (state.modes && state.modes.day) || {
    primary: null,
    secondary: null,
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <MicroLabel className="mb-2">Energy</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Modes
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">
          Energy takes form through modes — temporary ways attention and
          effort are being organized. Two readings matter:{" "}
          <span className="text-white">the mode you're in right now</span>,
          and{" "}
          <span className="text-white">the modes you're pointing focus at</span>
          .
        </p>
        <p className="mt-3 max-w-2xl border-l border-white/25 pl-4 text-[15px] leading-relaxed text-white/75">
          No mode is superior. Problems arise when one mode claims the whole
          system: Production without Pleasure becomes extractive; People
          without boundaries becomes self-loss; Pleasure without direction
          can become escape.
        </p>
      </header>

      {/* the mode you're IN right now (descriptive) */}
      <section className="axzio-rise axzio-rise-1 mb-6">
        <Card className="p-6">
          <SectionHead
            label="Right now"
            help={
              <HelpBubble title="The mode you're in">
                <HelpText
                  what="The mode your energy is actually in right now: Production, Pleasure, or People. Descriptive — an honest reading, not an aspiration."
                  why="Honesty about where you are keeps the system workable. In Pleasure but focusing Production is a real state, not a failure — but it only works when it's named."
                  how="Tap a mode to set it; tap it again to clear. This is separate from where you point your focus below."
                />
              </HelpBubble>
            }
            right={
              <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                {current ? `In · ${modeLabel(current)}` : "Unset"}
              </span>
            }
          />
          <p className="mb-4 mt-1 max-w-2xl text-[13px] leading-relaxed text-white/45">
            Where your energy actually is — not where you wish it were.
          </p>
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => {
              const isSel = current === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => axzio.setCurrentMode(isSel ? null : m.key)}
                  aria-pressed={isSel}
                  className={`rounded-full border px-4 py-2 text-[12px] uppercase tracking-[0.16em] transition-all duration-200 ${
                    isSel
                      ? "border-white/70 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                      : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
          {current && (
            <p className="mt-3 text-[12px] leading-relaxed text-white/40">
              {MODES.find((m) => m.key === current)?.organizes}
            </p>
          )}
        </Card>
      </section>

      {/* the modes to FOCUS on (prescriptive), per interval */}
      <section className="axzio-rise axzio-rise-2 mb-6">
        <div className="mb-2 flex items-center gap-3">
          <MicroLabel>Where focus goes</MicroLabel>
          <HelpBubble title="Modes to focus on">
            <HelpText
              what="The modes you're directing attention toward per day, week, and month — a primary and a secondary each. Prescriptive: where focus goes, even when that's not the mode you're in."
              why="Intention and state rarely match perfectly. Naming both keeps the gap visible — and the gap itself is useful signal — instead of letting it run the system unnoticed."
              how="Pick a primary and a secondary per interval; tap the selected mode again to clear it. The Command Deck reads today's setting."
            />
          </HelpBubble>
        </div>
        <p className="mb-4 max-w-2xl text-[13px] leading-relaxed text-white/45">
          Where you're directing attention — even if that's not where you are
          right now.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {MODE_INTERVALS.map((iv) => {
            const sel =
              (state.modes && state.modes[iv.key]) || {
                primary: null,
                secondary: null,
              };
            const summary =
              sel.primary || sel.secondary
                ? [sel.primary, sel.secondary]
                    .map(modeLabel)
                    .filter(Boolean)
                    .join(" · ")
                : "Unset";
            return (
              <Card key={iv.key} className="p-6">
                <SectionHead
                  label={`This ${iv.label.toLowerCase()}`}
                  help={
                    <HelpBubble title="Setting focus modes">
                      <HelpText
                        what={`The mode this ${iv.label.toLowerCase()} is pointed at — where attention goes, even if that's not where you are right now. A primary and a secondary.`}
                        why="No mode is superior; each supports life and each can distort it. Naming where focus goes keeps one mode from claiming the whole system unnoticed."
                        how="Pick a primary and a secondary; tap the selected mode again to clear it."
                      />
                    </HelpBubble>
                  }
                  right={
                    <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
                      {summary}
                    </span>
                  }
                />
                <ModePicker interval={iv.key} compact />
              </Card>
            );
          })}
        </div>
      </section>

      {/* the three modes, in the book's framing */}
      <section className="axzio-rise axzio-rise-3">
        <div className="mb-6 flex items-center gap-3">
          <MicroLabel>The three modes</MicroLabel>
          <HelpBubble title="Modes">
            <HelpText
              what="The three recurring ways energy organizes in the E3 framework: Production, Pleasure, People."
              why="Each mode can support life, and each can distort it. The risk is never the mode — it is one mode claiming the whole system."
              how="Read each mode's gift and its risk; set where you are and where focus goes above to keep the balance deliberate."
            />
          </HelpBubble>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {MODES.map((m, i) => {
            const isDayPrimary = dayModes.primary === m.key;
            return (
              <Card
                key={m.key}
                className={`axzio-rise axzio-rise-${i + 1} p-6 ${
                  isDayPrimary ? "border-white/40" : ""
                }`}
              >
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-medium tracking-[0.14em] uppercase">
                    {m.label}
                  </h3>
                  {isDayPrimary && (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">
                      Today's focus
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  <span className="text-white/85">Organizes energy around </span>
                  {m.organizes.charAt(0).toLowerCase() + m.organizes.slice(1)}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  <span className="text-white/85">Gift — </span>
                  {m.gift}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  <span className="text-white/85">Risk — </span>
                  {m.risk}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
