import { useState } from "react";
import { useAxzio, TAGS, actionsOn, localDateKey, tagLabel } from "../store.jsx";
import { Field, Btn, Pill, MicroLabel, HelpBubble, HelpText, Card, Empty, SectionHead } from "./ui.jsx";

/* ActionLog — the quick "log it" entry. Moved off the Bridge: actions are
   logged here on the Focus page, without going through the quadrants. */

export function ActionForm() {
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


export function TodaysActions() {
  const axzio = useAxzio();
  const { state } = axzio;
  const today = localDateKey();
  const todaysActions = actionsOn(state, today).slice().reverse();
  return (
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
                {new Date(a.ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
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
  );
}

/* The full quick-log section for the Focus page. */
export function LogActionSection() {
  return (
    <section className="axzio-rise mt-10">
      <Card className="p-6">
        <SectionHead
          label="Action Quick Log"
          help={
            <HelpBubble title="Log action">
              <HelpText
                what="A running log of embodied action — no quadrant required."
                why="Some action doesn't need deliberation; it needs recording. The log is the evidence."
                how="Log what you did, right after the matrix. Delete with the × — the log is yours to keep honest."
              />
            </HelpBubble>
          }
        />
        <ActionForm />
        <TodaysActions />
      </Card>
    </section>
  );
}
