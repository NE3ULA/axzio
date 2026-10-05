import { useMemo } from "react";

/**
 * Fixed full-screen starfield: randomly placed dots with a CSS twinkle.
 * Purely decorative (aria-hidden), cheap to render, no canvas needed.
 */
export default function Starfield({ count = 130 }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 0.6 + Math.random() * 1.8,
        delay: Math.random() * 5,
        duration: 2.4 + Math.random() * 4,
        peak: 0.25 + Math.random() * 0.65,
      })),
    [count]
  );

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* faint nebula glow — kept subtle so the black stays cinematic */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,255,255,0.055), transparent 70%), radial-gradient(ellipse 70% 50% at 50% 110%, rgba(255,255,255,0.035), transparent 70%)",
        }}
      />
      {stars.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            borderRadius: 9999,
            background: "#fff",
            opacity: s.peak,
            animation: `axzio-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
