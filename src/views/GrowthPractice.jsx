import { useEffect, useMemo, useState } from "react";
import {
  useAxzio,
  uid,
  growthSourceInfo,
  sortedCommitments,
  LIFEMOD_PLAIN_TYPES,
  lifemodPlainTypeLabel,
  formatLongDate,
} from "../store.jsx";
import {
  Card,
  MicroLabel,
  Btn,
  Field,
  TextArea,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";
import { GoalScheduleEditor } from "../components/GoalCapture.jsx";

/* ------------------------------------------------------------------ */
/* GROWTH PRACTICE — the "how" practice. The Reset ends in a decision  */
/* (Action Card); the Growth Practice ends in structure: goals,       */
/* habits, LifeMods, and focus items written into the system, plus a   */
/* Growth Card recording what was built. Staged, then built.           */
/* ------------------------------------------------------------------ */

const GROWTH_STEPS = [
  {
    id: "gpursuit",
    title: "Name the pursuit",
    prompt: "What are you growing? One pursuit — a goal to reach or a habit to keep.",
    help: {
      title: "Name the pursuit",
      what: "The single goal or habit this practice designs. Everything built here hangs off it.",
      why: "A practice works on one pursuit. Pick an existing one to deepen it, or name a new one to build it well from the start.",
      how: "Choose goal or habit, name it, and place it inside the commitment it serves — a pursuit never floats free.",
    },
  },
  {
    id: "goutcome",
    title: "Clarify the outcome",
    prompt: "What does done — or kept — actually look like? Describe it concretely, no vague.",
    help: {
      title: "Clarify the outcome",
      what: "The finished picture: what 'done' means for a goal, what 'kept' means for a habit.",
      why: "Vague pursuits produce vague effort. If you can't picture it, you can't plan it.",
      example: "“Inbox at zero every Friday by 5pm” — not “stay on top of email”.",
    },
  },
  {
    id: "gpath",
    title: "Design the path",
    prompt: "How does this unfold over time?",
    help: {
      title: "Design the path",
      what: "Goals get milestones — the waypoints on the way to done. Habits get a rhythm — and an evolution plan, if the habit deepens over time.",
      why: "A pursuit without a path is a wish. Milestones turn a goal into a roadmap; a rhythm turns a habit into a practice.",
      how: "Add each milestone as you think of it. For habits, set the weekly rhythm, then say how the habit evolves — does it grow, deepen, or expand?",
    },
  },
  {
    id: "gcapacity",
    title: "Check your capacity",
    prompt: "Do you have what this takes — and what would grow what you don't?",
    help: {
      title: "Check your capacity",
      what: "An honest read of your energy and what you have for this pursuit — then the builders: the smaller goals, habits, or tasks that would grow your capacity.",
      why: "Most pursuits fail on capacity, not desire. Naming what's missing turns it into a roadmap instead of a wall.",
      how: "Mark what you have. Anything missing becomes a capacity builder — a child of this pursuit, built in the final step.",
    },
  },
  {
    id: "gcontainer",
    title: "Set the container",
    prompt: "When and where does this live? Name the blocks, triggers, or setups that will hold it.",
    help: {
      title: "Set the container",
      what: "The time and place the pursuit occupies — calendar blocks, triggers, environment setups.",
      why: "A pursuit without a container loses to everything with one. Decide where it lives before the week decides for you.",
      example: "“Tuesday/Thursday 7am — garage gym” or “Review queue every Friday after standup”.",
    },
  },
  {
    id: "gfriction",
    title: "Name the friction",
    prompt: "What will get in the way? Name each obstacle — and where a condition change would remove it, make it a LifeMod.",
    help: {
      title: "Name the friction",
      what: "The practical obstacles between you and the pursuit — lighter than the Reset's friction check, aimed at removal.",
      why: "Obstacles named early can be designed around. Where the fix is a condition change rather than effort, it becomes a LifeMod.",
      how: "List each obstacle. Toggle 'Make LifeMod' where the answer is changing the setup, not trying harder.",
    },
  },
  {
    id: "gfirststep",
    title: "First step",
    prompt: "The smallest start — something doable within 48 hours.",
    help: {
      title: "First step",
      what: "One concrete action that starts the pursuit within two days.",
      why: "A designed pursuit that doesn't start is still a wish. The first step goes straight into Focus.",
      example: "“Text Maya asking for the intro” — not “start networking”.",
    },
  },
  {
    id: "gcommit",
    title: "Commit & review",
    prompt: "Say the commitment in plain words — then set when you'll review it.",
    help: {
      title: "Commit & review",
      what: "The vow — your words for what you're committing to — and a review date that closes the loop.",
      why: "Stating it makes it real; the review date makes it durable. The next step builds everything you designed.",
      how: "Write the vow as you'd say it aloud. The review date lands in Reviews due, like a reset's.",
    },
  },
];

const ENERGY_OPTS = [
  { key: "low", label: "Low" },
  { key: "okay", label: "Okay" },
  { key: "high", label: "High" },
];
const CAPACITY_DIMS = [
  { key: "time", label: "Time" },
  { key: "energy", label: "Energy" },
  { key: "skill", label: "Skill" },
  { key: "support", label: "Support" },
];
const BUILDER_KINDS = [
  { key: "goal", label: "Goal" },
  { key: "habit", label: "Habit" },
  { key: "task", label: "Task" },
];

function blankGrowthScratch() {
  return {
    gsubjectKind: "goal",
    gsubjectId: null,
    gsubjectName: "",
    gcommitmentId: "",
    goutcome: "",
    ghorizon: "",
    gschedule: null,
    gevolution: "",
    gmilestones: [],
    genergy: null,
    gcapacity: { time: false, energy: false, skill: false, support: false },
    gcapacityNotes: "",
    gbuilders: [],
    gcontainers: [],
    gfrictions: [],
    gfirstStep: "",
    gvow: "",
    greviewDate: "",
  };
}

/** Prefill a fresh scratch from the launch source's live data. */
export function prefillGrowthScratch(state, sourceKind, sourceId) {
  const sc = blankGrowthScratch();
  const info = growthSourceInfo(state, sourceKind, sourceId);
  if (!info) return sc;
  if (info.subjectKind) {
    sc.gsubjectKind = info.subjectKind;
    sc.gsubjectId = info.subjectId;
  }
  sc.gsubjectName = info.name || "";
  sc.gcommitmentId = info.commitmentId || "";
  if (info.subjectKind === "goal") {
    const g = (state.goals || []).find((x) => x.id === info.subjectId);
    if (g && g.horizon) sc.ghorizon = g.horizon;
  }
  if (info.subjectKind === "habit") {
    const h = (state.habits || []).find((x) => x.id === info.subjectId);
    if (h) {
      if (h.schedule) sc.gschedule = h.schedule;
      if (h.evolutionNote) sc.gevolution = h.evolutionNote;
    }
  }
  return sc;
}

function relativeTime(ts) {
  const s = Math.max(0, (Date.now() - (ts || 0)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/* Small list editor: type + Add, rows with remove. */
function ListEditor({ items, onAdd, onRemove, placeholder, addLabel = "Add" }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    onAdd(t);
    setText("");
  };
  return (
    <div>
      {items.length > 0 && (
        <ul className="mb-3 space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5"
            >
              <span className="min-w-0 flex-1 text-[14px] leading-snug text-white/85">
                {it.text}
              </span>
              <button
                type="button"
                onClick={() => onRemove(it.id)}
                className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Field
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Btn onClick={add} disabled={!text.trim()}>
          {addLabel}
        </Btn>
      </div>
    </div>
  );
}

/* ---------------- Step bodies ---------------- */

function CommitmentPicker({ value, onChange }) {
  const axzio = useAxzio();
  const commitments = sortedCommitments(axzio.state);
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-white/50"
    >
      <option value="">Serves commitment… (required)</option>
      {commitments.map((c) => (
        <option key={c.id} value={c.id}>
          {c.text}
        </option>
      ))}
    </select>
  );
}

function PursuitStep({ scratch, setScratch, sourceKind }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const fixed = sourceKind === "goal" || sourceKind === "habit";
  const goals = (state.goals || []).filter((g) => g && !g.done);
  const habits = (state.habits || []).filter((h) => h && h.active !== false);

  const pickExisting = (id) => {
    if (!id) {
      // Back to a new pursuit.
      setScratch((s) => ({
        ...s,
        gsubjectId: null,
        gsubjectName: "",
        gcommitmentId: "",
        ghorizon: "",
        gschedule: null,
        gevolution: "",
      }));
      return;
    };
    const g = goals.find((x) => x.id === id);
    const h = habits.find((x) => x.id === id);
    const found = g
      ? { kind: "goal", item: g }
      : h
        ? { kind: "habit", item: h }
        : null;
    if (!found) return;
    setScratch((s) => ({
      ...s,
      gsubjectKind: found.kind,
      gsubjectId: found.item.id,
      gsubjectName: found.item.text,
      gcommitmentId: found.item.commitmentId || "",
      ghorizon:
        found.kind === "goal" ? found.item.horizon || "" : s.ghorizon,
      gschedule:
        found.kind === "habit" ? found.item.schedule || null : s.gschedule,
      gevolution:
        found.kind === "habit"
          ? found.item.evolutionNote || ""
          : s.gevolution,
    }));
  };

  return (
    <div className="space-y-5">
      {!fixed && (
        <div>
          <div className="mb-2 flex gap-2">
            {(["goal", "habit"]).map((k) => (
              <button
                key={k}
                type="button"
                disabled={!!scratch.gsubjectId}
                onClick={() =>
                  setScratch((s) => ({ ...s, gsubjectKind: k, gsubjectId: null }))
                }
                className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors disabled:opacity-40 ${
                  scratch.gsubjectKind === k
                    ? "bg-white/10 text-white"
                    : "text-white/45 hover:text-white"
                }`}
              >
                {k === "goal" ? "New goal" : "New habit"}
              </button>
            ))}
          </div>
          <select
            value={scratch.gsubjectId || ""}
            onChange={(e) => pickExisting(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white outline-none transition-colors focus:border-white/50"
          >
            <option value="">…or grow an existing goal/habit</option>
            <optgroup label="Goals">
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.text}
                </option>
              ))}
            </optgroup>
            <optgroup label="Habits">
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.text}
                </option>
              ))}
            </optgroup>
          </select>
          <p className="mt-2 text-[12px] leading-relaxed text-white/35">
            Picking an existing pursuit deepens it instead of duplicating it —
            its rhythm, horizon, and links carry over.
          </p>
        </div>
      )}
      {fixed && (
        <p className="text-[12px] uppercase tracking-[0.2em] text-white/40">
          Growing the {scratch.gsubjectKind}: refine its name below
        </p>
      )}
      <Field
        value={scratch.gsubjectName}
        onChange={(e) =>
          setScratch((s) => ({ ...s, gsubjectName: e.target.value }))
        }
        placeholder={
          scratch.gsubjectKind === "goal"
            ? "The outcome — e.g. Launch the portfolio site"
            : "The practice — e.g. Write 500 words"
        }
        maxLength={80}
      />
      <div>
        <MicroLabel className="mb-2">Serves commitment</MicroLabel>
        <CommitmentPicker
          value={scratch.gcommitmentId}
          onChange={(v) => setScratch((s) => ({ ...s, gcommitmentId: v }))}
        />
      </div>
    </div>
  );
}

function OutcomeStep({ scratch, setScratch }) {
  return (
    <div className="space-y-5">
      <TextArea
        value={scratch.goutcome}
        onChange={(e) =>
          setScratch((s) => ({ ...s, goutcome: e.target.value }))
        }
        placeholder={
          scratch.gsubjectKind === "goal"
            ? "Done looks like…"
            : "Kept looks like…"
        }
        rows={4}
      />
      {scratch.gsubjectKind === "goal" && (
        <div>
          <MicroLabel className="mb-2">Horizon — the done-by date</MicroLabel>
          <Field
            type="date"
            value={scratch.ghorizon}
            onChange={(e) =>
              setScratch((s) => ({ ...s, ghorizon: e.target.value }))
            }
          />
        </div>
      )}
    </div>
  );
}

function PathStep({ scratch, setScratch }) {
  const isHabit = scratch.gsubjectKind === "habit";
  return (
    <div className="space-y-6">
      {isHabit ? (
        <>
          <div>
            <MicroLabel className="mb-2">The rhythm</MicroLabel>
            <GoalScheduleEditor
              value={scratch.gschedule}
              onChange={(v) => setScratch((s) => ({ ...s, gschedule: v }))}
            />
          </div>
          <div>
            <MicroLabel className="mb-2">
              Evolution — does this habit grow over time?
            </MicroLabel>
            <TextArea
              value={scratch.gevolution}
              onChange={(e) =>
                setScratch((s) => ({ ...s, gevolution: e.target.value }))
              }
              placeholder="If so, how — and what does that look like? e.g. Start 10 min; grow to 20 after two weeks; add weekends in month two."
              rows={3}
            />
            <p className="mt-2 text-[12px] leading-relaxed text-white/35">
              Habits are rarely static. Naming the evolution now means the
              practice grows with you instead of going stale.
            </p>
          </div>
        </>
      ) : (
        <div>
          <MicroLabel className="mb-2">
            Milestones — the waypoints to done
          </MicroLabel>
          <ListEditor
            items={scratch.gmilestones}
            onAdd={(text) =>
              setScratch((s) => ({
                ...s,
                gmilestones: [...s.gmilestones, { id: uid(), text }],
              }))
            }
            onRemove={(id) =>
              setScratch((s) => ({
                ...s,
                gmilestones: s.gmilestones.filter((m) => m.id !== id),
              }))
            }
            placeholder="A milestone on the way…"
            addLabel="Add milestone"
          />
          <p className="mt-2 text-[12px] leading-relaxed text-white/35">
            Each milestone becomes a child goal of this pursuit — the roadmap,
            built in the final step.
          </p>
        </div>
      )}
    </div>
  );
}

function CapacityStep({ scratch, setScratch }) {
  const cap = scratch.gcapacity || {};
  const toggleDim = (k) =>
    setScratch((s) => ({
      ...s,
      gcapacity: { ...s.gcapacity, [k]: !s.gcapacity[k] },
    }));
  return (
    <div className="space-y-6">
      <div>
        <MicroLabel className="mb-2">Your energy for this, right now</MicroLabel>
        <div className="flex gap-2">
          {ENERGY_OPTS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setScratch((s) => ({ ...s, genergy: o.key }))}
              className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                scratch.genergy === o.key
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <MicroLabel className="mb-2">What do you have for this?</MicroLabel>
        <div className="flex flex-wrap gap-2">
          {CAPACITY_DIMS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => toggleDim(d.key)}
              aria-pressed={!!cap[d.key]}
              className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
                cap[d.key]
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <MicroLabel className="mb-2">
          What would grow your capacity?
        </MicroLabel>
        <TextArea
          value={scratch.gcapacityNotes}
          onChange={(e) =>
            setScratch((s) => ({ ...s, gcapacityNotes: e.target.value }))
          }
          placeholder="What's missing, and what would build it…"
          rows={2}
        />
      </div>
      <CapacityBuilders scratch={scratch} setScratch={setScratch} />
    </div>
  );
}

function CapacityBuilders({ scratch, setScratch }) {
  const [text, setText] = useState("");
  const [kind, setKind] = useState("goal");
  const [schedule, setSchedule] = useState(null);
  const add = () => {
    const t = text.trim();
    if (!t) return;
    if (kind === "habit" && !schedule) return;
    setScratch((s) => ({
      ...s,
      gbuilders: [...s.gbuilders, { id: uid(), text: t, kind, schedule }],
    }));
    setText("");
    setSchedule(null);
  };
  return (
    <div>
      <MicroLabel className="mb-2">
        Capacity builders — children of this pursuit
      </MicroLabel>
      {scratch.gbuilders.length > 0 && (
        <ul className="mb-3 space-y-2">
          {scratch.gbuilders.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5"
            >
              <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/35">
                {b.kind}
              </span>
              <span className="min-w-0 flex-1 text-[14px] leading-snug text-white/85">
                {b.text}
              </span>
              <button
                type="button"
                onClick={() =>
                  setScratch((s) => ({
                    ...s,
                    gbuilders: s.gbuilders.filter((x) => x.id !== b.id),
                  }))
                }
                className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <Field
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Something that would build capacity…"
          />
        </div>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="shrink-0 rounded-xl border border-white/15 bg-black/40 px-3 py-3 text-[13px] text-white outline-none"
        >
          {BUILDER_KINDS.map((k) => (
            <option key={k.key} value={k.key}>
              {k.label}
            </option>
          ))}
        </select>
        <Btn onClick={add} disabled={!text.trim() || (kind === "habit" && !schedule)}>
          Add
        </Btn>
      </div>
      {kind === "habit" && (
        <div className="mt-3">
          <GoalScheduleEditor value={schedule} onChange={setSchedule} />
          {!schedule && (
            <p className="mt-1 text-[12px] text-white/35">
              A builder habit needs its rhythm.
            </p>
          )}
        </div>
      )}
      <p className="mt-2 text-[12px] leading-relaxed text-white/35">
        Each builder becomes a child goal, habit, or task of this pursuit —
        the roadmap from where you are to what it takes.
      </p>
    </div>
  );
}

function ContainerStep({ scratch, setScratch }) {
  return (
    <div>
      <ListEditor
        items={scratch.gcontainers}
        onAdd={(text) =>
          setScratch((s) => ({
            ...s,
            gcontainers: [...s.gcontainers, { id: uid(), text }],
          }))
        }
        onRemove={(id) =>
          setScratch((s) => ({
            ...s,
            gcontainers: s.gcontainers.filter((c) => c.id !== id),
          }))
        }
        placeholder="A block, trigger, or setup… e.g. Tue/Thu 7am — garage"
        addLabel="Add"
      />
      <p className="mt-2 text-[12px] leading-relaxed text-white/35">
        Each container becomes a Focus item — the pursuit, placed in time.
      </p>
    </div>
  );
}

function FrictionStep({ scratch, setScratch }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    setScratch((s) => ({
      ...s,
      gfrictions: [
        ...s.gfrictions,
        { id: uid(), text: t, lifemod: false, lifemodType: null },
      ],
    }));
    setText("");
  };
  const patch = (id, p) =>
    setScratch((s) => ({
      ...s,
      gfrictions: s.gfrictions.map((f) =>
        f.id === id ? { ...f, ...p } : f
      ),
    }));
  return (
    <div>
      {scratch.gfrictions.length > 0 && (
        <ul className="mb-3 space-y-2">
          {scratch.gfrictions.map((f) => (
            <li
              key={f.id}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-[14px] leading-snug text-white/85">
                  {f.text}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    patch(f.id, { lifemod: !f.lifemod, lifemodType: null })
                  }
                  aria-pressed={f.lifemod}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                    f.lifemod
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {f.lifemod ? "LifeMod ✓" : "Make LifeMod"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setScratch((s) => ({
                      ...s,
                      gfrictions: s.gfrictions.filter((x) => x.id !== f.id),
                    }))
                  }
                  className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/35 transition-colors hover:text-white"
                >
                  ✕
                </button>
              </div>
              {f.lifemod && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {LIFEMOD_PLAIN_TYPES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() =>
                        patch(f.id, {
                          lifemodType: f.lifemodType === t.key ? null : t.key,
                        })
                      }
                      className={`rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                        f.lifemodType === t.key
                          ? "bg-white/15 text-white"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Field
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="What will get in the way…"
        />
        <Btn onClick={add} disabled={!text.trim()}>
          Add
        </Btn>
      </div>
    </div>
  );
}

function FirstStepStep({ scratch, setScratch }) {
  return (
    <Field
      value={scratch.gfirstStep}
      onChange={(e) =>
        setScratch((s) => ({ ...s, gfirstStep: e.target.value }))
      }
      placeholder="The smallest start, doable within 48 hours…"
      maxLength={160}
    />
  );
}

function CommitStep({ scratch, setScratch }) {
  useEffect(() => {
    if (!scratch.greviewDate) {
      setScratch((s) =>
        s.greviewDate ? s : { ...s, greviewDate: tomorrowKey() }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-5">
      <TextArea
        value={scratch.gvow}
        onChange={(e) => setScratch((s) => ({ ...s, gvow: e.target.value }))}
        placeholder="I commit to… (in your own words)"
        rows={3}
        maxLength={300}
      />
      <div>
        <MicroLabel className="mb-2">Review date</MicroLabel>
        <Field
          type="date"
          value={scratch.greviewDate}
          onChange={(e) =>
            setScratch((s) => ({ ...s, greviewDate: e.target.value }))
          }
        />
        <p className="mt-2 text-[12px] leading-relaxed text-white/35">
          Arrives in Reviews due on the Deck — the loop this practice opens,
          closed when you review.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Runner ---------------- */

function recapAnswer(stepId, sc) {
  const t = (s) =>
    s && s.length > 120 ? s.slice(0, 120).trimEnd() + "…" : s || "—";
  switch (stepId) {
    case "gpursuit":
      return `${sc.gsubjectKind === "habit" ? "Habit" : "Goal"}: ${sc.gsubjectName || "—"}`;
    case "goutcome":
      return t(sc.goutcome);
    case "gpath":
      if (sc.gsubjectKind === "habit") {
        const bits = [];
        if (sc.gschedule) bits.push("rhythm set");
        if (sc.gevolution.trim()) bits.push(`evolves: ${sc.gevolution.trim()}`);
        return t(bits.join(" · ") || "—");
      }
      return sc.gmilestones.length
        ? `${sc.gmilestones.length} milestone${sc.gmilestones.length === 1 ? "" : "s"}: ${t(sc.gmilestones.map((m) => m.text).join("; "))}`
        : "—";
    case "gcapacity": {
      const dims = ["time", "energy", "skill", "support"].filter(
        (k) => sc.gcapacity && sc.gcapacity[k]
      );
      const bits = [];
      if (sc.genergy) bits.push(`energy: ${sc.genergy}`);
      if (dims.length) bits.push(`has ${dims.join(", ")}`);
      if (sc.gbuilders.length)
        bits.push(
          `${sc.gbuilders.length} builder${sc.gbuilders.length === 1 ? "" : "s"}`
        );
      return t(bits.join(" · ") || "—");
    }
    case "gcontainer":
      return sc.gcontainers.length
        ? t(sc.gcontainers.map((c) => c.text).join("; "))
        : "—";
    case "gfriction":
      return sc.gfrictions.length
        ? t(
            sc.gfrictions
              .map(
                (f) =>
                  f.text +
                  (f.lifemod
                    ? ` → LifeMod${f.lifemodType ? ` (${f.lifemodType})` : ""}`
                    : "")
              )
              .join("; ")
          )
        : "—";
    case "gfirststep":
      return t(sc.gfirstStep);
    case "gcommit":
      return t(sc.gvow);
    default:
      return "—";
  }
}

/** What the Build step will create — descriptors only, no writes. */
function describePlan(sc) {
  const children = [];
  for (const m of sc.gmilestones || []) {
    if (m.text && m.text.trim())
      children.push({ kind: "goal", text: m.text.trim() });
  }
  for (const b of sc.gbuilders || []) {
    if (!b.text || !b.text.trim()) continue;
    if (b.kind === "habit" && !b.schedule) continue;
    children.push({
      kind: b.kind,
      text: b.text.trim(),
      schedule: b.schedule || null,
    });
  }
  const lifemods = (sc.gfrictions || [])
    .filter((f) => f.lifemod && f.text && f.text.trim())
    .map((f) => ({ text: f.text.trim(), type: f.lifemodType || null }));
  const focusItems = [
    ...(sc.gcontainers || [])
      .filter((c) => c.text && c.text.trim())
      .map((c) => ({ text: c.text.trim(), label: "Container" })),
    ...(sc.gfirstStep && sc.gfirstStep.trim()
      ? [{ text: sc.gfirstStep.trim(), label: "First step" }]
      : []),
  ];
  return { children, lifemods, focusItems };
}

export function GrowthPracticeRunner({ initialSession, onExit }) {
  const axzio = useAxzio();
  const { id: draftId, sourceKind, sourceId, sourceName } = initialSession;
  const [step, setStep] = useState(initialSession.step || 0);
  const [scratch, setScratch] = useState(
    () => initialSession.scratch || blankGrowthScratch()
  );
  const [mode, setMode] = useState("steps"); // steps | build | done
  const [builtSessionId, setBuiltSessionId] = useState(null);
  const [recapOpen, setRecapOpen] = useState(false);

  // Draft persistence: save on every change; skip blank fresh opens so no
  // empty draft (or phantom resume prompt) is created.
  useEffect(() => {
    const blank =
      initialSession.fresh &&
      !scratch.gsubjectName.trim() &&
      step === 0 &&
      (scratch.gmilestones || []).length === 0;
    if (blank) return;
    axzio.saveGrowthDraft({
      id: draftId,
      sourceKind,
      sourceId,
      sourceName,
      step,
      scratch,
      savedAt: Date.now(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, scratch]);

  const canContinue = (() => {
    switch (step) {
      case 0:
        return !!(
          scratch.gsubjectName.trim() &&
          scratch.gcommitmentId &&
          scratch.gsubjectKind
        );
      case 1:
        return !!scratch.goutcome.trim();
      case 2:
        return scratch.gsubjectKind === "habit" ? !!scratch.gschedule : true;
      case 3:
        return (
          !!scratch.genergy &&
          (scratch.gbuilders || []).every(
            (b) =>
              b.text &&
              b.text.trim() &&
              (b.kind !== "habit" || b.schedule)
          )
        );
      case 6:
        return !!scratch.gfirstStep.trim();
      default:
        return true;
    }
  })();

  const go = (dir) => {
    if (dir > 0 && step === GROWTH_STEPS.length - 1) {
      setMode("build");
    } else {
      setStep((s) =>
        Math.min(GROWTH_STEPS.length - 1, Math.max(0, s + dir))
      );
    }
  };

  const plan = useMemo(() => describePlan(scratch), [scratch]);
  const subjectLabel = scratch.gsubjectName.trim() || "Untitled pursuit";

  const buildAll = () => {
    const sc = scratch;
    const commitmentId = sc.gcommitmentId;
    let subjectId = sc.gsubjectId;
    const subjectKind = sc.gsubjectKind;
    const srcStar = sourceKind === "star" ? sourceId : null;
    const srcLM = sourceKind === "lifemod" ? sourceId : null;
    if (subjectId) {
      if (subjectKind === "goal") {
        axzio.updateGoal(subjectId, {
          text: sc.gsubjectName.trim(),
          horizon: sc.ghorizon || null,
        });
      } else {
        axzio.updateHabit(subjectId, {
          text: sc.gsubjectName.trim(),
          schedule: sc.gschedule,
          evolutionNote: sc.gevolution.trim(),
        });
      }
    } else {
      if (subjectKind === "goal") {
        const g = axzio.addGoal(sc.gsubjectName.trim(), commitmentId, {
          horizon: sc.ghorizon || null,
          sourceStarId: srcStar,
          sourceLifeModId: srcLM,
        });
        subjectId = g && g.id;
      } else {
        const h = axzio.addHabit(sc.gsubjectName.trim(), commitmentId, {
          schedule: sc.gschedule,
          evolutionNote: sc.gevolution.trim(),
          sourceStarId: srcStar,
          sourceLifeModId: srcLM,
        });
        subjectId = h && h.id;
      }
    }
    if (!subjectId) return;

    const childRecs = [];
    for (const c of plan.children) {
      let rec = null;
      if (c.kind === "goal") {
        const g = axzio.addGoal(c.text, commitmentId, { parentId: subjectId });
        if (g) rec = { kind: "goal", id: g.id, text: g.text };
      } else if (c.kind === "habit") {
        const h = axzio.addHabit(c.text, commitmentId, {
          parentId: subjectId,
          schedule: c.schedule,
        });
        if (h) rec = { kind: "habit", id: h.id, text: h.text };
      } else {
        const f = axzio.addFocusItem(c.text, "q2", {
          commitmentId,
          timeframe: "week",
          parentId: subjectId,
          ...(subjectKind === "goal" ? { goalId: subjectId } : {}),
        });
        if (f) rec = { kind: "task", id: f.id, text: f.text };
      }
      if (rec) childRecs.push(rec);
    }
    const lifemodRecs = [];
    for (const l of plan.lifemods) {
      const m = axzio.addLifeMod(l.text, { origin: "friction" });
      if (m) lifemodRecs.push({ id: m.id, name: m.name, type: l.type });
    }
    const focusIds = [];
    for (const fi of plan.focusItems) {
      const f = axzio.addFocusItem(fi.text, "q2", {
        commitmentId,
        timeframe: fi.label === "First step" ? "day" : "week",
        parentId: subjectId,
        ...(subjectKind === "goal" ? { goalId: subjectId } : {}),
      });
      if (f) focusIds.push(f.id);
    }
    const session = axzio.saveGrowthSession({
      subjectKind,
      subjectId,
      subjectName: sc.gsubjectName.trim(),
      commitmentId,
      outcome: sc.goutcome.trim(),
      evolutionNote: sc.gevolution.trim(),
      energy: sc.genergy,
      capacity: sc.gcapacity,
      capacityNotes: sc.gcapacityNotes.trim(),
      children: childRecs,
      lifemods: lifemodRecs,
      focusItemIds: focusIds,
      vow: sc.gvow.trim(),
      reviewDate: sc.greviewDate || tomorrowKey(),
    });
    axzio.clearGrowthDraft(draftId);
    setBuiltSessionId(session.id);
    setMode("done");
  };

  if (mode === "done" && builtSessionId) {
    return <GrowthCard sessionId={builtSessionId} onBack={onExit} justBuilt />;
  }

  const cfg = GROWTH_STEPS[step];
  const recapSteps = GROWTH_STEPS.slice(0, step);

  return (
    <Card className="axzio-rise p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <MicroLabel className="mb-2">Practice · How</MicroLabel>
          <h3 className="text-2xl font-light tracking-wide md:text-3xl">
            Growth Practice
          </h3>
          <div className="mt-3 max-w-xl">
            <p className="flex items-baseline gap-2.5">
              <span className="shrink-0 text-[10px] uppercase tracking-[0.22em] text-white/40">
                Growing
              </span>
              <span
                className="truncate text-[17px] font-medium tracking-wide text-white"
                title={subjectLabel}
              >
                {subjectLabel}
              </span>
            </p>
            {recapSteps.length > 0 && (
              <button
                type="button"
                onClick={() => setRecapOpen((o) => !o)}
                aria-expanded={recapOpen}
                className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
              >
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${
                    recapOpen ? "rotate-180" : ""
                  }`}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                Your answers so far ({recapSteps.length})
              </button>
            )}
            {recapOpen && recapSteps.length > 0 && (
              <ul className="mt-3 space-y-2.5 border-l border-white/15 pl-4">
                {recapSteps.map((r) => (
                  <li key={r.id}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                      {r.title}
                    </p>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-white/65">
                      {recapAnswer(r.id, scratch)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white"
        >
          Exit
        </button>
      </div>

      {mode === "build" ? (
        <BuildReview
          scratch={scratch}
          plan={plan}
          onBack={() => setMode("steps")}
          onBuild={buildAll}
        />
      ) : (
        <>
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-3">
              <MicroLabel>
                Step {step + 1} of {GROWTH_STEPS.length} · {cfg.title}
              </MicroLabel>
              <HelpBubble title={cfg.help.title}>
                <HelpText
                  what={cfg.help.what}
                  why={cfg.help.why}
                  how={cfg.help.how}
                  example={cfg.help.example}
                />
              </HelpBubble>
            </div>
            <p className="max-w-xl text-[15px] leading-relaxed text-white/70">
              {cfg.prompt}
            </p>
          </div>
          {step === 0 && (
            <PursuitStep
              scratch={scratch}
              setScratch={setScratch}
              sourceKind={sourceKind}
            />
          )}
          {step === 1 && <OutcomeStep scratch={scratch} setScratch={setScratch} />}
          {step === 2 && <PathStep scratch={scratch} setScratch={setScratch} />}
          {step === 3 && (
            <CapacityStep scratch={scratch} setScratch={setScratch} />
          )}
          {step === 4 && (
            <ContainerStep scratch={scratch} setScratch={setScratch} />
          )}
          {step === 5 && (
            <FrictionStep scratch={scratch} setScratch={setScratch} />
          )}
          {step === 6 && (
            <FirstStepStep scratch={scratch} setScratch={setScratch} />
          )}
          {step === 7 && <CommitStep scratch={scratch} setScratch={setScratch} />}

          <div className="mt-8 flex items-center justify-between gap-3">
            <Btn variant="quiet" onClick={() => go(-1)} disabled={step === 0}>
              ← Back
            </Btn>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/30">
              {step + 1} / {GROWTH_STEPS.length}
            </span>
            <Btn onClick={() => go(1)} disabled={!canContinue}>
              {step === GROWTH_STEPS.length - 1 ? "Review build →" : "Continue →"}
            </Btn>
          </div>
        </>
      )}
    </Card>
  );
}

/* ---------------- Build review ---------------- */

function BuildReview({ scratch, plan, onBack, onBuild }) {
  const axzio = useAxzio();
  const commitment =
    (axzio.state.identity.commitments || []).find(
      (c) => c && c.id === scratch.gcommitmentId
    ) || null;
  const isNew = !scratch.gsubjectId;
  const rows = [];
  rows.push({
    label: isNew ? `New ${scratch.gsubjectKind}` : `Update ${scratch.gsubjectKind}`,
    items: [scratch.gsubjectName.trim()],
  });
  if (plan.children.length)
    rows.push({
      label: `Children — roadmap (${plan.children.length})`,
      items: plan.children.map((c) => `${c.kind}: ${c.text}`),
    });
  if (plan.lifemods.length)
    rows.push({
      label: `LifeMods (${plan.lifemods.length})`,
      items: plan.lifemods.map(
        (l) => `${l.text}${l.type ? ` (${l.type})` : ""}`
      ),
    });
  if (plan.focusItems.length)
    rows.push({
      label: `Focus items (${plan.focusItems.length})`,
      items: plan.focusItems.map((f) => `${f.label}: ${f.text}`),
    });
  return (
    <div>
      <div className="mb-1 flex items-center gap-3">
        <MicroLabel>Review the build</MicroLabel>
        <HelpBubble title="Review the build">
          <HelpText
            what="Everything the practice staged, before anything is written. Nothing enters the system until you build it."
            why="A builder should show its work. This is the moment to catch a misnamed milestone or a builder that doesn't belong."
            how="Read it through. Go back to change a step, or build it all into goals, habits, LifeMods, and Focus."
          />
        </HelpBubble>
      </div>
      <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-white/70">
        This is what the practice will write. Nothing is built yet.
      </p>
      <ul className="space-y-4">
        {rows.map((r, i) => (
          <li key={i}>
            <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-white/40">
              {r.label}
            </p>
            <ul className="space-y-1.5">
              {r.items.map((t, j) => (
                <li
                  key={j}
                  className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-[14px] leading-snug text-white/85"
                >
                  {t}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {commitment && (
        <p className="mt-5 text-[13px] text-white/45">
          Serving commitment:{" "}
          <span className="text-white/75">{commitment.text}</span>
        </p>
      )}
      {scratch.greviewDate && (
        <p className="mt-2 text-[13px] text-white/45">
          Review:{" "}
          <span className="text-white/75">
            {formatLongDate(scratch.greviewDate)}
          </span>
        </p>
      )}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Btn variant="quiet" onClick={onBack}>
          ← Back to steps
        </Btn>
        <Btn onClick={onBuild}>Build it</Btn>
      </div>
    </div>
  );
}

/* ---------------- Home: drafts + history ---------------- */

export function GrowthPracticeHome({ drafts, sessions, onResume, onDiscard, onNew, onViewSession, onBack }) {
  return (
    <Card className="axzio-rise p-6 md:p-10">
      <MicroLabel className="mb-2">Practice · How</MicroLabel>
      <h3 className="text-2xl font-light tracking-wide md:text-3xl">
        Growth Practice
      </h3>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/60">
        The "how" practice: design a pursuit — a goal or a habit — into a
        structure. Name it, clarify the outcome, design the path, check your
        capacity, set the container, name the friction, take the first step —
        then build it all into your system.
      </p>

      {drafts.length > 0 && (
        <div className="mt-8">
          <MicroLabel className="mb-3">Unfinished growth</MicroLabel>
          <ul className="space-y-2.5">
            {drafts.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-white/85">
                    {d.scratch?.gsubjectName || d.sourceName || "Untitled pursuit"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-white/40">
                    Step {(d.step || 0) + 1} of {GROWTH_STEPS.length} · saved{" "}
                    {relativeTime(d.savedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onResume(d)}
                    className="text-[11px] uppercase tracking-[0.18em] text-white/60 transition-colors hover:text-white"
                  >
                    Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => onDiscard(d.id)}
                    className="text-[11px] uppercase tracking-[0.18em] text-white/30 transition-colors hover:text-white"
                  >
                    Discard
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Btn onClick={onNew}>
          {drafts.length > 0 ? "Start new practice" : "Begin"}
        </Btn>
        <Btn variant="quiet" onClick={onBack}>
          Back to journeys
        </Btn>
      </div>

      {sessions.length > 0 && (
        <div className="mt-10">
          <MicroLabel className="mb-3">Growth Cards</MicroLabel>
          <ul className="space-y-2.5">
            {sessions
              .slice()
              .sort((a, b) => (b.ts || 0) - (a.ts || 0))
              .map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => onViewSession(s.id)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-left transition-colors hover:border-white/25"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] text-white/85">
                        {s.subjectName || "Untitled pursuit"}
                      </p>
                      <p className="mt-0.5 text-[12px] text-white/40">
                        {s.date}
                        {s.reviewDate && !s.reviewedAt
                          ? ` · review ${s.reviewDate}`
                          : ""}
                        {s.reviewedAt ? " · reviewed" : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-white/40">
                      Open →
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

/* ---------------- Growth Card ---------------- */

export function GrowthCard({ sessionId, onBack, justBuilt = false }) {
  const axzio = useAxzio();
  const s = (axzio.state.growthSessions || []).find((x) => x.id === sessionId);
  if (!s) {
    return (
      <Card className="p-6 md:p-10">
        <p className="text-white/60">That growth session couldn't be found.</p>
        <div className="mt-6">
          <Btn variant="quiet" onClick={onBack}>
            Back
          </Btn>
        </div>
      </Card>
    );
  }
  const commitment =
    (axzio.state.identity.commitments || []).find(
      (c) => c && c.id === s.commitmentId
    ) || null;
  const builtCount =
    (s.children || []).length +
    (s.lifemods || []).length +
    (s.focusItemIds || []).length;
  return (
    <Card className="axzio-rise p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <MicroLabel className="mb-2">
            {justBuilt ? "The practice is built" : "Growth Card"}
          </MicroLabel>
          <h3 className="text-2xl font-light tracking-wide md:text-3xl">
            {s.subjectName || "Untitled pursuit"}
          </h3>
          <p className="mt-2 text-[13px] text-white/45">
            {s.subjectKind === "habit" ? "Habit" : "Goal"} · {s.date}
            {commitment ? ` · serving ${commitment.text}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white"
        >
          {justBuilt ? "Done" : "Back"}
        </button>
      </div>

      {justBuilt && (
        <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-white/70">
          Built — {builtCount} new {builtCount === 1 ? "piece" : "pieces"} now
          live in your system, hanging off this pursuit.
        </p>
      )}

      {s.outcome && (
        <div className="mb-6">
          <MicroLabel className="mb-2">The outcome</MicroLabel>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/75">
            {s.outcome}
          </p>
        </div>
      )}

      {s.evolutionNote && (
        <div className="mb-6">
          <MicroLabel className="mb-2">How it evolves</MicroLabel>
          <p className="max-w-xl text-[15px] leading-relaxed text-white/75">
            {s.evolutionNote}
          </p>
        </div>
      )}

      {(s.children || []).length > 0 && (
        <div className="mb-6">
          <MicroLabel className="mb-2">
            Roadmap — children of this pursuit
          </MicroLabel>
          <ul className="space-y-1.5">
            {s.children.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5"
              >
                <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/35">
                  {c.kind}
                </span>
                <span className="min-w-0 flex-1 text-[14px] text-white/85">
                  {c.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(s.lifemods || []).length > 0 && (
        <div className="mb-6">
          <MicroLabel className="mb-2">LifeMods</MicroLabel>
          <ul className="space-y-1.5">
            {s.lifemods.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5"
              >
                <span className="min-w-0 flex-1 text-[14px] text-white/85">
                  {m.name}
                </span>
                {m.type && (
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-white/35">
                    {lifemodPlainTypeLabel(m.type) || m.type}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {(s.focusItemIds || []).length > 0 && (
        <div className="mb-6">
          <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
            In Focus — {(s.focusItemIds || []).length}{" "}
            {(s.focusItemIds || []).length === 1 ? "item" : "items"}
          </p>
          <p className="text-[13px] leading-relaxed text-white/50">
            Containers and the first step are waiting in Focus, linked to this
            pursuit.
          </p>
        </div>
      )}

      {s.vow && (
        <div className="mb-6">
          <MicroLabel className="mb-2">The vow</MicroLabel>
          <p className="max-w-xl text-[15px] italic leading-relaxed text-white/75">
            “{s.vow}”
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
        <p className="text-[13px] text-white/45">
          {s.reviewDate ? (
            <>
              Review{" "}
              <span className="text-white/75">
                {formatLongDate(s.reviewDate)}
              </span>
              {s.reviewedAt ? " · reviewed" : ""}
            </>
          ) : (
            "No review date set."
          )}
        </p>
        {!s.reviewedAt && s.reviewDate && (
          <Btn
            variant="quiet"
            onClick={() => axzio.markGrowthReviewed(s.id)}
          >
            Mark reviewed
          </Btn>
        )}
      </div>
    </Card>
  );
}
