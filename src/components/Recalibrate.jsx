/* Recalibrate — the full-system sweep.
 *
 * When the map no longer matches the territory — earlier inputs were
 * uninformed, honesty was partial, or life shifted — walk the whole
 * Identity Stack again, this time informed by history. Distinct from
 * Reset (one situation → Action Card) and Orientation (daily
 * micro-practices). Portaled: it must escape any transformed ancestor.
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  useAxzio,
  ORIENTATION_STATEMENTS,
  PRIMITIVES,
  MODES,
  sortedCommitments,
} from "../store.jsx";
import { logEvent } from "../events.js";
import { Btn, Card, MicroLabel, TextArea, Field } from "./ui.jsx";

const STEPS = [
  { id: "intro", title: "The sweep" },
  { id: "statements", title: "Statements" },
  { id: "commitments", title: "Commitments" },
  { id: "primitives", title: "Primitives" },
  { id: "modes", title: "Modes" },
  { id: "done", title: "Sealed" },
];

function ModePills({ options, selected, onPick, allowClear = true }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((m) => {
        const on = selected === m.key;
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onPick(allowClear && on ? null : m.key)}
            className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
              on ? "bg-white/10 text-white" : "text-white/45 hover:text-white"
            }`}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Recalibrate({ onClose }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const [step, setStep] = useState(0);
  const [drafts, setDrafts] = useState(() => ({
    becoming: state.identity.becoming || "",
    standFor: state.identity.standFor || "",
    practice: state.identity.practice || "",
    returnThrough: state.identity.returnThrough || "",
  }));
  const [newCommitment, setNewCommitment] = useState("");
  const [prims, setPrims] = useState(() => {
    const last =
      state.assessments && state.assessments.length
        ? state.assessments[state.assessments.length - 1]
        : null;
    const o = {};
    for (const p of PRIMITIVES) o[p.key] = last ? last[p.key] ?? 5 : 5;
    return o;
  });
  const [modeDraft, setModeDraft] = useState(() => ({
    current: state.modes?.current ?? null,
    primary: state.modes?.day?.primary ?? null,
    secondary: state.modes?.day?.secondary ?? null,
  }));
  const [summary, setSummary] = useState(null);

  const go = (dir) =>
    setStep((s) => Math.min(STEPS.length - 1, Math.max(0, s + dir)));

  const commitStatements = () => {
    const patch = {};
    let changed = 0;
    for (const s of ORIENTATION_STATEMENTS) {
      const v = (drafts[s.key] || "").trim();
      if (v !== (state.identity[s.key] || "")) {
        patch[s.key] = v;
        changed++;
      }
    }
    if (changed) axzio.updateIdentity(patch);
    return changed;
  };

  const commitPrimitives = () => {
    axzio.saveAssessment({ ...prims });
  };

  const commitModes = () => {
    let changed = 0;
    if (modeDraft.current !== (state.modes?.current ?? null)) {
      axzio.setCurrentMode(modeDraft.current);
      changed++;
    }
    if (modeDraft.primary !== (state.modes?.day?.primary ?? null)) {
      axzio.setMode("day", "primary", modeDraft.primary);
      changed++;
    }
    if (modeDraft.secondary !== (state.modes?.day?.secondary ?? null)) {
      axzio.setMode("day", "secondary", modeDraft.secondary);
      changed++;
    }
    return changed;
  };

  // change counters, accumulated as the user moves through
  const [counts, setCounts] = useState({
    statements: 0,
    commitmentsAdded: 0,
    commitmentsRemoved: 0,
  });

  const next = () => {
    const id = STEPS[step].id;
    if (id === "statements") {
      const c = commitStatements();
      setCounts((k) => ({ ...k, statements: k.statements + c }));
    }
    if (id === "primitives") commitPrimitives();
    if (id === "modes") {
      commitModes();
      const lines = [];
      if (counts.statements) lines.push(`${counts.statements} statement${counts.statements === 1 ? "" : "s"} revised`);
      if (counts.commitmentsAdded) lines.push(`${counts.commitmentsAdded} commitment${counts.commitmentsAdded === 1 ? "" : "s"} added`);
      if (counts.commitmentsRemoved) lines.push(`${counts.commitmentsRemoved} commitment${counts.commitmentsRemoved === 1 ? "" : "s"} released`);
      lines.push("Primitives re-assessed");
      lines.push("Modes re-aimed");
      setSummary(lines);
      logEvent("recalibrate.completed", {
        statements: counts.statements,
        added: counts.commitmentsAdded,
        removed: counts.commitmentsRemoved,
      });
    }
    go(1);
  };

  const commitments = sortedCommitments(state);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Recalibrate"
    >
      <Card className="w-full max-w-2xl p-6 md:p-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <MicroLabel className="mb-2">Recalibrate</MicroLabel>
            <h3 className="text-2xl font-light tracking-wide md:text-3xl">
              {STEPS[step].title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[11px] uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-white"
          >
            Exit
          </button>
        </div>

        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/45">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
          <div className="flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-px flex-1 transition-colors duration-500 ${
                  i <= step ? "bg-white/80" : "bg-white/12"
                }`}
              />
            ))}
          </div>
        </div>

        {STEPS[step].id === "intro" && (
          <div className="axzio-rise">
            <p className="max-w-lg text-[15px] leading-relaxed text-white/70">
              When the map no longer matches the territory — earlier inputs
              were uninformed, honesty was partial, or life shifted — walk
              the whole stack again. This time you're informed by your
              history, not starting blind.
            </p>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
              You'll revisit your four statements, commitments, primitives,
              and modes. Nothing is erased; everything is revised against
              the person you've become since.
            </p>
          </div>
        )}

        {STEPS[step].id === "statements" && (
          <div className="axzio-rise space-y-6">
            {ORIENTATION_STATEMENTS.map((s) => (
              <div key={s.key}>
                <MicroLabel className="mb-2">{s.prompt}</MicroLabel>
                <TextArea
                  value={drafts[s.key]}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [s.key]: e.target.value }))
                  }
                  placeholder={s.placeholder}
                  rows={2}
                  maxLength={280}
                />
              </div>
            ))}
          </div>
        )}

        {STEPS[step].id === "commitments" && (
          <div className="axzio-rise">
            <p className="mb-5 max-w-lg text-[15px] leading-relaxed text-white/60">
              Which commitments still hold? Release what doesn't; name
              what's new.
            </p>
            <ul className="mb-6 space-y-2">
              {commitments.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-4 py-3"
                >
                  <span className="min-w-0 flex-1 truncate text-[14px] text-white/85">
                    {c.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      axzio.removeCommitment(c.id);
                      setCounts((k) => ({
                        ...k,
                        commitmentsRemoved: k.commitmentsRemoved + 1,
                      }));
                    }}
                    className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-white/35 transition-colors hover:text-white/80"
                  >
                    Release
                  </button>
                </li>
              ))}
              {commitments.length === 0 && (
                <li className="text-[14px] text-white/40">
                  No commitments yet — name the first.
                </li>
              )}
            </ul>
            <div className="flex gap-2">
              <Field
                value={newCommitment}
                onChange={(e) => setNewCommitment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newCommitment.trim()) {
                    axzio.addCommitment(newCommitment.trim());
                    setCounts((k) => ({
                      ...k,
                      commitmentsAdded: k.commitmentsAdded + 1,
                    }));
                    setNewCommitment("");
                  }
                }}
                placeholder="A new commitment…"
                maxLength={120}
                aria-label="New commitment"
              />
              <Btn
                onClick={() => {
                  if (!newCommitment.trim()) return;
                  axzio.addCommitment(newCommitment.trim());
                  setCounts((k) => ({
                    ...k,
                    commitmentsAdded: k.commitmentsAdded + 1,
                  }));
                  setNewCommitment("");
                }}
              >
                Add
              </Btn>
            </div>
          </div>
        )}

        {STEPS[step].id === "primitives" && (
          <div className="axzio-rise space-y-6">
            <p className="max-w-lg text-[15px] leading-relaxed text-white/60">
              Where do the lived conditions stand now? Answer from this
              week, not from aspiration.
            </p>
            {PRIMITIVES.map((p) => (
              <div key={p.key}>
                <div className="mb-2 flex items-center justify-between">
                  <MicroLabel>{p.label}</MicroLabel>
                  <span className="text-[13px] text-white/70">
                    {prims[p.key]}/10
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={prims[p.key]}
                  onChange={(e) =>
                    setPrims((o) => ({ ...o, [p.key]: Number(e.target.value) }))
                  }
                  className="w-full accent-white"
                  aria-label={p.label}
                />
                <p className="mt-1 text-[12px] text-white/40">{p.desc}</p>
              </div>
            ))}
          </div>
        )}

        {STEPS[step].id === "modes" && (
          <div className="axzio-rise space-y-7">
            <div>
              <div className="mb-2.5 flex items-center gap-2">
                <MicroLabel>The mode you've been in lately</MicroLabel>
              </div>
              <p className="mb-3 max-w-lg text-[13px] leading-relaxed text-white/45">
                Not this exact moment — where has your energy actually been
                going? The calibration itself may shift the answer; answer
                from the recent pattern.
              </p>
              <ModePills
                options={MODES}
                selected={modeDraft.current}
                onPick={(v) => setModeDraft((m) => ({ ...m, current: v }))}
              />
            </div>
            <div>
              <MicroLabel className="mb-2.5">Primary focus today</MicroLabel>
              <ModePills
                options={MODES}
                selected={modeDraft.primary}
                onPick={(v) => setModeDraft((m) => ({ ...m, primary: v }))}
              />
            </div>
            <div>
              <MicroLabel className="mb-2.5">Secondary focus today</MicroLabel>
              <ModePills
                options={MODES}
                selected={modeDraft.secondary}
                onPick={(v) => setModeDraft((m) => ({ ...m, secondary: v }))}
              />
              {modeDraft.primary &&
                modeDraft.primary === modeDraft.secondary && (
                  <p className="mt-2 text-[12px] text-white/40">
                    Primary and secondary should differ — pick two, or clear
                    one.
                  </p>
                )}
            </div>
          </div>
        )}

        {STEPS[step].id === "done" && (
          <div className="axzio-rise py-4 text-center">
            <MicroLabel className="mb-3">Recalibration sealed</MicroLabel>
            <h4 className="text-3xl font-light tracking-wide">
              The map matches the territory again.
            </h4>
            {summary && (
              <ul className="mx-auto mt-6 max-w-md space-y-1.5 text-[14px] text-white/65">
                {summary.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-white/60">
              The system now reads against the revised core. Return here
              whenever the drift feels structural rather than situational.
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <Btn
            variant="quiet"
            onClick={() => go(-1)}
            disabled={step === 0 || STEPS[step].id === "done"}
          >
            Back
          </Btn>
          {STEPS[step].id === "done" ? (
            <Btn onClick={onClose}>Return</Btn>
          ) : (
            <Btn
              onClick={next}
              disabled={
                STEPS[step].id === "modes" &&
                !!modeDraft.primary &&
                modeDraft.primary === modeDraft.secondary
              }
            >
              {STEPS[step].id === "intro" ? "Begin" : "Continue"}
            </Btn>
          )}
        </div>
      </Card>
    </div>,
    document.body
  );
}
