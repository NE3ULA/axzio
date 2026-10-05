import { useMemo, useState } from "react";
import { useAxzio, QUADRANTS } from "../store.jsx";
import {
  Card,
  MicroLabel,
  Btn,
  Field,
  Pill,
  SectionHead,
  Empty,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* FOCUS — the Decision Engine home: the two questions, then the        */
/* Eisenhower Matrix as a prioritization lens.                         */
/* ------------------------------------------------------------------ */

const QUAD_KEYS = ["q1", "q2", "q3", "q4"];

export default function Focus() {
  const axzio = useAxzio();
  const { state } = axzio;
  const items = state.focusItems;
  const openItems = items.filter((f) => !f.done);
  const oneThing = items.find((f) => f.oneThing && !f.done) || null;

  const byQuadrant = useMemo(() => {
    const map = { q1: [], q2: [], q3: [], q4: [] };
    for (const f of items) {
      if (map[f.quadrant]) map[f.quadrant].push(f);
      else map.q2.push(f);
    }
    // open first, newest last within each quadrant
    for (const k of QUAD_KEYS) {
      map[k].sort((a, b) => Number(a.done) - Number(b.done) || a.created - b.created);
    }
    return map;
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <MicroLabel className="mb-2">Decision Engine</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Focus
        </h2>
        <p className="mt-4 text-xl font-light leading-relaxed text-white/85 md:text-2xl">
          What matters now?
        </p>
        <p className="mt-1 text-xl font-light leading-relaxed text-white/85 md:text-2xl">
          What should I do next?
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
          The Eisenhower Matrix is a practical prioritization lens — not the
          whole philosophy of decision-making. It separates urgency from
          importance to preserve attention for aligned action, and it is most
          useful combined with your Identity Core commitments and the One
          Thing.
        </p>
      </header>

      {/* the one thing */}
      <section className="axzio-rise axzio-rise-1 mb-6">
        {oneThing ? (
          <Card className="border-white/40 bg-white/[0.04] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <MicroLabel className="mb-2">The One Thing</MicroLabel>
                  <HelpBubble title="The One Thing" className="mb-2">
                    <HelpText
                      what="The single item that, done well, would make everything else easier — flagged from the matrix below."
                      why="The Decision Engine's focus question: what is the next meaningful action? One thing held at a time keeps attention from fragmenting."
                      how="Flag exactly one item with the “One Thing” button; it holds this banner until done or cleared."
                    />
                  </HelpBubble>
                </div>
                <p className="text-xl font-light tracking-wide">
                  {oneThing.text}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill tone="lit">
                    {QUADRANTS.find((q) => q.key === oneThing.quadrant)?.label}
                  </Pill>
                  {oneThing.commitmentId && (
                    <Pill>Serves: {oneThing.commitmentId}</Pill>
                  )}
                </p>
              </div>
              <Btn
                variant="quiet"
                onClick={() => axzio.setOneThing(null)}
                className="shrink-0"
              >
                Clear
              </Btn>
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <MicroLabel className="mb-2">The One Thing</MicroLabel>
              <HelpBubble title="The One Thing" className="mb-2">
                <HelpText
                  what="The single item that, done well, would make everything else easier — flagged from the matrix below."
                  why="The Decision Engine's focus question: what is the next meaningful action? One thing held at a time keeps attention from fragmenting."
                  how="Flag exactly one item with the “One Thing” button; it holds this banner until done or cleared."
                />
              </HelpBubble>
            </div>
            <p className="text-sm leading-relaxed text-white/55">
              Nothing flagged yet. Choose the single item that, done well,
              would make the rest easier — flag it below and it holds this
              place.
            </p>
          </Card>
        )}
      </section>

      {/* add item */}
      <section className="axzio-rise axzio-rise-2 mb-8">
        <Card className="p-6">
          <SectionHead label="Capture" />
          <AddFocusForm />
        </Card>
      </section>

      {/* the matrix */}
      <section className="axzio-rise axzio-rise-3">
        <SectionHead
          label="The Matrix"
          help={
            <HelpBubble title="The Matrix">
              <HelpText
                what="The Eisenhower Matrix: a prioritization lens inside the Decision Engine — urgency on one axis, importance on the other."
                why="Urgency shouts; importance compounds. The matrix protects attention for aligned action instead of reactive motion."
                how="Capture items, place each in a quadrant, move them as reality changes, link commitments, and flag one One Thing."
              />
            </HelpBubble>
          }
          right={
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              {openItems.length} open
            </span>
          }
        />
        <div className="grid gap-4 md:grid-cols-2">
          {QUADRANTS.map((q, i) => (
            <QuadrantCard
              key={q.key}
              quadrant={q}
              items={byQuadrant[q.key]}
              index={i}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function AddFocusForm() {
  const { addFocusItem } = useAxzio();
  const [text, setText] = useState("");
  const [quadrant, setQuadrant] = useState("q2");

  const submit = (e) => {
    e.preventDefault();
    if (addFocusItem(text, quadrant)) {
      setText("");
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row">
      <Field
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs deciding? — name it plainly"
        maxLength={160}
        className="md:flex-1"
      />
      <select
        value={quadrant}
        onChange={(e) => setQuadrant(e.target.value)}
        aria-label="Quadrant"
        className="rounded-xl border border-white/15 bg-black px-4 py-3 text-[13px] tracking-wide text-white outline-none focus:border-white/50"
      >
        {QUADRANTS.map((q) => (
          <option key={q.key} value={q.key}>
            {q.label} — {q.sub}
          </option>
        ))}
      </select>
      <Btn type="submit" variant="ghost" disabled={!text.trim()}>
        Place
      </Btn>
    </form>
  );
}

function QuadrantCard({ quadrant, items, index }) {
  const open = items.filter((f) => !f.done).length;
  return (
    <Card className={`axzio-rise axzio-rise-${(index % 4) + 1} p-6`}>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-medium tracking-[0.14em]">
          <span className="mr-2 text-white/40">Q{index + 1}</span>
          {quadrant.label.toUpperCase()}
        </h3>
        <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
          {open} open
        </span>
      </div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
        {quadrant.sub}
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
        {quadrant.desc}
      </p>

      <div className="mt-4 space-y-2">
        {items.length === 0 && (
          <p className="py-4 text-center text-sm tracking-wide text-white/30">
            Empty quadrant.
          </p>
        )}
        {items.map((f) => (
          <FocusRow key={f.id} item={f} />
        ))}
      </div>
    </Card>
  );
}

function FocusRow({ item }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const commitments = state.identity.commitments;

  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        item.done
          ? "border-white/8 bg-transparent opacity-50"
          : "border-white/12 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => axzio.toggleFocusDone(item.id)}
          aria-label={item.done ? "Reopen item" : "Mark done"}
          aria-pressed={item.done}
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
            item.done
              ? "border-white/70 bg-white text-black"
              : "border-white/30 hover:border-white/70"
          }`}
        >
          {item.done && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5.5l2.5 2.5 4.5-5.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] leading-snug ${
              item.done ? "text-white/50 line-through" : ""
            }`}
          >
            {item.text}
          </p>

          {item.commitmentId && (
            <p className="mt-1.5">
              <Pill>Serves: {item.commitmentId}</Pill>
            </p>
          )}

          {!item.done && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {/* move between quadrants */}
              <select
                value={item.quadrant}
                onChange={(e) => axzio.moveFocusItem(item.id, e.target.value)}
                aria-label="Move to quadrant"
                className="rounded-lg border border-white/12 bg-black px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/60 outline-none focus:border-white/40"
              >
                {QUADRANTS.map((q, i) => (
                  <option key={q.key} value={q.key}>
                    Q{i + 1} {q.label}
                  </option>
                ))}
              </select>

              {/* link a commitment */}
              <select
                value={item.commitmentId || ""}
                onChange={(e) =>
                  axzio.linkFocusCommitment(item.id, e.target.value || null)
                }
                aria-label="Link to a commitment"
                className="max-w-[190px] rounded-lg border border-white/12 bg-black px-2.5 py-1.5 text-[11px] tracking-wide text-white/60 outline-none focus:border-white/40"
              >
                <option value="">No commitment</option>
                {commitments.map((c) => (
                  <option key={c} value={c}>
                    {c.length > 34 ? c.slice(0, 34) + "…" : c}
                  </option>
                ))}
              </select>

              {/* the one thing */}
              <button
                onClick={() => axzio.setOneThing(item.oneThing ? null : item.id)}
                aria-pressed={item.oneThing}
                title={item.oneThing ? "Clear the One Thing" : "Flag as the One Thing"}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  item.oneThing
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/12 text-white/45 hover:border-white/40 hover:text-white"
                }`}
              >
                {item.oneThing ? "The One Thing" : "One Thing"}
              </button>

              <button
                onClick={() => axzio.deleteFocusItem(item.id)}
                aria-label="Delete item"
                className="ml-auto text-white/25 transition-colors hover:text-white/80"
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.4" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
