/* Shared UI primitives — the AXZIO visual language:
   pure black, white text, thin 1px borders, wide-tracked micro labels. */

import { useState } from "react";

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
export function SectionHead({ label, right, help }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <span className="flex items-center gap-2">
        <MicroLabel>{label}</MicroLabel>
        {help}
      </span>
      {right}
    </div>
  );
}

/**
 * HelpBubble — a small "?" button that opens a popover card:
 * title + WHAT / WHY / HOW. Used on every major section so the
 * interface explains itself in place.
 */
export function HelpBubble({ title, children, className = "" }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`relative inline-flex shrink-0 align-middle ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`About: ${title}`}
        aria-expanded={open}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-white/25 text-[11px] leading-none text-white/60 transition-colors hover:border-white/60 hover:text-white"
      >
        ?
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/50"
          />
          <div
            role="dialog"
            aria-label={title}
            className="fixed left-1/2 top-1/2 z-50 max-h-[calc(100dvh-3rem)] w-80 max-w-[calc(100vw-2.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/20 bg-[#0b0b0b] p-5 shadow-[0_8px_48px_rgba(0,0,0,0.85)]"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <MicroLabel>{title}</MicroLabel>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-white/40 transition-colors hover:text-white"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </div>
            {children}
          </div>
        </>
      )}
    </span>
  );
}

/** WHAT / WHY / HOW body for a HelpBubble. */
export function HelpText({ what, why, how, example }) {
  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-white/65">
      {what && (
        <p>
          <span className="text-white/90">What — </span>
          {what}
        </p>
      )}
      {why && (
        <p>
          <span className="text-white/90">Why — </span>
          {why}
        </p>
      )}
      {how && (
        <p>
          <span className="text-white/90">How — </span>
          {how}
        </p>
      )}
      {example && (
        <p>
          <span className="text-white/90">Example — </span>
          {example}
        </p>
      )}
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
