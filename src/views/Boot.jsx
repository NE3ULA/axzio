import { useEffect } from "react";

/** Cinematic entry: the AXZIO mark, a thin progress line, then onDone. */
export default function Boot({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2100);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
      <div className="axzio-rise flex flex-col items-center">
        {/* the mark: a crossing of lines, a center for it all */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden="true"
          className="mb-8"
        >
          <line x1="8" y1="36" x2="64" y2="36" stroke="white" strokeWidth="1" opacity="0.9" />
          <line x1="36" y1="8" x2="36" y2="64" stroke="white" strokeWidth="1" opacity="0.9" />
          <line x1="16" y1="16" x2="56" y2="56" stroke="white" strokeWidth="1" opacity="0.35" />
          <line x1="56" y1="16" x2="16" y2="56" stroke="white" strokeWidth="1" opacity="0.35" />
          <circle cx="36" cy="36" r="4" fill="white" />
          <circle cx="36" cy="36" r="9" stroke="white" strokeWidth="1" opacity="0.4" />
        </svg>
        <h1 className="text-4xl font-light uppercase tracking-[0.5em] text-white md:text-5xl">
          Axzio
        </h1>
        <p className="mt-6 text-[11px] uppercase tracking-[0.3em] text-white/45">
          Initializing interface
        </p>
        <div className="mt-6 h-px w-44 overflow-hidden bg-white/10">
          <div
            className="h-full w-full origin-left bg-white/80"
            style={{ animation: "axzio-bootbar 1.8s cubic-bezier(0.22,1,0.36,1) both" }}
          />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.28em] text-white/30">
          Call &rarr; Signal &rarr; Initiation
        </p>
      </div>
    </div>
  );
}
