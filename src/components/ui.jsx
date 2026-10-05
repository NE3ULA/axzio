/* Shared UI primitives — the AXZIO visual language:
   pure black, white text, thin 1px borders, wide-tracked micro labels. */

export function Card({ className = "", children, ...rest }) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/[0.02] backdrop-blur-sm ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Small uppercase label with wide letter-spacing. */
export function MicroLabel({ className = "", children }) {
  return (
    <p
      className={`text-[11px] font-medium uppercase tracking-[0.22em] text-white/50 ${className}`}
    >
      {children}
    </p>
  );
}

export function Btn({
  variant = "primary",
  className = "",
  children,
  ...rest
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-[13px] font-medium uppercase tracking-[0.18em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40";
  const styles =
    variant === "primary"
      ? "border-white/70 bg-white text-black hover:bg-white/85"
      : variant === "ghost"
        ? "border-white/20 bg-transparent text-white hover:border-white/50"
        : "border-white/10 bg-transparent text-white/60 hover:text-white hover:border-white/30";
  return (
    <button className={`${base} ${styles} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Field({ className = "", ...rest }) {
  return (
    <input
      className={`w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white placeholder-white/30 outline-none transition-colors focus:border-white/50 ${className}`}
      {...rest}
    />
  );
}

export function TextArea({ className = "", ...rest }) {
  return (
    <textarea
      className={`w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] leading-relaxed text-white placeholder-white/30 outline-none transition-colors focus:border-white/50 ${className}`}
      {...rest}
    />
  );
}

export function Pill({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "border-white/20 text-white/70",
    lit: "border-white/60 bg-white/10 text-white",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Section header: micro label + thin rule. */
export function SectionHead({ label, right }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <MicroLabel>{label}</MicroLabel>
      {right}
    </div>
  );
}

/** Empty-state line used across lists. */
export function Empty({ children }) {
  return (
    <p className="py-6 text-center text-sm tracking-wide text-white/35">
      {children}
    </p>
  );
}
