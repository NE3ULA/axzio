import { useEffect, useRef, useState } from "react";
import { useAxzio } from "../store.jsx";

/* ------------------------------------------------------------------ */
/* QuickCapture — the front door. One tap (or the C key) from anywhere: */
/* a single field, zero decisions. Enter → spark. The Bridge's Sparks   */
/* section is the inbox; ignite or compost later. Capture makes no       */
/* triage decisions — that's what makes it fast.                         */
/* ------------------------------------------------------------------ */

export default function QuickCapture() {
  const { addSignal } = useAxzio();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [whisper, setWhisper] = useState("");
  const inputRef = useRef(null);
  const whisperTimer = useRef(null);

  const close = () => {
    setOpen(false);
    setText("");
  };

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (addSignal(t)) {
      close();
      setWhisper("Spark captured ✓");
      clearTimeout(whisperTimer.current);
      whisperTimer.current = setTimeout(() => setWhisper(""), 2400);
    }
  };

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open ]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (open) close();
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const tag = (el?.tagName || "").toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        el?.isContentEditable
      )
        return;
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open ]);

  useEffect(() => () => clearTimeout(whisperTimer.current), []);

  return (
    <>
      {whisper && (
        <div className="fixed bottom-24 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-[#d8a94e]/40 bg-black/90 px-5 py-2.5 text-[13px] tracking-wide text-white/90 backdrop-blur-md">
          {whisper}
        </div>
      )}
      {open && (
        <div className="fixed bottom-24 right-5 z-[60] w-[min(340px,calc(100vw-40px))]">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-white/15 bg-[#0b0b12]/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-md"
          >
            <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
              Capture a spark
            </p>
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's alive right now?"
              maxLength={280}
              aria-label="Capture a spark"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[16px] text-white placeholder:text-white/30 focus:border-[#d8a94e]/50 focus:outline-none"
            />
            <p className="mt-2 text-[11px] text-white/35">
              Enter to capture · Esc to close
            </p>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={open ? "Close capture" : "Capture a spark (C)"}
        className="fixed bottom-5 right-5 z-[60] flex h-14 w-14 items-center justify-center rounded-full border border-[#d8a94e]/50 bg-[#0b0b12]/95 text-[26px] font-light text-[#d8a94e] shadow-xl shadow-black/50 backdrop-blur-md transition-transform hover:scale-105 active:scale-95"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <span
          className={`transition-transform duration-200 ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
    </>
  );
}
