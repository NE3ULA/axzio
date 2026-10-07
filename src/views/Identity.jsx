import { useMemo, useRef, useState } from "react";
import {
  useAxzio,
  PRIMITIVES,
  PILLARS,
  ORIENTATION_STATEMENTS,
  sortedCommitments,
  formatLongDate,
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
import Recalibrate from "../components/Recalibrate.jsx";
import GoalCapture, { GoalsList } from "../components/GoalCapture.jsx";

/* ------------------------------------------------------------------ */
/* IDENTITY — user state systems: Identity Core + Four Primitives        */
/* ------------------------------------------------------------------ */

export default function Identity() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [recalibrating, setRecalibrating] = useState(false);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-10">
        <MicroLabel className="mb-2">User State</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Identity
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Your Identity Core is the stable reference the system reads against —
          authored, not performed. The Four Primitives show how that structure
          is grounded in lived conditions.
        </p>
      </header>

      <section className="axzio-rise axzio-rise-1 mb-6">
        <Card className="p-6 md:p-8">
          <SectionHead
            label="Identity Core"
            help={
              <HelpBubble title="Identity Core">
                <HelpText
                  what="Your authored center: four orientation statements — who you are choosing to become, what you stand for, what you practice, and what returns you when you drift."
                  why="The system reads every day against this core; a stable reference keeps decisions aligned across changing states."
                  how="Write statements provisional but honest enough to guide an ordinary Tuesday. Revise them as life tests them."
                />
              </HelpBubble>
            }
          />
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/55">
            The relatively stable authored center the system reads against —
            structured but living. Begin with four statements, provisional
            and honest enough to guide an ordinary Tuesday.
          </p>
          <div className="space-y-6">
            {ORIENTATION_STATEMENTS.map((s) => (
              <div key={s.key}>
                <div className="mb-2 flex items-center gap-2">
                  <MicroLabel>{s.prompt}</MicroLabel>
                  {s.help && (
                    <HelpBubble title={s.help.title}>
                      <HelpText
                        what={s.help.what}
                        why={s.help.why}
                        how={s.help.how}
                        example={s.help.example}
                      />
                    </HelpBubble>
                  )}
                </div>
                <TextArea
                  value={state.identity[s.key] || ""}
                  onChange={(e) =>
                    axzio.updateIdentity({ [s.key]: e.target.value })
                  }
                  placeholder={s.placeholder}
                  rows={2}
                  maxLength={280}
                />
              </div>
            ))}
            <ListEditor
              label="Values"
              items={state.identity.values}
              placeholder="Add a value — e.g. “Honesty over comfort”"
              onAdd={(v) => axzio.addIdentityListItem("values", v)}
              onRemove={(i) => axzio.removeIdentityListItem("values", i)}
              help={
                <HelpBubble title="Values">
                  <HelpText
                    what="The handful of non-negotiables your choices get measured against — the principles that hold when motivation doesn't."
                    why="Commitments say what you're loyal to; values say how you act while keeping them. When a decision is hard, the values are the tiebreaker."
                    how="Name a few as tensions resolved, not single words — “Honesty over comfort” beats “Honesty”. Five or fewer; if everything is a value, nothing is."
                    example="“Honesty over comfort. Depth over speed. Keep promises, especially small ones.”"
                  />
                </HelpBubble>
              }
            />
            <CommitmentList />
          </div>
        </Card>
      </section>

      <section className="axzio-rise axzio-rise-2 mb-6">
        <Card className="p-6 md:p-8">
          <SectionHead
            label="Four Pillars"
            help={
              <HelpBubble title="Four Pillars">
                <HelpText
                  what="Mind, Body, Heart, Spirit — the four lenses the person is read through."
                  why="Pillars read the person; Primitives read the life. Together, the pillars prevent transformation from collapsing into thought alone."
                  how="When you tag a Focus item with a pillar, read the task through these lenses — over time the tags reveal where effort actually goes."
                />
              </HelpBubble>
            }
          />
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/55">
            Where the Primitives read your <span className="text-white/80">life</span> —
            its domains and conditions — the Pillars read{" "}
            <span className="text-white/80">you</span>: the four dimensions
            every experience moves through.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PILLARS.map((p) => (
              <div
                key={p.key}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-5"
              >
                <h4 className="text-[15px] font-medium tracking-[0.14em] uppercase">
                  {p.label}
                </h4>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-white/40">
            Together, these Four Pillars prevent transformation from
            collapsing into thought alone.
          </p>
        </Card>
      </section>

      <section className="axzio-rise axzio-rise-2 mb-6">
        <Card className="p-6 md:p-8">
          <SectionHead
            label="Four Primitives — self assessment"
            help={
              <HelpBubble title="Four Primitives">
                <HelpText
                  what="The four domains where identity meets reality: Money, Engagement, Building, Being — distinct from the Pillars of Mind, Body, Heart, Spirit."
                  why="Stabilization first: steady the ground before reaching for higher-order work. Small, concrete repairs unlock everything above them."
                  how="Score each 1–10, record the assessment, and watch the history. The primitives move slowly — that is the point."
                />
              </HelpBubble>
            }
            right={<Pill>1 – 10</Pill>}
          />
          <PrimitivesAssessment />
        </Card>
      </section>

      <section className="axzio-rise axzio-rise-3 mb-6">
        <Card className="p-6 md:p-8">
          <SectionHead
            label="Walkthrough"
            help={
              <HelpBubble title="Walkthrough">
                <HelpText
                  what="The first-use tour: what AXZIO is, what each module does, and the setup sequence."
                  why="Replaying it re-grounds the interface when the modules have drifted from memory."
                  how="It re-opens from the beginning; your existing data is kept and every step is skippable."
                />
              </HelpBubble>
            }
          />
          <p className="mb-4 max-w-lg text-sm leading-relaxed text-white/55">
            Revisit the first-use tour — the module walkthrough and the setup
            sequence. Your data stays intact.
          </p>
          <Btn variant="ghost" onClick={() => axzio.replayOnboarding()}>
            Replay the walkthrough
          </Btn>
        </Card>
      </section>

      <section className="axzio-rise axzio-rise-3 mb-6">
        <Card className="p-6 md:p-8">
          <SectionHead
            label="Recalibrate"
            help={
              <HelpBubble title="Recalibrate">
                <HelpText
                  what="A full-system sweep: revisit your statements, commitments, primitives, and modes when the map no longer matches the territory."
                  why="Earlier inputs may have been uninformed or partial, or life may have shifted. Recalibrate revises the core against who you've become — informed by your history, not starting blind."
                  how="Six short movements. Nothing is erased; everything is revised. Run it whenever drift feels structural rather than situational."
                />
              </HelpBubble>
            }
          />
          <p className="mb-4 max-w-lg text-sm leading-relaxed text-white/55">
            When drift feels structural — the statements ring hollow, the
            commitments belong to an older you — walk the whole stack again.
          </p>
          <Btn variant="ghost" onClick={() => setRecalibrating(true)}>
            Begin recalibration
          </Btn>
        </Card>
      </section>

      {recalibrating && (
        <Recalibrate onClose={() => setRecalibrating(false)} />
      )}

      <section className="axzio-rise axzio-rise-3">
        <Card className="border-white/10 p-6 md:p-8">
          <SectionHead label="Erase data" />
          <ResetZone />
        </Card>
      </section>
    </div>
  );
}

function ListEditor({ label, items, placeholder, onAdd, onRemove, help }) {
  const [draft, setDraft] = useState("");
  const submit = (e) => {
    e.preventDefault();
    onAdd(draft);
    setDraft("");
  };
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <MicroLabel>{label}</MicroLabel>
        {help}
      </div>
      <ul className="mb-3 space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-2.5"
          >
            <span className="text-[15px]">{item}</span>
            <button
              onClick={() => onRemove(i)}
              aria-label={`Remove ${item}`}
              className="mt-0.5 shrink-0 text-white/25 transition-colors hover:text-white/80"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.3" />
              </svg>
            </button>
          </li>
        ))}
      </ul>
      {items.length === 0 && (
        <p className="mb-3 text-sm text-white/35">None named yet.</p>
      )}
      <form onSubmit={submit} className="flex gap-3">
        <Field
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          maxLength={120}
          className="flex-1"
        />
        <Btn type="submit" variant="ghost" disabled={!draft.trim()}>
          Add
        </Btn>
      </form>
    </div>
  );
}

