/**
 * Inline candidate list for filling an empty priority rank.
 *
 * Candidates are open, unranked focus items in the slot's timeframe.
 * Picking one claims the rank — setPriority keeps each rank unique per
 * timeframe, so the rank simply moves to the chosen item.
 */
export default function PriorityPicker({
  rankLabel,
  candidates,
  onPick,
  onClose,
}) {
  if (!candidates.length) {
    return (
      <p className="mt-3 text-[13px] leading-relaxed text-white/35">
        No open unranked items to choose from — capture one and it will
        appear here.
      </p>
    );
  }
  return (
    <div className="mt-3">
      <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/35">
        Choose {rankLabel} from your list
      </p>
      <ul className="max-h-48 space-y-1 overflow-y-auto pr-1">
        {candidates.map((f) => (
          <li key={f.id}>
            <button
              onClick={() => onPick(f.id)}
              aria-label={`Set ${f.text} as ${rankLabel}`}
              className="block w-full truncate rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left text-[13px] text-white/80 transition-colors hover:border-white/35 hover:text-white"
            >
              {f.text}
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={onClose}
        className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/35 transition-colors hover:text-white/70"
      >
        Cancel
      </button>
    </div>
  );
}
