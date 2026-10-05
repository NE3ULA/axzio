import { useMemo, useState } from "react";
import {
  useAxzio,
  localDateKey,
  getDayState,
  actionsOn,
  signalsOn,
  computeStreak,
  formatLongDate,
  formatTime,
} from "../store.jsx";
import { Card, MicroLabel, Pill, Empty, Btn, HelpBubble, HelpText } from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* CONSTELLATION — the 8 stages of the NE3ULA flow as a navigable map    */
/* CALL/SIGNAL → INITIATION → WORLD → ENGINE → INTERFACE → DOMAINS →     */
/* SYSTEMS → LEGEND                                                      */
/* ------------------------------------------------------------------ */

const STAGES = [
  {
    key: "call",
    name: "Call / Signal",
    desc: "The originating impulse — a signal from the world, or from within, that something must move. Every journey in this system begins as a call.",
  },
  {
    key: "initiation",
    name: "Initiation",
    desc: "Crossing the threshold. The participant commits to the path; the old frame loosens and the authored identity takes the helm.",
  },
  {
    key: "world",
    name: "World",
    desc: "Meaning and narrative — the cosmology, myth, and lore that give the journey its shape. The four anchors are practiced here, daily.",
  },
  {
    key: "engine",
    name: "Engine",
    desc: "Transformation mechanics. The E3 human engine reads identity, primitives, and patterns — stabilizing ground before higher-order work.",
  },
  {
    key: "interface",
    name: "Interface",
    desc: "AXZIO itself — the navigation layer where signal becomes structure. The command deck, this constellation, the journeys.",
  },
  {
    key: "domains",
    name: "Domains",
    desc: "Creative expression — music, mythwear, artifacts. Identity made tangible in the world. Your orbiting stars live here.",
  },
  {
    key: "systems",
    name: "Systems",
    desc: "Participation infrastructure — the forge, the artifact system, the rails that let others build and belong.",
  },
  {
    key: "legend",
    name: "Legend",
    desc: "The lived outcome. A legend is not declared; it is accumulated — one aligned action at a time.",
  },
];

const W = 1000;
const H = 620;
const CX = 500;
const CY = 300;

function stagePos(i) {
  const rx = 350;
  const ry = 205;
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / STAGES.length;
  return [CX + rx * Math.cos(a), CY + ry * Math.sin(a)];
}

