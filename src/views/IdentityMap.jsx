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
/* SYSTEM — the unified galaxy view, living in the Nebula tab. The       */
/* orbit arrangement (Core, primitive arcs, commitments, threads — the   */
/* map) with the sky's logic folded in: select a commitment to isolate + */
/* zoom, select a thread to open it. Vertical keeps the ladder view.     */
/* Not a task list: the journey. Time + action are the distance          */
/* traveled.                                                             */
/* ------------------------------------------------------------------ */

/* Deterministic 0–1 hash so dust placement is stable between renders. */
function hash01(str) {
  let h = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1000) / 1000;
}

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

/* System data: commitments with vitality, threads, the week's action,
   movement feed. */
function useSystemData(state) {
  return useMemo(() => {
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
}

/* SYSTEM — bare (embedded in the Nebula tab). The unified view: orbit
   arrangement + sky logic, with the Vertical ladder one toggle away. */
export function SystemView({ onSelectThread }) {
  const { state } = useAxzio();
  const [view, setView] = useState("orbit"); // 'orbit' | 'vertical'
  const data = useSystemData(state);

  return (
    <div>
      <div className="axzio-rise axzio-rise-1 mb-6 flex flex-wrap items-center gap-3">
        <MicroLabel>System</MicroLabel>
        <HelpBubble title="System">
          <HelpText
            what="Your solar system, condensed from your nebula: the Core star at the center, commitments as planets on their primitive arcs, threads orbiting."
            why="The system at a glance: am I becoming who I said I am? Drift is shown honestly — a dimmed commitment is an invitation, not a failure."
            how="Select a commitment to isolate its sky. Select a thread to open it. Vertical reads the same system as a ladder, action by action."
          />
        </HelpBubble>
        <div className="ml-auto inline-flex rounded-full border border-white/10 p-1">
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
      </div>

      {view === "orbit" ? (
        <OrbitView data={data} state={state} onSelectThread={onSelectThread} />
      ) : (
        <VerticalView data={data} />
      )}
    </div>
  );
}

export default SystemView;

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

function OrbitView({ data, state, onSelectThread }) {
  const { becoming, commitments, threads, weekActions } = data;
  const nodes = useMemo(() => orbitCommitmentNodes(commitments), [commitments]);
  const nodeById = useMemo(
    () => new Map(nodes.map((n) => [n.c.id, n])),
    [nodes]
  );
  const [focusId, setFocusId] = useState(null); // isolated commitment
  const focusNode = focusId ? nodeById.get(focusId) : null;
  const ZOOM = 1.8;
  const zoomStyle = focusNode
    ? {
        transform: `translate(${CX}px, ${CY}px) scale(${ZOOM}) translate(${-focusNode.x}px, ${-focusNode.y}px)`,
        transformOrigin: "0 0",
        transition: "transform 0.65s cubic-bezier(0.22,1,0.36,1)",
      }
    : { transition: "transform 0.65s cubic-bezier(0.22,1,0.36,1)" };

  // Unignited sparks hang as dust — pure atmosphere, not selectable.
  const dust = (state.signals || [])
    .filter((sg) => sg && !sg.ignited)
    .slice(-12);

  const streaks = useMemo(() => {
    const n = Math.min(weekActions.length, 10);
    return Array.from({ length: n }, (_, j) => {
      const deg = -90 + (j + 0.5) * (360 / Math.max(n, 1));
      const [x0, y0] = pt(R_IN, deg);
      const [x1, y1] = pt(R_IN - 34, deg);
      return { x0, y0, x1, y1, key: j };
    });
  }, [weekActions.length]);

  const threadPts = threads.map((t, j) => {
    const deg = -90 + j * (360 / Math.max(threads.length, 1));
    const [x, y] = pt(R_THREAD, deg);
    return { t, x, y, dimmed: !!(focusId && t.commitmentId !== focusId) };
  });

  const toggleFocus = (id) => setFocusId((cur) => (cur === id ? null : id));
  const blines = becoming ? becomingLines(becoming) : [];

  return (
    <div className="axzio-rise axzio-rise-2">
      {/* commitment selector — isolate a commitment to focus its seeds */}
      {commitments.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFocusId(null)}
            className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${
              !focusId
                ? "border-white/60 text-white"
                : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
            }`}
          >
            All
          </button>
          {commitments.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleFocus(c.id)}
              aria-pressed={focusId === c.id}
              className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                focusId === c.id
                  ? "border-[#d8a94e] text-[#d8a94e]"
                  : "border-white/15 text-white/45 hover:border-white/40 hover:text-white"
              }`}
            >
              {(c.text || "").slice(0, 24)}
            </button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden">
        <svg
          viewBox="0 0 900 660"
          role="img"
          aria-label="System orbit view"
          className="h-auto w-full select-none"
        >
          <defs>
            <radialGradient id="imap-core-glow">
              <stop offset="0%" stopColor="#d8a94e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#d8a94e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sys-dustV">
              <stop offset="0%" stopColor="#6d5bd0" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6d5bd0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sys-dustT">
              <stop offset="0%" stopColor="#2e8f9e" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#2e8f9e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sys-dustI">
              <stop offset="0%" stopColor="#3b4a8f" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b4a8f" stopOpacity="0" />
            </radialGradient>
          </defs>

          <g style={zoomStyle}>
            {/* dust clouds */}
            <g
              pointerEvents="none"
              opacity={focusId ? 0.25 : 1}
              style={{ transition: "opacity 0.5s" }}
            >
              {dust.map((sg, i) => {
                const dx = 60 + hash01(sg.id + ":dx") * 780;
                const dy = 60 + hash01(sg.id + ":dy") * 540;
                const dr = 70 + hash01(sg.id + ":dr") * 90;
                const grad = ["url(#sys-dustV)", "url(#sys-dustT)", "url(#sys-dustI)"][i % 3];
                return (
                  <ellipse
                    key={sg.id}
                    cx={dx}
                    cy={dy}
                    rx={dr}
                    ry={dr * 0.62}
                    fill={grad}
                    opacity="0.34"
                  />
                );
              })}
            </g>

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

            {/* threads — select one to open it */}
            <g>
              {threadPts.map(({ t, x, y, dimmed }) => {
                const color = t.crowned
                  ? "#ffffff"
                  : STAGE_COLORS[t.loopStage] || "#9db4ff";
                return (
                  <g
                    key={t.id}
                    onClick={() => onSelectThread && onSelectThread(t.id)}
                    className="cursor-pointer"
                    opacity={dimmed ? 0.07 : 1}
                    style={{ transition: "opacity 0.45s" }}
                  >
                    <title>{`${t.name} — ${stageLabel(t.loopStage)}${t.crowned ? " · crowned" : ""}`}</title>
                    <circle
                      cx={x}
                      cy={y}
                      r={t.crowned ? 8 : 6}
                      fill={t.crowned ? "#0a0a10" : color}
                      stroke={color}
                      strokeWidth="1.6"
                      opacity={dimmed ? 0.6 : 0.9}
                      style={
                        t.crowned && !dimmed
                          ? { filter: "drop-shadow(0 0 10px #ffffff)" }
                          : undefined
                      }
                    />
                    {!dimmed && (
                      <text
                        x={x}
                        y={y < CY ? y - 14 : y + 22}
                        textAnchor="middle"
                        fontSize="11"
                        fill="rgba(255,255,255,0.72)"
                      >
                        {t.name.length > 20 ? t.name.slice(0, 19) + "…" : t.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>

            {/* commitments on their arcs — select to isolate */}
            <g>
              {nodes.map(({ c, x, y }) => {
                const v = c.vitality;
                const stroke =
                  v === "tended"
                    ? "#d8a94e"
                    : v === "quiet"
                      ? "rgba(255,255,255,0.35)"
                      : "#b45cff";
                const active = !focusId || focusId === c.id;
                return (
                  <g
                    key={c.id}
                    onClick={() => toggleFocus(c.id)}
                    className="cursor-pointer"
                    opacity={active ? (v === "drifting" ? 0.75 : 1) : 0.08}
                    style={{ transition: "opacity 0.45s" }}
                  >
                    <title>{`${c.text}${c.primitive ? ` — ${primitiveLabel(c.primitive)}` : " — unplaced"} · ${vitalityMeta(v, c.lastActive)}`}</title>
                    <circle
                      cx={x}
                      cy={y}
                      r="13"
                      fill="#050508"
                      stroke={focusId === c.id ? "#fff" : stroke}
                      strokeWidth="1.6"
                      style={
                        v === "tended"
                          ? { filter: "drop-shadow(0 0 10px #d8a94e)" }
                          : v === "drifting"
                            ? { filter: "drop-shadow(0 0 8px #b45cff)" }
                            : undefined
                      }
                    />
                    {active && (
                      <text
                        x={x}
                        y={y - 20}
                        textAnchor="middle"
                        fontSize="12"
                        fill="rgba(255,255,255,0.8)"
                      >
                        {c.text.length > 22 ? c.text.slice(0, 21) + "…" : c.text}
                      </text>
                    )}
                    {v === "drifting" && active && (
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
          </g>
        </svg>

        {focusNode && (
          <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-3 rounded-full border border-[#d8a94e]/40 bg-black/85 py-1.5 pl-4 pr-1.5 text-[11px] tracking-[0.14em] uppercase">
            <span className="text-[#d8a94e]">
              Isolated · {(focusNode.c.text || "").slice(0, 28)}
            </span>
            <button
              type="button"
              onClick={() => setFocusId(null)}
              className="rounded-full border border-white/15 px-3 py-1 text-white/70 hover:border-white/40 hover:text-white"
            >
              All
            </button>
          </div>
        )}
      </div>

      <p className="mt-2 px-1 text-[10px] uppercase tracking-[0.24em] text-white/30">
        {focusId
          ? "Isolated — select the commitment again, or All, to return"
          : "Select a commitment to isolate its sky · select a thread to open it · dust is unignited sparks"}
      </p>

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
