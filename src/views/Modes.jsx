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
/* Production, Pleasure, People. Primary + secondary per interval.      */
/* ------------------------------------------------------------------ */

export default function Modes() {
  const { state } = useAxzio();
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
          effort are being organized. Ask not only how much energy you have,{" "}
          <span className="text-white">but where that energy is going</span>.
        </p>
        <p className="mt-3 max-w-2xl border-l border-white/25 pl-4 text-[15px] leading-relaxed text-white/75">
          No mode is superior. Problems arise when one mode claims the whole
          system: Production without Pleasure becomes extractive; People
          without boundaries becomes self-loss; Pleasure without direction
          can become escape.
        </p>
      </header>

      {/* interval pickers */}
      <section className="axzio-rise axzio-rise-1 mb-6">
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
                    <HelpBubble title="Setting modes">
                      <HelpText
                        what={`The mode organizing this ${iv.label.toLowerCase()}'s energy: Production, Pleasure, or People — a primary and a secondary.`}
                        why="No mode is superior; each supports life and each can distort it. Naming the mode keeps one from claiming the whole system unnoticed."
                        how="Pick a primary and a secondary; tap the selected mode again to clear it. The Command Deck reads today's setting."
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
      <section className="axzio-rise axzio-rise-2">
        <div className="mb-6 flex items-center gap-3">
          <MicroLabel>The three modes</MicroLabel>
          <HelpBubble title="Modes">
            <HelpText
              what="The three recurring ways energy organizes in the E3 framework: Production, Pleasure, People."
              why="Each mode can support life, and each can distort it. The risk is never the mode — it is one mode claiming the whole system."
              how="Read each mode's gift and its risk; choose modes per interval above to keep the balance deliberate."
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
                      Today's primary
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
