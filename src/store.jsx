import { createContext, useContext, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/* AXZIO state store — single source of truth, persisted to localStorage */
/* ------------------------------------------------------------------ */

export const STORAGE_KEY = "axzio-state-v1";

/** Local calendar date as YYYY-MM-DD (not UTC — the user's day). */
export function localDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatLongDate(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/* Canonical 4-line mantra anchors (NE3ULA world docs). */
export const MANTRA = [
  { key: "gratitude", label: "Be Grateful", hint: "Gratitude for existence" },
  { key: "beauty", label: "See Beauty", hint: "Perception of meaning" },
  { key: "action", label: "Take Action", hint: "Movement into embodiment" },
  { key: "love", label: "Give Love", hint: "Relational generosity" },
];

/* The Four Primitives (E3 human engine, identity stack). */
export const PRIMITIVES = [
  {
    key: "money",
    label: "Money",
    desc: "Resource stability, survival bandwidth, material grounding.",
  },
  {
    key: "engagement",
    label: "Engagement",
    desc: "Relational interface — boundaries, reciprocity, participation.",
  },
  {
    key: "building",
    label: "Building",
    desc: "Purpose and contribution — what you are here to make.",
  },
  {
    key: "being",
    label: "Being",
    desc: "Expression, aliveness, lived selfhood.",
  },
];

/* The Human Battery (WE ARE ALCHEMY, ch. TUNING): five dimensions of
   available capacity. State is not identity. */
export const BATTERY = [
  {
    key: "physical",
    label: "Physical",
    desc: "Sleep, nourishment, movement, pain, recovery — the body's current demand.",
  },
  {
    key: "mental",
    label: "Mental",
    desc: "Attention, clarity, cognitive load, unfinished loops competing for awareness.",
  },
  {
    key: "emotional",
    label: "Emotional",
    desc: "Feelings in motion, the effort to regulate them, what is unprocessed.",
  },
  {
    key: "social",
    label: "Social",
    desc: "Connection, belonging, boundaries, conflict, care, loneliness, demand.",
  },
  {
    key: "purpose",
    label: "Purpose",
    desc: "Meaning, direction, contribution — what the effort belongs to.",
  },
];

/* The master practice loop — the Alchemist Path (WE ARE ALCHEMY, ch. INTEGRATION). */
export const PHASES = ["Reveal", "Interpret", "Align", "Act", "Integrate"];

/* The Eisenhower Matrix quadrants, as a prioritization lens inside the
   E3 decision engine: separate urgency from importance; preserve
   attention for aligned action. */
export const QUADRANTS = [
  {
    key: "q1",
    label: "Do",
    sub: "Urgent + important",
    desc: "Crises, deadlines, problems that cannot wait. Enter and resolve.",
  },
  {
    key: "q2",
    label: "Decide",
    sub: "Not urgent + important",
    desc: "Schedule it. This is where aligned action is protected — commitments, craft, becoming.",
  },
  {
    key: "q3",
    label: "Delegate",
    sub: "Urgent + not important",
    desc: "Interruptions, other people's urgencies. Hand off, defer, or decline with a boundary.",
  },
  {
    key: "q4",
    label: "Release",
    sub: "Neither urgent nor important",
    desc: "Retain, revise, release, or repeat — but do not let it pose as work.",
  },
];

/* The Identity Launch Sequence (WE ARE ALCHEMY, ch. LIVE YOUR LEGEND):
   a map of movement, not a measure of rank. Each stage names the
   movement the stage is asking for. */
export const LAUNCH_STAGES = [
  {
    key: "love",
    label: "Love",
    move: "Discover what matters",
    desc: "Before direction becomes strategy, something matters. Love creates the reason to move.",
    suggestion:
      "Name what you care for, ache for, or feel protective of. Let it tell you why the question matters.",
  },
  {
    key: "hope",
    label: "Hope",
    move: "Permit possibility",
    desc: "Not certainty — the willingness to leave the future open.",
    suggestion:
      "Refuse to declare the present condition final. Leave enough space for participation to remain available.",
  },
  {
    key: "dream",
    label: "Dream",
    move: "Give possibility form",
    desc: "Dreaming is an act of orientation: an image of what could be.",
    suggestion:
      "Ask: what could this love become? What life would allow it to breathe? Give desire a visible form.",
  },
  {
    key: "believe",
    label: "Believe",
    move: "Invest before certainty",
    desc: "Belief is sufficient trust to invest — before the outcome is guaranteed.",
    suggestion:
      "Give time, attention, or care to the possibility now. Test it against reality instead of waiting for proof.",
  },
  {
    key: "begin",
    label: "Begin",
    move: "Cross the threshold",
    desc: "Beginning changes the relationship: the dream enters contact with time, material, and consequence.",
    suggestion:
      "Take one small, real first action. End the fantasy that more thinking can substitute for participation.",
  },
  {
    key: "build",
    label: "Build",
    move: "Create evidence and structure",
    desc: "The patient conversion of meaning into form — rhythms, conditions, skills, relationships.",
    suggestion:
      "Create a rhythm that reduces the distance between intention and action. Repeat what works; revise what does not.",
  },
  {
    key: "become",
    label: "Become",
    move: "Let participation change you",
    desc: "The work is no longer only something you do — it is changing the person doing it.",
    suggestion:
      "Stay committed and revisable. Give form to who you choose to be, then learn from who that choice reveals.",
  },
  {
    key: "legend",
    label: "Live Your Legend",
    move: "Embody the story",
    desc: "Identity, meaning, and action begin to recognize one another in ordinary life.",
    suggestion:
      "Make the chosen identity visible today — in care, craft, contribution. When you drift, return and choose again.",
  },
  {
    key: "myth",
    label: "Forge the Myth",
    move: "Make meaning from experience",
    desc: "Choosing how lived truth will be carried forward — what the experience revealed and earned.",
    suggestion:
      "Name what was tested, what you will protect, and what you refuse to repeat. Let the forged story orient the next cycle.",
  },
];
/** All tags usable on actions: mantra anchors + primitives. */
export const TAGS = [
  ...MANTRA.map((m) => ({ key: m.key, label: m.label, group: "Mantra" })),
  ...PRIMITIVES.map((p) => ({ key: p.key, label: p.label, group: "Primitive" })),
];

export function tagLabel(key) {
  const t = TAGS.find((t) => t.key === key);
  return t ? t.label : key;
}

function defaultState() {
  return {
    version: 1,
    identity: {
      name: "",
      // The four orientation statements (WE ARE ALCHEMY, ch. AUTHORSHIP).
      becoming: "", // "I am choosing to become someone who…"
      standFor: "", // "I stand for…"
      practice: "", // "I practice…"
      returnThrough: "", // "When I drift, I return through…"
      values: [],
      commitments: [],
      setupComplete: false,
    },
    // "YYYY-MM-DD" -> { mantra: {gratitude,beauty,action,love}, intention, battery: {physical,mental,emotional,social,purpose} }
    days: {},
    actions: [], // { id, date, ts, text, tag }
    signals: [], // { id, date, ts, text }
    stars: [], // { id, name, note, created }
    assessments: [], // { id, date, ts, money, engagement, building, being }
    // Decision Engine — Eisenhower matrix items.
    // { id, text, quadrant: q1|q2|q3|q4, commitmentId, oneThing, done, created }
    focusItems: [],
    // Identity Launch Sequence locator: stage key or null.
    launchStage: null,
  };
}

function blankDay() {
  return {
    mantra: { gratitude: false, beauty: false, action: false, love: false },
    intention: "",
    battery: { physical: 5, mental: 5, emotional: 5, social: 5, purpose: 5 },
  };
}

/** Read-only accessor for a day's state (never mutates). */
export function getDayState(state, key) {
  return state.days[key] || blankDay();
}

export function actionsOn(state, key) {
  return state.actions.filter((a) => a.date === key);
}

export function signalsOn(state, key) {
  return state.signals.filter((s) => s.date === key);
}

/** Consecutive days with >= 1 action, counting back from today. */
export function computeStreak(state) {
  let streak = 0;
  const d = new Date();
  if (actionsOn(state, localDateKey(d)).length === 0) {
    d.setDate(d.getDate() - 1);
  }
  while (actionsOn(state, localDateKey(d)).length > 0) {
    streak += 1;
    d.setDate(d.getDate() - 1);
    if (streak > 3650) break; // safety valve
  }
  return streak;
}

function uid() {
  return (
    Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  );
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("unexpected shape");
    }
    const base = defaultState();

    /* Migrate the pre-e-book identity shape: the old "authored identity"
       field becomes the first orientation statement, the old "core
       orientation" field becomes the second. */
    const oldIdentity =
      parsed.identity && typeof parsed.identity === "object"
        ? parsed.identity
        : {};
    const identity = { ...base.identity, ...oldIdentity };
    if (!identity.becoming && typeof oldIdentity.authored === "string") {
      identity.becoming = oldIdentity.authored;
    }
    if (!identity.standFor && typeof oldIdentity.orientation === "string") {
      identity.standFor = oldIdentity.orientation;
    }
    delete identity.authored;
    delete identity.orientation;

    /* Normalize saved days: older entries predate the battery check. */
    const blank = blankDay();
    const rawDays =
      parsed.days && typeof parsed.days === "object" ? parsed.days : {};
    const days = {};
    for (const [k, d] of Object.entries(rawDays)) {
      if (!d || typeof d !== "object") continue;
      days[k] = {
        ...blank,
        ...d,
        mantra: { ...blank.mantra, ...(d.mantra || {}) },
        battery: { ...blank.battery, ...(d.battery || {}) },
      };
    }

    const validQuadrants = new Set(["q1", "q2", "q3", "q4"]);
    const focusItems = Array.isArray(parsed.focusItems)
      ? parsed.focusItems.filter((f) => f && typeof f === "object")
      : [];

    return {
      ...base,
      ...parsed,
      identity,
      days,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      stars: Array.isArray(parsed.stars) ? parsed.stars : [],
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      focusItems: focusItems.map((f) => ({
        id: String(f.id ?? ""),
        text: String(f.text ?? ""),
        quadrant: validQuadrants.has(f.quadrant) ? f.quadrant : "q2",
        commitmentId: f.commitmentId ?? null,
        oneThing: f.oneThing === true,
        done: f.done === true,
        created: Number(f.created) || 0,
      })),
      launchStage:
        typeof parsed.launchStage === "string" &&
        LAUNCH_STAGES.some((s) => s.key === parsed.launchStage)
          ? parsed.launchStage
          : null,
    };
  } catch {
    // Corrupted storage: quarantine the raw value, start clean.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        localStorage.setItem(`${STORAGE_KEY}.corrupt-${Date.now()}`, raw);
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable — run in-memory */
    }
    return defaultState();
  }
}

