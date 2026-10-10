/* AI.d Weekly Review — the structural shell.
 *
 * The intelligence layer ships later (as an optional paid tier). Until
 * then this view is honest scaffolding: the master toggle, the
 * per-surface sovereignty toggles, and the review slot the layer will
 * fill. Nothing here simulates intelligence — an empty review list
 * renders an empty state, never invented insight.
 *
 * Entry: #/aid.
 */
import { useAxzio } from "../store.jsx";
import {
  Card,
  MicroLabel,
  HelpBubble,
  HelpText,
  Btn,
  Empty,
  SectionHead,
} from "../components/ui.jsx";

const SURFACES = [
  {
    key: "readBattery",
    label: "Battery & energy",
    desc: "Your daily battery readings and what moves them.",
  },
  {
    key: "readActions",
    label: "Actions & completions",
    desc: "What you did, what you finished, what slipped.",
  },
  {
    key: "readThreads",
    label: "Threads & constellation",
    desc: "Your seeds, threads, and how they're moving.",
  },
  {
    key: "readJournal",
    label: "Journal & reset content",
    desc: "The words inside your resets and reflections.",
  },
];

function SurfaceToggle({ surface }) {
  const axzio = useAxzio();
  const { state } = axzio;
  const on = !!(state.aid && state.aid[surface.key]);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-[14px] text-white/85">{surface.label}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/40">
          {surface.desc}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Let AI.d read ${surface.label}`}
        onClick={() => axzio.setAidRead(surface.key, !on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-[#d8a94e]/70" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            on ? "left-[22px]" : "left-0.5"
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

function ReviewCard({ review }) {
  const axzio = useAxzio();
  const pending = (review.suggestions || []).filter(
    (s) => !s.status || s.status === "pending"
  );
  const decided = (review.suggestions || []).filter(
    (s) => s.status === "confirmed" || s.status === "dismissed"
  );
  return (
    <Card className="border-[#d8a94e]/30 p-6">
      <MicroLabel className="mb-2 text-[#d8a94e]/80">
        Weekly review ·{" "}
        {new Date(review.weekStart).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })}
      </MicroLabel>
      <h2 className="text-xl font-light">Your week, read back to you.</h2>
      <p className="mt-3 text-[14.5px] leading-relaxed text-white/65">
        {review.pattern}
      </p>
      {pending.length > 0 && (
        <div className="mt-5">
          <MicroLabel className="mb-2">Suggested — confirm to enter</MicroLabel>
          <div className="space-y-2">
            {pending.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
              >
                <div className="flex-1">
                  <p className="text-[14px] text-white/80">{s.text}</p>
                  {s.why && (
                    <p className="mt-1 text-[12.5px] text-white/40">{s.why}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      axzio.decideAidSuggestion(review.id, s.id, "confirmed")
                    }
                    aria-label="Confirm suggestion"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8a94e]/60 text-[#d8a94e] transition-colors hover:bg-[#d8a94e]/10"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      axzio.decideAidSuggestion(review.id, s.id, "dismissed")
                    }
                    aria-label="Dismiss suggestion"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/50 transition-colors hover:border-white/50 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-white/35">
            Nothing enters your system unconfirmed. Dismissed suggestions never
            return.
          </p>
        </div>
      )}
      {decided.length > 0 && (
        <div className="mt-4">
          <MicroLabel className="mb-2">Decided</MicroLabel>
          <ul className="space-y-1">
            {decided.map((s) => (
              <li key={s.id} className="text-[13px] text-white/40">
                <span
                  className={
                    s.status === "confirmed" ? "text-[#d8a94e]/70" : ""
                  }
                >
                  {s.status === "confirmed" ? "✓" : "✕"}
                </span>{" "}
                {s.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

export default function AidReview() {
  const axzio = useAxzio();
  const { state } = axzio;
  const aiEnabled = !!(state.settings && state.settings.aiEnabled);
  const aid = state.aid || { reviews: [] };
  const reviews = aid.reviews || [];

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <SectionHead
        label="AI.d"
        help={
          <HelpBubble title="AI.d">
            <HelpText
              what="Your AI companion — weekly pattern reviews and suggestions, on your terms."
              why="The app is fully functional without it. AI.d is a layer you opt into, never a lock-in."
              how="Enable it, choose what it may read, and confirm or dismiss every suggestion. The intelligence layer itself ships later as an optional paid tier."
            />
          </HelpBubble>
        }
      />
      <h1 className="text-3xl font-light tracking-wide">It sees what you let it see.</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/55">
        AI.d reads <span className="text-white/85">only</span> the surfaces you
        enable — and every suggestion waits for your yes. Prompts never command.
      </p>

      {!aiEnabled ? (
        <Card className="mt-8 p-8 text-center">
          <MicroLabel className="mb-3">AI.d is off</MicroLabel>
          <h2 className="text-2xl font-light">The companion is waiting.</h2>
          <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-white/55">
            AXZIO is fully usable without it. Enable AI.d to be first in line
            when the intelligence layer launches — your reading preferences
            below are saved either way.
          </p>
          <Btn
            variant="primary"
            onClick={() => axzio.setAiEnabled(true)}
            className="mt-6"
          >
            Enable AI.d
          </Btn>
          <p className="mt-4 text-[12px] text-white/35">
            Coming as an optional paid tier in a future update.
          </p>
        </Card>
      ) : (
        <>
          <div className="mt-8 space-y-2">
            {reviews.length === 0 ? (
              <Card className="p-8">
                <MicroLabel className="mb-3 text-[#d8a94e]/80">
                  Weekly review
                </MicroLabel>
                <Empty>
                  No review yet. The intelligence layer isn't connected —
                  when it ships, your weekly pattern review lands here. Nothing
                  on this screen is generated until then.
                </Empty>
              </Card>
            ) : (
              reviews
                .slice()
                .sort((a, b) => (b.weekStart || 0) - (a.weekStart || 0))
                .map((r) => <ReviewCard key={r.id} review={r} />)
            )}
          </div>

          <Card className="mt-8 p-6">
            <SectionHead label="What AI.d may read" />
            <div className="divide-y divide-white/10">
              {SURFACES.map((s) => (
                <SurfaceToggle key={s.key} surface={s} />
              ))}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-white/40">
              Pause anytime by disabling AI.d — the app keeps working exactly
              as before.
            </p>
            <button
              type="button"
              onClick={() => axzio.setAiEnabled(false)}
              className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
            >
              Disable AI.d
            </button>
          </Card>
        </>
      )}

      {!aiEnabled && (
        <Card className="mt-8 p-6 opacity-80">
          <SectionHead label="What AI.d may read" />
          <div className="divide-y divide-white/10">
            {SURFACES.map((s) => (
              <SurfaceToggle key={s.key} surface={s} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