/* Commitments as an ordered list: position IS the priority (1 = highest).
   Up/down arrows reorder; new commitments append at the lowest
   priority; deleting re-numbers. Focus items link by commitment id,
   so reordering never breaks their links. */
function CommitmentList() {
  const { state, addCommitment, updateCommitment, removeCommitment, moveCommitment } =
    useAxzio();
  const [draft, setDraft] = useState("");
  const commitments = sortedCommitments(state);

  const submit = (e) => {
    e.preventDefault();
    if (addCommitment(draft)) setDraft("");
  };

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <MicroLabel>
          Commitments{" "}
          <span className="text-white/30">— ordered, 1 is highest priority</span>
        </MicroLabel>
        <HelpBubble title="Commitments">
          <HelpText
            what="Standing promises, not finish lines: ongoing allegiances like your marriage, your work, your health. A commitment isn't finished, it's kept — the allegiances persist even as the goals inside them complete."
            why="Tasks tell you what's next; commitments tell you what it's all for. Linking actions to commitments keeps the doing aligned with the being."
            how="Name a few in your own words — areas of life, key relationships, major projects. Order them with 1 as the highest allegiance. Focus items can then “serve” a commitment. The domain picker places a commitment in its life domain (Money, Engagement, Building, Being) — optional, but it threads the commitment into your assessments and readings."
            example="“My marriage. Building AXZIO. My physical health. Being a present father.” Not “File taxes” — that's a task. A commitment is bigger and more general: the thing the tasks are for."
          />
        </HelpBubble>
      </div>
      {commitments.length === 0 && (
        <p className="mb-3 text-sm text-white/35">None named yet.</p>
      )}
      <ul className="mb-3 space-y-2">
        {commitments.map((c, i) => (
          <li
            key={c.id}
            className="rounded-xl border border-white/10 px-4 py-2.5"
          >
            <div className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-[11px] tabular-nums tracking-[0.2em] text-white/40">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 text-[15px]">{c.text}</span>
              {/* life domain placement: optional thread into the primitives */}
              <select
                value={c.primitive || ""}
                onChange={(e) =>
                  updateCommitment(c.id, {
                    primitive: e.target.value || null,
                  })
                }
                aria-label={`Life domain for “${c.text}”`}
                className="shrink-0 cursor-pointer appearance-none rounded-full border border-white/10 bg-black px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/45 outline-none transition-colors hover:border-white/30 hover:text-white/75 focus:border-white/40"
              >
                <option value="">Unplaced</option>
                {PRIMITIVES.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => moveCommitment(c.id, -1)}
                  disabled={i === 0}
                  aria-label={`Move “${c.text}” up in priority`}
                  className="rounded p-1 text-white/40 transition-colors hover:text-white disabled:opacity-20 disabled:hover:text-white/40"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 7.5l4-4 4 4" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
                <button
                  onClick={() => moveCommitment(c.id, 1)}
                  disabled={i === commitments.length - 1}
                  aria-label={`Move “${c.text}” down in priority`}
                  className="rounded p-1 text-white/40 transition-colors hover:text-white disabled:opacity-20 disabled:hover:text-white/40"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4.5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </button>
                <button
                  onClick={() => removeCommitment(c.id)}
                  aria-label={`Remove “${c.text}”`}
                  className="rounded p-1 text-white/25 transition-colors hover:text-white/80"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </button>
              </span>
            </div>
            {/* the goal stage: goals live inside their commitment */}
            <div className="mt-1 pl-8">
              <GoalsList commitmentId={c.id} />
              <div className="mt-2">
                <GoalCapture commitmentId={c.id} compact />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex gap-3">
        <Field
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a commitment — e.g. “Write every morning”"
          maxLength={120}
          className="flex-1"
        />
        <Btn type="submit" variant="ghost" disabled={!draft.trim()}>
          Add
        </Btn>
      </form>
      <p className="mt-2 text-[12px] leading-relaxed text-white/35">
        New commitments start at the lowest priority. Reorder with the
        arrows — the Deck reads the top three.
      </p>
    </div>
  );
}

function PrimitivesAssessment() {
  const { state, saveAssessment } = useAxzio();
  const [scores, setScores] = useState({
    money: 5,
    engagement: 5,
    building: 5,
    being: 5,
  });
  const [savedFlash, setSavedFlash] = useState("");

  const guidance = useMemo(() => primitiveGuidance(scores), [scores]);
  const history = state.assessments.slice().reverse();

  const save = () => {
    saveAssessment(scores);
    setSavedFlash("Assessment recorded.");
    setTimeout(() => setSavedFlash(""), 3500);
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="space-y-7">
          {PRIMITIVES.map((p) => (
            <div key={p.key}>
              <div className="mb-1.5 flex items-baseline justify-between">
                <span className="text-[15px] font-medium tracking-wide">
                  {p.label}
                </span>
                <span className="text-2xl font-light tabular-nums">
                  {scores[p.key]}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={scores[p.key]}
                onChange={(e) =>
                  setScores((s) => ({ ...s, [p.key]: Number(e.target.value) }))
                }
                className="axzio-range w-full"
                aria-label={`${p.label} score`}
              />
              <p className="mt-1.5 text-[13px] leading-snug text-white/45">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-start">
          <RadarChart scores={scores} />
          <div className="mt-5 w-full rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <MicroLabel className="mb-2">Reading</MicroLabel>
            <p className="text-sm leading-relaxed text-white/65">{guidance}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Btn onClick={save}>Record assessment</Btn>
        {savedFlash && (
          <span className="text-sm tracking-wide text-white/60">{savedFlash}</span>
        )}
      </div>

      <div className="mt-8 border-t border-white/10 pt-6">
        <MicroLabel className="mb-4">History</MicroLabel>
        {history.length === 0 && <Empty>No assessments recorded yet.</Empty>}
        <div className="space-y-3">
          {history.slice(0, 8).map((a) => (
            <div
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3"
            >
              <span className="text-sm tracking-wide text-white/60">
                {formatLongDate(a.date)}
              </span>
              <div className="flex gap-4">
                {PRIMITIVES.map((p) => (
                  <span
                    key={p.key}
                    className="text-[12px] tracking-wide text-white/55"
                    title={p.label}
                  >
                    <span className="mr-1 uppercase text-white/35">
                      {p.label.slice(0, 3)}
                    </span>
                    <span className="tabular-nums text-white/85">{a[p.key]}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Guidance per the Four Primitives framing: stabilization first —
 * low scores in grounding domains should be addressed before
 * higher-order identity work.
 */
function primitiveGuidance(scores) {
  const entries = Object.entries(scores);
  const lowest = entries.reduce((a, b) => (a[1] <= b[1] ? a : b));
  const [lowKey, lowVal] = lowest;
  const label = PRIMITIVES.find((p) => p.key === lowKey)?.label ?? lowKey;

  if (lowVal <= 3) {
    return (
      `Stabilization signal — ${label} is reading at ${lowVal}/10. ` +
      "The framework suggests steadying this ground before reaching for higher-order work. " +
      "Small, concrete repairs here unlock everything above them."
    );
  }
  if (lowVal <= 5) {
    return (
      `${label} is the soft edge at ${lowVal}/10. Nothing urgent — ` +
      "but this is where your next increment of stability will come from. " +
      "One deliberate action this week, logged in the deck."
    );
  }
  const avg = entries.reduce((s, [, v]) => s + v, 0) / entries.length;
  if (avg >= 8) {
    return (
      "The stack reads as coherent — grounded across all four primitives. " +
      "This is the condition from which higher-order identity work becomes stable rather than performative."
    );
  }
  return (
    "A stable, workable reading. Keep the anchors held and watch for drift — " +
    "the primitives move slowly, and that is the point."
  );
}

/** SVG radar chart for the four primitives. */
function RadarChart({ scores }) {
  const size = 280;
  const c = size / 2;
  const R = size / 2 - 52;
  // order: money (top), engagement (right), building (bottom), being (left)
  const axes = ["money", "engagement", "building", "being"];
  const labels = { money: "MONEY", engagement: "ENGAGE", building: "BUILD", being: "BEING" };
  const angle = (i) => -Math.PI / 2 + (i * Math.PI) / 2;
  const pt = (i, r) => [c + r * Math.cos(angle(i)), c + r * Math.sin(angle(i))];
  const labelR = R + 24;

  const gridRings = [0.25, 0.5, 0.75, 1].map((f) =>
    axes.map((_, i) => pt(i, R * f).join(",")).join(" ")
  );
  const dataPts = axes
    .map((k, i) => pt(i, (R * scores[k]) / 10).join(","))
    .join(" ");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Radar chart of the four primitives"
    >
      {gridRings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1"
        />
      ))}
      {axes.map((k, i) => {
        return (
          <g key={k}>
            <line
              x1={c}
              y1={c}
              x2={pt(i, R)[0]}
              y2={pt(i, R)[1]}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />
            <text
              x={c + labelR * Math.cos(angle(i))}
              y={c + labelR * Math.sin(angle(i))}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="10"
              letterSpacing="2"
            >
              {labels[k]}
            </text>
          </g>
        );
      })}
      <polygon
        points={dataPts}
        fill="rgba(255,255,255,0.10)"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="1.5"
      />
      {axes.map((k, i) => {
        const [x, y] = pt(i, (R * scores[k]) / 10);
        return <circle key={k} cx={x} cy={y} r={3.5} fill="#fff" />;
      })}
    </svg>
  );
}

function ResetZone() {
  const { state, resetAll, replaceState } = useAxzio();
  const [armed, setArmed] = useState(false);
  const [importError, setImportError] = useState("");
  const fileRef = useRef(null);

  const exportBackup = () => {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const d = new Date();
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      a.href = url;
      a.download = `axzio-backup-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      /* download unavailable — ignore */
    }
  };

  const importBackup = (file) => {
    setImportError("");
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object" || !parsed.identity) {
          throw new Error("bad backup");
        }
        // Bump the clock so this copy wins the next cloud sync.
        replaceState({ ...parsed, updatedAt: Date.now() });
      } catch {
        setImportError("That file isn't a valid AXZIO backup.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <p className="mb-4 max-w-lg text-sm leading-relaxed text-white/55">
        Back up everything stored in this browser — a JSON file you keep.
        If sync ever surprises you, a backup restores it.
      </p>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Btn variant="ghost" onClick={exportBackup}>
          Export backup
        </Btn>
        <Btn variant="quiet" onClick={() => fileRef.current?.click()}>
          Import backup
        </Btn>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Import backup file"
          onChange={(e) => {
            importBackup(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {importError && (
        <p className="mb-6 text-[13px] text-red-200/80">{importError}</p>
      )}
      <p className="mb-4 max-w-lg text-sm leading-relaxed text-white/55">
        Erase everything stored in this browser — identity, days, actions,
        signals, stars, and assessments. This cannot be undone.
      </p>
      {!armed ? (
        <Btn
          variant="ghost"
          onClick={() => setArmed(true)}
          className="border-red-400/30 text-red-200/80 hover:border-red-300/60 hover:text-red-100"
        >
          Reset all data
        </Btn>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Btn
            variant="ghost"
            onClick={() => {
              resetAll();
              setArmed(false);
            }}
            className="border-red-400/50 text-red-100 hover:border-red-300"
          >
            Yes, erase everything
          </Btn>
          <Btn variant="quiet" onClick={() => setArmed(false)}>
            Cancel
          </Btn>
        </div>
      )}
    </div>
  );
}
