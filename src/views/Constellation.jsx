import { useMemo, useState } from "react";
import { useAxzio, LOOP_STAGES, RELEASED_STAGE, commitmentText } from "../store.jsx";
import { Card, MicroLabel, Empty, Btn, HelpBubble, HelpText } from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* CONSTELLATION — the journey of a seed through the E3 practice loop   */
/* Reveal → Interpret → Align → Act → Integrate, with a Released branch */
/* for seeds that don't grow. Ignite a star from the Deck; it lands in  */
/* Reveal. Placement is manual: declare, don't guess.                  */
/* ------------------------------------------------------------------ */

const W = 1000;
const H = 640;

/** The five loop waypoints along a gentle arc. */
function stagePos(i) {
  const x = 110 + i * 195;
  const y = 300 - Math.sin((i / 4) * Math.PI) * 90;
  return [x, y];
}
const RELEASED_POS = [500, 540];

/** Cluster offsets for the seeds gathered at one waypoint. */
const SEED_OFFS = [
  [-44, -40],
  [0, -48],
  [44, -40],
  [-44, 42],
  [0, 50],
  [44, 42],
  [-76, -32],
  [76, -32],
  [-76, 38],
  [76, 38],
];
const SEED_SHOW_MAX = 10;

const ALL_STAGES = [...LOOP_STAGES, RELEASED_STAGE];

