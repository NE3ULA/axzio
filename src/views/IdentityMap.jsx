import { useMemo, useState } from "react";
import {
  useAxzio,
  LOOP_STAGES,
  sortedCommitments,
  primitiveLabel,
  threadEvidence,
} from "../store.jsx";
import { recentLocalEvents } from "../events.js";
import {
  MicroLabel,
  SectionHead,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* IDENTITY MAP — the differentiator, made visible. Not a task list:    */
/* the journey. Time + action are the distance traveled. Orbit is the   */
/* first impression (the system at a glance); Vertical digs into the    */
/* details (the ladder: action → threads → commitments → identity).      */
/* ------------------------------------------------------------------ */

const WEEK_MS = 7 * 864e5;
const TWO_WEEKS_MS = 14 * 864e5;

/* Orbit geometry */
const CX = 450;
const CY = 330;
const R_COMMIT = 150;
const R_THREAD = 240;
const R_IN = 305;
/* Primitive arcs: 70° arcs centered in their 90° sector, leaving open
   space between them. Unlinked commitments orbit in that open space. */
const PRIM_ARCS = [
  { key: "building", a0: -35, a1: 35, rgb: "216,169,78" },
  { key: "being", a0: 70, a1: 140, rgb: "77,208,166" },
  { key: "money", a0: 160, a1: 230, rgb: "127,176,105" },
  { key: "engagement", a0: 250, a1: 320, rgb: "224,142,121" },
];
const GAP_MIDS = [52.5, 150, 240, 322.5];
const STAGE_COLORS = {
  reveal: "#9db4ff",
  interpret: "#ffb347",
  align: "#4dd0a6",
  act: "#ff8c42",
  integrate: "#d8a94e",
};

const rad = (d) => (d * Math.PI) / 180;
const pt = (r, deg) => [CX + r * Math.cos(rad(deg)), CY + r * Math.sin(rad(deg))];
function arcPath(r, a0, a1) {
  const [x0, y0] = pt(r, a0);
  const [x1, y1] = pt(r, a1);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}
function stageLabel(key) {
  const s = LOOP_STAGES.find((s) => s.key === key);
  return s ? s.label : key;
}
function relTime(ts) {
  const d = Date.now() - (ts || 0);
  if (d < 0) return "just now";
  if (d < 3600e3) return "just now";
  if (d < 864e5) {
    const h = Math.floor(d / 3600e3);
    return h === 1 ? "an hour ago" : `${h} hours ago`;
  }
  const days = Math.floor(d / 864e5);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  return `${Math.floor(days / 7)} weeks ago`;
}
function vitalityOf(lastActive) {
  const q = Date.now() - (lastActive || 0);
  if (lastActive && q < 3 * 864e5) return "tended";
  if (lastActive && q < 9 * 864e5) return "quiet";
  return "drifting";
}
function vitalityMeta(v, lastActive) {
  if (v === "tended") return `tended ${relTime(lastActive)}`;
  if (v === "quiet") return `quiet ${relTime(lastActive)}`;
  return lastActive ? `drifting · ${relTime(lastActive)}` : "not yet tended";
}

/** Last activity timestamp for a commitment: its threads, its completed
    goals, and journal events touching it or its threads. */
function commitmentLastActive(state, c, threads) {
  let last = 0;
  const tids = new Set();
  for (const t of threads) {
    if (t.commitmentId === c.id) {
      tids.add(t.id);
      last = Math.max(last, t.created || 0);
    }
  }
  for (const g of state.goals || []) {
    if (g.commitmentId === c.id && g.completedAt) last = Math.max(last, g.completedAt);
  }
  try {
    const evs = recentLocalEvents(null, Date.now() - 30 * 864e5, 400);
    for (const e of evs) {
      const pid = e.payload && e.payload.id;
      if (pid && (tids.has(pid) || pid === c.id)) last = Math.max(last, e.ts || 0);
    }
  } catch {
    /* journal unavailable — state-derived activity stands */
  }
  return last;
}

/** The movement feed: journal events first, state-derived fallbacks so
    the feed isn't empty when the outbox has drained to the cloud. */
function buildMovement(state, threads) {
  const now = Date.now();
  const starById = new Map(threads.map((t) => [t.id, t]));
  const commitById = new Map(
    (state.identity.commitments || []).map((c) => [c.id, c])
  );
  const goalById = new Map((state.goals || []).map((g) => [g.id, g]));
  const items = [];
  const seenStarCreated = new Set();
  let evs = [];
  try {
    evs = recentLocalEvents(null, now - TWO_WEEKS_MS, 400);
  } catch {
    /* no journal — fall back to state */
  }
  for (const e of evs) {
    const p = e.payload || {};
    const star = starById.get(p.id);
    const sname = star ? star.name : null;
    switch (e.type) {
      case "seed.crowned":
        if (sname) items.push({ at: e.ts, text: `“${sname}” was crowned` });
        break;
      case "seed.transition":
        if (sname)
          items.push({ at: e.ts, text: `“${sname}” moved to ${stageLabel(p.stage)}` });
        break;
      case "seed.created":
        if (sname) {
          seenStarCreated.add(p.id);
          items.push({ at: e.ts, text: `“${sname}” ignited as a seed` });
        }
        break;
      case "seed.released":
        items.push({ at: e.ts, text: `“${sname || "A thread"}” was released` });
        break;
      case "seed.renamed":
        if (sname) items.push({ at: e.ts, text: `“${sname}” renamed` });
        break;
      case "reset.session":
        items.push({
          at: e.ts,
          text: `Reset faced${p.situation ? ` — ${p.situation}` : ""}`,
        });
        break;
      case "commitment.created": {
        const c = commitById.get(p.id);
        if (c) items.push({ at: e.ts, text: `Commitment named: “${c.text}”` });
        break;
      }
      case "commitment.placed": {
        const c = commitById.get(p.id);
        if (c && p.primitive)
          items.push({
            at: e.ts,
            text: `“${c.text}” placed in ${primitiveLabel(p.primitive)}`,
          });
        break;
      }
      case "goal.completed": {
        const g = goalById.get(p.id);
        if (g) items.push({ at: e.ts, text: `Goal completed: “${g.text}”` });
        break;
      }
      case "habit.integrated": {
        const h = (state.habits || []).find((x) => x.id === p.id);
        if (h) items.push({ at: e.ts, text: `Habit integrated: “${h.text}”` });
        break;
      }
      default:
        break;
    }
  }
  /* Fallbacks from state for what the journal no longer holds. */
  for (const t of threads) {
    if (t.created >= now - TWO_WEEKS_MS && !seenStarCreated.has(t.id)) {
      items.push({ at: t.created, text: `“${t.name}” ignited as a seed` });
    }
  }
  for (const r of state.resets || []) {
    if ((r.ts || 0) >= now - TWO_WEEKS_MS && !evs.some((e) => e.type === "reset.session" && Math.abs(e.ts - r.ts) < 60000)) {
      items.push({ at: r.ts, text: "Reset faced" });
    }
  }
  items.sort((a, b) => b.at - a.at);
  return items.slice(0, 8);
}

/** Threads with movement in the last two weeks, newest first. */
function threadsInMotion(threads, movement) {
  const now = Date.now();
  const rows = [];
  for (const t of threads) {
    let badge = null;
    let at = 0;
    if (t.crowned) {
      badge = "crowned ✓";
      at = t.created || 0;
    }
    const mv = movement.find(
      (m) => m.text.includes(`“${t.name}”`) && m.at >= now - TWO_WEEKS_MS
    );
    if (mv && mv.at > at) {
      at = mv.at;
      badge = mv.text.replace(`“${t.name}” `, "");
    } else if (!badge && t.created >= now - TWO_WEEKS_MS) {
      badge = "ignited";
      at = t.created;
    }
    if (badge) rows.push({ thread: t, badge, at });
  }
  rows.sort((a, b) => b.at - a.at);
  return rows;
}

export default function IdentityMap() {
  const { state } = useAxzio();
  const [view, setView] = useState("orbit"); // 'orbit' | 'vertical'

  const data = useMemo(() => {
    const now = Date.now();
    const becoming = (state.identity.becoming || "").trim();
    const commitments = sortedCommitments(state).map((c) => {
      const threads = (state.stars || []).filter(
        (s) => s && s.loopStage !== "released"
      );
      const last = commitmentLastActive(state, c, threads);
      return { ...c, lastActive: last, vitality: vitalityOf(last) };
    });
    const threads = (state.stars || []).filter(
      (s) => s && s.loopStage !== "released"
    );
    const inWeek = (ts) => (ts || 0) >= now - WEEK_MS;
    const weekActions = (state.actions || []).filter((a) => inWeek(a.ts));
    const weekSparks = (state.signals || []).filter((s) => inWeek(s.ts));
    const weekIgnited = threads.filter((t) => inWeek(t.created));
    const weekResets = (state.resets || []).filter((r) => inWeek(r.ts));
    const weekGoals = (state.goals || []).filter((g) =>
      inWeek(g.completedAt)
    );
    const crowned = threads.filter((t) => t.crowned);
    let evidenceCount = 0;
    try {
      for (const t of threads) evidenceCount += threadEvidence(state, t).length;
    } catch {
      /* evidence unavailable */
    }
    const movement = buildMovement(state, threads);
    return {
      becoming,
      commitments,
      threads,
      weekActions,
      weekSparks,
      weekIgnited,
      weekResets,
      weekGoals,
      crowned,
      evidenceCount,
      movement,
      motion: threadsInMotion(threads, movement),
    };
  }, [state]);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-8">
        <MicroLabel className="mb-2">The Journey</MicroLabel>
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-light tracking-wide md:text-4xl">
            Identity Map
          </h2>
          <HelpBubble title="Identity Map">
            <HelpText
              what="The journey made visible: this week's doing flowing upward into threads, threads feeding commitments, commitments authoring identity. Time + action are the distance traveled."
              why="Every other app optimizes the doing. This map shows the doing becoming the being — the one thing AXZIO is for."
              how="Orbit is the system at a glance; Vertical digs into the details. Drift is shown honestly: a dimmed commitment is an invitation, not a failure."
            />
          </HelpBubble>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/50">
          Not a task list —{" "}
          <span className="text-white/80">the journey</span>. Am I becoming
          who I said I am? The map reads the week&apos;s action upward into
          identity, so you can see formation happening.
        </p>
      </header>

      {/* Orbit | Vertical toggle */}
      <div className="axzio-rise axzio-rise-1 mb-6 inline-flex rounded-full border border-white/10 p-1">
        {[
          { key: "orbit", label: "Orbit" },
          { key: "vertical", label: "Vertical" },
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

      {view === "orbit" ? (
        <OrbitView data={data} />
      ) : (
        <VerticalView data={data} />
      )}
    </div>
  );
}

/* ------------------------------ ORBIT ------------------------------ */

function orbitCommitmentNodes(commitments) {
  const byPrim = { building: [], being: [], money: [], engagement: [] };
  const unlinked = [];
  for (const c of commitments) {
    if (c.primitive && byPrim[c.primitive]) byPrim[c.primitive].push(c);
    else unlinked.push(c);
  }
  const nodes = [];
  for (const arc of PRIM_ARCS) {
    const list = byPrim[arc.key];
    list.forEach((c, j) => {
      const deg = arc.a0 + (arc.a1 - arc.a0) * ((j + 1) / (list.length + 1));
      const [x, y] = pt(R_COMMIT, deg);
      nodes.push({ c, x, y, arc });
    });
  }
  unlinked.forEach((c, j) => {
    const [x, y] = pt(R_COMMIT, GAP_MIDS[j % GAP_MIDS.length]);
    nodes.push({ c, x, y, arc: null });
  });
  return nodes;
}

function becomingLines(text, per = 30) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > per && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = next;
    }
    if (lines.length === 2) break;
  }
  if (lines.length < 2 && cur) lines.push(cur);
  if (lines.length === 2 && words.join(" ").length > lines.join(" ").length) {
    lines[1] = lines[1].replace(/\s+\S*$/, "") + "…";
  }
  return lines.slice(0, 2);
}

