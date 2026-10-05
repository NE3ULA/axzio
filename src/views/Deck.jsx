import { useMemo, useState } from "react";
import {
  useAxzio,
  MANTRA,
  TAGS,
  BATTERY,
  tagLabel,
  localDateKey,
  formatLongDate,
  formatTime,
  getDayState,
  actionsOn,
  signalsOn,
  computeStreak,
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
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* COMMAND DECK — the daily home of the interface                        */
/* ------------------------------------------------------------------ */

export default function Deck() {
  const axzio = useAxzio();
  const { state } = axzio;
  const today = localDateKey();
  const day = getDayState(state, today);
  const todaysActions = actionsOn(state, today).slice().reverse();
  const todaysSignals = signalsOn(state, today).slice().reverse();
  const streak = useMemo(() => computeStreak(state), [state]);
  const mantraDone = MANTRA.filter((m) => day.mantra[m.key]).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8">
      {/* header */}
      <header className="axzio-rise mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <MicroLabel className="mb-2">Command Deck</MicroLabel>
          <h2 className="text-3xl font-light tracking-wide md:text-4xl">
            {state.identity.name || "Traveler"}
          </h2>
          <p className="mt-2 text-sm tracking-wide text-white/45">
            {formatLongDate(today)}
          </p>
          <p className="mt-3 max-w-md text-[11px] uppercase leading-relaxed tracking-[0.2em] text-white/35">
            Time is your frame. Energy is your fuel. Identity is your
            direction. Purpose is your destination.
          </p>
        </div>
        <div className="flex gap-6 text-right">
          <Stat value={streak} label="day streak" />
          <Stat value={state.actions.length} label="total actions" />
        </div>
      </header>

      {/* today's alignment */}
      <section className="axzio-rise axzio-rise-1 mb-6">
        <SectionHead
          label="Today's alignment"
          right={
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              {mantraDone} / 4
            </span>
          }
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {MANTRA.map((m) => (
            <AnchorToggle
              key={m.key}
              label={m.label}
              hint={m.hint}
              active={day.mantra[m.key]}
              onToggle={() => axzio.setMantra(today, m.key, !day.mantra[m.key])}
            />
          ))}
        </div>
      </section>

      {/* state — human battery */}
      <section className="axzio-rise axzio-rise-2 mb-6">
        <Card className="p-6">
          <SectionHead label="State — the Human Battery" />
          <p className="mb-5 max-w-xl text-sm leading-relaxed text-white/55">
            Hear the instrument before trying to force the performance.{" "}
            <span className="text-white/80">State is not identity</span> — a
            depleted reading is a condition to meet, not a verdict on who
            you are.
          </p>
          <BatteryCheck day={day} today={today} />
        </Card>
      </section>

      {/* intention */}
      <section className="axzio-rise axzio-rise-3 mb-6">
        <Card className="p-6">
          <SectionHead label="Intention for the day" />
          <TextArea
            value={day.intention}
            onChange={(e) => axzio.setIntention(today, e.target.value)}
            placeholder="One line. What is today for?"
            rows={2}
            maxLength={220}
          />
        </Card>
      </section>

      {/* action log */}
      <section className="axzio-rise axzio-rise-4 mb-6">
        <Card className="p-6">
          <SectionHead label="Action log" />
          <ActionForm />
          <div className="mt-5 space-y-2">
            {todaysActions.length === 0 && (
              <Empty>No actions logged today yet.</Empty>
            )}
            {todaysActions.map((a) => (
              <div
                key={a.id}
                className="group flex items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-[15px] leading-snug">{a.text}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2">
                    <Pill>{tagLabel(a.tag)}</Pill>
                    <span className="text-[11px] tracking-[0.14em] text-white/35">
                      {formatTime(a.ts)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => axzio.deleteAction(a.id)}
                  aria-label="Delete action"
                  className="mt-1 shrink-0 text-white/25 transition-colors hover:text-white/80"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* signals */}
      <section className="axzio-rise axzio-rise-5 mb-6">
        <Card className="p-6">
          <SectionHead label="Signal feed" />
          <SignalForm />
          <div className="mt-5 space-y-3">
            {todaysSignals.length === 0 && (
              <Empty>Nothing transmitted today. Send a signal.</Empty>
            )}
            {todaysSignals.map((s) => (
              <div key={s.id} className="border-l border-white/20 pl-4">
                <p className="text-[15px] leading-relaxed text-white/85">
                  {s.text}
                </p>
                <p className="mt-1 text-[11px] tracking-[0.14em] text-white/35">
                  {formatTime(s.ts)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* add a star */}
      <section className="axzio-rise axzio-rise-5">
        <Card className="p-6">
          <SectionHead label="Ignite a star" />
          <p className="mb-4 text-sm leading-relaxed text-white/55">
            Name an intention or project. It takes its place in your
            constellation as an orbiting star.
          </p>
          <StarForm />
        </Card>
      </section>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <p className="text-3xl font-light">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/45">
        {label}
      </p>
    </div>
  );
}

function AnchorToggle({ label, hint, active, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={active}
      className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-white/60 bg-white/[0.07] shadow-[0_0_28px_rgba(255,255,255,0.12)]"
          : "border-white/15 bg-white/[0.02] hover:border-white/35"
      }`}
    >
      <span
        className={`mb-2 block h-1.5 w-1.5 rounded-full transition-colors ${
          active ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]" : "bg-white/25"
        }`}
      />
      <span className="block text-[13px] font-medium tracking-wide">{label}</span>
      <span className="mt-1 block text-[11px] leading-snug text-white/40">
        {hint}
      </span>
    </button>
  );
}

function BatteryCheck({ day, today }) {
  const { setBattery } = useAxzio();
  const battery = day.battery || {};

  const entries = BATTERY.map((b) => ({
    ...b,
    value: Number.isFinite(battery[b.key]) ? battery[b.key] : 5,
  }));
  const depleted = entries.reduce((a, b) => (a.value <= b.value ? a : b));
  const available = entries.reduce((a, b) => (a.value >= b.value ? a : b));

  return (
    <div>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
        {entries.map((b) => (
          <div key={b.key}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[15px] font-medium tracking-wide">
                {b.label}
              </span>
              <span className="text-2xl font-light tabular-nums">
                {b.value}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={b.value}
              onChange={(e) =>
                setBattery(today, b.key, Number(e.target.value))
              }
              className="axzio-range w-full"
              aria-label={`${b.label} battery level`}
            />
            <p className="mt-1.5 text-[13px] leading-snug text-white/45">
              {b.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/10 pt-4">
        <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
          Most depleted{" "}
          <span className="ml-1 text-white">
            {depleted.label} · {depleted.value}/10
          </span>
        </p>
        <p className="text-[12px] uppercase tracking-[0.18em] text-white/45">
          Most available{" "}
          <span className="ml-1 text-white">
            {available.label} · {available.value}/10
          </span>
        </p>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-white/40">
        Read the pattern, not only the total. Begin with the dimension asking
        most clearly for attention.
      </p>
    </div>
  );
}

function ActionForm() {
  const { addAction } = useAxzio();
  const [text, setText] = useState("");
  const [tag, setTag] = useState("action");

  const submit = (e) => {
    e.preventDefault();
    if (addAction(text, tag)) {
      setText("");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Log an action — what did you do?"
        maxLength={220}
        className="md:flex-1"
      />
      <select
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        aria-label="Action tag"
        className="rounded-xl border border-white/15 bg-black px-4 py-3 text-[13px] tracking-wide text-white outline-none focus:border-white/50"
      >
        <optgroup label="Mantra">
          {TAGS.filter((t) => t.group === "Mantra").map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Primitive">
          {TAGS.filter((t) => t.group === "Primitive").map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </optgroup>
      </select>
      <Btn type="submit" variant="ghost" disabled={!text.trim()}>
        Log
      </Btn>
    </form>
  );
}

function SignalForm() {
  const { addSignal } = useAxzio();
  const [text, setText] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (addSignal(text)) setText("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Transmit a signal — a note, an observation, a vow…"
        maxLength={280}
        className="md:flex-1"
      />
      <Btn type="submit" variant="ghost" disabled={!text.trim()}>
        Transmit
      </Btn>
    </form>
  );
}

function StarForm() {
  const { addStar, state } = useAxzio();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [flash, setFlash] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const star = addStar(name, note);
    if (star) {
      setName("");
      setNote("");
      setFlash(`“${star.name}” now orbits your constellation.`);
      setTimeout(() => setFlash(""), 4000);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Field
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Star name — e.g. “Ship the portfolio”"
          maxLength={60}
          className="md:flex-1"
        />
        <Btn type="submit" variant="ghost" disabled={!name.trim()}>
          Ignite
        </Btn>
      </div>
      <Field
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="A note on what this star means (optional)"
        maxLength={160}
      />
      {flash && (
        <p className="text-sm tracking-wide text-white/70">{flash}</p>
      )}
      {state.stars.length > 0 && (
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          {state.stars.length} star{state.stars.length === 1 ? "" : "s"} in orbit
        </p>
      )}
    </form>
  );
}