export default function Constellation() {
  const axzio = useAxzio();
  const { state } = axzio;
  const [selected, setSelected] = useState(null); // {type:'stage',key} | {type:'star',id}

  const stagePoints = useMemo(() => LOOP_STAGES.map((_, i) => stagePos(i)), []);
  const pathD = useMemo(() => {
    const pts = stagePoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);
    return `M${pts.join(" L")}`;
  }, [stagePoints]);

  const starsByStage = useMemo(() => {
    const map = {};
    for (const s of ALL_STAGES) map[s.key] = [];
    for (const star of state.stars) {
      const k = map[star.loopStage] ? star.loopStage : "reveal";
      map[k].push(star);
    }
    return map;
  }, [state.stars]);

  const inLoop = state.stars.filter((s) => s.loopStage !== "released").length;
  const released = state.stars.filter((s) => s.loopStage === "released").length;

  const selectedStage =
    selected?.type === "stage"
      ? ALL_STAGES.find((s) => s.key === selected.key)
      : null;
  const selectedStar =
    selected?.type === "star"
      ? state.stars.find((s) => s.id === selected.id)
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-6">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">Constellation</MicroLabel>
          <HelpBubble title="Constellation" className="mb-2">
            <HelpText
              what="The journey of a seed through the E3 practice loop: Reveal → Interpret → Align → Act → Integrate, with a Released branch for seeds that don't grow."
              why="A seed you can locate is a seed you can tend. The map shows where each one stands — growing, stalled, or released."
              how="Ignite stars from the Command Deck — they land in Reveal. Select a seed to move it along the loop, release it, or explore it in a Guided Reset."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          The Seed Journey
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Follow the seeds you ignite — from spark to understanding,
          placement, planning, and action — until each one roots into your
          legend or is released.
        </p>
        {(inLoop > 0 || released > 0) && (
          <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/40">
            {inLoop} in the loop{released > 0 ? ` · ${released} released` : ""}
          </p>
        )}
      </header>

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* the map */}
        <Card className="axzio-rise axzio-rise-1 relative flex-1 overflow-hidden p-2 md:p-4">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full select-none"
            role="img"
            aria-label="Constellation map of the practice loop"
          >
            {/* the loop's path */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            {/* the released branch */}
            <line
              x1={stagePoints[2][0]}
              y1={stagePoints[2][1]}
              x2={RELEASED_POS[0]}
              y2={RELEASED_POS[1]}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
              strokeDasharray="4 7"
            />
            {/* loop waypoints */}
            {LOOP_STAGES.map((st, i) => {
              const [x, y] = stagePoints[i];
              const isSel = selectedStage?.key === st.key;
              const seeds = starsByStage[st.key];
              return (
                <g key={st.key}>
                  <g
                    onClick={() => setSelected({ type: "stage", key: st.key })}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={x}
                      cy={y}
                      r={isSel ? 28 : 20}
                      fill="rgba(255,255,255,0.06)"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isSel ? 12 : 9}
                      fill="#fff"
                      style={{
                        animation: `axzio-twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.4}s infinite`,
                        filter:
                          "drop-shadow(0 0 10px rgba(255,255,255,0.7))",
                      }}
                    />
                    {isSel && (
                      <circle
                        cx={x}
                        cy={y}
                        r={20}
                        fill="none"
                        stroke="rgba(255,255,255,0.7)"
                        strokeWidth="1"
                      />
                    )}
                    <text
                      x={x}
                      y={y - 34}
                      textAnchor="middle"
                      fill={isSel ? "#fff" : "rgba(255,255,255,0.62)"}
                      fontSize="15"
                      letterSpacing="3"
                      style={{ textTransform: "uppercase" }}
                    >
                      {st.label.toUpperCase()}
                    </text>
                  </g>
                  {seeds.slice(0, SEED_SHOW_MAX).map((s, j) => (
                    <SeedDiamond
                      key={s.id}
                      star={s}
                      x={x + SEED_OFFS[j][0]}
                      y={y + SEED_OFFS[j][1]}
                      selected={selectedStar?.id === s.id}
                      onSelect={() => setSelected({ type: "star", id: s.id })}
                    />
                  ))}
                  {seeds.length > SEED_SHOW_MAX && (
                    <text
                      x={x}
                      y={y + 78}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.4)"
                      fontSize="12"
                      letterSpacing="2"
                    >
                      +{seeds.length - SEED_SHOW_MAX} MORE
                    </text>
                  )}
                </g>
              );
            })}
            {/* released waypoint */}
            <g>
              <g
                onClick={() => setSelected({ type: "stage", key: "released" })}
                className="cursor-pointer"
              >
                <circle
                  cx={RELEASED_POS[0]}
                  cy={RELEASED_POS[1]}
                  r={selectedStage?.key === "released" ? 24 : 17}
                  fill="rgba(255,255,255,0.03)"
                />
                <circle
                  cx={RELEASED_POS[0]}
                  cy={RELEASED_POS[1]}
                  r={7}
                  fill="rgba(255,255,255,0.45)"
                />
                {selectedStage?.key === "released" && (
                  <circle
                    cx={RELEASED_POS[0]}
                    cy={RELEASED_POS[1]}
                    r={17}
                    fill="none"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1"
                  />
                )}
                <text
                  x={RELEASED_POS[0]}
                  y={RELEASED_POS[1] - 30}
                  textAnchor="middle"
                  fill={
                    selectedStage?.key === "released"
                      ? "#fff"
                      : "rgba(255,255,255,0.5)"
                  }
                  fontSize="14"
                  letterSpacing="3"
                  style={{ textTransform: "uppercase" }}
                >
                  RELEASED
                </text>
              </g>
              {starsByStage.released.slice(0, SEED_SHOW_MAX).map((s, j) => (
                <SeedDiamond
                  key={s.id}
                  star={s}
                  x={RELEASED_POS[0] + SEED_OFFS[j][0]}
                  y={RELEASED_POS[1] + SEED_OFFS[j][1]}
                  dim
                  selected={selectedStar?.id === s.id}
                  onSelect={() => setSelected({ type: "star", id: s.id })}
                />
              ))}
            </g>
          </svg>
          <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-white/30">
            Diamonds are seeds you ignited — select one to place it, or
            release it
          </p>
        </Card>

        {/* detail panel */}
        <div className="w-full shrink-0 lg:w-96">
          <Card className="axzio-rise axzio-rise-2 min-h-[320px] p-6">
            {!selectedStage && !selectedStar && (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <MicroLabel className="mb-3">Reading</MicroLabel>
                <p className="max-w-[240px] text-sm leading-relaxed text-white/50">
                  Select a stage — or one of your seeds — to read it.
                </p>
              </div>
            )}
            {selectedStage && (
              <StageDetail
                stage={selectedStage}
                seeds={starsByStage[selectedStage.key]}
                onSelectStar={(id) => setSelected({ type: "star", id })}
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

/** One seed rendered as a small diamond on the map. */
function SeedDiamond({ star, x, y, dim, selected, onSelect }) {
  return (
    <g onClick={onSelect} className="cursor-pointer">
      <path
        d={`M${x},${y - 8} L${x + 2.4},${y - 2.4} L${x + 8},${y} L${x + 2.4},${y + 2.4} L${x},${y + 8} L${x - 2.4},${y + 2.4} L${x - 8},${y} L${x - 2.4},${y - 2.4} Z`}
        fill={selected ? "#fff" : dim ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)"}
        style={{
          animation: `axzio-twinkle 4s ease-in-out ${(x % 3).toFixed(1)}s infinite`,
          filter: dim
            ? "none"
            : "drop-shadow(0 0 8px rgba(255,255,255,0.6))",
        }}
      />
      <text
        x={x}
        y={y + 24}
        textAnchor="middle"
        fill={selected ? "#fff" : "rgba(255,255,255,0.55)"}
        fontSize="12"
        letterSpacing="1.5"
      >
        {star.name.toUpperCase().slice(0, 20)}
      </text>
    </g>
  );
}

function StageDetail({ stage, seeds, onSelectStar, onClose }) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <MicroLabel className="mb-2">Stage</MicroLabel>
          <h3 className="text-2xl font-light uppercase tracking-[0.12em]">
            {stage.label}
          </h3>
        </div>
        <CloseBtn onClose={onClose} />
      </div>
      <p className="text-[15px] leading-relaxed text-white/65">{stage.copy}</p>
      <div className="mt-6 border-t border-white/10 pt-5">
        <MicroLabel className="mb-3">
          Seeds here · {seeds.length}
        </MicroLabel>
        {seeds.length === 0 ? (
          <Empty>
            No seeds here yet — ignite one from the Deck, or move one here.
          </Empty>
        ) : (
          <ul className="space-y-2">
            {seeds.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelectStar(s.id)}
                  className="w-full truncate rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left text-[15px] text-white/85 transition-colors hover:border-white/35"
                >
                  {s.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StarDetail({ star, axzio, onClose }) {
  const [confirm, setConfirm] = useState(false);
  const current =
    ALL_STAGES.find((s) => s.key === star.loopStage) || LOOP_STAGES[0];
  const rootedText = commitmentText(axzio.state, star.commitmentId);

  const exploreInReset = () => {
    if (axzio.requestResetFromStar(star.id)) {
      window.location.hash = "#/journeys";
    }
  };
  const promote = () => {
    const c = axzio.addCommitment(star.name);
    if (c) axzio.linkStarCommitment(star.id, c.id);
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <MicroLabel className="mb-2">Your seed</MicroLabel>
          <h3 className="text-2xl font-light tracking-wide">{star.name}</h3>
        </div>
        <CloseBtn onClose={onClose} />
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

      <div className="mt-6 border-t border-white/10 pt-5">
        <MicroLabel className="mb-3">Place in the loop</MicroLabel>
        <div className="flex flex-wrap gap-2">
          {ALL_STAGES.map((s) => {
            const isSel = star.loopStage === s.key;
            const isReleased = s.key === "released";
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => axzio.setStarLoopStage(star.id, s.key)}
                aria-pressed={isSel}
                title={s.copy}
                className={`rounded-lg border px-3 py-2 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                  isSel
                    ? "border-white/70 bg-white/10 text-white"
                    : isReleased
                      ? "border-dashed border-white/20 text-white/45 hover:border-white/50 hover:text-white"
                      : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          Placement is yours to declare — completing a reset does not move
          the seed on its own.
        </p>
      </div>

      <div className="mt-5">
        <MicroLabel className="mb-3">Root into identity</MicroLabel>
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
        <button
          type="button"
          onClick={exploreInReset}
          className="rounded-lg border border-white/15 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
        >
          Explore in Guided Reset →
        </button>
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          The reset is the mechanism that moves a seed through the loop.
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
