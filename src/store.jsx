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

/* The four orientation micro-practices — one per mantra anchor. Each is
   named and asks for something specific, saved per day under
   days[date].orientation. A practice counts as complete when it has text;
   the done flag can also be set/cleared by hand. */
export const ORIENTATION_PRACTICES = [
  {
    key: "gratitude",
    label: "Be Grateful",
    prompt: "What are you grateful for right now?",
  },
  {
    key: "beauty",
    label: "See Beauty",
    prompt: "What beauty did you notice today?",
  },
  {
    key: "action",
    label: "Take Action",
    prompt: "One action you will take today",
    focusLink: true, // links into #/focus
  },
  {
    key: "love",
    label: "Give Love",
    prompt: "One thing you will do today for someone else",
  },
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
/* The three Modes of Energy (WE ARE ALCHEMY, ch. TUNING): temporary
   ways attention and effort are being organized. No mode is superior —
   problems arise when one mode claims the whole system. */
export const MODES = [
  {
    key: "production",
    label: "Production",
    organizes:
      "Decision, action, structure, momentum, output, and impact.",
    gift: "Turns intention into visible form.",
    risk:
      "Can fuse self-worth with output; fear-driven hustle; rigid structure maintained after meaning has left. Production without Pleasure becomes extractive.",
  },
  {
    key: "pleasure",
    label: "Pleasure",
    organizes:
      "Presence, restoration, sensation, joy, and receptive aliveness.",
    gift: "Returns you to the body; reminds you that rest is part of transformation.",
    risk:
      "Can become indulgence, avoidance, or numbing mistaken for nourishment. Pleasure without direction can become escape.",
  },
  {
    key: "people",
    label: "People",
    organizes: "Relationship, belonging, feedback, connection, and care.",
    gift: "Creates intimacy, collaboration, recognition, and growth through contact.",
    risk:
      "Can become validation dependence, emotional entanglement, social masking, or self-loss. People without boundaries becomes self-loss.",
  },
];

/* The intervals on which a mode can be set: each gets a primary and a
   secondary mode. */
export const MODE_INTERVALS = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

export function modeLabel(key) {
  const m = MODES.find((m) => m.key === key);
  return m ? m.label : null;
}

/* The seven fields of a Guided Reset (mirrors the guided practice at
   ne3ula.com/e3-reset/guided): Situation, then the Alchemist Path —
   Reveal → Interpret → Align → Act — plus a LifeMod, then Integrate. */
export const RESET_FIELDS = [
  { key: "situation", label: "Situation" },
  { key: "reveal", label: "Reveal" },
  { key: "interpret", label: "Interpret" },
  { key: "align", label: "Align" },
  { key: "act", label: "Act" },
  { key: "lifemod", label: "LifeMod" },
  { key: "integrate", label: "Integrate" },
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

/* The Four Pillars (WE ARE ALCHEMY, ch. INTEGRATION): the four lenses
   the *person* is read through — distinct from the Four Primitives,
   which read the *life* (its domains and conditions). Together, the
   pillars prevent transformation from collapsing into thought alone. */
export const PILLARS = [
  {
    key: "mind",
    label: "Mind",
    desc: "What you understand, believe, and perceive.",
  },
  {
    key: "body",
    label: "Body",
    desc: "What you sense, carry, enact, and physically require.",
  },
  {
    key: "heart",
    label: "Heart",
    desc: "What you feel, love, grieve, fear, and need in relationship.",
  },
  {
    key: "spirit",
    label: "Spirit",
    desc: "What gives experience meaning, direction, connection, or sacred weight.",
  },
];

export function pillarLabel(key) {
  const p = PILLARS.find((p) => p.key === key);
  return p ? p.label : null;
}

/* Focus item timeframes. Items are tagged by timeframe, mode, and
   pillar so effort can be analyzed across dimensions over time
   (future AI.D nudges read these tags). */
export const TIMEFRAMES = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "year", label: "Year" },
];

export function timeframeLabel(key) {
  const t = TIMEFRAMES.find((t) => t.key === key);
  return t ? t.label : "Day";
}

const TIMEFRAME_KEYS = new Set(TIMEFRAMES.map((t) => t.key));

