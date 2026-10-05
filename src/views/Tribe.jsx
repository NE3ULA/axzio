import { useState } from "react";
import {
  useAxzio,
  CIRCLES,
  circleLabel,
  formatLongDate,
} from "../store.jsx";
import {
  Card,
  MicroLabel,
  Field,
  TextArea,
  Pill,
  SectionHead,
  Empty,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* TRIBE v1 — a people directory in core-group circles. Thin local      */
/* foundation: Give Love entries can tag a personId; per-person        */
/* history keeps the thread. Sharing / identity-stack exchange with    */
/* tribe members arrives later, with accounts.                        */
/* ------------------------------------------------------------------ */

export default function Tribe() {
  const axzio = useAxzio();
  const { state } = axzio;
  const people = Array.isArray(state.people) ? state.people : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <MicroLabel className="mb-2">People</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Tribe
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">
          The people your legend is lived with — held in circles, from the
          most intimate outward. Tagging a Give Love entry with a person
          keeps the thread of care visible over time.
        </p>
      </header>

      <section className="axzio-rise axzio-rise-1 mb-6">
        <Card className="p-6">
          <SectionHead
            label="Your people"
            help={
              <HelpBubble title="Circles">
                <HelpText
                  what="Circles name the distance of a relationship: Spouse/Partner, Family, Closest friends, Key Business Relationships, Other. They describe the relationship — not a rank of worth."
                  why="Care is finite. Seeing who sits where keeps attention honest about who is being invested in and who is being neglected."
                  how="Add someone below, then tag them on Give Love entries from the Deck. Their history gathers here. Sharing and identity-stack exchange with tribe members arrives later, with accounts."
                />
              </HelpBubble>
            }
          />
          {people.length === 0 ? (
            <Empty>
              No one here yet. Add the first person below — your tribe
              starts with a single name.
            </Empty>
          ) : (
            <div className="space-y-8">
              {CIRCLES.map((c) => {
                const members = people.filter((p) => p.circle === c.key);
                if (members.length === 0) return null;
                return (
                  <div key={c.key}>
                    <MicroLabel className="mb-3">
                      {c.label}{" "}
                      <span className="ml-1 text-white/40">
                        · {members.length}
                      </span>
                    </MicroLabel>
                    <div className="space-y-2">
                      {members.map((p) => (
                        <PersonRow key={p.id} person={p} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      <section className="axzio-rise axzio-rise-2">
        <AddPersonForm />
      </section>
    </div>
  );
}

function AddPersonForm() {
  const { addPerson } = useAxzio();
  const [name, setName] = useState("");
  const [circle, setCircle] = useState("friends");
  const [notes, setNotes] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (addPerson(name, circle, notes)) {
      setName("");
      setNotes("");
      setCircle("friends");
    }
  };

  return (
    <Card className="p-6">
      <SectionHead label="Add a person" />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <MicroLabel className="mb-2">Name</MicroLabel>
          <Field
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Who matters here?"
            maxLength={80}
            aria-label="Person name"
          />
        </div>
        <div>
          <MicroLabel className="mb-2">Circle</MicroLabel>
          <select
            value={circle}
            onChange={(e) => setCircle(e.target.value)}
            className="w-full appearance-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white/85 outline-none transition-colors hover:border-white/30"
            aria-label="Circle"
          >
            {CIRCLES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <MicroLabel className="mb-2">Notes — optional</MicroLabel>
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What do you want to remember about them?"
            rows={2}
            maxLength={500}
            aria-label="Person notes"
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-full border border-white/60 bg-white/10 px-6 py-2.5 text-[12px] uppercase tracking-[0.2em] text-white transition-all hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Add person
        </button>
      </form>
    </Card>
  );
}

function PersonRow({ person }) {
  const { state, updatePerson, removePerson } = useAxzio();
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Give Love history for this person, newest first.
  const history = Object.entries(state.days || {})
    .map(([date, day]) => {
      const love = day?.orientation?.love;
      if (!love || love.personId !== person.id) return null;
      if (!love.text?.trim() && !love.done) return null;
      return { date, text: love.text || "", done: love.done === true };
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <div
      className={`rounded-xl border transition-colors ${
        expanded ? "border-white/25 bg-white/[0.02]" : "border-white/10"
      }`}
    >
      <button
        onClick={() => {
          setExpanded((e) => !e);
          setConfirming(false);
        }}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium tracking-wide">
            {person.name}
          </span>
          {person.notes?.trim() && (
            <span className="block truncate text-[12px] text-white/40">
              {person.notes.trim()}
            </span>
          )}
        </span>
        {history.length > 0 && (
          <Pill className="shrink-0">
            {history.length} {history.length === 1 ? "entry" : "entries"}
          </Pill>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          aria-hidden="true"
          className={`shrink-0 text-white/40 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-white/10 px-4 py-4">
          <div className="mb-4">
            <MicroLabel className="mb-2">Circle</MicroLabel>
            <select
              value={person.circle}
              onChange={(e) =>
                updatePerson(person.id, { circle: e.target.value })
              }
              className="w-full appearance-none rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[13px] text-white/85 outline-none transition-colors hover:border-white/30"
              aria-label={`${person.name} circle`}
            >
              {CIRCLES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <MicroLabel className="mb-2">Notes</MicroLabel>
            <TextArea
              value={person.notes || ""}
              onChange={(e) =>
                updatePerson(person.id, { notes: e.target.value })
              }
              placeholder="What do you want to remember about them?"
              rows={2}
              maxLength={500}
              aria-label={`${person.name} notes`}
            />
          </div>

          <MicroLabel className="mb-2">Give Love history</MicroLabel>
          {history.length === 0 ? (
            <p className="mb-4 text-[13px] leading-relaxed text-white/40">
              No love-actions tagged to {person.name} yet. Tag them from a
              Give Love entry on the Deck.
            </p>
          ) : (
            <ul className="mb-4 space-y-2.5">
              {history.map((h) => (
                <li key={h.date} className="text-[13px] leading-relaxed">
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-white/35">
                    {formatLongDate(h.date)}
                  </span>
                  <span className={h.done ? "text-white/80" : "text-white/50"}>
                    {h.text || "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {confirming ? (
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-white/60">
                Remove {person.name}? Their entries keep their text.
              </span>
              <button
                onClick={() => removePerson(person.id)}
                className="text-[11px] uppercase tracking-[0.2em] text-white underline decoration-white/30 underline-offset-4"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-[11px] uppercase tracking-[0.2em] text-white/45 hover:text-white"
              >
                Keep
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="text-[11px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-white"
            >
              Remove person
            </button>
          )}
        </div>
      )}
    </div>
  );
}
