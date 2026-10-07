import { useMemo, useState } from "react";
import {
  useAxzio,
  LOOP_STAGES,
  RELEASED_STAGE,
  commitmentText,
  LEGEND_FUNCTIONS,
  BECOMING_STAGES,
  legendFunctionLabel,
  becomingStageLabel,
  lifeModById,
  SPINE_STAGES,
  threadOffspring,
  threadReviewDue,
  threadSpine,
  spineWhy,
  sortedCommitments,
  threadMassTier,
  threadAttention,
  stellarClass,
  STELLAR_CLASSES,
  threadGates,
  threadEvidence,
  habitSessionCount,
  habitIntegrated,
  wellAttention,
} from "../store.jsx";
import {
  Card,
  MicroLabel,
  Empty,
  Btn,
  Field,
  TextArea,
  Pill,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";
import GoalCapture, { GrownGoalsList } from "../components/GoalCapture.jsx";
import HabitCapture, { GrownHabitsList } from "../components/HabitCapture.jsx";
import { LifeModRow, LifeModEditor } from "../components/LifeMod.jsx";

/* ------------------------------------------------------------------ */
/* CONSTELLATION — the night sky of your becoming. Every star is a      */
/* THREAD: one thought walking the Becoming spine (Capture → Evaluate  */
/* → Execute → Review → Evolve). The E3 loop is the engine inside      */
/* Evaluate — each orbit adds mass, and mass is brightness.            */
/* ------------------------------------------------------------------ */

const SKY_W = 1000;
const SKY_H = 430;

/** X-centers of the spine zones along the arc. */
const SPINE_X = {
  capture: 130,
  evaluate: 370,
  execute: 600,
  review: 790,
  evolve: 920,
};
/** Star radius per mass tier 0–4. */
const TIER_R = [3.5, 5, 6.5, 9, 12];

/** Deterministic 0–1 hash so the sky is stable between renders. */
function hash01(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}
/** The journey arc's height at x. */
function arcY(x) {
  const t = Math.min(1, Math.max(0, (x - 60) / 890));
  return 335 - Math.sin(t * Math.PI) * 115 - t * 185;
}
/** Where a thread's star sits: zone center + stable jitter. */
function threadPos(star, spine) {
  if (spine === "released")
    return [
      80 + hash01(star.id + ":x") * 840,
      392 + hash01(star.id + ":y") * 26,
    ];
  const cx = SPINE_X[spine] ?? SPINE_X.capture;
  const x = cx + (hash01(star.id + ":x") - 0.5) * 150;
  const y = arcY(x) + (hash01(star.id + ":y") - 0.5) * 100;
  return [Math.min(975, Math.max(25, x)), Math.min(380, Math.max(30, y))];
}

const ALL_STAGES = [...LOOP_STAGES, RELEASED_STAGE];

export default function Constellation() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [view, setView] = useState("sky"); // 'sky' | 'threads'
  const [selectedId, setSelectedId] = useState(null);
  const stars = Array.isArray(state.stars) ? state.stars : [];
  const selectedStar = stars.find((s) => s.id === selectedId) || null;

  const inThread = stars.filter((s) => s.loopStage !== "released").length;
  const releasedCount = stars.length - inThread;
  // Selecting a star opens its thread; selecting it again closes it.
  const toggleSelect = (id) =>
    setSelectedId((cur) => (cur === id ? null : id));

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-6">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">Nebula</MicroLabel>
          <HelpBubble title="Nebula" className="mb-2">
            <HelpText
              what="The nebula where your stars are born. Every star is a thread — one thought walking the spine from spark to legend. Brightness is mass: the more orbits and offspring, the more light."
              why="A thread you can locate is a thread you can tend. The sky shows where each one stands; the threads list shows what needs you next."
              how="Ignite a seed above — it lands in Capture. Select a star to read its chain, move it along the loop, rename it as it evolves, or work it with Reset and Grow."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          The Night Sky of Your Becoming
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Every star is a thread — one thought walking from spark to legend.
          Brightness is mass: each orbit and hatching makes it shine brighter.
        </p>
        {(inThread > 0 || releasedCount > 0) && (
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/40">
            {inThread} in the sky
            {releasedCount > 0 ? ` · ${releasedCount} released` : ""}
          </p>
        )}
      </header>

      {/* ignite a star seed — capture lives where stars live */}
      <Card className="axzio-rise axzio-rise-1 mb-6 p-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Ignite a star seed</MicroLabel>
          <HelpBubble title="Ignite a star seed">
            <HelpText
              what="Capture a spark — an idea, feeling, or friction — as a star seed in your sky."
              why="Named things gain gravity. A captured seed is a thread begun: it will orbit, gather mass, and one day ignite."
              how="Name it, add an optional note, ignite. It lands in Capture; work it from here."
            />
          </HelpBubble>
        </div>
        <IgniteForm />
      </Card>

      {/* Sky | Threads toggle */}
      <div className="axzio-rise axzio-rise-1 mb-5 inline-flex rounded-full border border-white/12 p-1">
        {[
          { key: "sky", label: "Sky" },
          { key: "threads", label: "Threads" },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setView(t.key)}
            aria-pressed={view === t.key}
            className={`rounded-full px-5 py-1.5 text-[11px] uppercase tracking-[0.16em] transition-colors ${
              view === t.key
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "sky" ? (
        <SkyView
          stars={stars}
          state={state}
          selectedId={selectedId}
          onSelect={toggleSelect}
        />
      ) : (
        <ThreadsView
          stars={stars}
          state={state}
          axzio={axzio}
          onOpen={(id) => setSelectedId(id)}
        />
      )}

      {selectedStar && (
        <section className="mt-6">
          <Card className="p-6 md:p-8">
            <ThreadDetail
              star={selectedStar}
              axzio={axzio}
              onClose={() => setSelectedId(null)}
            />
          </Card>
        </section>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ignite — the capture form. Stars are ignited where they live.        */
/* ------------------------------------------------------------------ */
function IgniteForm() {
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
      setFlash(`“${star.name}” now drifts in your sky — a star seed.`);
      setTimeout(() => setFlash(""), 4000);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row">
        <Field
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name the spark — e.g. “Ship the portfolio”"
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
        placeholder="A note on what this spark means (optional)"
        maxLength={160}
      />
      {flash && (
        <p className="text-sm tracking-wide text-white/70">{flash}</p>
      )}
      <p className="text-[12px] text-white/35">
        Want the full ignition passage — name, meaning, first action?{" "}
        <button
          type="button"
          onClick={() => {
            window.location.hash = "#/practice?passage=star";
          }}
          className="text-white/60 underline-offset-2 hover:text-white hover:underline"
        >
          Guided ignition →
        </button>
      </p>
      {state.stars.length > 0 && (
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/35">
          {state.stars.length} star{state.stars.length === 1 ? "" : "s"} in the sky
        </p>
      )}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Thread views — the sky and the threads list                          */
/* ------------------------------------------------------------------ */

/* Why is the thread here — and what moves it? The spine is derived,
   never set; this expander makes the derivation legible. */
function SpineExplainer({ star, state, spine }) {
  const [open, setOpen] = useState(false);
  const info = spineWhy(state, star);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <SpineDots spine={spine} />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white/70"
        >
          Why this stage? {open ? "▾" : "▸"}
        </button>
      </div>
      {open && (
        <div className="mt-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <p className="text-[13px] leading-relaxed text-white/70">{info.why}</p>
          {info.lever && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-white/45">
              <span className="text-[#d8a94e]">What moves it — </span>
              {info.lever}
            </p>
          )}
          <p className="mt-1.5 text-[11.5px] text-white/30">
            Stages are earned by the work, never set by hand.
          </p>
        </div>
      )}
    </div>
  );
}

/** The six spine positions as dots; current lit gold. */
function SpineDots({ spine }) {
  if (spine === "released")
    return (
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
        Released
      </span>
    );
  const idx = SPINE_STAGES.findIndex((s) => s.key === spine);
  const label = SPINE_STAGES[idx]?.label ?? spine;
  return (
    <span className="inline-flex items-center gap-1.5">
      {SPINE_STAGES.map((s, i) => (
        <span
          key={s.key}
          title={s.label}
          className={`h-[9px] w-[9px] rounded-full ${
            i < idx
              ? "bg-white/40"
              : i === idx
                ? "bg-[#d8a94e] shadow-[0_0_10px_rgba(216,169,78,0.8)]"
                : "border border-white/25"
          }`}
        />
      ))}
      <span className="ml-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
    </span>
  );
}

/** The thread's lineage: seed → hatchings → offspring, each tagged with
 *  the stage that produced it. Provenance is kept, never merged. */
function ThreadChain({ star, state }) {
  const off = threadOffspring(state, star);
  const lifemodGoals = (state.goals || []).filter(
    (g) => g && star.lifemodId && g.sourceLifeModId === star.lifemodId
  );
  const lifemodHabits = (state.habits || []).filter(
    (h) => h && star.lifemodId && h.sourceLifeModId === star.lifemodId
  );
  const loopLabel =
    (LOOP_STAGES.find((l) => l.key === star.loopStage) || {}).label ||
    star.loopStage;
  const rows = [
    {
      k: "Seed",
      v: star.name,
      sub: `captured ${new Date(star.created).toLocaleDateString()} · ${star.orbits} orbit${star.orbits === 1 ? "" : "s"} · ${loopLabel}`,
    },
  ];
  if (off.lifemod)
    rows.push({ k: "LifeMod", v: off.lifemod.name, sub: "hatched at Execute" });
  if (off.commitment)
    rows.push({
      k: "Identity",
      v: commitmentText(state, off.commitment.id),
      sub: "the thread became a commitment",
    });
  const kids = [];
  for (const g of off.goals)
    kids.push({ kind: "goal", text: g.text, from: "from seed" });
  for (const g of lifemodGoals)
    if (!off.goals.some((x) => x.id === g.id))
      kids.push({ kind: "goal", text: g.text, from: "from LifeMod" });
  for (const h of off.habits)
    kids.push({ kind: "habit", text: h.text, from: "from seed" });
  for (const h of lifemodHabits)
    if (!off.habits.some((x) => x.id === h.id))
      kids.push({ kind: "habit", text: h.text, from: "from LifeMod" });
  return (
    <div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-baseline gap-3 border-t border-dashed border-white/10 py-2 first:border-t-0 first:pt-0"
        >
          <span className="w-[86px] shrink-0 text-[10px] uppercase tracking-[0.18em] text-[#d8a94e]">
            {r.k}
          </span>
          <span className="text-[14px] text-white/90">
            {r.v}{" "}
            <span className="text-[12px] text-white/35">· {r.sub}</span>
          </span>
        </div>
      ))}
      {kids.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {kids.map((k, i) => (
            <span
              key={i}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[12px] text-white/85"
            >
              <span className="mr-1.5 text-[10px] uppercase tracking-[0.1em] text-white/35">
                {k.kind}
              </span>
              {k.text}{" "}
              <span className="text-white/35">· {k.from}</span>
            </span>
          ))}
        </div>
      )}
      {rows.length === 1 && kids.length === 0 && (
        <p className="pt-1 text-[13px] text-white/35">
          Nothing hatched yet — the thread is still becoming.
        </p>
      )}
    </div>
  );
}

/* ------------------------------ SKY ------------------------------ */

/* Anchors are commitments: every commitment renders as a gold-ringed
   black hole, and threads rooted to it orbit nearby. No marking needed —
   rooting into identity IS anchoring. */
function anchorPos(commitments, id) {
  const idx = commitments.findIndex((c) => c.id === id);
  const n = commitments.length;
  const x = n <= 1 ? SKY_W / 2 : 130 + (idx * (SKY_W - 260)) / (n - 1);
  return [x, 372];
}

function SkyView({ stars, state, selectedId, onSelect }) {
  const commitments = sortedCommitments(state);
  const anchorById = new Map(commitments.map((c) => [c.id, anchorPos(commitments, c.id)]));
  const pts = stars.map((s) => {
    const spine = threadSpine(state, s);
    const off = threadOffspring(state, s);
    const tier = threadMassTier(s, off);
    let [x, y] = threadPos(s, spine);
    // rooted threads orbit their anchor
    const ap = s.commitmentId && anchorById.get(s.commitmentId);
    if (ap && spine !== "released") {
      const ang = hash01(s.id + ":orbit") * Math.PI * 2;
      const rad = 52 + hash01(s.id + ":rad") * 30;
      x = Math.min(975, Math.max(25, ap[0] + Math.cos(ang) * rad));
      y = Math.min(340, Math.max(40, ap[1] - 40 - Math.abs(Math.sin(ang)) * rad));
    }
    return { star: s, spine, tier, x, y };
  });
  const spineLabel = (sp) =>
    sp === "released"
      ? "Released"
      : (SPINE_STAGES.find((s) => s.key === sp) || {}).label || sp;
  return (
    <Card className="axzio-rise axzio-rise-2 relative overflow-hidden p-2 md:p-4">
      <div className="flex justify-between px-4 pt-3 text-[10px] uppercase tracking-[0.24em] text-white/30">
        <span>Capture</span>
        <span>Evaluate</span>
        <span>Execute</span>
        <span>Review · Evolve</span>
      </div>
      <svg
        viewBox={`0 0 ${SKY_W} ${SKY_H}`}
        className="h-auto w-full select-none"
        role="img"
        aria-label="Thread sky: one star per thread along the spine"
      >
        <defs>
          <radialGradient id="skyGlow">
            <stop offset="0%" stopColor="#d8a94e" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d8a94e" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* the journey arc */}
        <path
          d="M60,335 Q300,90 520,205 T950,150"
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="1.5"
          strokeDasharray="4 7"
        />
        {pts.map((p) => {
          const r = TIER_R[p.tier];
          const isSel = selectedId === p.star.id;
          const cls = stellarClass(state, p.star, p.tier);
          const def = STELLAR_CLASSES[cls];
          const isBH = cls === "trap";
          const dim = cls === "released";
          const labelBelow = p.y < 300;
          return (
            <g
              key={p.star.id}
              onClick={() => onSelect(p.star.id)}
              className="cursor-pointer"
            >
              {isBH ? (
                <g>
                  <circle cx={p.x} cy={p.y} r={r * 2.1} fill="none" stroke={def.ring} strokeWidth="1" opacity="0.35" strokeDasharray="3 5" />
                  <circle cx={p.x} cy={p.y} r={r} fill={def.color} stroke={def.ring} strokeWidth="1.6" />
                  <circle cx={p.x} cy={p.y} r={r} fill="none" stroke={def.ring} strokeWidth="1" opacity="0.9"
                    style={{ filter: `drop-shadow(0 0 ${8 + p.tier * 2}px ${def.ring})` }} />
                </g>
              ) : (
                <g>
                  {p.tier >= 2 && !dim && (
                    <circle cx={p.x} cy={p.y} r={r * 2.8} fill={def.color} opacity="0.16" />
                  )}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r}
                    fill={def.color}
                    opacity={dim ? 0.6 : 0.95}
                    style={{
                      animation: `axzio-twinkle ${3 + (p.tier % 3)}s ease-in-out ${(p.x % 3).toFixed(1)}s infinite`,
                      filter: dim ? "none" : `drop-shadow(0 0 ${6 + p.tier * 3}px ${def.color})`,
                    }}
                  />
                </g>
              )}
              {isSel && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r + 7}
                  fill="none"
                  stroke="rgba(255,255,255,0.7)"
                  strokeWidth="1"
                />
              )}
              {!dim && (
                <g>
                  <text
                    x={p.x}
                    y={labelBelow ? p.y + r + 16 : p.y - r - 20}
                    textAnchor="middle"
                    fill={isSel ? "#fff" : "rgba(255,255,255,0.72)"}
                    fontSize="12"
                    letterSpacing="1"
                  >
                    {p.star.name.slice(0, 20)}
                  </text>
                  <text
                    x={p.x}
                    y={labelBelow ? p.y + r + 30 : p.y - r - 6}
                    textAnchor="middle"
                    fill={isBH ? def.ring : "rgba(255,255,255,0.35)"}
                    fontSize="9"
                    letterSpacing="2"
                    style={{ textTransform: "uppercase" }}
                  >
                    {isBH
                      ? def.label.toUpperCase()
                      : `${spineLabel(p.spine).toUpperCase()} · ${def.label.toUpperCase()}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {/* anchors — commitments as black holes */}
        {commitments.map((c) => {
          const [ax, ay] = anchorPos(commitments, c.id);
          return (
            <g key={`anchor-${c.id}`}>
              <circle cx={ax} cy={ay} r={26} fill="none" stroke="#d8a94e" strokeWidth="1" opacity="0.3" strokeDasharray="3 5" />
              <circle cx={ax} cy={ay} r={13} fill="#050508" stroke="#d8a94e" strokeWidth="1.6" />
              <circle cx={ax} cy={ay} r={13} fill="none" stroke="#d8a94e" strokeWidth="1" opacity="0.9"
                style={{ filter: "drop-shadow(0 0 10px #d8a94e)" }} />
              <text x={ax} y={ay + 32} textAnchor="middle" fill="rgba(216,169,78,0.85)" fontSize="10" letterSpacing="2">
                {(c.text || "").slice(0, 22).toUpperCase()}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-white/30">
        One star per thread — brightness is mass · gold rings are your
        commitments, anchoring what orbits them
      </p>
    </Card>
  );
}

/* ---------------------------- THREADS ---------------------------- */

function ThreadsView({ stars, state, axzio, onOpen }) {
  const enriched = stars.map((s) => ({
    star: s,
    spine: threadSpine(state, s),
    attn: threadAttention(state, s),
    off: threadOffspring(state, s),
  }));
  const byMass = (a, b) =>
    threadMassTier(b.star, b.off) - threadMassTier(a.star, a.off) ||
    b.star.created - a.star.created;
  const attn = enriched.filter((e) => e.attn);
  const legends = enriched.filter((e) => !e.attn && e.spine === "evolve");
  const motion = enriched
    .filter((e) => !e.attn && e.spine !== "evolve" && e.spine !== "released")
    .sort(byMass);
  const released = enriched.filter((e) => e.spine === "released");
  const [showReleased, setShowReleased] = useState(false);

  return (
    <div className="axzio-rise axzio-rise-2">
      {stars.length === 0 && (
        <Card className="p-8 text-center">
          <MicroLabel className="mb-3">No threads yet</MicroLabel>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-white/50">
            Ignite a star from the Command Deck — every thread begins as a
            captured spark.
          </p>
        </Card>
      )}
      {attn.length > 0 && (
        <ThreadSection label="Needs attention">
          {attn.map((e) => (
            <ThreadCard key={e.star.id} e={e} state={state} axzio={axzio} onOpen={onOpen} />
          ))}
        </ThreadSection>
      )}
      {motion.length > 0 && (
        <ThreadSection label="In motion">
          {motion.map((e) => (
            <ThreadCard key={e.star.id} e={e} state={state} axzio={axzio} onOpen={onOpen} />
          ))}
        </ThreadSection>
      )}
      {legends.length > 0 && (
        <ThreadSection label="Legends">
          {legends.map((e) => (
            <ThreadCard key={e.star.id} e={e} state={state} axzio={axzio} onOpen={onOpen} />
          ))}
        </ThreadSection>
      )}
      {released.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowReleased((v) => !v)}
            className="text-[11px] uppercase tracking-[0.2em] text-white/35 transition-colors hover:text-white/60"
          >
            Released · {released.length} {showReleased ? "↑" : "↓"}
          </button>
          {showReleased && (
            <div className="mt-3 space-y-2">
              {released.map((e) => (
                <button
                  key={e.star.id}
                  type="button"
                  onClick={() => onOpen(e.star.id)}
                  className="w-full truncate rounded-xl border border-dashed border-white/10 px-4 py-3 text-left text-[14px] text-white/45 transition-colors hover:border-white/30 hover:text-white/70"
                >
                  {e.star.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ThreadSection({ label, children }) {
  return (
    <div className="mb-7">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.26em] text-white/35">
          {label}
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ThreadCard({ e, state, axzio, onOpen }) {
  const { star, spine, attn, off } = e;
  const [showChain, setShowChain] = useState(false);
  const tier = threadMassTier(star, off);
  const dotSize = [6, 8, 11, 14, 16][tier];
  const cls = stellarClass(state, star, tier);
  const cdef = STELLAR_CLASSES[cls];
  const isBH = cls === "trap";
  const legend = spine === "evolve";
  const anchorName = star.commitmentId ? commitmentText(state, star.commitmentId) : null;

  const goReview = () => {
    const t = attn.target;
    window.location.hash =
      t.kind === "growth" ? `#/practice?growth=${t.id}` : `#/practice?reset=${t.id}`;
  };
  const goReset = () => {
    if (axzio.requestResetFromStar(star.id)) window.location.hash = "#/practice";
  };
  const beginOrbit = () => axzio.setStarLoopStage(star.id, "interpret");

  let action = null;
  if (attn?.type === "review")
    action = { label: "Review →", primary: true, fn: goReview };
  else if (attn?.type === "fog")
    action = { label: "Reset →", fn: goReset };
  else if (spine === "capture")
    action = { label: "Begin orbit →", fn: beginOrbit };
  else action = { label: spine === "evolve" ? "Revisit →" : "Open thread →", fn: () => onOpen(star.id) };

  const kids = [...off.goals, ...off.habits];
  return (
    <Card className={`p-5 ${attn ? "border-[#d8a94e]/40 bg-[#d8a94e]/[0.04]" : ""}`}>
      <div className="flex items-start gap-4">
        <span
          className="mt-1.5 shrink-0 rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: cdef.color,
            border: isBH ? `1.5px solid ${cdef.ring}` : "none",
            boxShadow: isBH
              ? `0 0 ${8 + tier * 2}px ${cdef.ring}`
              : `0 0 ${6 + tier * 3}px ${cdef.color}`,
            opacity: 0.55 + tier * 0.11,
          }}
          title={cdef.label}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[16px] text-white/90">{star.name}</p>
            {star.crowned && (
              <span className="rounded-full border border-white/40 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/70">
                White dwarf
              </span>
            )}
            {isBH && (
              <span
                className="rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]"
                style={{ borderColor: cdef.ring, color: cdef.ring }}
              >
                Trap
              </span>
            )}
            {anchorName && !isBH && (
              <span className="rounded-full border border-[#d8a94e]/50 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#d8a94e]/80">
                Anchored · {anchorName.slice(0, 18)}
              </span>
            )}
          </div>
          {star.previousNames.length > 0 && (
            <p className="truncate text-[11.5px] text-white/35">
              formerly “{star.previousNames[star.previousNames.length - 1].text}”
            </p>
          )}
          <p className="mt-1 text-[12.5px] leading-relaxed text-white/50">
            {attn ? (
              <span className="text-[#d8a94e]">{attn.label}</span>
            ) : spine === "capture" ? (
              "Captured — not yet orbited"
            ) : spine === "evaluate" ? (
              `${star.orbits} orbit${star.orbits === 1 ? "" : "s"} · gaining mass`
            ) : spine === "execute" ? (
              "Building — the pursuit takes form"
            ) : (
              "Became identity — it still orbits, quietly"
            )}
            {kids.length > 0 || off.lifemod
              ? ` · ${kids.length + (off.lifemod ? 1 : 0)} hatched`
              : ""}
          </p>
          <div className="mt-2.5">
            <SpineDots spine={spine} />
          </div>
          {(kids.length > 0 || off.lifemod) && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {off.lifemod && (
                <span className="rounded-full border border-[#d8a94e]/30 bg-[#d8a94e]/10 px-2.5 py-0.5 text-[11px] text-white/75">
                  <span className="mr-1 text-[9px] uppercase tracking-[0.1em] text-white/35">lifemod</span>
                  {off.lifemod.name}
                </span>
              )}
              {kids.slice(0, 4).map((k) => (
                <span
                  key={k.id}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-white/70"
                >
                  {k.text}
                </span>
              ))}
              {kids.length > 4 && (
                <span className="px-1 py-0.5 text-[11px] text-white/35">
                  +{kids.length - 4} more
                </span>
              )}
            </div>
          )}
          {cls === "trap" && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-[#b45cff]/25 bg-[#b45cff]/[0.05] px-3 py-2">
              <span className="text-[11px] uppercase tracking-[0.14em] text-[#b45cff]/80">
                The well
              </span>
              <button
                type="button"
                onClick={() => axzio.logWellCheck(star.id, false)}
                className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-white/65 transition-colors hover:border-white/40 hover:text-white"
              >
                Steered clear
              </button>
              <button
                type="button"
                onClick={() => axzio.logWellCheck(star.id, true)}
                className="rounded-lg border border-white/15 px-2.5 py-1 text-[11px] text-white/65 transition-colors hover:border-white/40 hover:text-white"
              >
                Fell in
              </button>
              {star.wellCheckedAt && (
                <span className="text-[11px] text-white/35">
                  last checked {new Date(star.wellCheckedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          {showChain && (
            <div className="mt-3 border-t border-dashed border-white/10 pt-3">
              <ThreadChain star={star} state={state} />
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={action.fn}
            className={`whitespace-nowrap rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              action.primary
                ? "border-[#d8a94e] bg-[#d8a94e] font-semibold text-black hover:bg-[#e5b95e]"
                : action.label.startsWith("Reset")
                  ? "border-[#d8a94e]/50 text-[#d8a94e] hover:border-[#d8a94e] hover:text-[#e5b95e]"
                  : "border-white/15 text-white/60 hover:border-white/50 hover:text-white"
            }`}
          >
            {action.label}
          </button>
          <button
            type="button"
            onClick={() => setShowChain((v) => !v)}
            className="px-1 py-1 text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white/60"
          >
            Chain {showChain ? "↑" : "↓"}
          </button>
        </div>
      </div>
    </Card>
  );
}

/* The future name: what this thread is becoming. Set early as a
   visualization beacon; claimed or revised at the transition. */
function FutureNameField({ star, axzio }) {
  const [draft, setDraft] = useState(star.futureName || "");
  const [editing, setEditing] = useState(false);
  if (!editing && !star.futureName)
    return (
      <button
        type="button"
        onClick={() => {
          setDraft("");
          setEditing(true);
        }}
        className="mt-2 text-[12px] tracking-wide text-white/35 transition-colors hover:text-[#d8a94e]"
      >
        + Name what this is becoming…
      </button>
    );
  if (!editing)
    return (
      <p className="mt-2 text-[13px] text-white/55">
        <span className="text-[#d8a94e]">→ becoming “{star.futureName}”</span>{" "}
        <button
          type="button"
          onClick={() => {
            setDraft(star.futureName);
            setEditing(true);
          }}
          className="ml-1 text-[11px] uppercase tracking-[0.12em] text-white/30 hover:text-white/60"
        >
          edit
        </button>
      </p>
    );
  return (
    <div className="mt-2 flex items-center gap-2">
      <Field
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="The future self — e.g. Mommas Boy"
        maxLength={80}
        className="max-w-xs"
      />
      <Btn
        variant="quiet"
        onClick={() => {
          axzio.setFutureName(star.id, draft);
          setEditing(false);
        }}
      >
        Set
      </Btn>
      <Btn
        variant="ghost"
        onClick={() => {
          setEditing(false);
          setDraft(star.futureName || "");
        }}
      >
        Cancel
      </Btn>
    </div>
  );
}

const E3_ORDER = ["reveal", "interpret", "align", "act", "integrate"];

/** Which gate guards a forward move to the given E3 stage. */
function gateForTarget(target, gates) {
  if (target === "interpret" || target === "align") return gates[0];
  if (target === "act") return gates[1];
  return gates[2];
}

/* The loop: the E3 stages as a quiet stepper. Gates run in the
   background — tapping a stage opens its popup, which says plainly what
   the stage asks and where the thread stands. Stages are earned. */
function GateSection({ star, axzio }) {
  const [flow, setFlow] = useState(null); // {target, gate, met}
  const [repDraft, setRepDraft] = useState("");
  const gates = threadGates(axzio.state, star);
  const curIdx = E3_ORDER.indexOf(star.loopStage);
  const stageLabel = (k) =>
    (LOOP_STAGES.find((l) => l.key === k) || {}).label || k;

  const tryAdvance = (target) => {
    if (target === "released" || E3_ORDER.indexOf(target) <= curIdx) {
      // Back, same, or released: always free.
      axzio.setStarLoopStage(star.id, target);
      return;
    }
    // Forward: walk one gated step at a time.
    const next = E3_ORDER[curIdx + 1] || target;
    const gate = gateForTarget(next, gates);
    setFlow({ target: next, gate, met: gate.have >= gate.need });
  };

  const beginInstrument = () => {
    const g = flow.gate;
    setFlow(null);
    if (g.key === "reset") {
      if (axzio.requestResetFromStar(star.id)) window.location.hash = "#/practice";
    } else if (g.key === "growth") {
      if (axzio.requestGrowthFrom("star", star.id)) window.location.hash = "#/practice";
    }
  };
  const declareAdvance = () => {
    axzio.setStarLoopStage(star.id, flow.target);
    setFlow(null);
  };

  const intGate = gates[2];
  const habits = (intGate.detail && intGate.detail.habits) || [];

  // gate state per stage, for the quiet hint under each button
  const gateHint = (key) => {
    const idx = E3_ORDER.indexOf(key);
    if (idx < 0 || idx <= curIdx) return null;
    if (idx > curIdx + 1) return null; // only the next stage shows state
    const gate = gateForTarget(key, gates);
    const met = gate.have >= gate.need;
    return met ? "ready" : `${gate.have}/${gate.need}`;
  };

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>The loop</MicroLabel>
        <HelpBubble title="The loop">
          <HelpText
            what="The E3 loop the thread walks: Reveal → Interpret → Align → Act → Integrate."
            why="Stages you earn mean something. The gate doesn't auto-advance you; it knocks, and you decide whether the work is real."
            how="Tap the next stage to see what it asks. Meet the requirement and approve — or move early: the instrument is offered first, and honest declaration is always accepted."
          />
        </HelpBubble>
      </div>

      {/* the stepper — forward moves open the gate popup */}
      <div className="flex flex-wrap gap-2">
        {ALL_STAGES.map((st) => {
          const isSel = star.loopStage === st.key;
          const isReleased = st.key === "released";
          const hint = gateHint(st.key);
          return (
            <button
              key={st.key}
              type="button"
              onClick={() => tryAdvance(st.key)}
              aria-pressed={isSel}
              title={st.copy}
              className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                isSel
                  ? "border-white/70 bg-white/10 text-white"
                  : isReleased
                    ? "border-dashed border-white/20 text-white/45 hover:border-white/50 hover:text-white"
                    : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
              }`}
            >
              {st.label}
              {hint && (
                <span className={`ml-1.5 ${hint === "ready" ? "text-[#d8a94e]" : "text-white/35"}`}>
                  {hint === "ready" ? "· ready" : `· ${hint}`}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* gate popup */}
      {flow && (
        <div className="mt-4 rounded-xl border border-[#d8a94e]/40 bg-[#d8a94e]/[0.06] p-5">
          {!flow.met ? (
            <>
              <p className="text-[14px] text-white/85">
                {stageLabel(flow.target)} asks for{" "}
                {flow.gate.key === "integrate"
                  ? `${flow.gate.need} completions — goals finished, habits integrated, or focus tasks done`
                  : flow.gate.instrument
                    ? `a ${flow.gate.instrument}`
                    : "the work"}
                . You're at {flow.gate.have} of {flow.gate.need}.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">
                {flow.gate.blurb} The tools are the path of least resistance —
                but your word is always accepted.
              </p>
              {flow.gate.key === "integrate" && habits.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-dashed border-white/10 pt-3">
                  {habits.filter((h) => !habitIntegrated(h)).map((h) => (
                    <div key={h.id} className="flex flex-wrap items-center gap-2">
                      <span className="min-w-0 flex-1 text-[12.5px] text-white/70">
                        {h.text} · {habitSessionCount(h)} session{habitSessionCount(h) === 1 ? "" : "s"}
                        {h.repGoal ? ` / ${h.repGoal} rep goal` : " · no rep goal"}
                      </span>
                      {!h.repGoal && (
                        <span className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={repDraft}
                            onChange={(e) => setRepDraft(e.target.value)}
                            placeholder="#"
                            aria-label={`Rep goal for ${h.text}`}
                            className="w-14 rounded-lg border border-white/15 bg-black px-2 py-1 text-[12px] text-white outline-none focus:border-white/40"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const n = parseInt(repDraft, 10);
                              if (Number.isInteger(n) && n > 0) {
                                axzio.setHabitRepGoal(h.id, n);
                                setRepDraft("");
                              }
                            }}
                            className="rounded-lg border border-white/15 px-2 py-1 text-[11px] text-white/60 hover:border-white/40 hover:text-white"
                          >
                            Set rep goal
                          </button>
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => axzio.declareHabitIntegrated(h.id)}
                        title="The habit is on autopilot — become, not practiced"
                        className="rounded-lg border border-[#d8a94e]/40 px-2 py-1 text-[11px] text-[#d8a94e]/90 hover:border-[#d8a94e] hover:text-[#d8a94e]"
                      >
                        I feel integrated
                      </button>
                    </div>
                  ))}
                  {habits.some((h) => habitIntegrated(h)) && (
                    <p className="text-[12px] text-white/40">
                      Integrated: {habits.filter((h) => habitIntegrated(h)).map((h) => h.text).join(", ")}
                    </p>
                  )}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {flow.gate.instrument && (
                  <Btn variant="primary" onClick={beginInstrument}>
                    Begin {flow.gate.instrument} →
                  </Btn>
                )}
                <Btn variant="quiet" onClick={declareAdvance}>
                  I've done this work — declare it
                </Btn>
                <Btn variant="ghost" onClick={() => setFlow(null)}>
                  Not now
                </Btn>
              </div>
            </>
          ) : flow.gate.key === "integrate" ? (
            <>
              <p className="text-[14px] text-white/85">
                The count is hit — {flow.gate.have} completion{flow.gate.have === 1 ? "" : "s"}.
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
                Do you feel this is integrated? Honestly — the stat got you to
                the door; only the feeling opens it.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn variant="primary" onClick={declareAdvance}>
                  Yes — I feel integrated
                </Btn>
                <Btn variant="quiet" onClick={() => setFlow(null)}>
                  Not yet
                </Btn>
              </div>
              <p className="mt-2 text-[12px] text-white/40">
                Not yet? Raise a rep target above, or revise the habit — maybe
                the design was wrong, not the effort.
              </p>
            </>
          ) : (
            <>
              <p className="text-[14px] text-white/85">
                Ready — advance to {stageLabel(flow.target)}?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn variant="primary" onClick={declareAdvance}>
                  Advance →
                </Btn>
                <Btn variant="ghost" onClick={() => setFlow(null)}>
                  Not yet
                </Btn>
              </div>
            </>
          )}
        </div>
      )}

      <p className="mt-3 text-[12px] leading-relaxed text-white/35">
        Moving back is always free. Release is always one tap — a thread let
        go on purpose, never a failure.
      </p>
    </div>
  );
}

/* The evidence: the case file for the identity being claimed. A lens
   over existing records — resets faced, pursuits designed, goals done,
   sessions kept — plus user-entered evidence from outside AXZIO, clearly
   badged as entered-by-you. */
const EVIDENCE_KIND_LABEL = {
  reset: "Reset", growth: "Growth", goal: "Goal", habit: "Habit",
  focus: "Focus", orbit: "Orbits", rename: "Renamed", beacon: "Beacon",
  ignition: "Ignition", crown: "Crowned", manual: "Entered by you",
};

function EvidenceSection({ star, axzio }) {
  const [draft, setDraft] = useState("");
  const [condensed, setCondensed] = useState(false);
  const [openKinds, setOpenKinds] = useState({});
  const ev = threadEvidence(axzio.state, star);
  const add = () => {
    if (draft.trim()) {
      axzio.addManualEvidence(star.id, draft.trim());
      setDraft("");
    }
  };
  const grouped = ev.reduce((acc, e) => {
    (acc[e.kind] = acc[e.kind] || []).push(e);
    return acc;
  }, {});

  const entryRow = (e, i) => (
    <li
      key={i}
      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5"
    >
      <span className="mt-0.5 shrink-0 rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/50">
        {EVIDENCE_KIND_LABEL[e.kind] || e.kind}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-[13.5px] text-white/85">{e.label}</span>
        {e.sub && (
          <span className="block truncate text-[12px] text-white/45">{e.sub}</span>
        )}
      </span>
      {e.kind === "manual" ? (
        <button
          type="button"
          onClick={() =>
            axzio.removeManualEvidence(
              star.id,
              (star.manualEvidence || []).find((m) => m.text === e.sub)?.id
            )
          }
          aria-label="Remove evidence"
          className="shrink-0 text-white/25 transition-colors hover:text-white/70"
        >
          ×
        </button>
      ) : (
        e.at > 0 && (
          <span className="shrink-0 text-[11px] text-white/30">
            {new Date(e.at).toLocaleDateString()}
          </span>
        )
      )}
    </li>
  );

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>
          The evidence{ev.length > 0 ? ` · ${ev.length}` : ""}
        </MicroLabel>
        <HelpBubble title="The evidence">
          <HelpText
            what="The accumulated proof behind the identity this thread claims — every reset faced, pursuit designed, goal completed, session kept."
            why="An identity claim without evidence is a wish. The case file lets the thread — and you — see that the becoming is real."
            how="Most entries are recorded automatically as you work. Add anything from outside AXZIO (or before it) below — those stay badged as entered by you."
          />
        </HelpBubble>
        {ev.length > 3 && (
          <button
            type="button"
            onClick={() => setCondensed((v) => !v)}
            className="ml-auto text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white/70"
          >
            {condensed ? "Expand" : "Condense"}
          </button>
        )}
      </div>
      {ev.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-white/35">
          No evidence yet — work the thread and the proof accumulates here on
          its own.
        </p>
      ) : condensed ? (
        <ul className="space-y-1.5">
          {Object.entries(grouped).map(([kind, items]) => {
            const open = !!openKinds[kind];
            return (
              <li key={kind}>
                <button
                  type="button"
                  onClick={() =>
                    setOpenKinds((o) => ({ ...o, [kind]: !o[kind] }))
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-left"
                >
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white/50">
                    {EVIDENCE_KIND_LABEL[kind] || kind}
                  </span>
                  <span className="flex-1 text-[13px] text-white/60">
                    ×{items.length}
                  </span>
                  <span className="text-white/35">{open ? "▾" : "▸"}</span>
                </button>
                {open && (
                  <ul className="mt-1.5 space-y-1.5 pl-3">
                    {items.map((e, i) => entryRow(e, `${kind}-${i}`))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="space-y-2">{ev.map((e, i) => entryRow(e, i))}</ul>
      )}
      <div className="mt-3 flex items-center gap-2">
        <Field
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Evidence from outside AXZIO — e.g. ran a 5k in 2023"
          maxLength={300}
          className="flex-1"
        />
        <Btn variant="quiet" onClick={add} disabled={!draft.trim()}>
          Add
        </Btn>
      </div>
    </div>
  );
}

/* Stellar status: EARNED, not selected. The crown unlocks when the
   thread integrates (the path below is walked); anchors require the thread
   to be rooted into identity; traps are declared, not earned — naming a
   drain is honesty, not achievement. Each carries a ? explaining what it is
   and how it's achieved. Already-held statuses are grandfathered. */
/* Stellar status: EARNED, not selected. The crown unlocks when the
   thread integrates; a draining thread can collapse into a trap. Anchors
   are commitments — they need no marking: rooting into identity IS
   anchoring, and the sky renders every commitment as a gold-ringed
   black hole. */
function StellarStatus({ star, axzio, tier }) {
  const cls = stellarClass(axzio.state, star, tier);
  const def = STELLAR_CLASSES[cls];
  const gates = threadGates(axzio.state, star);
  const integrateMet = gates[2].have >= gates[2].need;
  const canCrown = star.crowned || integrateMet;
  const isTrap = star.blackHole === "trap";
  const anchorName = star.commitmentId
    ? commitmentText(axzio.state, star.commitmentId)
    : null;

  const row = (label, help, button, note) => (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] text-white/80">{label}</span>
          <HelpBubble title={label}>{help}</HelpBubble>
        </div>
        {note && (
          <p className="mt-1 text-[12px] leading-relaxed text-white/40">{note}</p>
        )}
      </div>
      {button}
    </div>
  );

  const statusBtn = (active, onClick, activeLabel, idleLabel, disabled) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
        active
          ? "border-[#b45cff]/60 bg-[#b45cff]/10 text-[#b45cff]"
          : disabled
            ? "cursor-not-allowed border-white/10 text-white/25"
            : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
      }`}
    >
      {active ? activeLabel : idleLabel}
    </button>
  );

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>Stellar status</MicroLabel>
        <HelpBubble title="Stellar status">
          <HelpText
            what="What kind of star this thread is. Dwarf colors follow mass automatically; the rest are earned or declared."
            why="A star's kind tells you how to tend it: seeds want orbiting, white dwarfs want maintaining, traps want watching — and anchors hold the whole sky together."
            how="The crown unlocks when the thread integrates. A draining thread can collapse into a trap. Anchors are your commitments — automatic."
          />
        </HelpBubble>
      </div>
      <p className="mb-3 text-[13px] text-white/55">
        Currently a{" "}
        <span style={{ color: def.color === "#050508" ? def.ring : def.color }}>
          {def.label}
        </span>
        {star.crowned && " — crowned, maintained identity"}
        {anchorName && (
          <span className="text-[#d8a94e]/80"> · anchored to “{anchorName}”</span>
        )}
      </p>
      <div className="space-y-2">
        {row(
          "White dwarf — crowned",
          <HelpText
            what="A crowned thread: the ambition became identity, dense and enduring."
            why="Crowning honors the becoming without removing it — a white dwarf stays in the sky and still dims if untended."
            how="Earned by integrating the thread: walk the path (Reset → Growth → completions) and approve the integrate gate."
          />,
          <button
            type="button"
            onClick={() => axzio.toggleCrowned(star.id)}
            disabled={!canCrown}
            aria-pressed={star.crowned}
            className={`shrink-0 rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              star.crowned
                ? "border-white/70 bg-white/10 text-white"
                : !canCrown
                  ? "cursor-not-allowed border-white/10 text-white/25"
                  : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
            }`}
          >
            {star.crowned ? "Crowned ✓" : "Crown"}
          </button>,
          !canCrown &&
            `Unlocks when this thread integrates — currently ${gates[2].have}/${gates[2].need} completions.`
        )}
        {row(
          "Collapse into a trap",
          <HelpText
            what="A gravity well — a pattern that robs energy and focus (doomscrolling, the 2am spiral). Collapsing names it honestly: this thread is not a star, it's gravity."
            why="Named traps lose power. Checking the well honestly — steered clear or fell in — turns a drain into data."
            how="Declared, not earned. A collapsed thread keeps its well log; release it to let it be a thread again."
          />,
          statusBtn(
            isTrap,
            () => axzio.setBlackHole(star.id, isTrap ? null : "trap"),
            "Trap ✓",
            "Collapse",
            false
          ),
          null
        )}
      </div>
      {isTrap && (
        <div className="mt-3 rounded-xl border border-[#b45cff]/25 bg-[#b45cff]/[0.05] p-4">
          <p className="text-[12.5px] leading-relaxed text-white/55">
            This thread has collapsed into a gravity well. Check the well
            honestly: did you steer clear, or fall in? Quiet wells surface in
            Needs attention.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => axzio.logWellCheck(star.id, false)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white/65 hover:border-white/40 hover:text-white"
            >
              Steered clear
            </button>
            <button
              type="button"
              onClick={() => axzio.logWellCheck(star.id, true)}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white/65 hover:border-white/40 hover:text-white"
            >
              Fell in
            </button>
            {(star.wellLog || []).length > 0 && (
              <span className="text-[11px] text-white/35">
                {star.wellLog.filter((w) => !w.fell).length} clear ·{" "}
                {star.wellLog.filter((w) => w.fell).length} fell in
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RootIdentity({ star, axzio }) {
  const commitments = (axzio.state.identity.commitments || []).filter(
    (c) => c && !c.archived
  );
  const [pick, setPick] = useState(star.commitmentId || "");
  const [newName, setNewName] = useState("");
  const rootedText = commitmentText(axzio.state, star.commitmentId);

  const link = () => {
    if (pick === "__new") {
      const c = axzio.addCommitment(newName.trim() || star.name);
      if (c) axzio.linkStarCommitment(star.id, c.id);
    } else if (pick) {
      axzio.linkStarCommitment(star.id, pick);
    }
    setNewName("");
  };

  if (rootedText) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/[0.03] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          Rooted as commitment
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-white">
          {rootedText}
        </p>
        <button
          type="button"
          onClick={() => axzio.linkStarCommitment(star.id, null)}
          className="mt-2 text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white/70"
        >
          Unlink
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <select
        value={pick}
        onChange={(e) => setPick(e.target.value)}
        className="w-full rounded-lg border border-white/15 bg-black px-3 py-2.5 text-[14px] text-white/85 outline-none focus:border-white/40"
      >
        <option value="">Choose a commitment…</option>
        {commitments.map((c) => (
          <option key={c.id} value={c.id}>
            {c.text}
          </option>
        ))}
        <option value="__new">＋ New commitment…</option>
      </select>
      {pick === "__new" && (
        <Field
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={`Name it — e.g. “${(star.name || "…").slice(0, 40)}”`}
          maxLength={80}
        />
      )}
      <div>
        <button
          type="button"
          onClick={link}
          disabled={!pick}
          className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white disabled:opacity-40"
        >
          Root into identity
        </button>
      </div>
      <p className="text-[12px] leading-relaxed text-white/35">
        A matured seed becomes a system asset — link it to an existing
        commitment, or grow a new one.
      </p>
    </div>
  );
}

/* The LifeMod grown from this thread: opens as an overlay right here,
   in the seed view where it was added. Deleting removes the LifeMod;
   goals and habits grown from it stay under their commitments. */
function LifeModCard({ lifemod, axzio }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      <div className="rounded-xl border border-white/20 bg-white/[0.03] p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          Growing as LifeMod
        </p>
        <p className="mt-1.5 text-[15px] leading-relaxed text-white">
          {lifemod.name}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:text-white"
          >
            Open →
          </button>
          {confirming ? (
            <span className="flex items-center gap-2 text-[11px] text-white/50">
              Delete this LifeMod?
              <button
                type="button"
                onClick={() => axzio.deleteLifeMod(lifemod.id)}
                className="uppercase tracking-[0.14em] text-red-300/80 hover:text-red-200"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="uppercase tracking-[0.14em] text-white/40 hover:text-white/70"
              >
                Keep
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white/70"
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`LifeMod: ${lifemod.name}`}
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto my-8 w-full max-w-2xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-2xl border border-white/15 bg-black p-6">
              <div className="mb-4 flex items-center justify-between">
                <MicroLabel>LifeMod</MicroLabel>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="text-white/40 hover:text-white"
                >
                  ×
                </button>
              </div>
              <LifeModEditor lifemod={lifemod} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ThreadDetail({ star, axzio, onClose }) {
  const [confirm, setConfirm] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(star.name);
  const current =
    ALL_STAGES.find((s) => s.key === star.loopStage) || LOOP_STAGES[0];
  const spine = threadSpine(axzio.state, star);
  const spineInfo = SPINE_STAGES.find((x) => x.key === spine);
  const rootedText = commitmentText(axzio.state, star.commitmentId);
  const grownLifeMod = lifeModById(axzio.state, star.lifemodId);
  const grownGoalsCount = (axzio.state.goals || []).filter(
    (g) => g && g.sourceStarId === star.id
  ).length;
  const grownHabitsCount = (axzio.state.habits || []).filter(
    (h) => h && h.sourceStarId === star.id
  ).length;

  const exploreInReset = () => {
    if (axzio.requestResetFromStar(star.id)) {
      window.location.hash = "#/practice";
    }
  };
  const growSeed = () => {
    if (axzio.requestGrowthFrom("star", star.id)) {
      window.location.hash = "#/practice";
    }
  };
  const growLifeMod = () => {
    // Door A: the seed matures into a LifeMod. addLifeMod links the
    // star back via sourceStarId when origin is 'seed'.
    axzio.addLifeMod(star.name, {
      origin: "seed",
      sourceStarId: star.id,
      becomingStage: "capture",
    });
  };

  const saveName = () => {
    const n = nameDraft.trim();
    if (n && n !== star.name) {
      axzio.renameStar(star.id, n);
      // Claiming the beacon clears it — it is now the name.
      if (star.futureName && n === star.futureName) axzio.setFutureName(star.id, "");
    }
    setEditingName(false);
    setNameDraft(star.name);
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Thread</MicroLabel>
            <HelpBubble title="Threads evolve — names too">
              <HelpText
                what="A thread's name can change as the thread itself changes. An ambition ('call mom more') becomes an identity statement ('Mommas Boy')."
                why="The name you gave a spark described what you wanted. The name it earns describes who you're becoming. Keeping the history honors the arc."
                how="Rename anytime with the pencil. Every former name is kept below with its date — the thread's naming history."
              />
            </HelpBubble>
          </div>
          {editingName ? (
            <div className="flex items-center gap-2">
              <Field
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setNameDraft(star.name);
                  }
                }}
                autoFocus
                className="max-w-sm"
              />
              <Btn variant="quiet" onClick={saveName}>
                Save
              </Btn>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="truncate text-2xl font-light tracking-wide">
                {star.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  // Pre-populate with the future name beacon if one was set —
                  // claim it or revise it; never locked in.
                  setNameDraft(star.futureName || star.name);
                  setEditingName(true);
                }}
                aria-label="Rename thread"
                title="Rename — names evolve as threads become identity"
                className="shrink-0 rounded-full border border-white/15 p-1.5 text-white/45 transition-colors hover:border-white/40 hover:text-white"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M8.5 1.5l2 2L4 10l-2.6.6L2 8l6.5-6.5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
          {star.previousNames.length > 0 && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/35">
              Formerly{" "}
              {star.previousNames
                .slice()
                .reverse()
                .map((pn, i) => (
                  <span key={i}>
                    {i > 0 && ", "}
                    <span className="text-white/55">“{pn.text}”</span>
                    {pn.at
                      ? ` · ${new Date(pn.at).toLocaleDateString()}`
                      : ""}
                  </span>
                ))}
            </p>
          )}
          <FutureNameField star={star} axzio={axzio} />
        </div>
        <CloseBtn onClose={onClose} />
      </div>
      <div className="mb-4">
        <SpineExplainer star={star} state={axzio.state} spine={spine} />
      </div>
      <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <MicroLabel className="mb-2">The chain</MicroLabel>
        <ThreadChain star={star} state={axzio.state} />
      </div>
      {star.note ? (
        <p className="text-[15px] leading-relaxed text-white/65">{star.note}</p>
      ) : (
        <p className="text-[15px] leading-relaxed text-white/40">
          No note attached to this seed.
        </p>
      )}
      <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-white/35">
        Ignited {new Date(star.created).toLocaleDateString()} ·{" "}
        {current.label} · Orbit {star.orbits}
      </p>

      <GateSection star={star} axzio={axzio} />
      <EvidenceSection star={star} axzio={axzio} />
      <StellarStatus
        star={star}
        axzio={axzio}
        tier={threadMassTier(star, threadOffspring(axzio.state, star))}
      />

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Root into identity</MicroLabel>
          <HelpBubble title="Root into identity">
            <HelpText
              what="Promotes a matured seed into an identity commitment — a standing promise that Focus items can serve."
              why="Seeds that survive the loop become system assets. A commitment gives future actions something to align to."
              how="One tap creates the commitment at the lowest priority; reorder it on the Identity page."
            />
          </HelpBubble>
        </div>
        <RootIdentity star={star} axzio={axzio} />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Grow into a LifeMod</MicroLabel>
          <HelpBubble title="Grow into a LifeMod">
            <HelpText
              what="Turns a matured seed into a LifeMod — a designed life change tracked through the Becoming Cycle."
              why="Some seeds aren't tasks to complete but conditions to change. A LifeMod gives them a structure to grow in."
              how="One tap creates it from the seed; open the LifeMod to name its legend function and move it through Detect → Capture → Evaluate → Execute → Review → Evolve."
            />
          </HelpBubble>
        </div>
        {grownLifeMod ? (
          <LifeModCard lifemod={grownLifeMod} axzio={axzio} />
        ) : (
          <>
            <button
              type="button"
              onClick={growLifeMod}
              className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
            >
              Make LifeMod
            </button>
            <p className="mt-2 text-[12px] leading-relaxed text-white/35">
              A seed that has matured becomes a designed life change —
              tracked through the Becoming Cycle.
            </p>
          </>
        )}
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>
            Become a goal
            {grownGoalsCount > 0 ? ` · ${grownGoalsCount} grown` : ""}
          </MicroLabel>
          <HelpBubble title="Seed becomes a goal">
            <HelpText
              what="Turns a matured seed into a goal — a defined outcome with a horizon, serving one of your commitments."
              why="Some seeds aren't ongoing practices or life changes; they're destinations. A goal gives the seed a finish line inside a commitment."
              how="Name the outcome, choose the commitment it serves, set an optional horizon. The goal then lives under that commitment on the Identity page."
            />
          </HelpBubble>
        </div>
        <GrownGoalsList sourceStarId={star.id} />
        <GoalCapture
          initialText={(star.text || "").slice(0, 140)}
          sourceStarId={star.id}
          compact
        />
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          A seed with a destination becomes a goal — placed inside a
          commitment, never floating free.
        </p>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>
            Become a habit
            {grownHabitsCount > 0 ? ` · ${grownHabitsCount} grown` : ""}
          </MicroLabel>
          <HelpBubble title="Seed becomes a habit">
            <HelpText
              what="Turns a matured seed into a habit — a repeating practice with a rhythm, serving one of your commitments."
              why="Some seeds aren't destinations; they're practices. A habit gives the seed a schedule instead of a finish line."
              how="Name the practice, set when it happens and for how long, choose the commitment it serves. The habit then lives under that commitment on the Identity page, and its sessions appear in Focus."
            />
          </HelpBubble>
        </div>
        <GrownHabitsList sourceStarId={star.id} />
        <HabitCapture
          initialText={(star.text || "").slice(0, 140)}
          sourceStarId={star.id}
          compact
        />
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          A seed with a rhythm becomes a habit — practiced, not finished.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exploreInReset}
            className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
          >
            Reset — clear fog →
          </button>
          <button
            type="button"
            onClick={growSeed}
            className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
          >
            Grow — design pursuit →
          </button>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          The reset clears fog on a seed; growing designs the pursuit it
          becomes.
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-5">
        {!confirm ? (
          <Btn variant="quiet" onClick={() => setConfirm(true)} className="px-0">
            Extinguish this seed
          </Btn>
        ) : (
          <div className="flex items-center gap-3">
            <Btn variant="ghost" onClick={() => axzio.deleteStar(star.id)}>
              Confirm
            </Btn>
            <Btn variant="quiet" onClick={() => setConfirm(false)}>
              Keep it
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}

function CloseBtn({ onClose }) {
  return (
    <button
      onClick={onClose}
      aria-label="Close reading"
      className="shrink-0 rounded-full border border-white/15 p-2 text-white/50 transition-colors hover:border-white/40 hover:text-white"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}

/* ------------------------------------------------------------------ */

function TriState({ label, value, onChange }) {
  const opts = [
    { key: "low", label: "Low" },
    { key: "med", label: "Med" },
    { key: "high", label: "High" },
  ];
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
        {label}
      </p>
      <div className="flex gap-2">
        {opts.map((o) => {
          const sel = value === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => onChange(sel ? null : o.key)}
              aria-pressed={sel}
              className={`rounded-lg border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                sel
                  ? "border-white/60 bg-white/10 text-white"
                  : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
