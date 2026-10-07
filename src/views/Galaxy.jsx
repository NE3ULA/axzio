import { useMemo } from "react";
import { useAxzio, sortedCommitments } from "../store.jsx";
import {
  Card,
  MicroLabel,
  HelpBubble,
  HelpText,
} from "../components/ui.jsx";

/* ------------------------------------------------------------------ */
/* GALAXY — the shared field. Your system within the larger cloud.       */
/* Emergence, not containment: galaxies condense from nebulae, and your  */
/* system condensed from yours. Tribe systems will shine here later —    */
/* only where allowed. v1: your system as the first light, honestly      */
/* framed. No fake population.                                           */
/* ------------------------------------------------------------------ */

export default function Galaxy() {
  const { state } = useAxzio();
  const commitments = useMemo(() => sortedCommitments(state), [state]);
  const shown = commitments.slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8">
      <header className="axzio-rise mb-8">
        <div className="flex items-center gap-3">
          <MicroLabel className="mb-2">Galaxy</MicroLabel>
          <HelpBubble title="Galaxy" className="mb-2">
            <HelpText
              what="The shared field of raw potential. Your system condensed from your nebula — and this is the larger cloud it belongs to. One day, the systems of your tribe will shine here too."
              why="No one becomes alone. The galaxy is where your formation meets the people forming alongside you — visible only where allowed, on both sides."
              how="For now, your system is the first light. The tribe forms in three steps: you add your people, they join, their systems appear — only with approval."
            />
          </HelpBubble>
        </div>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Your System in the Larger Cloud
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
          Galaxies condense from nebulae. Yours did — and this is the field
          it belongs to. The lights of your tribe will gather here, only
          where allowed.
        </p>
      </header>

      <Card className="axzio-rise axzio-rise-1 relative overflow-hidden p-2 md:p-4">
        <svg
          viewBox="0 0 900 520"
          role="img"
          aria-label="Your system as the first light in the shared cloud"
          className="h-auto w-full select-none"
        >
          <defs>
            <radialGradient id="gx-cloudV">
              <stop offset="0%" stopColor="#6d5bd0" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#6d5bd0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gx-cloudT">
              <stop offset="0%" stopColor="#2e8f9e" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#2e8f9e" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gx-cloudI">
              <stop offset="0%" stopColor="#3b4a8f" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#3b4a8f" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="gx-core">
              <stop offset="0%" stopColor="#d8a94e" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#d8a94e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* the larger cloud */}
          <ellipse cx="200" cy="140" rx="260" ry="150" fill="url(#gx-cloudV)" />
          <ellipse cx="720" cy="380" rx="280" ry="160" fill="url(#gx-cloudT)" />
          <ellipse cx="680" cy="120" rx="200" ry="120" fill="url(#gx-cloudI)" />
          <ellipse cx="180" cy="420" rx="220" ry="130" fill="url(#gx-cloudI)" />
          <ellipse cx="450" cy="260" rx="180" ry="120" fill="url(#gx-cloudV)" opacity="0.6" />

          {/* emergence ripples around your system */}
          {[110, 150, 195].map((r) => (
            <circle
              key={r}
              cx="450"
              cy="260"
              r={r}
              fill="none"
              stroke="rgba(216,169,78,0.14)"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
          ))}

          {/* your system */}
          <circle cx="450" cy="260" r="46" fill="url(#gx-core)" />
          <circle
            cx="450"
            cy="260"
            r="70"
            fill="none"
            stroke="rgba(216,169,78,0.35)"
            strokeWidth="1"
            strokeDasharray="5 6"
          />
          <circle
            cx="450"
            cy="260"
            r="15"
            fill="#0a0a10"
            stroke="#d8a94e"
            strokeWidth="1.8"
            style={{ filter: "drop-shadow(0 0 14px #d8a94e)" }}
          />
          {shown.map((c, i) => {
            const a = (i / Math.max(shown.length, 1)) * Math.PI * 2 - Math.PI / 2;
            const x = 450 + Math.cos(a) * 70;
            const y = 260 + Math.sin(a) * 70;
            return (
              <g key={c.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#050508"
                  stroke="#d8a94e"
                  strokeWidth="1.4"
                  style={{ filter: "drop-shadow(0 0 8px #d8a94e)" }}
                />
                <title>{c.text}</title>
              </g>
            );
          })}
          <text
            x="450"
            y="372"
            textAnchor="middle"
            fill="rgba(255,255,255,0.85)"
            fontSize="12"
            letterSpacing="4"
          >
            YOUR SYSTEM
          </text>
          <text
            x="450"
            y="392"
            textAnchor="middle"
            fill="rgba(216,169,78,0.7)"
            fontSize="10"
            letterSpacing="2"
          >
            THE FIRST LIGHT
          </text>
        </svg>
        <p className="px-3 pb-2 text-[10px] uppercase tracking-[0.24em] text-white/30">
          You are the first light here — tribe systems appear only where allowed
        </p>
      </Card>

      <div className="axzio-rise axzio-rise-2 mt-6 grid gap-4 md:grid-cols-3">
        {[
          {
            n: "1",
            t: "You add your people",
            d: "The tribe starts as your own list — the people your commitments already serve.",
          },
          {
            n: "2",
            t: "They join",
            d: "Invite the real person. Nothing is visible until they accept.",
          },
          {
            n: "3",
            t: "Systems merge",
            d: "On approval, your entry links to their system — and their light joins this cloud.",
          },
        ].map((s) => (
          <Card key={s.n} className="p-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#d8a94e]">
              Step {s.n}
            </p>
            <p className="mt-2 text-[15px] font-light text-white/90">{s.t}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-white/45">{s.d}</p>
          </Card>
        ))}
      </div>
      <p className="axzio-rise axzio-rise-3 mt-4 text-[12px] tracking-wide text-white/35">
        The tribe layer is on the horizon — this view will populate as it forms.
      </p>
    </div>
  );
}