/* Priority ranks per timeframe. Each rank (1|2|3) is unique within its
   timeframe — week/month/year each hold their own independent 1/2/3.
   Rank 1 is the one thing to focus on. */
export const PRIORITY_RANKS = [
  { rank: 1, label: "1st", note: "the one thing to focus on" },
  { rank: 2, label: "2nd", note: null },
  { rank: 3, label: "3rd", note: null },
];

export function priorityLabel(rank) {
  const r = PRIORITY_RANKS.find((r) => r.rank === rank);
  if (!r) return null;
  return r.note ? `${r.label} — ${r.note}` : r.label;
}

/* Week items repeat on selected days (0 = Sunday … 6 = Saturday);
   month items repeat in selected months (0 = January … 11 = December). */
export const DAYS_OF_WEEK = [
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
  { key: 0, label: "Sun" },
];

export const MONTHS_OF_YEAR = [
  { key: 0, label: "Jan" },
  { key: 1, label: "Feb" },
  { key: 2, label: "Mar" },
  { key: 3, label: "Apr" },
  { key: 4, label: "May" },
  { key: 5, label: "Jun" },
  { key: 6, label: "Jul" },
  { key: 7, label: "Aug" },
  { key: 8, label: "Sep" },
  { key: 9, label: "Oct" },
  { key: 10, label: "Nov" },
  { key: 11, label: "Dec" },
];

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
      // Commitments are ordered objects [{ id, text, order }]; array
      // order IS the priority (order 0 = highest). Focus items link by
      // commitment id, never by position.
      commitments: [],
      setupComplete: false,
      // First-use walkthrough (replaces the bare setup screen). Existing
      // users who finished the old setup never see it.
      onboarded: false,
      onboardingStep: 0,
    },
    // "YYYY-MM-DD" -> { mantra: {gratitude,beauty,action,love},
    //   orientation: { <anchor>: { text, done } }, intention,
    //   battery: {physical,mental,emotional,social,purpose} }
    days: {},
    actions: [], // { id, date, ts, text, tag }
    signals: [], // { id, date, ts, text }
    stars: [], // { id, name, note, created }
    assessments: [], // { id, date, ts, money, engagement, building, being }
    // Decision Engine — Eisenhower matrix items. Entries are living
    // objects: editable text, quadrant, commitment link, notes, and
    // subtasks — plus timeframe ('day'|'week'|'month'|'year'),
    // repeat selections (daysOfWeek [0-6], months [0-11]), mode and
    // pillar tags, per-timeframe priority rank (1|2|3, unique within
    // the timeframe), and optional parentId nesting (linked subtasks).
    // { id, text, quadrant: q1|q2|q3|q4, commitmentId, priority, done,
    // notes, subtasks: [{id, text, done}], timeframe, daysOfWeek,
    // months, mode, pillar, parentId, created }
    focusItems: [],
    // Identity Launch Sequence locator: stage key or null.
    launchStage: null,
    // Modes of Energy: `current` is the mode I'm IN right now
    // (descriptive, single nullable value). Per interval (day/week/month),
    // primary + secondary are where FOCUS goes (prescriptive intention).
    // Mode keys: production | pleasure | people | null.
    modes: {
      current: null,
      day: { primary: null, secondary: null },
      week: { primary: null, secondary: null },
      month: { primary: null, secondary: null },
    },
    // Guided Reset completions (private, local only):
    // { id, ts, date, situation, reveal, interpret, align, act, lifemod, integrate }
    resets: [],
  };
}