export default function Constellation() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [selected, setSelected] = useState(null); // {type:'stage',key} | {type:'star',id}

  const stagePoints = useMemo(() => STAGES.map((_, i) => stagePos(i)), []);
  const pathD = useMemo(() => {
    const pts = stagePoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);
    return `M${pts.join(" L")} Z`;
  }, [stagePoints]);

  // user stars on a wider orbit, spread evenly
  const starNodes = useMemo(
    () =>
      state.stars.map((s, i) => {
        const rx = 448;
        const ry = 268;
        const a =
          -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(state.stars.length, 1) + 0.35;
        return { ...s, x: CX + rx * Math.cos(a), y: CY + ry * Math.sin(a) };
      }),
    [state.stars]
  );

  const selectedStage = selected?.type === "stage"
    ? STAGES.find((s) => s.key === selected.key)
    : null;
  const selectedStar = selected?.type === "star"
    ? state.stars.find((s) => s.id === selected.id)
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-6">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">Constellation</MicroLabel>
          <HelpBubble title="Constellation" className="mb-2">
            <HelpText
              what="The system's eight stages — Call/Signal through Legend — rendered as a navigable sky, plus your own orbiting stars."
              why="A map lets you locate where you are in the larger movement instead of mistaking one stage for the whole journey."
              how="Select a stage to read it and see what of yours lives there. Ignite stars from the Command Deck."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          The Eight Stages
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          The conceptual flow of the system, rendered as a navigable sky.
          Select a stage to read it — and to see what of yours lives there.
        </p>
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* the map */}
        <Card className="axzio-rise axzio-rise-1 relative flex-1 overflow-hidden p-2 md:p-4">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Constellation map of the eight NE3ULA stages"
          >
            {/* orbit ring for user stars */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={448}
              ry={268}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray="3 8"
            />
            {/* the flow line through the eight stages */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            {/* stage nodes */}
            {STAGES.map((st, i) => {
              const [x, y] = stagePoints[i];
              const isSel = selectedStage?.key === st.key;
              return (
                <g
                  key={st.key}
                  onClick={() => setSelected({ type: "stage", key: st.key })}
                  className="cursor-pointer"
                >
                  <circle cx={x} cy={y} r={isSel ? 26 : 18} fill="rgba(255,255,255,0.06)" />
                  <circle
                    cx={x}
                    cy={y}
                    r={isSel ? 11 : 8}
                    fill="#fff"
                    style={{
                      animation: `axzio-twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
                      filter: "drop-shadow(0 0 10px rgba(255,255,255,0.7))",
                    }}
                  />
                  {isSel && (
                    <circle
                      cx={x}
                      cy={y}
                      r={18}
                      fill="none"
                      stroke="rgba(255,255,255,0.7)"
                      strokeWidth="1"
                    />
                  )}
                  <text
                    x={x}
                    y={y + 34}
                    textAnchor="middle"
                    fill={isSel ? "#fff" : "rgba(255,255,255,0.62)"}
                    fontSize="15"
                    letterSpacing="3"
                    style={{ textTransform: "uppercase" }}
                  >
                    {st.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
            {/* user stars */}
            {starNodes.map((s) => {
              const isSel = selectedStar?.id === s.id;
              return (
                <g
                  key={s.id}
                  onClick={() => setSelected({ type: "star", id: s.id })}
                  className="cursor-pointer"
                >
                  <path
                    d={`M${s.x},${s.y - 9} L${s.x + 2.6},${s.y - 2.6} L${s.x + 9},${s.y} L${s.x + 2.6},${s.y + 2.6} L${s.x},${s.y + 9} L${s.x - 2.6},${s.y + 2.6} L${s.x - 9},${s.y} L${s.x - 2.6},${s.y - 2.6} Z`}
                    fill={isSel ? "#fff" : "rgba(255,255,255,0.85)"}
                    style={{
                      animation: `axzio-twinkle 4s ease-in-out ${(s.x % 3).toFixed(1)}s infinite`,
                      filter: "drop-shadow(0 0 8px rgba(255,255,255,0.6))",
                    }}
                  />
                  <text
                    x={s.x}
                    y={s.y + 26}
                    textAnchor="middle"
                    fill={isSel ? "#fff" : "rgba(255,255,255,0.55)"}
                    fontSize="13"
                    letterSpacing="2"
                  >
                    {s.name.toUpperCase().slice(0, 24)}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-white/30">
            Diamonds in wide orbit are stars you ignited from the deck
          </p>
        </Card>

        {/* detail panel */}
        <div className="w-full shrink-0 lg:w-96">
          <Card className="axzio-rise axzio-rise-2 min-h-[320px] p-6">
            {!selectedStage && !selectedStar && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <MicroLabel className="mb-3">Reading</MicroLabel>
                <p className="max-w-[240px] text-sm leading-relaxed text-white/50">
                  Select a stage — or one of your orbiting stars — to read it.
                </p>
              </div>
            )}
            {selectedStage && (
              <StageDetail
                stage={selectedStage}
                axzio={axzio}
                onClose={() => setSelected(null)}
              />
            )}
            {selectedStar && (
              <StarDetail
                star={selectedStar}
                axzio={axzio}
                onClose={() => setSelected(null)}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function StageDetail({ stage, axzio, onClose }) {
  const { state } = axzio;
  const today = localDateKey();
  const day = getDayState(state, today);
  const readings = stageReadings(stage.key, state, day, today);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <MicroLabel className="mb-2">Stage</MicroLabel>
          <h3 className="text-2xl font-light uppercase tracking-[0.12em]">
            {stage.name}
          </h3>
        </div>
        <CloseBtn onClose={onClose} />
      </div>
      <p className="text-[15px] leading-relaxed text-white/65">{stage.desc}</p>
      <div className="mt-6 border-t border-white/10 pt-5">
        <MicroLabel className="mb-3">What lives here</MicroLabel>
        {readings.length === 0 ? (
          <Empty>Nothing of yours here yet.</Empty>
        ) : (
          <ul className="space-y-2.5">
            {readings.map((r, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <span className="text-white/60">{r.label}</span>
                <span className="text-right font-medium tracking-wide">
                  {r.value}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Per-stage "related user data" — the map reads back the user's state. */
function stageReadings(key, state, day, today) {
  const todaysActions = actionsOn(state, today);
  const todaysSignals = signalsOn(state, today);
  const latestAssessment = state.assessments[state.assessments.length - 1];
  const mantraDone = ["gratitude", "beauty", "action", "love"].filter(
    (k) => day.mantra[k]
  ).length;

  switch (key) {
    case "call":
      return [
        { label: "Signals today", value: String(todaysSignals.length) },
        {
          label: "Latest signal",
          value: todaysSignals.length
            ? `“${truncate(todaysSignals[todaysSignals.length - 1].text, 42)}”`
            : "—",
        },
      ];
    case "initiation":
      return [
        {
          label: "Identity",
          value: state.identity.setupComplete ? "Authored" : "Not yet authored",
        },
        { label: "Traveler", value: state.identity.name || "—" },
      ];
    case "world":
      return [
        { label: "Anchors held today", value: `${mantraDone} / 4` },
        {
          label: "Today's intention",
          value: day.intention ? `“${truncate(day.intention, 42)}”` : "—",
        },
      ];
    case "engine": {
      if (!latestAssessment)
        return [{ label: "Assessment", value: "None recorded yet" }];
      const entries = [
        ["money", latestAssessment.money],
        ["engagement", latestAssessment.engagement],
        ["building", latestAssessment.building],
        ["being", latestAssessment.being],
      ];
      const [lowKey, lowVal] = entries.reduce((a, b) => (a[1] <= b[1] ? a : b));
      return [
        { label: "Last assessed", value: formatLongDate(latestAssessment.date) },
        { label: "Lowest primitive", value: `${cap(lowKey)} · ${lowVal}/10` },
        { label: "Assessments total", value: String(state.assessments.length) },
      ];
    }
    case "interface":
      return [
        { label: "Actions today", value: String(todaysActions.length) },
        { label: "Actions total", value: String(state.actions.length) },
      ];
    case "domains":
      return [
        { label: "Stars in orbit", value: String(state.stars.length) },
        {
          label: "Newest star",
          value: state.stars.length
            ? state.stars[state.stars.length - 1].name
            : "—",
        },
      ];
    case "systems":
      return [
        { label: "Signals total", value: String(state.signals.length) },
        {
          label: "Latest",
          value: state.signals.length
            ? formatTime(state.signals[state.signals.length - 1].ts)
            : "—",
        },
      ];
    case "legend":
      return [
        { label: "Day streak", value: String(computeStreak(state)) },
        { label: "Actions total", value: String(state.actions.length) },
      ];
    default:
      return [];
  }
}

function StarDetail({ star, axzio, onClose }) {
  const [confirm, setConfirm] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <MicroLabel className="mb-2">Your star</MicroLabel>
          <h3 className="text-2xl font-light tracking-wide">{star.name}</h3>
        </div>
        <CloseBtn onClose={onClose} />
      </div>
      {star.note ? (
        <p className="text-[15px] leading-relaxed text-white/65">{star.note}</p>
      ) : (
        <p className="text-[15px] leading-relaxed text-white/40">
          No note attached to this star.
        </p>
      )}
      <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-white/35">
        Ignited {new Date(star.created).toLocaleDateString()}
      </p>
      <div className="mt-6 border-t border-white/10 pt-5">
        {!confirm ? (
          <Btn
            variant="quiet"
            onClick={() => setConfirm(true)}
            className="px-0"
          >
            Extinguish this star
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

function truncate(s, n) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