const AxzioContext = createContext(null);

export function useAxzio() {
  const ctx = useContext(AxzioContext);
  if (!ctx) throw new Error("useAxzio must be used inside AxzioProvider");
  return ctx;
}

export function AxzioProvider({ children }) {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — state stays in memory */
    }
  }, [state]);

  // Deep-clone, mutate the draft, replace. State is JSON-safe.
  const update = (fn) =>
    setState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      return next;
    });

  const ensureDay = (draft, key) => {
    if (!draft.days[key]) draft.days[key] = blankDay();
    return draft.days[key];
  };

  const api = {
    state,

    /* identity */
    completeSetup(name, authored) {
      update((d) => {
        d.identity.name = name.trim();
        // First-run statement feeds the first orientation statement.
        d.identity.becoming = authored.trim();
        d.identity.setupComplete = true;
      });
    },
    updateIdentity(patch) {
      update((d) => {
        Object.assign(d.identity, patch);
      });
    },
    addIdentityListItem(list, value) {
      const v = value.trim();
      if (!v) return;
      update((d) => {
        if (Array.isArray(d.identity[list])) d.identity[list].push(v);
      });
    },
    removeIdentityListItem(list, index) {
      update((d) => {
        if (Array.isArray(d.identity[list])) d.identity[list].splice(index, 1);
      });
    },

    /* daily */
    setMantra(key, anchor, val) {
      update((d) => {
        ensureDay(d, key).mantra[anchor] = val;
      });
    },
    setIntention(key, text) {
      update((d) => {
        ensureDay(d, key).intention = text;
      });
    },

    /* actions */
    addAction(text, tag, key = localDateKey()) {
      const t = text.trim();
      if (!t) return null;
      const entry = { id: uid(), date: key, ts: Date.now(), text: t, tag };
      update((d) => {
        d.actions.push(entry);
      });
      return entry;
    },
    deleteAction(id) {
      update((d) => {
        d.actions = d.actions.filter((a) => a.id !== id);
      });
    },

    /* signals */
    addSignal(text, key = localDateKey()) {
      const t = text.trim();
      if (!t) return null;
      const entry = { id: uid(), date: key, ts: Date.now(), text: t };
      update((d) => {
        d.signals.push(entry);
      });
      return entry;
    },
    deleteSignal(id) {
      update((d) => {
        d.signals = d.signals.filter((s) => s.id !== id);
      });
    },

    /* stars (user constellation nodes) */
    addStar(name, note = "") {
      const n = name.trim();
      if (!n) return null;
      const star = { id: uid(), name: n, note: note.trim(), created: Date.now() };
      update((d) => {
        d.stars.push(star);
      });
      return star;
    },
    deleteStar(id) {
      update((d) => {
        d.stars = d.stars.filter((s) => s.id !== id);
      });
    },

    /* primitive assessments */
    saveAssessment(scores) {
      const entry = {
        id: uid(),
        date: localDateKey(),
        ts: Date.now(),
        money: clamp(scores.money),
        engagement: clamp(scores.engagement),
        building: clamp(scores.building),
        being: clamp(scores.being),
      };
      update((d) => {
        d.assessments.push(entry);
      });
      return entry;
    },

    /* human battery (daily state check) */
    setBattery(key, dim, val) {
      if (!BATTERY.some((b) => b.key === dim)) return;
      update((d) => {
        ensureDay(d, key).battery[dim] = clamp(val);
      });
    },

    /* decision engine — Eisenhower matrix items */
    addFocusItem(text, quadrant = "q2") {
      const t = text.trim();
      if (!t) return null;
      const q = ["q1", "q2", "q3", "q4"].includes(quadrant) ? quadrant : "q2";
      const entry = {
        id: uid(),
        text: t,
        quadrant: q,
        commitmentId: null,
        oneThing: false,
        done: false,
        created: Date.now(),
      };
      update((d) => {
        d.focusItems.push(entry);
      });
      return entry;
    },
    moveFocusItem(id, quadrant) {
      if (!["q1", "q2", "q3", "q4"].includes(quadrant)) return;
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (f) f.quadrant = quadrant;
      });
    },
    toggleFocusDone(id) {
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (f) f.done = !f.done;
      });
    },
    deleteFocusItem(id) {
      update((d) => {
        d.focusItems = d.focusItems.filter((x) => x.id !== id);
      });
    },
    linkFocusCommitment(id, commitmentId) {
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (f) f.commitmentId = commitmentId || null;
      });
    },
    /** Exactly one item may hold the One Thing at a time. */
    setOneThing(id) {
      update((d) => {
        for (const f of d.focusItems) f.oneThing = f.id === id;
      });
    },

    /* identity launch sequence locator */
    setLaunchStage(stageKey) {
      update((d) => {
        d.launchStage = LAUNCH_STAGES.some((s) => s.key === stageKey)
          ? stageKey
          : null;
      });
    },

    /* nuclear option */
    resetAll() {
      const fresh = defaultState();
      setState(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch {
        /* ignore */
      }
    },
  };

  return (
    <AxzioContext.Provider value={api}>{children}</AxzioContext.Provider>
  );
}

function clamp(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 1;
  return Math.min(10, Math.max(1, Math.round(n)));
}