function blankDay() {
  return {
    mantra: { gratitude: false, beauty: false, action: false, love: false },
    // Orientation micro-practices: one text entry per mantra anchor.
    // { gratitude: { text, done }, beauty: {...}, action: {...}, love: {...} }
    orientation: {
      gratitude: { text: "", done: false },
      beauty: { text: "", done: false },
      action: { text: "", done: false },
      love: { text: "", done: false },
    },
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

/** Normalize saved mode selections; unknown keys fall back to null. */
function normalizeModes(raw) {
  const blank = {
    current: null,
    day: { primary: null, secondary: null },
    week: { primary: null, secondary: null },
    month: { primary: null, secondary: null },
  };
  if (!raw || typeof raw !== "object") return blank;
  const valid = new Set(MODES.map((m) => m.key));
  const current = valid.has(raw.current) ? raw.current : null;
  const out = { current };
  for (const interval of ["day", "week", "month"]) {
    const r = raw[interval] && typeof raw[interval] === "object" ? raw[interval] : {};
    const primary = valid.has(r.primary) ? r.primary : null;
    let secondary = valid.has(r.secondary) ? r.secondary : null;
    if (secondary === primary) secondary = null; // primary wins a conflict
    out[interval] = { primary, secondary };
  }
  return out;
}

/** Normalize saved guided resets; anything malformed is dropped. */
function normalizeResets(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      id: String(r.id ?? ""),
      ts: Number(r.ts) || 0,
      date: typeof r.date === "string" ? r.date : "",
      situation: String(r.situation ?? ""),
      reveal: String(r.reveal ?? ""),
      interpret: String(r.interpret ?? ""),
      align: String(r.align ?? ""),
      act: String(r.act ?? ""),
      lifemod: String(r.lifemod ?? ""),
      integrate: String(r.integrate ?? ""),
      // Optional thread back to the Focus item that triggered this reset.
      sourceItemId: typeof r.sourceItemId === "string" ? r.sourceItemId : null,
    }))
    .filter((r) => r.id);
}

/** Normalize one focus item's subtasks; malformed entries are dropped. */
function normalizeSubtasks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === "object")
    .map((s) => ({
      id: String(s.id ?? ""),
      text: String(s.text ?? ""),
      done: s.done === true,
    }))
    .filter((s) => s.id && s.text.trim());
}

/**
 * Normalize commitments to ordered objects [{ id, text, order }].
 * Older states store plain strings — they migrate in place, keeping
 * their position as priority (0 = highest). Returns the list plus
 * lookup maps used to remap focus-item links from text to id.
 */
function normalizeCommitments(raw) {
  const arr = Array.isArray(raw) ? raw : [];
  const list = [];
  const textToId = new Map();
  arr.forEach((c, i) => {
    let text = "";
    let id = null;
    let order = i;
    if (c && typeof c === "object") {
      text = typeof c.text === "string" ? c.text : "";
      id = typeof c.id === "string" && c.id ? c.id : null;
      if (Number.isInteger(c.order)) order = c.order;
    } else {
      text = String(c ?? "");
    }
    text = text.trim();
    if (!text) return;
    if (!id) id = `cmt-${Date.now().toString(36)}-${i}`;
    if (!textToId.has(text)) textToId.set(text, id);
    list.push({ id, text: text.slice(0, 120), order });
  });
  list.sort((a, b) => a.order - b.order);
  list.forEach((c, i) => {
    c.order = i;
  });
  return { list, textToId, validIds: new Set(list.map((c) => c.id)) };
}

/**
 * Remap a focus item's commitment link: old links hold the commitment
 * text, new links hold its id. Unknown values drop to null.
 */
function remapCommitmentId(cid, textToId, validIds) {
  if (typeof cid !== "string" || !cid) return null;
  if (validIds.has(cid)) return cid;
  return textToId.get(cid) ?? null;
}

/** Read-only lookup of a commitment's text by id (links are by id). */
export function commitmentText(state, id) {
  const list = state?.identity?.commitments;
  if (!Array.isArray(list) || !id) return null;
  const c = list.find((c) => c && c.id === id);
  return c ? c.text : null;
}