function OrbitView({ data }) {
  const { becoming, commitments, threads, weekActions } = data;
  const nodes = useMemo(() => orbitCommitmentNodes(commitments), [commitments]);
  const streaks = useMemo(() => {
    const n = Math.min(weekActions.length, 10);
    return Array.from({ length: n }, (_, j) => {
      const deg = -90 + (j + 0.5) * (360 / Math.max(n, 1));
      const [x0, y0] = pt(R_IN, deg);
      const [x1, y1] = pt(R_IN - 34, deg);
      return { x0, y0, x1, y1, key: j };
    });
  }, [weekActions.length]);

  const blines = becoming ? becomingLines(becoming) : [];

  return (
    <div className="axzio-rise axzio-rise-2">
      <svg
        viewBox="0 0 900 660"
        role="img"
        aria-label="Identity map orbit view"
        className="h-auto w-full"
      >
        <defs>
          <radialGradient id="imap-core-glow">
            <stop offset="0%" stopColor="#d8a94e" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#d8a94e" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* base ring + primitive arcs */}
        <circle
          cx={CX}
          cy={CY}
          r={R_COMMIT}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
        {PRIM_ARCS.map((a) => (
          <g key={a.key}>
            <path
              d={arcPath(R_COMMIT, a.a0, a.a1)}
              fill="none"
              stroke={`rgba(${a.rgb},0.42)`}
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <text
              x={pt(188, (a.a0 + a.a1) / 2)[0]}
              y={pt(188, (a.a0 + a.a1) / 2)[1]}
              textAnchor="middle"
              fontSize="10"
              letterSpacing="3"
              fill={`rgba(${a.rgb},0.6)`}
              style={{ textTransform: "uppercase" }}
            >
              {primitiveLabel(a.key)}
            </text>
          </g>
        ))}

        {/* threads ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R_THREAD}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        <text
          x={CX}
          y={CY - R_THREAD - 8}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="3"
          fill="rgba(255,255,255,0.3)"
          style={{ textTransform: "uppercase" }}
        >
          Threads
        </text>

        {/* incoming ring */}
        <circle
          cx={CX}
          cy={CY}
          r={R_IN}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="1"
        />
        <text
          x={CX}
          y={CY - R_IN - 8}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="3"
          fill="rgba(255,255,255,0.25)"
          style={{ textTransform: "uppercase" }}
        >
          This week
        </text>

        {/* incoming action streaks */}
        <g stroke="rgba(126,226,168,0.5)" strokeWidth="1.5">
          {streaks.map((s) => (
            <g key={s.key}>
              <line x1={s.x0} y1={s.y0} x2={s.x1} y2={s.y1} />
              <circle cx={s.x0} cy={s.y0} r="2.5" fill="#7ee2a8" stroke="none" />
            </g>
          ))}
        </g>

        {/* threads */}
        <g>
          {threads.map((t, j) => {
            const deg = -90 + j * (360 / Math.max(threads.length, 1));
            const [x, y] = pt(R_THREAD, deg);
            const color = t.crowned
              ? "#ffffff"
              : STAGE_COLORS[t.loopStage] || "#9db4ff";
            return (
              <g key={t.id}>
                <title>{`${t.name} — ${stageLabel(t.loopStage)}${t.crowned ? " · crowned" : ""}`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r={t.crowned ? 8 : 6}
                  fill={t.crowned ? "#0a0a10" : color}
                  stroke={color}
                  strokeWidth="1.6"
                  opacity="0.9"
                  style={
                    t.crowned
                      ? { filter: "drop-shadow(0 0 10px #ffffff)" }
                      : undefined
                  }
                />
              </g>
            );
          })}
        </g>

        {/* commitments on their arcs */}
        <g>
          {nodes.map(({ c, x, y }) => {
            const v = c.vitality;
            const stroke =
              v === "tended"
                ? "#d8a94e"
                : v === "quiet"
                  ? "rgba(255,255,255,0.35)"
                  : "#b45cff";
            return (
              <g key={c.id} opacity={v === "drifting" ? 0.75 : 1}>
                <title>{`${c.text}${c.primitive ? ` — ${primitiveLabel(c.primitive)}` : " — unplaced"} · ${vitalityMeta(v, c.lastActive)}`}</title>
                <circle
                  cx={x}
                  cy={y}
                  r="13"
                  fill="#050508"
                  stroke={stroke}
                  strokeWidth="1.6"
                  style={
                    v === "tended"
                      ? { filter: "drop-shadow(0 0 10px #d8a94e)" }
                      : v === "drifting"
                        ? { filter: "drop-shadow(0 0 8px #b45cff)" }
                        : undefined
                  }
                />
                <text
                  x={x}
                  y={y - 20}
                  textAnchor="middle"
                  fontSize="12"
                  fill="rgba(255,255,255,0.8)"
                >
                  {c.text.length > 22 ? c.text.slice(0, 21) + "…" : c.text}
                </text>
                {v === "drifting" && (
                  <text
                    x={x + 18}
                    y={y + 4}
                    fontSize="9"
                    fill="#b45cff"
                    letterSpacing="1"
                  >
                    drifting
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* core */}
        <circle cx={CX} cy={CY} r="92" fill="url(#imap-core-glow)" />
        <circle
          cx={CX}
          cy={CY}
          r="64"
          fill="#0a0a10"
          stroke="#d8a94e"
          strokeWidth="1.5"
        />
        {becoming ? (
          <g>
            {blines.map((ln, i) => (
              <text
                key={i}
                x={CX}
                y={CY - 8 + i * 18}
                textAnchor="middle"
                fill="#fff"
                fontSize="13"
                fontWeight="300"
              >
                {ln}
              </text>
            ))}
            <text
              x={CX}
              y={CY + 34}
              textAnchor="middle"
              fill="rgba(216,169,78,0.9)"
              fontSize="10"
              letterSpacing="3"
            >
              CORE
            </text>
          </g>
        ) : (
          <a href="#/core">
            <text
              x={CX}
              y={CY - 4}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="12"
            >
              Name your
            </text>
            <text
              x={CX}
              y={CY + 16}
              textAnchor="middle"
              fill="rgba(255,255,255,0.6)"
              fontSize="12"
            >
              becoming in Core
            </text>
          </a>
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 px-1">
        <span className="text-[11px] tracking-wide text-white/35">
          {weekActions.length} action{weekActions.length === 1 ? "" : "s"}{" "}
          this week arcing inward
        </span>
        {nodes.some((n) => !n.arc) && (
          <span className="text-[11px] tracking-wide text-white/35">
            Unplaced commitments orbit in open space
          </span>
        )}
      </div>

      {commitments.length === 0 && (
        <p className="mt-4 text-[13px] text-white/40">
          No commitments yet —{" "}
          <a href="#/core" className="underline underline-offset-4 hover:text-white/70">
            name them in Core
          </a>{" "}
          and they will settle onto their primitive arcs here.
        </p>
      )}
    </div>
  );
}

/* ----------------------------- VERTICAL ----------------------------- */

function VitalDot({ vitality }) {
  const style =
    vitality === "tended"
      ? { background: "#7ee2a8", boxShadow: "0 0 8px #7ee2a8" }
      : vitality === "quiet"
        ? { background: "rgba(255,255,255,0.35)" }
        : { background: "#b45cff", boxShadow: "0 0 8px #b45cff" };
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={style}
      aria-label={vitality}
    />
  );
}

function VerticalView({ data }) {
  const {
    becoming,
    commitments,
    weekActions,
    weekSparks,
    weekIgnited,
    weekResets,
    weekGoals,
    crowned,
    evidenceCount,
    movement,
    motion,
  } = data;

  const stats = [
    [weekActions.length, "actions logged"],
    [`${weekSparks.length} · ${weekIgnited.length} ignited`, "sparks"],
    [weekResets.length, "resets faced"],
    [weekGoals.length, "goals completed"],
  ];

  return (
    <div>
      <div className="mx-auto max-w-xl">
        {/* the becoming */}
        <section className="axzio-rise axzio-rise-2 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <MicroLabel className="mb-3">The becoming</MicroLabel>
          {becoming ? (
            <p className="text-xl font-light leading-relaxed">
              <span className="text-white/45">Someone who </span>
              <span className="text-[#d8a94e]">{becoming}</span>
            </p>
          ) : (
            <p className="text-[14px] text-white/40">
              No becoming statement yet —{" "}
              <a href="#/core" className="underline underline-offset-4 hover:text-white/70">
                author it in Core
              </a>
              .
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <span className="text-[13px] text-white/55">
              <b className="mr-1 text-lg font-light text-white">{evidenceCount}</b>
              pieces of evidence
            </span>
            <span className="text-[13px] text-white/55">
              <b className="mr-1 text-lg font-light text-white">{commitments.length}</b>
              commitments holding
            </span>
            <span className="text-[13px] text-white/55">
              <b className="mr-1 text-lg font-light text-white">{crowned.length}</b>
              crowned
            </span>
          </div>
        </section>

        <p className="py-2 text-center text-[10px] uppercase tracking-[0.24em] text-[#d8a94e]/70">
          ↑ formed by
        </p>

        {/* commitments */}
        <section className="axzio-rise axzio-rise-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <MicroLabel className="mb-3">Commitments · vitality</MicroLabel>
          {commitments.length === 0 ? (
            <p className="text-[13px] text-white/40">
              No commitments yet —{" "}
              <a href="#/core" className="underline underline-offset-4 hover:text-white/70">
                name them in Core
              </a>
              .
            </p>
          ) : (
            <div>
              {commitments.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 py-1.5">
                  <VitalDot vitality={c.vitality} />
                  <span className="text-[14px] text-white/85">{c.text}</span>
                  {c.primitive && (
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-white/40">
                      {primitiveLabel(c.primitive)}
                    </span>
                  )}
                  <span className="ml-auto shrink-0 text-[11px] tracking-wide text-white/40">
                    {c.vitality === "drifting" ? (
                      <span className="rounded-full border border-[#b45cff]/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#b45cff]">
                        drifting
                      </span>
                    ) : (
                      vitalityMeta(c.vitality, c.lastActive)
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="py-2 text-center text-[10px] uppercase tracking-[0.24em] text-[#d8a94e]/70">
          ↑ fed by
        </p>

        {/* threads in motion */}
        <section className="axzio-rise axzio-rise-4 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <MicroLabel className="mb-3">Threads in motion · last two weeks</MicroLabel>
          {motion.length === 0 ? (
            <p className="text-[13px] text-white/40">
              No thread movement lately —{" "}
              <a href="#/nebula" className="underline underline-offset-4 hover:text-white/70">
                tend a thread in the Nebula
              </a>
              .
            </p>
          ) : (
            <div>
              {motion.map(({ thread, badge, at }) => (
                <div key={thread.id} className="flex items-center gap-2.5 py-1.5">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background: thread.crowned
                        ? "#fff"
                        : STAGE_COLORS[thread.loopStage] || "#9db4ff",
                    }}
                  />
                  <span className="truncate text-[14px] text-white/85">
                    {thread.name}
                  </span>
                  <span className="ml-auto shrink-0 text-[11px] tracking-wide text-[#d8a94e]">
                    {badge} · {relTime(at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <p className="py-2 text-center text-[10px] uppercase tracking-[0.24em] text-[#d8a94e]/70">
          ↑ built from
        </p>

        {/* this week in action */}
        <section className="axzio-rise axzio-rise-5 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <MicroLabel className="mb-3">This week in action</MicroLabel>
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            {stats.map(([v, label]) => (
              <div key={label}>
                <b className="block text-[22px] font-light text-white">{v}</b>
                <span className="text-[12px] text-white/50">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* movement feed */}
      <div className="mx-auto mt-8 max-w-xl border-t border-white/10 pt-5">
        <MicroLabel className="mb-3">Movement · the authorship edits</MicroLabel>
        {movement.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-white/40">
            The journey is quiet — ignite a spark in the Nebula and the
            authorship edits will appear here.
          </p>
        ) : (
          <div>
            {movement.map((m, i) => (
              <div
                key={i}
                className="flex gap-3 border-b border-white/5 py-2 text-[13px]"
              >
                <span className="w-24 shrink-0 pt-0.5 text-[11px] uppercase tracking-[0.08em] text-white/35">
                  {relTime(m.at)}
                </span>
                <span className="text-white/65">{m.text}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
