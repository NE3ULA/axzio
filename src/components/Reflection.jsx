import { useAxzio, BATTERY, localDateKey, modeLabel } from "../store.jsx";
import { Card, MicroLabel, HelpBubble, HelpText, SectionHead } from "./ui.jsx";

/* Weekly reflection — the manual readings loop (no AI). Parked in the
   Atlas: eventually this wraps into the evening review and the
   weekly/monthly reviews. */

function last7Keys() {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(localDateKey(d));
  }
  return out;
}

export function ReflectionCard() {
  const { state } = useAxzio();
  const keys = last7Keys();
  const weekAgo = Date.now() - 7 * 86400000;

  const days = keys
    .map((k) => state.days?.[k])
    .filter((d) => d && typeof d === "object");

  // Battery: weekly averages + low-state/high-priority gaps.
  const agg = {};
  for (const b of BATTERY) agg[b.key] = { sum: 0, n: 0, gap: 0 };
  for (const d of days) {
    for (const b of BATTERY) {
      const v = d.battery?.[b.key];
      if (!Number.isFinite(v)) continue;
      agg[b.key].sum += v;
      agg[b.key].n += 1;
      if (v <= 4 && d.batteryPriority?.[b.key] === "high") agg[b.key].gap += 1;
    }
  }
  const avg = (k) => (agg[k].n ? agg[k].sum / agg[k].n : null);
  const withData = BATTERY.filter((b) => agg[b.key].n >= 2);
  const lowest = withData.length
    ? withData.reduce((a, b) => (avg(b.key) < avg(a.key) ? b : a))
    : null;
  const gapDim = BATTERY.find((b) => agg[b.key].gap > 0);

  // Focus: created vs completed in the last 7 days.
  const created = (state.focusItems || []).filter((f) => f && f.created >= weekAgo);
  const completed = (state.actions || []).filter(
    (a) => a && a.tag === "focus" && a.ts >= weekAgo && /^Completed:/.test(a.text || "")
  );
  const openQ1 = (state.focusItems || []).filter(
    (f) => f && !f.done && f.quadrant === "q1"
  ).length;
  const rate = created.length ? completed.length / created.length : null;

  // Orientation: days with at least 3 of 4 practices held.
  const grounded = days.filter((d) => {
    const m = d.mantra || {};
    return ["gratitude", "beauty", "action", "love"].filter((k) => m[k]).length >= 3;
  }).length;

  // Reset sessions in the last 7 days.
  const resets = (state.resets || []).filter((r) => r && r.ts >= weekAgo).length;

  // Modes: current (descriptive) vs day focus (prescriptive).
  const curMode = state.modes?.current ? modeLabel(state.modes.current) : null;
  const focusMode = state.modes?.day?.primary ? modeLabel(state.modes.day.primary) : null;

  const hasData =
    days.length > 0 || created.length > 0 || resets > 0 || (state.actions || []).length > 0;

  if (!hasData) {
    return (
      <Card className="axzio-rise axzio-rise-3 p-6">
        <SectionHead
          label="Reflection"
          help={
            <HelpBubble title="Reflection">
              <HelpText
                what="A weekly reading of your own patterns — derived transparently from your entries, never asserted as truth."
                why="Drift is normal and return is learnable; seeing the pattern is the first half of return."
                how="Use AXZIO for a week and your first reflection grows here."
              />
            </HelpBubble>
          }
        />
        <p className="text-[15px] leading-relaxed text-white/40">
          A week of entries will grow your first reflection here — what the
          system notices, a possible pattern, and questions to sit with.
        </p>
      </Card>
    );
  }

  const notices = [];
  if (lowest) {
    notices.push(
      `${lowest.label} averaged ${avg(lowest.key).toFixed(0)}/10 — your lowest battery this week.`
    );
  }
  if (gapDim) {
    notices.push(
      `${gapDim.label} ran low while flagged high priority — it was promised attention it didn't get.`
    );
  }
  if (curMode || focusMode) {
    notices.push(
      curMode && focusMode && curMode !== focusMode
        ? `You're in ${curMode} mode, with focus set on ${focusMode}.`
        : `Mode: ${curMode || focusMode}.`
    );
  }
  if (created.length || completed.length) {
    notices.push(
      `${created.length} focus action${created.length === 1 ? "" : "s"} created, ${completed.length} completed.`
    );
  }
  if (days.length) {
    notices.push(`Practices held ${grounded} of the last ${days.length} days with entries.`);
  }
  if (resets) {
    notices.push(`${resets} Reset session${resets === 1 ? "" : "s"} this week.`);
  }

  let pattern =
    "One read: the week looks steady — the signal to watch is whatever repeats.";
  if (openQ1 > 0 && rate !== null && rate < 0.5) {
    pattern =
      "One read: urgent items are aging while new ones keep arriving — the one thing may need re-choosing.";
  } else if (gapDim) {
    pattern =
      "One read: a flagged battery keeps running low — either the priority or the load wants renegotiating.";
  } else if (resets >= 2) {
    pattern =
      "One read: repeated Resets on similar ground — there may be a friction worth naming as a LifeMod.";
  }

  const prompts = [
    "What drained the most energy this week — and was it friction, or the pressure of growth?",
  ];
  if (created.length - completed.length >= 3) {
    prompts.push("Which open item is heaviest — and what would finishing it unlock?");
  } else {
    prompts.push("Which commitment received the least of you?");
  }

  const rituals = [];
  if (openQ1 > 0) rituals.push("Run a Guided Reset on the heaviest open item.");
  if (gapDim) rituals.push(`Give ${gapDim.label.toLowerCase()} one deliberate act of care today.`);
  rituals.push("Name one friction as a LifeMod — remove drag or build lift.");
  if (resets >= 2 && !openQ1) rituals.push("Revisit your oldest open seed: does it still deserve orbit?");

  return (
    <Card className="axzio-rise axzio-rise-3 p-6">
      <SectionHead
        label="Reflection"
        help={
          <HelpBubble title="Reflection">
            <HelpText
              what="A weekly reading of your own patterns — derived transparently from your entries, never asserted as truth."
              why="Drift is normal and return is learnable; seeing the pattern is the first half of return."
              how="Read it, correct it, ignore it — it's a mirror, not a verdict."
            />
          </HelpBubble>
        }
        right={
          <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Last 7 days
          </span>
        }
      />

      <div className="mb-5">
        <MicroLabel className="mb-2">What we notice</MicroLabel>
        <ul className="space-y-1.5">
          {notices.slice(0, 4).map((n, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-white/75">
              {n}
            </li>
          ))}
        </ul>
      </div>

      <p className="mb-5 border-l border-white/15 pl-4 text-[14px] italic leading-relaxed text-white/65">
        {pattern}
      </p>

      <div className="mb-5">
        <MicroLabel className="mb-2">Questions to sit with</MicroLabel>
        <ul className="space-y-1.5">
          {prompts.map((p, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-white/75">
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <MicroLabel className="mb-2">Rituals to try</MicroLabel>
        <ul className="space-y-1.5">
          {rituals.slice(0, 2).map((r, i) => (
            <li key={i} className="text-[14px] leading-relaxed text-white/75">
              {r}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-white/35">
        Derived from your entries. Correct it freely — reflections are evidence
        of pattern, not identity labels.
      </p>
    </Card>
  );
}