/** Commitments sorted by priority (order 0 = highest). */
export function sortedCommitments(state) {
  const list = state?.identity?.commitments;
  if (!Array.isArray(list)) return [];
  return list
    .filter((c) => c && typeof c.text === "string")
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Normalize a day's orientation micro-practices. Each anchor becomes
 * { text, done }. The pre-practice mantra booleans migrate into done,
 * so a previously "held" anchor still reads as complete.
 */
function normalizeOrientation(raw, mantraRaw) {
  const out = {};
  const keys = ["gratitude", "beauty", "action", "love"];
  for (const k of keys) {
    const r = raw && typeof raw === "object" ? raw[k] : null;
    const text =
      r && typeof r.text === "string"
        ? r.text
        : typeof r === "string"
          ? r
          : "";
    const done =
      r && typeof r === "object" && r.done === true
        ? true
        : text.trim() !== ""
          ? true
          : mantraRaw && mantraRaw[k] === true;
    out[k] = { text, done: done === true };
  }
  return out;
}

const VALID_MODE_KEYS = new Set(["production", "pleasure", "people"]);
const VALID_PILLAR_KEYS = new Set(["mind", "body", "heart", "spirit"]);

/** Normalize the extended focus-item fields; old items gain defaults. */
function normalizeFocusItem(f, validQuadrants) {
  const daysOfWeek = Array.isArray(f.daysOfWeek)
    ? f.daysOfWeek.filter(
        (n) => Number.isInteger(n) && n >= 0 && n <= 6
      )
    : [];
  const months = Array.isArray(f.months)
    ? f.months.filter((n) => Number.isInteger(n) && n >= 0 && n <= 11)
    : [];
  return {
    id: String(f.id ?? ""),
    text: String(f.text ?? ""),
    quadrant: validQuadrants.has(f.quadrant) ? f.quadrant : "q2",
    commitmentId: f.commitmentId ?? null,
    // The old single "One Thing" flag migrates to priority 1 in the
    // item's timeframe; ranks are unique per timeframe.
    priority: [1, 2, 3].includes(f.priority)
      ? f.priority
      : f.oneThing === true
        ? 1
        : null,
    done: f.done === true,
    // Older items predate notes/subtasks — they gain empty defaults.
    notes: typeof f.notes === "string" ? f.notes : "",
    subtasks: normalizeSubtasks(f.subtasks),
    created: Number(f.created) || 0,
    // Timeframe + tagging layer (round 3): old items are day-scoped,
    // untagged, and top-level.
    timeframe: TIMEFRAME_KEYS.has(f.timeframe) ? f.timeframe : "day",
    daysOfWeek,
    months,
    mode: VALID_MODE_KEYS.has(f.mode) ? f.mode : null,
    pillar: VALID_PILLAR_KEYS.has(f.pillar) ? f.pillar : null,
    parentId: typeof f.parentId === "string" && f.parentId ? f.parentId : null,
  };
}

/**
 * All ids under itemId (its linked children, recursively). Used to
 * guard the "attach to" picker against cycles.
 */
export function descendantIds(items, itemId) {
  const out = [];
  const children = items.filter((f) => f.parentId === itemId);
  for (const c of children) {
    out.push(c.id);
    out.push(...descendantIds(items, c.id));
  }
  return out;
}

/** True when attaching itemId under newParentId would create a cycle. */
function wouldCreateCycle(items, itemId, newParentId) {
  if (!newParentId) return false;
  if (newParentId === itemId) return true;
  return descendantIds(items, itemId).includes(newParentId);
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

    /* First-use walkthrough: anyone who finished the old bare setup
       never sees the new onboarding. Check the saved identity (not the
       merged one — the base already carries onboarded:false). */
    if (typeof oldIdentity.onboarded !== "boolean") {
      identity.onboarded = oldIdentity.setupComplete === true;
    }
    if (!Number.isInteger(identity.onboardingStep)) {
      identity.onboardingStep = 0;
    }

    /* Commitments migrate from plain strings to ordered objects
       [{ id, text, order }]; order IS the priority (0 = highest).
       Focus-item links (which held text) remap to ids below. */
    const {
      list: commitments,
      textToId: commitmentTextToId,
      validIds: commitmentValidIds,
    } = normalizeCommitments(oldIdentity.commitments);
    identity.commitments = commitments;

    /* Normalize saved days: older entries predate the battery check. */
    const blank = blankDay();
    const rawDays =
      parsed.days && typeof parsed.days === "object" ? parsed.days : {};
    const days = {};
    for (const [k, d] of Object.entries(rawDays)) {
      if (!d || typeof d !== "object") continue;
      const mantra = { ...blank.mantra, ...(d.mantra || {}) };
      days[k] = {
        ...blank,
        ...d,
        mantra,
        battery: { ...blank.battery, ...(d.battery || {}) },
        orientation: normalizeOrientation(d.orientation, mantra),
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
      focusItems: focusItems.map((f) => {
        const n = normalizeFocusItem(f, validQuadrants);
        // Old links hold commitment text; remap to the migrated id.
        n.commitmentId = remapCommitmentId(
          n.commitmentId,
          commitmentTextToId,
          commitmentValidIds
        );
        return n;
      }),
      launchStage:
        typeof parsed.launchStage === "string" &&
        LAUNCH_STAGES.some((s) => s.key === parsed.launchStage)
          ? parsed.launchStage
          : null,
      modes: normalizeModes(parsed.modes),
      resets: normalizeResets(parsed.resets),
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

  /* Transient (never persisted): prefill for a Guided Reset triggered
     from a Focus item via "Explore in Guided Reset". Consumed once by
     the Journeys view, then cleared. */
  const [resetPrefill, setResetPrefill] = useState(null);

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
    /** Finish the first-use walkthrough: gates the onboarding flow. */
    completeOnboarding() {
      update((d) => {
        d.identity.onboarded = true;
        d.identity.setupComplete = true;
        d.identity.onboardingStep = 0;
      });
    },
    /** Persist the walkthrough's current step so a reload resumes it. */
    setOnboardingStep(n) {
      update((d) => {
        d.identity.onboardingStep = Number.isInteger(n) && n >= 0 ? n : 0;
      });
    },
    /** Re-enter the walkthrough later (replay entry point). */
    replayOnboarding() {
      update((d) => {
        d.identity.onboarded = false;
        d.identity.onboardingStep = 0;
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
    /* commitments — ordered; position IS the priority (1st = highest).
       New commitments append at the lowest priority; deleting
       re-numbers. Focus items link by id, so reordering never breaks
       their links. */
    addCommitment(text) {
      const t = text.trim();
      if (!t) return null;
      const entry = { id: uid(), text: t.slice(0, 120), order: 0 };
      update((d) => {
        if (!Array.isArray(d.identity.commitments)) {
          d.identity.commitments = [];
        }
        entry.order = d.identity.commitments.length;
        d.identity.commitments.push({ ...entry });
      });
      return entry;
    },
    removeCommitment(id) {
      update((d) => {
        const list = (d.identity.commitments || []).filter(
          (c) => c && c.id !== id
        );
        list.forEach((c, i) => {
          c.order = i;
        });
        d.identity.commitments = list;
        // Focus items linked to the deleted commitment lose the link.
        for (const f of d.focusItems) {
          if (f.commitmentId === id) f.commitmentId = null;
        }
      });
    },
    /** Move a commitment up (dir=-1) or down (dir=+1) in priority. */
    moveCommitment(id, dir) {
      if (dir !== -1 && dir !== 1) return;
      update((d) => {
        const list = Array.isArray(d.identity.commitments)
          ? d.identity.commitments
          : [];
        const i = list.findIndex((c) => c && c.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= list.length) return;
        const [c] = list.splice(i, 1);
        list.splice(j, 0, c);
        list.forEach((x, k) => {
          x.order = k;
        });
      });
    },

    /* daily */
    /** Legacy mantra toggle — kept in sync with the orientation practice's done flag. */
    setMantra(key, anchor, val) {
      update((d) => {
        const day = ensureDay(d, key);
        day.mantra[anchor] = val;
        if (day.orientation && day.orientation[anchor]) {
          day.orientation[anchor].done = val;
        }
      });
    },
    /**
     * Orientation micro-practices (one text entry per mantra anchor,
     * saved per day). Entering text marks the practice complete; the
     * done flag can also be set/cleared by hand.
     */
    setOrientationText(key, anchor, text) {
      update((d) => {
        const day = ensureDay(d, key);
        if (!day.orientation) day.orientation = blankDay().orientation;
        const p = day.orientation[anchor];
        if (!p) return;
        p.text = String(text ?? "").slice(0, 280);
        if (p.text.trim()) {
          p.done = true;
          day.mantra[anchor] = true;
        }
      });
    },
    setOrientationDone(key, anchor, done) {
      update((d) => {
        const day = ensureDay(d, key);
        if (!day.orientation) day.orientation = blankDay().orientation;
        const p = day.orientation[anchor];
        if (!p) return;
        p.done = done === true;
        day.mantra[anchor] = p.done;
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
    /**
     * Capture a new focus item. opts: timeframe ('day'|'week'|'month'|'year'),
     * daysOfWeek [0-6], months [0-11], mode, pillar, commitmentId, parentId.
     * Old call sites (text, quadrant) keep working — everything else defaults.
     */
    addFocusItem(text, quadrant = "q2", opts = {}) {
      const t = text.trim();
      if (!t) return null;
      const q = ["q1", "q2", "q3", "q4"].includes(quadrant) ? quadrant : "q2";
      const entry = normalizeFocusItem(
        {
          id: uid(),
          text: t,
          quadrant: q,
          commitmentId: opts.commitmentId ?? null,
          priority: null,
          done: false,
          notes: "",
          subtasks: [],
          created: Date.now(),
          timeframe: opts.timeframe,
          daysOfWeek: opts.daysOfWeek,
          months: opts.months,
          mode: opts.mode,
          pillar: opts.pillar,
          parentId: opts.parentId,
        },
        new Set(["q1", "q2", "q3", "q4"])
      );
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
        // Linked children become top-level rather than orphaned.
        for (const f of d.focusItems) {
          if (f.parentId === id) f.parentId = null;
        }
      });
    },
    linkFocusCommitment(id, commitmentId) {
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (f) f.commitmentId = commitmentId || null;
      });
    },
    /**
     * Set a focus item's priority rank (1|2|3) — or null to clear it.
     * Each rank is unique within its timeframe: setting rank N clears
     * rank N from every other item in the same timeframe (day/week/
     * month/year hold independent 1/2/3 sets). Rank 1 is the one thing to focus on.
     */
    setPriority(id, rank) {
      const r = rank === 1 || rank === 2 || rank === 3 ? rank : null;
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (!f) return;
        if (r !== null) {
          for (const x of d.focusItems) {
            if (
              x.id !== id &&
              x.timeframe === f.timeframe &&
              x.priority === r
            ) {
              x.priority = null;
            }
          }
        }
        f.priority = r;
      });
    },
    /**
     * Patch a focus item from its expanded editor. Accepted keys: text,
     * quadrant, commitmentId, notes, subtasks ([{id, text, done}]),
     * timeframe, daysOfWeek, months, mode, pillar, parentId, priority,
     * done. priority 1|2|3 claims that rank in the item's timeframe
     * (clearing it from the previous holder); null clears the item's
     * rank. parentId is cycle-guarded: self and descendants are refused.
     */
    updateFocusItem(id, patch = {}) {
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (!f) return;
        if (typeof patch.text === "string" && patch.text.trim()) {
          f.text = patch.text.trim().slice(0, 160);
        }
        if (["q1", "q2", "q3", "q4"].includes(patch.quadrant)) {
          f.quadrant = patch.quadrant;
        }
        if ("commitmentId" in patch) {
          f.commitmentId = patch.commitmentId || null;
        }
        if (typeof patch.notes === "string") {
          f.notes = patch.notes.slice(0, 2000);
        }
        if (Array.isArray(patch.subtasks)) {
          f.subtasks = normalizeSubtasks(
            patch.subtasks.map((s) => ({
              id: s.id || uid(),
              text: s.text,
              done: s.done === true,
            }))
          );
        }
        if (TIMEFRAME_KEYS.has(patch.timeframe)) {
          f.timeframe = patch.timeframe;
        }
        if (Array.isArray(patch.daysOfWeek)) {
          f.daysOfWeek = patch.daysOfWeek.filter(
            (n) => Number.isInteger(n) && n >= 0 && n <= 6
          );
        }
        if (Array.isArray(patch.months)) {
          f.months = patch.months.filter(
            (n) => Number.isInteger(n) && n >= 0 && n <= 11
          );
        }
        if ("mode" in patch) {
          f.mode = VALID_MODE_KEYS.has(patch.mode) ? patch.mode : null;
        }
        if ("pillar" in patch) {
          f.pillar = VALID_PILLAR_KEYS.has(patch.pillar) ? patch.pillar : null;
        }
        if ("parentId" in patch) {
          const pid =
            typeof patch.parentId === "string" && patch.parentId
              ? patch.parentId
              : null;
          const parentExists =
            pid && d.focusItems.some((x) => x.id === pid && !x.done);
          if (pid && parentExists && !wouldCreateCycle(d.focusItems, id, pid)) {
            f.parentId = pid;
          } else if (!pid) {
            f.parentId = null; // move to top level
          }
          // A refused attach (self, descendant, missing parent) leaves
          // the item where it was — never half-moved.
        }
        if (typeof patch.done === "boolean") f.done = patch.done;
        if ("priority" in patch) {
          const p = patch.priority;
          if (p === 1 || p === 2 || p === 3) {
            for (const x of d.focusItems) {
              if (
                x.id !== id &&
                x.timeframe === f.timeframe &&
                x.priority === p
              ) {
                x.priority = null;
              }
            }
            f.priority = p;
          } else {
            f.priority = null;
          }
        }
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

    /* modes of energy */
    setMode(interval, slot, modeKey) {
      if (!["day", "week", "month"].includes(interval)) return;
      if (!["primary", "secondary"].includes(slot)) return;
      const valid = MODES.some((m) => m.key === modeKey) ? modeKey : null;
      update((d) => {
        if (!d.modes || typeof d.modes !== "object") {
          d.modes = {
            current: null,
            day: { primary: null, secondary: null },
            week: { primary: null, secondary: null },
            month: { primary: null, secondary: null },
          };
        }
        d.modes[interval][slot] = valid;
        // Primary and secondary must differ; the newly set value wins.
        const other = slot === "primary" ? "secondary" : "primary";
        if (valid && d.modes[interval][other] === valid) {
          d.modes[interval][other] = null;
        }
      });
    },

    /* The mode I'm IN right now (descriptive) — distinct from the
       per-interval focus modes (prescriptive). Tapping the selected
       mode clears it. */
    setCurrentMode(modeKey) {
      const valid = MODES.some((m) => m.key === modeKey) ? modeKey : null;
      update((d) => {
        if (!d.modes || typeof d.modes !== "object") {
          d.modes = {
            current: null,
            day: { primary: null, secondary: null },
            week: { primary: null, secondary: null },
            month: { primary: null, secondary: null },
          };
        }
        d.modes.current = valid;
      });
    },

    /* guided resets */
    saveReset(fields) {
      const entry = {
        id: uid(),
        ts: Date.now(),
        date: localDateKey(),
        situation: String(fields?.situation ?? "").trim(),
        reveal: String(fields?.reveal ?? "").trim(),
        interpret: String(fields?.interpret ?? "").trim(),
        align: String(fields?.align ?? "").trim(),
        act: String(fields?.act ?? "").trim(),
        lifemod: String(fields?.lifemod ?? "").trim(),
        integrate: String(fields?.integrate ?? "").trim(),
        // Optional thread back to the Focus item this reset was
        // triggered from ("Explore in Guided Reset").
        sourceItemId:
          typeof fields?.sourceItemId === "string"
            ? fields.sourceItemId
            : null,
      };
      update((d) => {
        if (!Array.isArray(d.resets)) d.resets = [];
        d.resets.push(entry);
      });
      return entry;
    },
    deleteReset(id) {
      update((d) => {
        d.resets = d.resets.filter((r) => r.id !== id);
      });
    },

    /* decision -> journey thread (transient, never persisted) */
    resetPrefill,
    /**
     * Begin a Guided Reset from a Focus item: the reset's Situation is
     * pre-filled from the item's text (plus its notes), and the saved
     * reset keeps a sourceItemId thread back to the decision.
     * Returns false when the item no longer exists.
     */
    requestResetFromDecision(id) {
      const item = state.focusItems.find((x) => x.id === id);
      if (!item) return false;
      const notes = (item.notes || "").trim();
      setResetPrefill({
        situation: notes ? `${item.text}\n\nNotes:\n${notes}` : item.text,
        sourceItemId: item.id,
      });
      return true;
    },
    clearResetPrefill() {
      setResetPrefill(null);
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
