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

      {/* lifemods — designed life changes */}
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-4">
          <MicroLabel>LifeMods</MicroLabel>
          <HelpBubble title="LifeMods">
            <HelpText
              what="A LifeMod is a designed life change — a seed that matured, or a friction named directly."
              why="A LifeMod does not ask 'How do I force myself to comply?' It asks 'What could I change so the next aligned action becomes clearer?'"
              how="Grow one from a seed (its detail card), or name a friction below. Give it a legend function, work its Becoming Cycle, archive it when it is installed — or delete it when it no longer serves."
            />
          </HelpBubble>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <LifeModsSection />
      </section>
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
        <div className="mb-3 flex items-center gap-2">
          <MicroLabel>Place in the loop</MicroLabel>
          <HelpBubble title="Place in the loop">
            <HelpText
              what="Where this seed stands in the E3 practice loop — you declare it, the app doesn't guess."
              why="A seed gains mass each orbit: completing Integrate returns it to Reveal, further developed. Placement you declare stays honest."
              how="Move the seed as it matures. Released is a real branch, not a failure — a seed let go on purpose."
            />
          </HelpBubble>
        </div>
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
