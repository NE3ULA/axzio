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
          <MicroLabel className="mb-2">Constellation</MicroLabel>
          <HelpBubble title="Constellation" className="mb-2">
            <HelpText
              what="The night sky of your becoming. Every star is a thread — one thought walking the spine from spark to legend. Brightness is mass: the more orbits and offspring, the more light."
              why="A thread you can locate is a thread you can tend. The sky shows where each one stands; the threads list shows what needs you next."
              how="Ignite stars from the Command Deck — they land in Capture. Select one to read its chain, move it along the loop, rename it as it evolves, or work it with Reset and Grow."
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

      {/* lifemods — designed life changes */}
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-4">
          <MicroLabel>LifeMods</MicroLabel>
          <HelpBubble title="LifeMods">
            <HelpText
              what="A LifeMod is a designed life change — a thread's answer when the conditions need to change. It is the Execute-phase view of a thread."
              why="A LifeMod does not ask 'How do I force myself to comply?' It asks 'What could I change so the next aligned action becomes clearer?'"
              how="Grow one from a thread (its detail card), or name a friction below. Give it a legend function, work its Becoming Cycle, archive it when it is installed — or delete it when it no longer serves."
            />
          </HelpBubble>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <LifeModsSection />
      </section>
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

function SkyView({ stars, state, selectedId, onSelect }) {
  const pts = stars.map((s) => {
    const spine = threadSpine(state, s);
    const off = threadOffspring(state, s);
    const tier = threadMassTier(s, off);
    const [x, y] = threadPos(s, spine);
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
          const isBH = cls === "anchor" || cls === "trap";
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
      </svg>
      <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-white/30">
        One star per thread — brightness is mass · select a star to read its
        thread
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
  const isBH = cls === "anchor" || cls === "trap";
  const legend = spine === "evolve";

  const goReview = () => {
    const t = attn.target;
    window.location.hash =
      t.kind === "growth" ? `#/journeys?growth=${t.id}` : `#/journeys?reset=${t.id}`;
  };
  const goReset = () => {
    if (axzio.requestResetFromStar(star.id)) window.location.hash = "#/journeys";
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
                {cls === "anchor" ? "Anchor" : "Trap"}
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

/* The path: the E3 loop as a graduated progress bar. Gates are soft —
   meeting one knocks (the user approves the unlock); moving early
   offers the instrument first, with honest declaration as the bypass. */
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
      if (axzio.requestResetFromStar(star.id)) window.location.hash = "#/journeys";
    } else if (g.key === "growth") {
      if (axzio.requestGrowthFrom("star", star.id)) window.location.hash = "#/journeys";
    }
  };
  const declareAdvance = () => {
    axzio.setStarLoopStage(star.id, flow.target);
    setFlow(null);
  };

  const intGate = gates[2];
  const habits = (intGate.detail && intGate.detail.habits) || [];

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>The path</MicroLabel>
        <HelpBubble title="The path">
          <HelpText
            what="The E3 loop as a graduated path: each stage is unlocked by doing the work — a Reset, a Growth Practice, completed offspring."
            why="Stages you earn mean something. The gate doesn't auto-advance you; it knocks, and you decide whether the work is real."
            how="Meet a gate's requirement and approve the unlock — or move early: the app offers the instrument first, and honest declaration ('I did this elsewhere') is always available."
          />
        </HelpBubble>
      </div>

      {/* E3 progress bar */}
      <div className="mb-4 flex items-center gap-1">
        {E3_ORDER.map((k, i) => (
          <div key={k} className="flex flex-1 items-center gap-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`h-[10px] w-[10px] rounded-full ${
                  i < curIdx
                    ? "bg-white/50"
                    : i === curIdx
                      ? "bg-[#d8a94e] shadow-[0_0_10px_rgba(216,169,78,0.8)]"
                      : "border border-white/25"
                }`}
                title={stageLabel(k)}
              />
              <span
                className={`text-[9px] uppercase tracking-[0.1em] ${
                  i === curIdx ? "text-[#d8a94e]" : "text-white/30"
                }`}
              >
                {stageLabel(k).slice(0, 4)}
              </span>
            </div>
            {i < E3_ORDER.length - 1 && <div className="mb-4 h-px flex-1 bg-white/10" />}
          </div>
        ))}
      </div>

      {/* the stepper — forward moves go through the gate flow */}
      <div className="flex flex-wrap gap-2">
        {ALL_STAGES.map((st) => {
          const isSel = star.loopStage === st.key;
          const isReleased = st.key === "released";
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
            </button>
          );
        })}
      </div>

      {/* gate rows */}
      <div className="mt-4 space-y-2.5">
        {gates.map((g) => {
          const met = g.have >= g.need;
          const pct = Math.min(100, Math.round((g.have / g.need) * 100));
          return (
            <div
              key={g.key}
              className={`rounded-xl border p-4 ${
                met ? "border-[#d8a94e]/40 bg-[#d8a94e]/[0.05]" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px] font-medium tracking-wide text-white/85">
                  {g.label}
                </p>
                <p className="shrink-0 text-[12px] text-white/50">
                  {g.have}/{g.need} {g.unit}
                  {met && <span className="ml-2 text-[#d8a94e]">· Ready</span>}
                </p>
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#d8a94e] transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">{g.blurb}</p>
              {g.key === "integrate" && habits.length > 0 && (
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
            </div>
          );
        })}
      </div>

      {/* gate flow dialog */}
      {flow && (
        <div className="mt-4 rounded-xl border border-[#d8a94e]/40 bg-[#d8a94e]/[0.06] p-5">
          {!flow.met ? (
            <>
              <p className="text-[14px] text-white/85">
                This stage is unlocked by {flow.gate.instrument
                  ? `a ${flow.gate.instrument}`
                  : "completing the work"}
                {" "}— {flow.gate.have}/{flow.gate.need} {flow.gate.unit} so far.
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">
                {flow.gate.blurb} The tools are the path of least resistance —
                but your word is always accepted.
              </p>
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
      <p className="mt-2 text-[12px] leading-relaxed text-white/35">
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
  const ev = threadEvidence(axzio.state, star);
  const add = () => {
    if (draft.trim()) {
      axzio.addManualEvidence(star.id, draft.trim());
      setDraft("");
    }
  };
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>The evidence</MicroLabel>
        <HelpBubble title="The evidence">
          <HelpText
            what="The accumulated proof behind the identity this thread claims — every reset faced, pursuit designed, goal completed, session kept."
            why="An identity claim without evidence is a wish. The case file lets the thread — and you — see that the becoming is real."
            how="Most entries are recorded automatically as you work. Add anything from outside AXZIO (or before it) below — those stay badged as entered by you."
          />
        </HelpBubble>
      </div>
      {ev.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-white/35">
          No evidence yet — work the thread and the proof accumulates here on
          its own.
        </p>
      ) : (
        <ul className="space-y-2">
          {ev.map((e, i) => (
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
          ))}
        </ul>
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

/* Stellar status: crown as a white dwarf (maintained identity — a badge,
   not an exit), or mark as a black hole (anchor: core identity others
   orbit; trap: gravity well that robs energy). */
function StellarStatus({ star, axzio, tier }) {
  const cls = stellarClass(axzio.state, star, tier);
  const def = STELLAR_CLASSES[cls];
  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="mb-3 flex items-center gap-2">
        <MicroLabel>Stellar status</MicroLabel>
        <HelpBubble title="Stellar status">
          <HelpText
            what="What kind of star this thread is. Dwarf colors follow mass; a crowned thread is a white dwarf — dense, enduring identity."
            why="A star's kind tells you how to tend it: seeds want orbiting, white dwarfs want maintaining, anchors hold the sky together, traps want watching."
            how="Crown a thread that became identity — it stays in the sky and still dims if untended. Mark an anchor for core identities, a trap for gravity wells like doomscrolling."
          />
        </HelpBubble>
      </div>
      <p className="mb-3 text-[13px] text-white/55">
        Currently a <span style={{ color: def.color === "#050508" ? def.ring : def.color }}>{def.label}</span>
        {star.crowned && " — crowned, maintained identity"}
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => axzio.toggleCrowned(star.id)}
          aria-pressed={star.crowned}
          className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            star.crowned
              ? "border-white/70 bg-white/10 text-white"
              : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
          }`}
        >
          {star.crowned ? "Crowned ✓" : "Crown as white dwarf"}
        </button>
        {["anchor", "trap"].map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => axzio.setBlackHole(star.id, star.blackHole === k ? null : k)}
            aria-pressed={star.blackHole === k}
            className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              star.blackHole === k
                ? "border-[#d8a94e]/60 bg-[#d8a94e]/10 text-[#d8a94e]"
                : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
            }`}
          >
            {k === "anchor" ? "Mark as anchor" : "Mark as trap"}
          </button>
        ))}
      </div>
      {star.blackHole === "trap" && (
        <div className="mt-3 rounded-xl border border-[#b45cff]/25 bg-[#b45cff]/[0.05] p-4">
          <p className="text-[12.5px] leading-relaxed text-white/55">
            A trap is a gravity well — it robs energy and focus. Check the
            well honestly: did you steer clear, or fall in? Quiet wells
            surface in Needs attention.
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
      {star.blackHole === "anchor" && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-white/45">
          An anchor is a core identity — other threads orbit it. Its gravity
          is coherence: everything bends toward who you are.
        </p>
      )}
    </div>
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
      window.location.hash = "#/journeys";
    }
  };
  const growSeed = () => {
    if (axzio.requestGrowthFrom("star", star.id)) {
      window.location.hash = "#/journeys";
    }
  };
  const promote = () => {
    const c = axzio.addCommitment(star.name);
    if (c) axzio.linkStarCommitment(star.id, c.id);
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
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <SpineDots spine={spine} />
        {spineInfo && (
          <span className="text-[12.5px] text-white/45">{spineInfo.copy}</span>
        )}
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
        {rootedText ? (
          <div className="rounded-xl border border-white/20 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Rooted as commitment
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white">
              {rootedText}
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={promote}
              className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
            >
              Make commitment
            </button>
            <p className="mt-2 text-[12px] leading-relaxed text-white/35">
              A seed that has matured becomes a system asset — an identity
              commitment, added at the lowest priority.
            </p>
          </>
        )}
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
          <div className="rounded-xl border border-white/20 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              Growing as LifeMod
            </p>
            <p className="mt-1.5 text-[15px] leading-relaxed text-white">
              {grownLifeMod.name}
            </p>
          </div>
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
/* LifeMods — designed life changes. Two entry doors: grown from a     */
/* seed (star detail's "Make LifeMod") or named directly from a        */
/* friction (the capture below). No separate module: they live here,  */
/* in the Constellation, summarized on the Deck.                       */
/* ------------------------------------------------------------------ */

function LifeModsSection() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [frictionText, setFrictionText] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const lifemods = Array.isArray(state.lifemods) ? state.lifemods : [];
  const active = lifemods.filter((m) => m.active !== false);
  const archived = lifemods.filter((m) => m.active === false);

  const create = (e) => {
    e.preventDefault();
    const t = frictionText.trim();
    if (!t) return;
    // Door B: name the friction directly — conceptually still a matured
    // seed, just one that never went through the ignite loop.
    const m = axzio.addLifeMod(t, { origin: "friction" });
    if (m) {
      setFrictionText("");
      setExpandedId(m.id);
    }
  };

  return (
    <Card className="axzio-rise axzio-rise-3 p-6">
      {/* door B: name a friction */}
      <form onSubmit={create} className="mb-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Name a friction</MicroLabel>
          <HelpBubble title="Name a friction">
            <HelpText
              what="The second door into a LifeMod: name a preexisting circumstance that creates drag — no seed required."
              why="Not every LifeMod starts as inspiration. Friction-born LifeMods remove drag (repair, remove); seed-born ones build lift (unlock, expand)."
              example="“My sleep schedule is wrecking my mornings.”"
            />
          </HelpBubble>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Field
            value={frictionText}
            onChange={(e) => setFrictionText(e.target.value)}
            placeholder="What repeatedly creates drag?"
            maxLength={120}
            aria-label="Name a friction"
            className="flex-1"
          />
          <Btn type="submit" disabled={!frictionText.trim()}>
            Create LifeMod
          </Btn>
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          Preexisting circumstances count too — a LifeMod can start from a
          friction, not only from a seed.
        </p>
      </form>

      {/* active lifemods */}
      <div className="border-t border-white/10 pt-5">
        <MicroLabel className="mb-3">
          Active · {active.length}
        </MicroLabel>
        {active.length === 0 ? (
          <Empty>
            No active LifeMods — grow one from a seed, or name a friction
            above.
          </Empty>
        ) : (
          <div className="space-y-2">
            {active.map((m) => (
              <LifeModRow
                key={m.id}
                lifemod={m}
                expanded={expandedId === m.id}
                onToggle={() =>
                  setExpandedId(expandedId === m.id ? null : m.id)
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* archived */}
      {archived.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            aria-expanded={showArchived}
            className="text-[11px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
          >
            {showArchived ? "Hide archived" : `Show archived · ${archived.length}`}
          </button>
          {showArchived && (
            <div className="mt-3 space-y-2">
              {archived.map((m) => (
                <LifeModRow
                  key={m.id}
                  lifemod={m}
                  expanded={expandedId === m.id}
                  onToggle={() =>
                    setExpandedId(expandedId === m.id ? null : m.id)
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function LifeModRow({ lifemod, expanded, onToggle }) {
  const fnLabel = legendFunctionLabel(lifemod.legendFunction);
  const stageLabel = becomingStageLabel(lifemod.becomingStage);
  return (
    <div
      className={`rounded-xl border transition-colors ${
        expanded ? "border-white/30 bg-white/[0.02]" : "border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[15px] text-white/90">
          {lifemod.name || "Unnamed LifeMod"}
        </span>
        {fnLabel && <Pill>{fnLabel}</Pill>}
        {stageLabel && <Pill tone="lit">{stageLabel}</Pill>}
        <span className="text-[10px] uppercase tracking-[0.18em] text-white/35">
          {lifemod.origin === "seed" ? "Grown from a seed" : "Named from friction"}
        </span>
      </button>
      {expanded && <LifeModEditor lifemod={lifemod} />}
    </div>
  );
}

function LifeModEditor({ lifemod }) {
  const axzio = useAxzio();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const m = lifemod;
  const set = (patch) => axzio.updateLifeMod(m.id, patch);
  const growLifeMod = () => {
    if (axzio.requestGrowthFrom("lifemod", m.id)) {
      window.location.hash = "#/journeys";
    }
  };

  return (
    <div className="border-t border-white/10 px-4 py-5 md:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={growLifeMod}
          className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          Grow — design pursuit →
        </button>
        <p className="text-[12px] leading-relaxed text-white/35">
          Design the pursuit this condition change serves.
        </p>
      </div>
      {/* name */}
      <div className="mb-5">
        <MicroLabel className="mb-2">Name</MicroLabel>
        <Field
          value={m.name}
          onChange={(e) => set({ name: e.target.value })}
          maxLength={120}
          aria-label="LifeMod name"
        />
      </div>

      {/* the book's five elements */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <MicroLabel className="mb-2">Friction</MicroLabel>
          <TextArea
            value={m.friction}
            onChange={(e) => set({ friction: e.target.value })}
            placeholder="What is creating drag?"
            rows={2}
            maxLength={600}
            aria-label="Friction"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Current state</MicroLabel>
            <HelpBubble title="Current state">
              <HelpText
                what="Where this is right now, honestly described — the starting point the LifeMod moves from."
                why="A LifeMod travels from current to desired. Without an honest starting point there's nothing to measure the change against."
                example="“I check my phone in bed for 40 minutes most nights.”"
              />
            </HelpBubble>
          </div>
          <TextArea
            value={m.currentState}
            onChange={(e) => set({ currentState: e.target.value })}
            placeholder="Where it is now."
            rows={2}
            maxLength={600}
            aria-label="Current state"
          />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2">
            <MicroLabel>Desired state</MicroLabel>
            <HelpBubble title="Desired state">
              <HelpText
                what="Where this wants to be — the condition you're designing toward."
                why="The desired state is what the Becoming Cycle works toward and what Review measures against."
                how="Describe the condition, not the action. It's a state of life, not a to-do."
                example="“Phone charges in the kitchen; the bedroom is for sleep and reading.”"
              />
            </HelpBubble>
          </div>
          <TextArea
            value={m.desiredState}
            onChange={(e) => set({ desiredState: e.target.value })}
            placeholder="Where it wants to be."
            rows={2}
            maxLength={600}
            aria-label="Desired state"
          />
        </div>
        <div>
          <MicroLabel className="mb-2">Next action</MicroLabel>
          <Field
            value={m.nextAction}
            onChange={(e) => set({ nextAction: e.target.value })}
            placeholder="The smallest concrete action that begins the modification."
            maxLength={280}
            aria-label="Next action"
          />
          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                  Impact
                </p>
                <HelpBubble title="Impact vs effort">
                  <HelpText
                    what="A rough read on the LifeMod: how much it matters (impact) versus how much it costs to make (effort)."
                    why="High impact, low effort changes are the obvious first moves. The read keeps ambition honest."
                    how="Set each by feel — it's a compass, not a calculation."
                  />
                </HelpBubble>
              </div>
              <TriState
                value={m.impact}
                onChange={(v) => set({ impact: v })}
              />
            </div>
            <TriState
              label="Effort"
              value={m.effort}
              onChange={(v) => set({ effort: v })}
            />
          </div>
        </div>
      </div>

      {/* legend function */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Legend function</MicroLabel>
          <HelpBubble title="Legend functions">
            <HelpText
              what="The eight jobs a LifeMod can do for your legend — what this change is for."
              why="Naming the function keeps the LifeMod honest: a change meant to Simplify that keeps Expanding is off-course."
              how="Pick the one that fits. Friction-born LifeMods usually Repair or Remove; seed-born ones usually Unlock or Expand."
            />
          </HelpBubble>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {LEGEND_FUNCTIONS.map((f) => {
            const sel = m.legendFunction === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => set({ legendFunction: sel ? null : f.key })}
                aria-pressed={sel}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  sel
                    ? "border-white/60 bg-white/10"
                    : "border-white/10 hover:border-white/35"
                }`}
              >
                <p
                  className={`text-[12px] uppercase tracking-[0.16em] ${
                    sel ? "text-white" : "text-white/70"
                  }`}
                >
                  {f.label}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-white/45">
                  {f.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* becoming cycle stepper */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Becoming Cycle</MicroLabel>
          <HelpBubble title="Becoming Cycle">
            <HelpText
              what="The six-stage journey every LifeMod travels: Detect → Capture → Evaluate → Execute → Review → Evolve."
              why="A LifeMod is a change to living conditions, not a task — it needs its own cycle, with Review built in before it Evolves."
              how="Move the LifeMod along as it matures. Review asks whether it's working; Evolve carries the lesson into the next change."
            />
          </HelpBubble>
        </div>
        <div className="flex flex-wrap gap-2">
          {BECOMING_STAGES.map((s, i) => {
            const sel = m.becomingStage === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => set({ becomingStage: s.key })}
                aria-pressed={sel}
                title={sel ? "Current stage" : `Move to ${s.label}`}
                className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  sel
                    ? "border-white/70 bg-white/10 text-white"
                    : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                <span className="mr-1.5 text-white/30">{i + 1}</span>
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          Placement is yours to declare — the cycle does not advance on its
          own.
        </p>
      </div>

      {/* crystallize the desired state into a goal */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Goals grown from this LifeMod</MicroLabel>
          <HelpBubble title="LifeMod becomes a goal">
            <HelpText
              what="Crystallizes this LifeMod's desired state into a goal — a defined outcome with a horizon, serving one of your commitments."
              why="A LifeMod changes conditions; a goal names the destination those conditions serve. They stay linked: the condition and the outcome, each visible from the other."
              how="Read your desired state above, then distill it into a crisp outcome — name it in a breath, choose the commitment, set an optional horizon. The LifeMod keeps living here; the goal lives under its commitment on Identity."
            />
          </HelpBubble>
        </div>
        <GrownGoalsList sourceLifeModId={m.id} />
        {m.desiredState?.trim() && (
          <blockquote className="mb-3 border-l-2 border-white/20 pl-3 text-[13px] italic leading-relaxed text-white/55">
            “{m.desiredState.trim().length > 220
              ? m.desiredState.trim().slice(0, 220) + "…"
              : m.desiredState.trim()}”
          </blockquote>
        )}
        <div className="mt-3">
          <GoalCapture
            ctaLabel="Set a goal"
            sourceLifeModId={m.id}
            compact
          />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          Distill the desired state above into one crisp outcome — a LifeMod
          may grow several goals over its life.
        </p>
      </div>

      {/* grow the desired state into a habit */}
      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Habits grown from this LifeMod</MicroLabel>
          <HelpBubble title="LifeMod grows a habit">
            <HelpText
              what="Turns this LifeMod's desired state into a habit — a repeating practice with a rhythm, serving one of your commitments."
              why="A LifeMod changes conditions; a habit rehearses the new condition until it holds. They stay linked: the condition and the practice, each visible from the other."
              how="Read your desired state above, then name the practice that would grow it — set when it happens and for how long, choose the commitment. The LifeMod keeps living here; the habit lives under its commitment on Identity."
            />
          </HelpBubble>
        </div>
        <GrownHabitsList sourceLifeModId={m.id} />
        <div className="mt-3">
          <HabitCapture
            ctaLabel="Start a habit"
            sourceLifeModId={m.id}
            compact
          />
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          Name the practice that would grow this condition — a LifeMod may
          grow several habits over its life.
        </p>
      </div>

      {/* archive / delete */}
      <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-white/10 pt-5">
        <Btn
          variant="ghost"
          onClick={() => axzio.setLifeModActive(m.id, !m.active)}
        >
          {m.active ? "Archive" : "Restore"}
        </Btn>
        {!confirmDelete ? (
          <Btn variant="quiet" onClick={() => setConfirmDelete(true)} className="px-0">
            Delete
          </Btn>
        ) : (
          <span className="flex items-center gap-3">
            <Btn variant="ghost" onClick={() => axzio.deleteLifeMod(m.id)}>
              Confirm delete
            </Btn>
            <Btn variant="quiet" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Btn>
          </span>
        )}
        <span className="text-[12px] text-white/35">
          {m.active
            ? "Archiving keeps the record; deleting removes it."
            : "Archived — restore to work it again."}
        </span>
      </div>
    </div>
  );
}

/** Quiet Low / Med / High segmented control; tapping the selected clears it. */
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
