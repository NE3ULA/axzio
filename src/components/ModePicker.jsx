import { useAxzio, MODES, modeLabel } from "../store.jsx";
import { MicroLabel } from "./ui.jsx";

/**
 * ModePicker — primary + secondary mode selection for one interval
 * (day / week / month). Shared by the Modes view, the first-use
 * walkthrough, and the Command Deck's inline quick-switch.
 */
export default function ModePicker({ interval, compact = false }) {
  const axzio = useAxzio();
  const sel =
    (axzio.state.modes && axzio.state.modes[interval]) ||
    { primary: null, secondary: null };

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <SlotRow
        slot="primary"
        label="Primary"
        interval={interval}
        selected={sel.primary}
        onSelect={(key) => axzio.setMode(interval, "primary", key)}
        compact={compact}
      />
      <SlotRow
        slot="secondary"
        label="Secondary"
        interval={interval}
        selected={sel.secondary}
        onSelect={(key) => axzio.setMode(interval, "secondary", key)}
        compact={compact}
      />
    </div>
  );
}

function SlotRow({ slot, label, selected, onSelect, compact }) {
  return (
    <div>
      <MicroLabel className="mb-2.5">
        {label}
        {selected && (
          <span className="ml-2 text-white/80">· {modeLabel(selected)}</span>
        )}
      </MicroLabel>
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => {
          const isSel = selected === m.key;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => onSelect(isSel ? null : m.key)}
              aria-pressed={isSel}
              className={`rounded-full border px-4 transition-all duration-200 ${
                compact ? "py-1.5 text-[11px]" : "py-2 text-[12px]"
              } uppercase tracking-[0.16em] ${
                isSel
                  ? "border-white/70 bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                  : "border-white/15 text-white/50 hover:border-white/40 hover:text-white"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="mt-2 text-[12px] leading-relaxed text-white/40">
          {MODES.find((m) => m.key === selected)?.organizes}
        </p>
      )}
    </div>
  );
}
