import { createContext, useContext, useEffect, useState } from "react";
import { logEvent } from "./events.js";

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
/* The four orientation statements (WE ARE ALCHEMY, ch. AUTHORSHIP):
   provisional, honest enough to guide an ordinary Tuesday.
   Shared by Identity, the walkthrough, and Recalibrate. */
export const ORIENTATION_STATEMENTS = [
  {
    key: "becoming",
    prompt: "I am choosing to become someone who…",
    placeholder: "Name the quality or orientation in active terms…",
    help: {
      title: "Choosing to become",
      what: "The direction of your becoming — not who you are today, but who you are practicing being.",
      why: "Identity is authored, not discovered. Naming the direction gives every decision a reference point.",
      how: "Write it as an active quality, not a role or achievement. “Someone who…” keeps it about being, not having.",
      example: "“…keeps promises to himself, especially the small ones.”",
    },
  },
  {
    key: "standFor",
    prompt: "I stand for…",
    placeholder: "Name the principles that should remain recognizable across conditions…",
    help: {
      title: "What you stand for",
      what: "The principles that stay recognizable in you across conditions — the lines you don't cross and the things you'd defend.",
      why: "When pressure hits, principles decide faster than deliberation. These are the pre-made decisions.",
      how: "Name a few, in your own words. Fewer, deeply meant, beats a long list of slogans.",
      example: "“Honesty over comfort. People over optics.”",
    },
  },
  {
    key: "practice",
    prompt: "I practice…",
    placeholder: "Name the behaviors through which the identity becomes visible…",
    help: {
      title: "What you practice",
      what: "The recurring behaviors through which the identity becomes visible — what you actually do, regularly.",
      why: "Identity without practice is a costume. The practices are where becoming becomes real.",
      how: "Name behaviors, not aspirations. Things you can do on an ordinary Tuesday.",
      example: "“Morning pages. Walking meetings. One hard conversation a week.”",
    },
  },
  {
    key: "returnThrough",
    prompt: "When I drift, I return through…",
    placeholder: "Name the ritual, question, boundary, or action that restores contact…",
    help: {
      title: "Returning from drift",
      what: "Your way back — the ritual, question, boundary, or action that restores contact when you've drifted.",
      why: "Drift is guaranteed; the return path is what makes it a practice instead of a failure. Decide it now, while you're clear.",
      how: "Name something concrete you can actually do in a low moment — not an ideal, a doorway.",
      example: "“A ten-minute walk with no phone, then writing the next right action.”",
    },
  },
];
export const ORIENTATION_PRACTICES = [  {
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
    prompt: "Today's action — from Focus. Choosing aims it; doing it practices it.",
    focusLink: true, // links into #/focus
  },
  {
    key: "love",
    label: "Give Love",
    prompt: "One thing you will do today for someone else — mark it when you've done it, not when you've named it",
  },
];

/* Sync protocol version, stamped into every snapshot. Bump when the
   sync protocol changes incompatibly; a DB CHECK constraint rejects
   writes from older clients so a stale cached build can never clobber
   the cloud (fail-safe instead of fail-deadly). */
export const SYNC_VERSION = 2;

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

/** A commitment's life domain, or null while unplaced. Optional by
   design: capture stays frictionless, placement happens on reflection. */
export function normalizePrimitive(v) {
  return PRIMITIVES.some((p) => p.key === v) ? v : null;
}

/** Label for a primitive key. */
export function primitiveLabel(key) {
  const p = PRIMITIVES.find((p) => p.key === key);
  return p ? p.label : "";
}

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

/* Human Battery priorities — how much attention a dimension gets today.
   STATE (1–10) is where the instrument is; PRIORITY (low/med/high) is where
   focus goes. A low state with low priority is rest, not failure. */
export const BATTERY_PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "med", label: "Med" },
  { key: "high", label: "High" },
];

export function validBatteryPriority(v) {
  return BATTERY_PRIORITIES.some((p) => p.key === v) ? v : "med";
}

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

/* Tribe v1 — core-group circles for the people directory. Thin local
   foundation; sharing / identity-stack exchange arrives later with
   accounts. Give Love entries can tag a personId from these circles. */
export const CIRCLES = [
  { key: "partner", label: "Spouse/Partner" },
  { key: "family", label: "Family" },
  { key: "friends", label: "Closest friends" },
  { key: "business", label: "Key Business Relationships" },
  { key: "other", label: "Other" },
];

export function circleLabel(key) {
  const c = CIRCLES.find((c) => c.key === key);
  return c ? c.label : "Other";
}

export function validCircle(key) {
  return CIRCLES.some((c) => c.key === key) ? key : "other";
}

/** Normalize the people directory; old states predate it. */
function normalizePeople(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p) => p && typeof p === "object")
    .map((p) => ({
      id: typeof p.id === "string" && p.id ? p.id : uid(),
      name: typeof p.name === "string" ? p.name.trim().slice(0, 80) : "",
      circle: validCircle(p.circle),
      notes: typeof p.notes === "string" ? p.notes.slice(0, 500) : "",
      createdAt: Number(p.createdAt) || 0,
    }))
    .filter((p) => p.name !== "");
}

/* The seven fields of a Guided Reset (mirrors the guided practice at
   ne3ula.com/e3-reset/guided): Situation, then the Alchemist Path —
   Reveal → Interpret → Align → Act — plus a LifeMod, then Integrate. */
export const RESET_FIELDS = [
  { key: "situation", label: "Situation" },
  { key: "batteryNote", label: "Battery" },
  { key: "reveal", label: "Reveal" },
  { key: "interpret", label: "Interpret" },
  { key: "align", label: "Align" },
  { key: "act", label: "Act" },
  { key: "lifemod", label: "LifeMod" },
  { key: "integrate", label: "Integrate" },
];

/* Plain LifeMod intervention types (canonical 10-minute practice) — the
   capture surface on the Reset's LifeMod step. The 8 legend functions
   remain the deeper classification inside the LifeMod editor. */
export const LIFEMOD_PLAIN_TYPES = [
  { key: "environment", label: "Environment" },
  { key: "boundary", label: "Boundary" },
  { key: "scope", label: "Scope" },
  { key: "rhythm", label: "Rhythm" },
  { key: "support", label: "Support" },
  { key: "framing", label: "Framing" },
];

export function lifemodPlainTypeLabel(key) {
  const t = LIFEMOD_PLAIN_TYPES.find((t) => t.key === key);
  return t ? t.label : null;
}

/* Integrate choices — how the reset lands (canonical practice). */
export const INTEGRATE_CHOICES = [
  { key: "retain", label: "Retain", desc: "Keep what worked; let it hold." },
  { key: "revise", label: "Revise", desc: "Adjust the approach and try again." },
  { key: "release", label: "Release", desc: "Let it go; the loop is complete." },
  { key: "repeat", label: "Repeat", desc: "Run it again as a practice loop." },
];

export function integrateChoiceLabel(key) {
  const c = INTEGRATE_CHOICES.find((c) => c.key === key);
  return c ? c.label : null;
}

/* Friction reading — the required Eisenhower companion question. */
export const FRICTION_READINGS = [
  { key: "misalignment", label: "Misalignment" },
  { key: "growth", label: "Growth" },
  { key: "both", label: "Both" },
];

export function frictionReadingLabel(key) {
  const f = FRICTION_READINGS.find((f) => f.key === key);
  return f ? f.label : null;
}

/* Readiness check — confidence as an activatable state, at action time. */
export const READINESS_DIMS = [
  { key: "curiosity", label: "Curious" },
  { key: "competence", label: "Competent" },
  { key: "congruence", label: "Congruent" },
  { key: "connection", label: "Connected" },
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

/* Quest help kinds — the shapes help can take. A quest is opt-in:
   only a quested action can ever be picked up by the tribe (consent
   by design); the brief lives behind "Make Quest" as progressive
   disclosure. Grabbing/sharing arrive later with accounts. */
export const QUEST_KINDS = [
  { key: "hands", label: "Hands", desc: "do it with me" },
  { key: "eyes", label: "Eyes", desc: "feedback / a second brain" },
  { key: "funds", label: "Funds", desc: "money toward it" },
];

const QUEST_KIND_KEYS = new Set(QUEST_KINDS.map((k) => k.key));

export function questKindLabel(key) {
  const k = QUEST_KINDS.find((k) => k.key === key);
  return k ? k.label : null;
}

/** Normalize a focus item's quest data; old items predate quests. */
export function normalizeQuest(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  return {
    isQuest: r.isQuest === true,
    brief: typeof r.brief === "string" ? r.brief : "",
    kinds: Array.isArray(r.kinds)
      ? r.kinds.filter((k) => QUEST_KIND_KEYS.has(k))
      : [],
  };
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
    // Sync protocol version (see SYNC_VERSION). Old envelopes predate it.
    syncVersion: SYNC_VERSION,
    // Local mutation clock (ms epoch). Bumped on every store mutation;
    // drives cloud last-write-wins. Old envelopes migrate to 0.
    updatedAt: 0,
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
    // App settings (not identity data). aiEnabled is the AI.d seam: the
    // app is fully functional without it; the toggle lets users opt in,
    // and the intelligence layer itself ships later as a paid tier.
    // Default off. Surfaces check this flag before rendering anything
    // AI-related — honest "coming later" placeholders only, never
    // simulated intelligence.
    settings: {
      aiEnabled: false,
    },
    // "YYYY-MM-DD" -> { mantra: {gratitude,beauty,action,love},
    //   orientation: { <anchor>: { text, done } }, intention,
    //   battery: {physical,mental,emotional,social,purpose}  // 1–10 state
    //   batteryPriority: {physical,mental,...}  // 'low'|'med'|'high' focus
    days: {},
    actions: [], // { id, date, ts, text, tag }
    signals: [], // { id, date, ts, text }
    stars: [], // { id, name, note, created, loopStage, orbits, commitmentId }
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
    // Goals — defined outcomes with a horizon, each serving one
    // commitment (no orphan goals, per the identity-first rule).
    // { id, text, commitmentId, horizon: date-string|null, done, created }
    goals: [],
    habits: [],
    // Tribe v1 — people directory: [{ id, name, circle, notes, createdAt }].
    // Give Love entries tag a personId; local-only for now.
    people: [],
    // LifeMods — designed life changes (WE ARE ALCHEMY, ch. BECOMING).
    // { id, name, friction, currentState, desiredState, legendFunction,
    // impact, effort, nextAction, origin: 'seed'|'friction',
    // sourceStarId, becomingStage, active, createdAt }
    lifemods: [],
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
    // In-progress Guided Reset drafts (synced): one per source so resets
    // can span multiple sessions and assets.
    // [{ id, sourceKind: 'focus'|'goal'|'habit'|'star'|'general',
    //    sourceId, sourceName, step, subject, scratch, savedAt }]
    resetDrafts: [],
    // In-progress Growth Practice drafts (synced): one per source, same
    // machinery as resetDrafts.
    // [{ id, sourceKind: 'goal'|'habit'|'lifemod'|'star'|'focus'|'general',
    //    sourceId, sourceName, step, scratch, savedAt }]
    growthDrafts: [],
    // Completed Growth Practice sessions (private, local only):
    // { id, ts, date, subjectKind, subjectId, subjectName, commitmentId,
    //   outcome, evolutionNote, energy, capacity, capacityNotes,
    //   children: [{kind,id,text}], lifemods: [{id,name,type}], focusItemIds,
    //   vow, reviewDate, reviewedAt }
    growthSessions: [],
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
      action: { text: "", done: false, focusItemId: null },
      love: { text: "", done: false, personId: null },
    },
    intention: "",
    battery: { physical: 5, mental: 5, emotional: 5, social: 5, purpose: 5 },
    batteryPriority: {
      physical: "med",
      mental: "med",
      emotional: "med",
      social: "med",
      purpose: "med",
    },
  };
}

/** Read-only accessor for a day's state (never mutates). */
export function getDayState(state, key) {
  return (state.days || {})[key] || blankDay();
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

export function uid() {
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
      batteryNote: String(r.batteryNote ?? ""),
      reveal: String(r.reveal ?? ""),
      interpret: String(r.interpret ?? ""),
      align: String(r.align ?? ""),
      act: String(r.act ?? ""),
      lifemod: String(r.lifemod ?? ""),
      integrate: String(r.integrate ?? ""),
      // Canonical practice fields (newer resets).
      frictionReading: FRICTION_READINGS.some((f) => f.key === r.frictionReading)
        ? r.frictionReading
        : null,
      readiness:
        r.readiness && typeof r.readiness === "object"
          ? {
              curiosity: r.readiness.curiosity === true,
              competence: r.readiness.competence === true,
              congruence: r.readiness.congruence === true,
              connection: r.readiness.connection === true,
            }
          : null,
      lifemodTypes: (() => {
        const raw = Array.isArray(r.lifemodTypes)
          ? r.lifemodTypes
          : typeof r.lifemodType === "string"
            ? [r.lifemodType]
            : [];
        const valid = raw.filter(
          (k) =>
            typeof k === "string" &&
            LIFEMOD_PLAIN_TYPES.some((t) => t.key === k)
        );
        return [...new Set(valid)];
      })(),
      lifemodId: typeof r.lifemodId === "string" ? r.lifemodId : null,
      integrateChoice: INTEGRATE_CHOICES.some((c) => c.key === r.integrateChoice)
        ? r.integrateChoice
        : null,
      reviewDate: typeof r.reviewDate === "string" ? r.reviewDate : null,
      // When the review was actually done (closes the "Reviews due" loop).
      reviewedAt: Number(r.reviewedAt) || null,
      // Optional thread back to the Focus item that triggered this reset.
      sourceItemId: typeof r.sourceItemId === "string" ? r.sourceItemId : null,
      // Optional thread back to the star (seed) that triggered this reset.
      sourceStarId: typeof r.sourceStarId === "string" ? r.sourceStarId : null,
    }))
    .filter((r) => r.id);
}

/* The E3 practice loop — the Constellation's stages. A seed (ignited
   star) journeys Reveal → Interpret → Align → Act → Integrate, or takes
   the Released branch. Placement is manual in v1: declare, don't guess.
   Auto-derivation is a future revision. */
export const LOOP_STAGES = [
  { key: "reveal", label: "Reveal", copy: "Name the seed. What sparked?" },
  {
    key: "interpret",
    label: "Interpret",
    copy: "Understand it. The Guided Reset lives here.",
  },
  { key: "align", label: "Align", copy: "Place it: mode, pillar, commitment." },
  { key: "act", label: "Act", copy: "Do the work." },
  {
    key: "integrate",
    label: "Integrate",
    copy: "Root it into identity and legend.",
  },
];
export const RELEASED_STAGE = {
  key: "released",
  label: "Released",
  copy: "Let it go. Not every seed grows.",
};
const LOOP_STAGE_KEYS = new Set([
  ...LOOP_STAGES.map((s) => s.key),
  RELEASED_STAGE.key,
]);

/* LifeMods (WE ARE ALCHEMY, ch. BECOMING): designed life changes. Two
   entry doors: a seed that matured through E3 orbits (origin 'seed',
   sourceStarId set) or a directly-named friction — a preexisting
   circumstance causing drag (origin 'friction'). Conceptually both are
   matured seeds; the door is the entry point, not the kind. Every
   LifeMod names one of the 8 Legend Functions and moves through the
   6-stage Becoming Cycle. No separate module: LifeMods live inside the
   Constellation (the larger framework), with a compact summary on the
   Deck. */
export const LEGEND_FUNCTIONS = [
  {
    key: "unlock",
    label: "Unlock",
    desc: "Removes a barrier that prevents movement.",
  },
  {
    key: "accelerate",
    label: "Accelerate",
    desc: "Increases the speed or momentum of something already working.",
  },
  {
    key: "stabilize",
    label: "Stabilize",
    desc: "Creates consistency where the system is unreliable.",
  },
  {
    key: "protect",
    label: "Protect",
    desc: "Preserves energy, attention, relationships, resources, or progress.",
  },
  {
    key: "simplify",
    label: "Simplify",
    desc: "Reduces unnecessary complexity or decision load.",
  },
  {
    key: "repair",
    label: "Repair",
    desc: "Restores something damaged, neglected, or dysfunctional.",
  },
  {
    key: "remove",
    label: "Remove",
    desc: "Eliminates a source of recurring drag that no longer deserves accommodation.",
  },
  {
    key: "expand",
    label: "Expand",
    desc: "Increases capacity, possibility, connection, or expression.",
  },
];

export function legendFunctionLabel(key) {
  const f = LEGEND_FUNCTIONS.find((f) => f.key === key);
  return f ? f.label : null;
}

export function legendFunctionDesc(key) {
  const f = LEGEND_FUNCTIONS.find((f) => f.key === key);
  return f ? f.desc : null;
}

/* The Becoming Cycle: the lifecycle of an installed LifeMod, from
   detection to evolution. Placement is manual: declare, don't guess. */
export const BECOMING_STAGES = [
  { key: "detect", label: "Detect" },
  { key: "capture", label: "Capture" },
  { key: "evaluate", label: "Evaluate" },
  { key: "execute", label: "Execute" },
  { key: "review", label: "Review" },
  { key: "evolve", label: "Evolve" },
];

export function becomingStageLabel(key) {
  const s = BECOMING_STAGES.find((s) => s.key === key);
  return s ? s.label : null;
}

const LEGEND_FUNCTION_KEYS = new Set(LEGEND_FUNCTIONS.map((f) => f.key));
const BECOMING_STAGE_KEYS = new Set(BECOMING_STAGES.map((s) => s.key));
const IMPACT_EFFORT_KEYS = new Set(["low", "med", "high"]);

function impactEffortLabel(key) {
  return key === "low" ? "Low" : key === "high" ? "High" : key === "med" ? "Med" : null;
}

/** Normalize one LifeMod; old states predate them entirely. */
function normalizeLifeMod(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(raw.id ?? "");
  if (!id) return null;
  const str = (v, max) =>
    typeof v === "string" ? v.slice(0, max) : "";
  return {
    id,
    name: str(raw.name, 120),
    friction: str(raw.friction, 600),
    currentState: str(raw.currentState, 600),
    desiredState: str(raw.desiredState, 600),
    legendFunction: LEGEND_FUNCTION_KEYS.has(raw.legendFunction)
      ? raw.legendFunction
      : null,
    impact: IMPACT_EFFORT_KEYS.has(raw.impact) ? raw.impact : null,
    effort: IMPACT_EFFORT_KEYS.has(raw.effort) ? raw.effort : null,
    nextAction: str(raw.nextAction, 280),
    origin: raw.origin === "seed" ? "seed" : "friction",
    sourceStarId:
      typeof raw.sourceStarId === "string" && raw.sourceStarId
        ? raw.sourceStarId
        : null,
    becomingStage: BECOMING_STAGE_KEYS.has(raw.becomingStage)
      ? raw.becomingStage
      : "capture",
    active: raw.active !== false,
    createdAt: Number(raw.createdAt) || 0,
  };
}

function normalizeLifeMods(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeLifeMod).filter(Boolean);
}

/** Read-only lookup of a LifeMod by id. */
export function lifeModById(state, id) {
  const list = state?.lifemods;
  if (!Array.isArray(list) || !id) return null;
  return list.find((m) => m && m.id === id) || null;
}

/** Normalize one star; old stars predate loop stages → 'reveal', orbit 1. */
function normalizeStar(s) {
  if (!s || typeof s !== "object") return null;
  return {
    id: String(s.id ?? ""),
    name: String(s.name ?? ""),
    note: String(s.note ?? ""),
    created: Number(s.created) || 0,
    loopStage: LOOP_STAGE_KEYS.has(s.loopStage) ? s.loopStage : "reveal",
    // The loop is orbits, not a line: each completed circuit adds mass.
    orbits: Number.isInteger(s.orbits) && s.orbits >= 1 ? s.orbits : 1,
    // A seed promoted into an identity commitment (matured system asset).
    commitmentId: typeof s.commitmentId === "string" ? s.commitmentId : null,
    // A seed grown into a LifeMod (designed life change).
    lifemodId: typeof s.lifemodId === "string" ? s.lifemodId : null,
  };
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
    list.push({
      id,
      text: text.slice(0, 120),
      order,
      primitive: normalizePrimitive(c && c.primitive),
    });
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

/**
 * Normalize goals to [{ id, text, commitmentId, horizon, done, created }].
 * The constitutional rule is enforced here: a goal must serve a
 * commitment — goals whose commitmentId matches no commitment are
 * dropped, never orphaned.
 */
function normalizeGoals(raw, validCommitmentIds) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((g) => g && typeof g === "object")
    .map((g) => ({
      id: String(g.id ?? ""),
      text: String(g.text ?? ""),
      commitmentId:
        typeof g.commitmentId === "string" &&
        validCommitmentIds.has(g.commitmentId)
          ? g.commitmentId
          : null,
      horizon:
        typeof g.horizon === "string" && g.horizon ? g.horizon : null,
      done: g.done === true,
      created: Number(g.created) || 0,
      // Origin threads: what this goal grew from (seed or LifeMod).
      sourceLifeModId:
        typeof g.sourceLifeModId === "string" && g.sourceLifeModId
          ? g.sourceLifeModId
          : null,
      sourceStarId:
        typeof g.sourceStarId === "string" && g.sourceStarId
          ? g.sourceStarId
          : null,
      // Roadmap: a goal may be a child of a larger goal/habit.
      parentId:
        typeof g.parentId === "string" && g.parentId ? g.parentId : null,
    }))
    .filter((g) => g.id && g.text.trim() && g.commitmentId);
}

/** Read-only lookup of a goal by id. */
export function goalById(state, id) {
  const list = state?.goals;
  if (!Array.isArray(list) || !id) return null;
  return list.find((g) => g && g.id === id) || null;
}

/* Habits — repeating practices that serve a commitment. A habit is kept,
   not finished: it has a work schedule (not a horizon) and per-date session
   completion. The no-orphan rule applies: a habit always serves a real
   commitment. */
function normalizeHabits(raw, validCommitmentIds) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((h) => h && typeof h === "object")
    .map((h) => ({
      id: String(h.id ?? ""),
      text: String(h.text ?? ""),
      commitmentId:
        typeof h.commitmentId === "string" &&
        validCommitmentIds.has(h.commitmentId)
          ? h.commitmentId
          : null,
      schedule: normalizeSchedule(h.schedule),
      sessions: normalizeSessions(h.sessions),
      quadrant: normalizeQuadrant(h.quadrant),
      active: h.active !== false,
      created: Number(h.created) || 0,
      // Origin threads: what this habit grew from (seed or LifeMod).
      sourceLifeModId:
        typeof h.sourceLifeModId === "string" && h.sourceLifeModId
          ? h.sourceLifeModId
          : null,
      sourceStarId:
        typeof h.sourceStarId === "string" && h.sourceStarId
          ? h.sourceStarId
          : null,
      // Roadmap: a habit may be a child of a larger goal/habit.
      parentId:
        typeof h.parentId === "string" && h.parentId ? h.parentId : null,
      // How the habit evolves over time (captured by the Growth Practice).
      evolutionNote:
        typeof h.evolutionNote === "string"
          ? h.evolutionNote.slice(0, 500)
          : "",
    }))
    .filter((h) => h.id && h.text.trim() && h.commitmentId && h.schedule);
}

/** Read-only lookup of a habit by id. */
export function habitById(state, id) {
  const list = state?.habits;
  if (!Array.isArray(list) || !id) return null;
  return list.find((h) => h && h.id === id) || null;
}

/** Habits serving one commitment, active first, oldest first. */
export function habitsForCommitment(state, commitmentId) {
  const list = state?.habits;
  if (!Array.isArray(list) || !commitmentId) return [];
  return list
    .filter((h) => h && h.commitmentId === commitmentId)
    .slice()
    .sort(
      (a, b) =>
        Number(b.active !== false) - Number(a.active !== false) ||
        (a.created || 0) - (b.created || 0)
    );
}

/** Goals serving one commitment, open first then done, oldest first. */
export function goalsForCommitment(state, commitmentId) {
  const list = state?.goals;
  if (!Array.isArray(list) || !commitmentId) return [];
  return list
    .filter((g) => g && g.commitmentId === commitmentId)
    .slice()
    .sort(
      (a, b) =>
        Number(a.done) - Number(b.done) || (a.created || 0) - (b.created || 0)
    );
}

const SCHEDULE_KINDS = ["once", "weekly"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Quadrant for scheduled sessions on the matrix. Defaults to Q2 —
   committed work is important by definition; urgency is the exception. */
export function normalizeQuadrant(v) {
  return QUADRANTS.some((q) => q.key === v) ? v : "q2";
}

/** Normalize a goal work-schedule. Null when absent or invalid. */
export function normalizeSchedule(raw) {
  if (!raw || typeof raw !== "object") return null;
  const minutes =
    Number.isFinite(Number(raw.minutes)) && Number(raw.minutes) > 0
      ? Math.min(480, Math.round(Number(raw.minutes)))
      : 30;
  if (raw.kind === "once") {
    if (typeof raw.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.date))
      return null;
    return { kind: "once", date: raw.date, minutes };
  }
  if (raw.kind === "weekly") {
    const days = (Array.isArray(raw.days) ? raw.days : [])
      .map(Number)
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6);
    // weeks: null = ongoing (no end date); a positive int = fixed run.
    // "" / undefined / 0 are transient-or-invalid, never ongoing.
    const weeks =
      raw.weeks === null
        ? null
        : Number.isInteger(Number(raw.weeks)) && Number(raw.weeks) > 0
          ? Math.min(52, Number(raw.weeks))
          : 0;
    if (
      days.length === 0 ||
      typeof raw.start !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(raw.start) ||
      weeks === 0
    )
      return null;
    return {
      kind: "weekly",
      days: [...new Set(days)].sort((a, b) => a - b),
      start: raw.start,
      weeks,
      minutes,
    };
  }
  return null;
}

/** Normalize the per-date session completion map on a goal. */
export function normalizeSessions(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k) && v) out[k] = true;
  }
  return out;
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Work sessions a habit's schedule generates between two date keys
 * (inclusive). Returns [{ date, minutes }]. Inactive habits generate
 * none — a paused habit stops populating Focus.
 */
export function habitOccurrences(habit, fromKey, toKey) {
  const s = habit?.schedule;
  if (!s || habit.active === false) return [];
  const out = [];
  const minutes = s.minutes || 30;
  if (s.kind === "once") {
    if (s.date >= fromKey && s.date <= toKey)
      out.push({ date: s.date, minutes });
  } else if (s.kind === "weekly") {
    const start = parseDateKey(s.start);
    const end = s.weeks == null ? null : new Date(start);
    if (end) end.setDate(end.getDate() + s.weeks * 7 - 1);
    const to = parseDateKey(toKey);
    for (
      let d = new Date(start);
      d <= to && (!end || d <= end);
      d.setDate(d.getDate() + 1)
    ) {
      const k = localDateKey(d);
      if (k < fromKey) continue;
      if (s.days.includes(d.getDay())) out.push({ date: k, minutes });
    }
  }
  return out;
}

/** Compact weekday-range label: [1,2,3,4,5] -> "Mon–Fri". */
function daysLabel(days) {
  const sorted = [...days].sort((a, b) => a - b);
  const ranges = [];
  let run = [sorted[0]];
  for (let i = 1; i <= sorted.length; i++) {
    if (sorted[i] === run[run.length - 1] + 1) run.push(sorted[i]);
    else {
      ranges.push(run);
      run = [sorted[i]];
    }
  }
  return ranges
    .filter((r) => r[0] !== undefined)
    .map((r) =>
      r.length === 1
        ? DAY_NAMES[r[0]]
        : `${DAY_NAMES[r[0]]}–${DAY_NAMES[r[r.length - 1]]}`
    )
    .join(", ");
}

/** Human line for a schedule: "Mon–Fri · 60 min · 3 wks" / "Oct 9 · 30 min". */
export function describeSchedule(s) {
  if (!s) return "";
  const mins = s.minutes >= 60 && s.minutes % 60 === 0
    ? `${s.minutes / 60} h`
    : `${s.minutes} min`;
  if (s.kind === "once") {
    const [y, m, d] = s.date.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    return `${label} · ${mins}`;
  }
  if (s.kind === "weekly") {
    const dur =
      s.weeks == null ? "ongoing" : `${s.weeks} wk${s.weeks === 1 ? "" : "s"}`;
    return `${daysLabel(s.days)} · ${mins} · ${dur}`;
  }
  return "";
}

/** Date-key range for a Focus timeframe tab. Week = Mon–Sun. */
export function timeframeRange(timeframe) {
  const now = new Date();
  if (timeframe === "day") {
    const k = localDateKey(now);
    return { fromKey: k, toKey: k };
  }
  if (timeframe === "week") {
    const dow = (now.getDay() + 6) % 7; // 0 = Monday
    const mon = new Date(now);
    mon.setDate(now.getDate() - dow);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    return { fromKey: localDateKey(mon), toKey: localDateKey(sun) };
  }
  if (timeframe === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { fromKey: localDateKey(first), toKey: localDateKey(last) };
  }
  // year
  const y = now.getFullYear();
  return { fromKey: `${y}-01-01`, toKey: `${y}-12-31` };
}

/**
 * Resolve what a focus item serves, inheriting up the parent chain.
 * A nested item with no explicit link inherits its parent's; an
 * explicit goal or commitment on the item itself always wins.
 * Returns { goalId, commitmentId } with the commitment denormalized
 * from the goal when one is set.
 */
export function effectiveServes(state, item) {
  const items = Array.isArray(state?.focusItems) ? state.focusItems : [];
  const goals = Array.isArray(state?.goals) ? state.goals : [];
  let cur = item;
  const seen = new Set();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    if (cur.goalId) {
      const g = goals.find((x) => x && x.id === cur.goalId);
      if (g) return { goalId: g.id, commitmentId: g.commitmentId };
    }
    if (cur.commitmentId) {
      return { goalId: null, commitmentId: cur.commitmentId };
    }
    cur = items.find((x) => x && x.id === cur.parentId) || null;
  }
  return { goalId: null, commitmentId: null };
}

/**
 * True when the state holds no user content at all — a blank slate.
 * The blank-safety guard in cloud.jsx uses this to refuse uploading an
 * empty snapshot over a cloud row that holds real data.
 */
export function isEmptyState(s) {
  if (!s || typeof s !== "object") return true;
  const id = s.identity || {};
  const hasIdentityText = [id.name, id.becoming, id.standFor, id.practice, id.returnThrough].some(
    (v) => typeof v === "string" && v.trim().length > 0
  );
  const nonEmpty = (v) => Array.isArray(v) && v.length > 0;
  return !(
    hasIdentityText ||
    nonEmpty(id.commitments) ||
    nonEmpty(id.values) ||
    nonEmpty(s.focusItems) ||
    nonEmpty(s.goals) ||
    nonEmpty(s.habits) ||
    nonEmpty(s.stars) ||
    nonEmpty(s.lifemods) ||
    nonEmpty(s.actions) ||
    nonEmpty(s.signals) ||
    nonEmpty(s.assessments) ||
    nonEmpty(s.resets) ||
    nonEmpty(s.people) ||
    (s.days && typeof s.days === "object" && Object.keys(s.days).length > 0)
  );
}

/* Intentional-erase escape hatch for the blank-safety guard. resetAll()
   arms this; the cloud layer consumes it once. Without it, the guard
   would block the deliberate "erase everything" push and the next boot
   would resurrect the cloud's copy. */
let intentionalEraseArmed = false;
export function armIntentionalErase() {
  intentionalEraseArmed = true;
}
export function consumeIntentionalErase() {
  const v = intentionalEraseArmed;
  intentionalEraseArmed = false;
  return v;
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
    // Take Action may link a focus item (the day's one thing); old
    // free-text entries carry no link and are grandfathered as-is.
    const focusItemId =
      r && typeof r === "object" && typeof r.focusItemId === "string"
        ? r.focusItemId
        : null;
    // Give Love may tag a person from the Tribe directory; old entries
    // carry no tag and migrate cleanly to null.
    const personId =
      r && typeof r === "object" && typeof r.personId === "string"
        ? r.personId
        : null;
    out[k] = { text, done: done === true, focusItemId, personId };
  }
  return out;
}

const VALID_MODE_KEYS = new Set(["production", "pleasure", "people"]);
const VALID_PILLAR_KEYS = new Set(["mind", "body", "heart", "spirit"]);

/** Normalize a day's battery priorities; old days (pre-priority) gain 'med'. */
function normalizeBatteryPriority(raw, blankPriority) {
  const out = { ...blankPriority };
  if (raw && typeof raw === "object") {
    for (const b of BATTERY) out[b.key] = validBatteryPriority(raw[b.key]);
  }
  return out;
}

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
    // Quest layer: old items predate quests — they gain an unposted default.
    quest: normalizeQuest(f.quest),
    // Optional thread back to the Reset Action Card this item was
    // created from ("Add to Focus" on the card).
    sourceResetId:
      typeof f.sourceResetId === "string" && f.sourceResetId
        ? f.sourceResetId
        : null,
    // Goal layer: an item may serve a goal (which implies its
    // commitment) instead of linking a commitment directly.
    goalId:
      typeof f.goalId === "string" && f.goalId ? f.goalId : null,
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

/**
 * Normalize a raw persisted envelope (from localStorage or the cloud)
 * into a valid state object. Never throws on bad input — repairs or
 * falls back to defaults. Exported so cloud pulls can reuse it.
 */
/* In-progress Guided Reset draft: validated shape, or null. The scratch
   itself is free-form (step components tolerate missing keys). */
function normalizeResetDraft(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  if (!raw.scratch || typeof raw.scratch !== "object" || Array.isArray(raw.scratch))
    return null;
  const kinds = ["focus", "goal", "habit", "star", "general"];
  return {
    id:
      typeof raw.id === "string" && raw.id
        ? raw.id
        : raw.migratedSingle === true
          ? "migrated:single"
          : `gen:${uid()}`,
    sourceKind: kinds.includes(raw.sourceKind) ? raw.sourceKind : "general",
    sourceId: typeof raw.sourceId === "string" ? raw.sourceId : null,
    sourceName: typeof raw.sourceName === "string" ? raw.sourceName.slice(0, 80) : "",
    savedAt: Number.isFinite(raw.savedAt) ? raw.savedAt : 0,
    step: Number.isInteger(raw.step) && raw.step >= 0 ? raw.step : 0,
    subject: typeof raw.subject === "string" ? raw.subject.slice(0, 90) : "",
    scratch: raw.scratch,
  };
}

/* Draft collection: validates each entry, drops the invalid, and migrates
   the old single-slot resetDraft (pre-multi-draft) as a general draft. */
function normalizeResetDrafts(rawList, rawSingle) {
  const list = Array.isArray(rawList) ? rawList : [];
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const d = normalizeResetDraft(raw);
    if (d && !seen.has(d.id)) {
      seen.add(d.id);
      out.push(d);
    }
  }
  const single =
    rawSingle && typeof rawSingle === "object"
      ? normalizeResetDraft({ ...rawSingle, migratedSingle: true })
      : null;
  if (single && !seen.has(single.id)) {
    out.push(single);
  }
  return out;
}

/* Resolve a reset source to its display name + Situation autofill text.
   The autofill is re-derived from the live item every time, so it can
   never go stale the way a one-shot prefill could. */
export function resetSourceInfo(state, kind, id) {
  if (kind === "focus") {
    const item = (state.focusItems || []).find((x) => x.id === id);
    if (!item) return null;
    const notes = (item.notes || "").trim();
    return {
      name: item.text,
      situation: notes ? `${item.text}\n\nNotes:\n${notes}` : item.text,
    };
  }
  if (kind === "star") {
    const star = (state.stars || []).find((x) => x.id === id);
    if (!star) return null;
    const note = (star.note || "").trim();
    return {
      name: star.name,
      situation: note ? `${star.name}\n\nNote:\n${note}` : star.name,
    };
  }
  if (kind === "goal") {
    const goal = (state.goals || []).find((x) => x.id === id);
    if (!goal) return null;
    return { name: goal.text, situation: goal.text };
  }
  if (kind === "habit") {
    const habit = (state.habits || []).find((x) => x.id === id);
    if (!habit) return null;
    return { name: habit.text, situation: habit.text };
  }
  return null;
}

/** Deterministic draft id for a source: one in-progress reset per source. */
export function resetDraftIdFor(sourceKind, sourceId) {
  return `${sourceKind}:${sourceId || "general"}`;
}

/* Growth Practice drafts — same shape and machinery as reset drafts. */
function normalizeGrowthDraft(raw) {
  if (!raw || typeof raw !== "object") return null;
  const step = Number(raw.step);
  const d = {
    id: String(raw.id ?? ""),
    sourceKind:
      typeof raw.sourceKind === "string" && raw.sourceKind
        ? raw.sourceKind
        : "general",
    sourceId:
      typeof raw.sourceId === "string" && raw.sourceId ? raw.sourceId : null,
    sourceName:
      typeof raw.sourceName === "string" ? raw.sourceName.slice(0, 120) : "",
    step: Number.isFinite(step) && step >= 0 ? Math.floor(step) : 0,
    scratch:
      raw.scratch && typeof raw.scratch === "object" && !Array.isArray(raw.scratch)
        ? raw.scratch
        : {},
    savedAt: Number(raw.savedAt) || 0,
  };
  if (!d.id) return null;
  return d;
}

function normalizeGrowthDrafts(rawList) {
  const list = Array.isArray(rawList) ? rawList : [];
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const d = normalizeGrowthDraft(raw);
    if (d && !seen.has(d.id)) {
      seen.add(d.id);
      out.push(d);
    }
  }
  return out;
}

/** Deterministic draft id: one in-progress growth practice per source. */
export function growthDraftIdFor(sourceKind, sourceId) {
  return `${sourceKind}:${sourceId || "general"}`;
}

/* Resolve a growth source to its display name + commitment prefill.
   goal/habit sources carry their commitment; lifemod/star/focus carry
   what they have; the practice asks for the rest. */
export function growthSourceInfo(state, kind, id) {
  if (kind === "goal") {
    const g = (state.goals || []).find((x) => x.id === id);
    if (!g) return null;
    return {
      name: g.text,
      commitmentId: g.commitmentId,
      subjectKind: "goal",
      subjectId: g.id,
    };
  }
  if (kind === "habit") {
    const h = (state.habits || []).find((x) => x.id === id);
    if (!h) return null;
    return {
      name: h.text,
      commitmentId: h.commitmentId,
      subjectKind: "habit",
      subjectId: h.id,
    };
  }
  if (kind === "lifemod") {
    const m = lifeModById(state, id);
    if (!m) return null;
    return { name: m.name, commitmentId: null, subjectKind: null, subjectId: null };
  }
  if (kind === "star") {
    const star = (state.stars || []).find((x) => x.id === id);
    if (!star) return null;
    return { name: star.name, commitmentId: star.commitmentId || null, subjectKind: null, subjectId: null };
  }
  if (kind === "focus") {
    const item = (state.focusItems || []).find((x) => x.id === id);
    if (!item) return null;
    return {
      name: item.text,
      commitmentId: item.commitmentId || null,
      subjectKind: null,
      subjectId: null,
    };
  }
  return null;
}

/** Resolve a roadmap parent id to its pursuit (goal, habit, or focus item). */
export function parentPursuit(state, parentId) {
  if (!parentId) return null;
  const g = (state.goals || []).find((x) => x && x.id === parentId);
  if (g) return { kind: "goal", item: g };
  const h = (state.habits || []).find((x) => x && x.id === parentId);
  if (h) return { kind: "habit", item: h };
  const f = (state.focusItems || []).find((x) => x && x.id === parentId);
  if (f) return { kind: "focus", item: f };
  return null;
}

/* Completed Growth Practice sessions: the Growth Card record + review loop. */
function normalizeGrowthSessions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      id: String(r.id ?? ""),
      ts: Number(r.ts) || 0,
      date: typeof r.date === "string" ? r.date : "",
      subjectKind:
        r.subjectKind === "goal" || r.subjectKind === "habit"
          ? r.subjectKind
          : null,
      subjectId:
        typeof r.subjectId === "string" && r.subjectId ? r.subjectId : null,
      subjectName:
        typeof r.subjectName === "string" ? r.subjectName.slice(0, 120) : "",
      commitmentId:
        typeof r.commitmentId === "string" && r.commitmentId
          ? r.commitmentId
          : null,
      outcome: typeof r.outcome === "string" ? r.outcome.slice(0, 500) : "",
      evolutionNote:
        typeof r.evolutionNote === "string" ? r.evolutionNote.slice(0, 500) : "",
      energy: ["low", "okay", "high"].includes(r.energy) ? r.energy : null,
      capacity:
        r.capacity && typeof r.capacity === "object"
          ? {
              time: r.capacity.time === true,
              energy: r.capacity.energy === true,
              skill: r.capacity.skill === true,
              support: r.capacity.support === true,
            }
          : null,
      capacityNotes:
        typeof r.capacityNotes === "string"
          ? r.capacityNotes.slice(0, 500)
          : "",
      children: Array.isArray(r.children)
        ? r.children
            .filter((c) => c && typeof c === "object" && c.id && c.text)
            .map((c) => ({
              kind: ["goal", "habit", "task"].includes(c.kind) ? c.kind : "task",
              id: String(c.id),
              text: String(c.text).slice(0, 80),
            }))
        : [],
      lifemods: Array.isArray(r.lifemods)
        ? r.lifemods
            .filter((m) => m && typeof m === "object" && m.id)
            .map((m) => ({
              id: String(m.id),
              name: String(m.name || "").slice(0, 120),
              type: typeof m.type === "string" ? m.type : null,
            }))
        : [],
      focusItemIds: Array.isArray(r.focusItemIds)
        ? r.focusItemIds.filter((x) => typeof x === "string")
        : [],
      vow: typeof r.vow === "string" ? r.vow.slice(0, 300) : "",
      reviewDate: typeof r.reviewDate === "string" ? r.reviewDate : null,
      reviewedAt: Number(r.reviewedAt) || null,
    }))
    .filter((r) => r.id);
}

export function normalizeState(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return defaultState();
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

    /* Goals → Habits split: a goal that carries a work schedule was
       really a practice, so it migrates to a habit (new id; linked focus
       items keep their denormalized commitment and drop the goal thread).
       Runs once — after migration, goals no longer carry schedules. */
    const rawGoals = Array.isArray(parsed.goals) ? parsed.goals : [];
    const migratedHabits = [];
    const remainingGoals = [];
    for (const g of rawGoals) {
      if (g && typeof g === "object" && normalizeSchedule(g.schedule)) {
        migratedHabits.push({
          id: uid(),
          text: g.text,
          commitmentId: g.commitmentId,
          schedule: g.schedule,
          sessions: g.sessions,
          quadrant: g.quadrant,
          active: true,
          created: g.created,
          sourceLifeModId: g.sourceLifeModId,
          sourceStarId: g.sourceStarId,
        });
      } else {
        remainingGoals.push(g);
      }
    }
    /* Goals: old states predate them entirely → empty list. Orphans
       (no matching commitment) are dropped by normalizeGoals. */
    const goals = normalizeGoals(remainingGoals, commitmentValidIds);
    const habits = [
      ...normalizeHabits(parsed.habits, commitmentValidIds),
      ...normalizeHabits(migratedHabits, commitmentValidIds),
    ];

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
        batteryPriority: normalizeBatteryPriority(
          d.batteryPriority,
          blank.batteryPriority
        ),
        orientation: normalizeOrientation(d.orientation, mantra),
      };
    }

    const validQuadrants = new Set(["q1", "q2", "q3", "q4"]);
    const focusItems = Array.isArray(parsed.focusItems)
      ? parsed.focusItems.filter((f) => f && typeof f === "object")
      : [];

    const normalized = {
      ...base,
      ...parsed,
      identity,
      days,
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
      stars: Array.isArray(parsed.stars)
        ? parsed.stars.map(normalizeStar).filter(Boolean)
        : [],
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [],
      // Tribe v1: old states predate the people directory.
      people: normalizePeople(parsed.people),
      // LifeMods: old states predate them entirely → empty list.
      lifemods: normalizeLifeMods(parsed.lifemods),
      goals,
      habits,
      focusItems: focusItems.map((f) => {
        const n = normalizeFocusItem(f, validQuadrants);
        // Old links hold commitment text; remap to the migrated id.
        n.commitmentId = remapCommitmentId(
          n.commitmentId,
          commitmentTextToId,
          commitmentValidIds
        );
        // Goal links that resolve to no goal drop to null.
        const validGoalIds = new Set(goals.map((g) => g.id));
        if (n.goalId && !validGoalIds.has(n.goalId)) n.goalId = null;
        return n;
      }),
      launchStage:
        typeof parsed.launchStage === "string" &&
        LAUNCH_STAGES.some((s) => s.key === parsed.launchStage)
          ? parsed.launchStage
          : null,
      modes: normalizeModes(parsed.modes),
      resets: normalizeResets(parsed.resets),
      resetDrafts: normalizeResetDrafts(parsed.resetDrafts, parsed.resetDraft),
      growthDrafts: normalizeGrowthDrafts(parsed.growthDrafts),
      growthSessions: normalizeGrowthSessions(parsed.growthSessions),
      // Settings: merge so future keys default cleanly on old states.
      settings: {
        aiEnabled: !!(parsed.settings && parsed.settings.aiEnabled),
      },
      // Cloud sync: local mutation clock. Old envelopes predate it → 0.
      updatedAt:
        Number.isFinite(parsed.updatedAt) && parsed.updatedAt > 0
          ? Math.floor(parsed.updatedAt)
          : 0,
      // Sync protocol: old snapshots adopt the running client's version —
      // from here on this snapshot is managed by a current client.
      syncVersion:
        Number.isInteger(parsed.syncVersion) && parsed.syncVersion > 0
          ? parsed.syncVersion
          : SYNC_VERSION,
    };
    // The old single-slot draft key is superseded by resetDrafts — drop it
    // so a stale copy can't re-migrate on a later load.
    delete normalized.resetDraft;
    return normalized;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeState(JSON.parse(raw));
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

  /* Transient (never persisted): the source a Guided Reset was launched
     from — { kind: 'focus'|'goal'|'habit'|'star', id }. Consumed once by
     the Journeys view, which resolves the live item for the Situation
     autofill (re-derived every time, never a stale one-shot prefill). */
  const [pendingResetSource, setPendingResetSource] = useState(null);
  /* Transient (never persisted): the source a Growth Practice was launched
     from — { kind: 'goal'|'habit'|'lifemod'|'star'|'focus', id }. Consumed
     once by the Journeys view, which resolves the live item for prefill. */
  const [pendingGrowthSource, setPendingGrowthSource] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable — state stays in memory */
    }
  }, [state]);

  // Deep-clone, mutate the draft, replace. State is JSON-safe.
  // Every mutation bumps the local mutation clock (cloud sync).
  const update = (fn) =>
    setState((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      fn(next);
      next.updatedAt = Date.now();
      return next;
    });

  const ensureDay = (draft, key) => {
    if (!draft.days[key]) draft.days[key] = blankDay();
    return draft.days[key];
  };

  /* When an item claims day rank 1, mirror it into today's Take Action
     practice (auto-completes; the manual done toggle still overrides). */
  const mirrorDayOneThing = (draft, item) => {
    const day = ensureDay(draft, localDateKey());
    if (!day.orientation) day.orientation = blankDay().orientation;
    const p = day.orientation.action;
    if (!p) return;
    p.focusItemId = item.id;
    p.text = item.text;
    p.done = true;
    day.mantra.action = true;
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
    /* settings */
    /** AI.d opt-in toggle. The app is fully functional without it. */
    setAiEnabled(v) {
      update((d) => {
        if (!d.settings || typeof d.settings !== "object") d.settings = {};
        d.settings.aiEnabled = v === true;
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
    addCommitment(text, opts = {}) {
      const t = text.trim();
      if (!t) return null;
      const entry = {
        id: uid(),
        text: t.slice(0, 120),
        order: 0,
        primitive: normalizePrimitive(opts && opts.primitive),
      };
      update((d) => {
        if (!Array.isArray(d.identity.commitments)) {
          d.identity.commitments = [];
        }
        entry.order = d.identity.commitments.length;
        d.identity.commitments.push({ ...entry });
      });
      logEvent("commitment.created", { id: entry.id });
      return entry;
    },
    updateCommitment(id, patch) {
      let ok = false;
      update((d) => {
        const c = (d.identity.commitments || []).find((x) => x && x.id === id);
        if (!c) return;
        if (patch && Object.prototype.hasOwnProperty.call(patch, "primitive")) {
          c.primitive = normalizePrimitive(patch.primitive);
          ok = true;
        }
      });
      if (ok) logEvent("commitment.placed", { id, primitive: normalizePrimitive(patch && patch.primitive) });
      return ok;
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
        // Goals serving the deleted commitment go with it (no orphans).
        const deadGoalIds = new Set(
          (d.goals || []).filter((g) => g && g.commitmentId === id).map((g) => g.id)
        );
        if (deadGoalIds.size > 0) {
          d.goals = d.goals.filter((g) => g && !deadGoalIds.has(g.id));
        }
        // Focus items linked to the deleted commitment lose the link.
        for (const f of d.focusItems) {
          if (f.commitmentId === id) f.commitmentId = null;
          if (f.goalId && deadGoalIds.has(f.goalId)) f.goalId = null;
        }
        // Seeds rooted as this commitment lose the link too.
        for (const s of d.stars || []) {
          if (s.commitmentId === id) s.commitmentId = null;
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

    /* goals — defined outcomes with a horizon, each serving exactly one
       commitment. No orphan goals: creation requires a commitment, and
       deleting a commitment deletes its goals. */
    addGoal(text, commitmentId, opts = {}) {
      const t = String(text ?? "").trim();
      if (!t) return null;
      let entry = null;
      update((d) => {
        const ok = (d.identity.commitments || []).some(
          (c) => c && c.id === commitmentId
        );
        if (!ok) return;
        entry = {
          id: uid(),
          text: t.slice(0, 80),
          commitmentId,
          horizon:
            typeof opts.horizon === "string" && opts.horizon
              ? opts.horizon
              : null,
          done: false,
          created: Date.now(),
          sourceLifeModId:
            typeof opts.sourceLifeModId === "string"
              ? opts.sourceLifeModId
              : null,
          sourceStarId:
            typeof opts.sourceStarId === "string" ? opts.sourceStarId : null,
          parentId:
            typeof opts.parentId === "string" && opts.parentId
              ? opts.parentId
              : null,
        };
        if (!Array.isArray(d.goals)) d.goals = [];
        d.goals.push(entry);
      });
      if (entry) logEvent("goal.created", { id: entry.id, commitmentId });
      return entry;
    },
    toggleGoalDone(id) {
      let doneNow = null;
      update((d) => {
        const g = (d.goals || []).find((x) => x.id === id);
        if (!g) return;
        g.done = !g.done;
        doneNow = g.done;
      });
      if (doneNow === true) logEvent("goal.completed", { id });
      else if (doneNow === false) logEvent("goal.reopened", { id });
    },
    updateGoal(id, patch = {}) {
      update((d) => {
        const g = (d.goals || []).find((x) => x.id === id);
        if (!g) return;
        if (typeof patch.text === "string" && patch.text.trim()) {
          g.text = patch.text.trim().slice(0, 80);
        }
        if ("horizon" in patch) {
          g.horizon =
            typeof patch.horizon === "string" && patch.horizon
              ? patch.horizon
              : null;
        }
        if ("parentId" in patch) {
          g.parentId =
            typeof patch.parentId === "string" && patch.parentId
              ? patch.parentId
              : null;
        }
        if ("commitmentId" in patch && typeof patch.commitmentId === "string") {
          // The no-orphan rule: a goal always serves a real commitment.
          const valid = new Set(
            (d.identity?.commitments || []).map((c) => c && c.id)
          );
          if (valid.has(patch.commitmentId) && patch.commitmentId !== g.commitmentId) {
            g.commitmentId = patch.commitmentId;
            // Keep the denormalized commitment on linked focus items fresh.
            for (const f of d.focusItems || []) {
              if (f.goalId === id) f.commitmentId = patch.commitmentId;
            }
            logEvent("goal.rehomed", { id, commitmentId: patch.commitmentId });
          }
        }
      });
    },
    deleteGoal(id) {
      update((d) => {
        d.goals = (d.goals || []).filter((g) => g && g.id !== id);
        // Focus items that served the goal keep their (denormalized)
        // commitment link; only the goal thread is cleared.
        for (const f of d.focusItems) {
          if (f.goalId === id) f.goalId = null;
        }
        // Children of the deleted goal become top-level pursuits.
        for (const g of d.goals || []) if (g.parentId === id) g.parentId = null;
        for (const h of d.habits || []) if (h.parentId === id) h.parentId = null;
        for (const f of d.focusItems || [])
          if (f.parentId === id) f.parentId = null;
      });
      logEvent("goal.deleted", { id });
    },

    /* habits */
    /** A habit needs a commitment (no orphans) AND a schedule (a rhythm
       is what makes it a habit, not an outcome). */
    addHabit(text, commitmentId, opts = {}) {
      const t = String(text ?? "").trim();
      const schedule = normalizeSchedule(opts.schedule);
      if (!t || !schedule) return null;
      let entry = null;
      update((d) => {
        const ok = (d.identity.commitments || []).some(
          (c) => c && c.id === commitmentId
        );
        if (!ok) return;
        entry = {
          id: uid(),
          text: t.slice(0, 80),
          commitmentId,
          schedule,
          sessions: {},
          quadrant: normalizeQuadrant(opts.quadrant),
          active: true,
          created: Date.now(),
          sourceLifeModId:
            typeof opts.sourceLifeModId === "string"
              ? opts.sourceLifeModId
              : null,
          sourceStarId:
            typeof opts.sourceStarId === "string" ? opts.sourceStarId : null,
          parentId:
            typeof opts.parentId === "string" && opts.parentId
              ? opts.parentId
              : null,
          evolutionNote:
            typeof opts.evolutionNote === "string"
              ? opts.evolutionNote.slice(0, 500)
              : "",
        };
        if (!Array.isArray(d.habits)) d.habits = [];
        d.habits.push(entry);
      });
      if (entry) logEvent("habit.created", { id: entry.id, commitmentId });
      return entry;
    },
    updateHabit(id, patch = {}) {
      update((d) => {
        const h = (d.habits || []).find((x) => x.id === id);
        if (!h) return;
        if (typeof patch.text === "string" && patch.text.trim()) {
          h.text = patch.text.trim().slice(0, 80);
        }
        if ("schedule" in patch) {
          const sched = normalizeSchedule(patch.schedule);
          if (sched) h.schedule = sched;
        }
        if ("quadrant" in patch) {
          h.quadrant = normalizeQuadrant(patch.quadrant);
        }
        if ("parentId" in patch) {
          h.parentId =
            typeof patch.parentId === "string" && patch.parentId
              ? patch.parentId
              : null;
        }
        if ("evolutionNote" in patch) {
          h.evolutionNote =
            typeof patch.evolutionNote === "string"
              ? patch.evolutionNote.slice(0, 500)
              : "";
        }
        if ("commitmentId" in patch && typeof patch.commitmentId === "string") {
          // The no-orphan rule: a habit always serves a real commitment.
          const valid = new Set(
            (d.identity?.commitments || []).map((c) => c && c.id)
          );
          if (valid.has(patch.commitmentId) && patch.commitmentId !== h.commitmentId) {
            h.commitmentId = patch.commitmentId;
            logEvent("habit.rehomed", { id, commitmentId: patch.commitmentId });
          }
        }
      });
    },
    /** Pause or resume a habit without deleting its history. */
    setHabitActive(id, active) {
      let now = null;
      update((d) => {
        const h = (d.habits || []).find((x) => x.id === id);
        if (!h) return;
        h.active = active !== false;
        now = h.active;
      });
      if (now === true) logEvent("habit.resumed", { id });
      else if (now === false) logEvent("habit.paused", { id });
    },
    /** Flip one practice session (by date key) on a habit. */
    toggleHabitSession(habitId, dateKey) {
      update((d) => {
        const h = (d.habits || []).find((x) => x.id === habitId);
        if (!h) return;
        if (!h.sessions || typeof h.sessions !== "object") h.sessions = {};
        if (h.sessions[dateKey]) delete h.sessions[dateKey];
        else h.sessions[dateKey] = true;
      });
      logEvent("habit.session", { id: habitId, date: dateKey });
    },
    deleteHabit(id) {
      update((d) => {
        d.habits = (d.habits || []).filter((h) => h && h.id !== id);
        // Children of the deleted habit become top-level pursuits.
        for (const g of d.goals || []) if (g.parentId === id) g.parentId = null;
        for (const h of d.habits || []) if (h.parentId === id) h.parentId = null;
        for (const f of d.focusItems || [])
          if (f.parentId === id) f.parentId = null;
      });
      logEvent("habit.deleted", { id });
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
      if (val) logEvent("orientation.checkin", { anchor });
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
    /**
     * Take Action — link a focus item as today's one thing instead of
     * free text. Claims rank 1 in the item's own timeframe (uniqueness
     * rule) and mirrors its text. Choosing is aiming, not practicing:
     * the practice marks done only when the action is taken (completing
     * the item in Focus marks it automatically) — so a new choice resets
     * the check.
     */
    setOrientationFocusItem(key, itemId) {
      update((d) => {
        const f = d.focusItems.find((x) => x.id === itemId && !x.done);
        if (!f) return;
        for (const x of d.focusItems) {
          if (x.id !== itemId && x.timeframe === f.timeframe && x.priority === 1) {
            x.priority = null;
          }
        }
        f.priority = 1;
        const day = ensureDay(d, key);
        if (!day.orientation) day.orientation = blankDay().orientation;
        const p = day.orientation.action;
        if (!p) return;
        p.focusItemId = itemId;
        p.text = f.text;
        p.done = false;
        day.mantra.action = false;
      });
    },
    /**
     * Tribe v1 — people directory (local-only). Removing a person nulls
     * their personIds on Give Love entries; entries themselves are never
     * deleted.
     */
    addPerson(name, circle, notes) {
      const n = typeof name === "string" ? name.trim().slice(0, 80) : "";
      if (!n) return null;
      const person = {
        id: uid(),
        name: n,
        circle: validCircle(circle),
        notes: typeof notes === "string" ? notes.trim().slice(0, 500) : "",
        createdAt: Date.now(),
      };
      update((d) => {
        if (!Array.isArray(d.people)) d.people = [];
        d.people.push(person);
      });
      return person;
    },
    updatePerson(id, patch = {}) {
      update((d) => {
        const p = (d.people || []).find((x) => x.id === id);
        if (!p) return;
        if (typeof patch.name === "string" && patch.name.trim()) {
          p.name = patch.name.trim().slice(0, 80);
        }
        if (typeof patch.circle === "string") {
          p.circle = validCircle(patch.circle);
        }
        if (typeof patch.notes === "string") {
          p.notes = patch.notes.slice(0, 500);
        }
      });
    },
    removePerson(id) {
      update((d) => {
        d.people = (d.people || []).filter((x) => x.id !== id);
        // Entries keep their text; only the person tag is cleared.
        for (const day of Object.values(d.days || {})) {
          const love = day.orientation?.love;
          if (love && love.personId === id) love.personId = null;
        }
      });
    },
    /** Tag (or untag) a person on a day's Give Love entry. */
    setLovePerson(key, personId) {
      update((d) => {
        const valid =
          typeof personId === "string" &&
          (d.people || []).some((x) => x.id === personId)
            ? personId
            : null;
        const day = ensureDay(d, key);
        if (!day.orientation) day.orientation = blankDay().orientation;
        const love = day.orientation.love;
        if (!love) return;
        love.personId = valid;
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
      const star = {
        id: uid(),
        name: n,
        note: note.trim(),
        created: Date.now(),
        loopStage: "reveal",
        orbits: 1,
        commitmentId: null,
      };
      update((d) => {
        d.stars.push(star);
      });
      logEvent("seed.created", { id: star.id, name: star.name });
      return star;
    },
    /** Move a seed along the practice loop (or release it). Manual in v1.
     *  Integrate → Reveal completes an orbit: the seed re-enters further
     *  developed, so the orbit count increments. */
    setStarLoopStage(starId, stage) {
      if (!LOOP_STAGE_KEYS.has(stage)) return;
      update((d) => {
        const s = d.stars.find((x) => x.id === starId);
        if (!s) return;
        if (s.loopStage === "integrate" && stage === "reveal") {
          s.orbits =
            Number.isInteger(s.orbits) && s.orbits >= 1 ? s.orbits + 1 : 2;
        }
        s.loopStage = stage;
      });
      logEvent("seed.transition", { id: starId, stage });
    },
    /** Link a seed to the identity commitment it matured into. */
    linkStarCommitment(starId, commitmentId) {
      update((d) => {
        const s = d.stars.find((x) => x.id === starId);
        if (s) s.commitmentId = commitmentId || null;
      });
    },
    /** Link a seed to the LifeMod it grew into. */
    linkStarLifeMod(starId, lifemodId) {
      update((d) => {
        const s = d.stars.find((x) => x.id === starId);
        if (s) s.lifemodId = lifemodId || null;
      });
    },
    deleteStar(id) {
      update((d) => {
        d.stars = d.stars.filter((s) => s.id !== id);
      });
      logEvent("seed.released", { id });
    },

    /* lifemods — designed life changes (WE ARE ALCHEMY, ch. BECOMING).
       Two entry doors: origin 'seed' (a matured E3 seed, sourceStarId
       set) or 'friction' (a directly-named preexisting circumstance).
       Conceptually both are matured seeds; the door is the entry
       point, not the kind. */
    /**
     * Create a LifeMod. opts: origin ('seed'|'friction'),
     * sourceStarId, becomingStage. Name is required; friction text
     * doubles as the name for friction-born entries.
     */
    addLifeMod(name, opts = {}) {
      const n = typeof name === "string" ? name.trim().slice(0, 120) : "";
      if (!n) return null;
      const origin = opts.origin === "seed" ? "seed" : "friction";
      const entry = normalizeLifeMod({
        id: uid(),
        name: n,
        friction: origin === "friction" ? n : "",
        currentState: "",
        desiredState: "",
        legendFunction: null,
        impact: null,
        effort: null,
        nextAction: "",
        origin,
        sourceStarId:
          origin === "seed" && typeof opts.sourceStarId === "string"
            ? opts.sourceStarId
            : null,
        becomingStage:
          typeof opts.becomingStage === "string" ? opts.becomingStage : "capture",
        active: true,
        createdAt: Date.now(),
      });
      update((d) => {
        if (!Array.isArray(d.lifemods)) d.lifemods = [];
        d.lifemods.push(entry);
        // Door A: link the seed to the LifeMod it grew into.
        if (origin === "seed" && entry.sourceStarId) {
          const s = d.stars.find((x) => x.id === entry.sourceStarId);
          if (s) s.lifemodId = entry.id;
        }
      });
      logEvent("lifemod.created", {
        id: entry.id,
        origin,
        legendFunction: entry.legendFunction,
      });
      return entry;
    },
    /**
     * Patch a LifeMod from its editor. Accepted keys: name, friction,
     * currentState, desiredState, legendFunction, impact, effort,
     * nextAction, becomingStage. Unknown enum values are refused.
     */
    updateLifeMod(id, patch = {}) {
      update((d) => {
        const m = (d.lifemods || []).find((x) => x.id === id);
        if (!m) return;
        if (typeof patch.name === "string" && patch.name.trim()) {
          // Slice but don't trim here: trimming on every keystroke eats
          // spaces while typing. Whitespace-only input is still rejected.
          m.name = patch.name.slice(0, 120);
        }
        for (const k of ["friction", "currentState", "desiredState"]) {
          if (typeof patch[k] === "string") m[k] = patch[k].slice(0, 600);
        }
        if (typeof patch.nextAction === "string") {
          m.nextAction = patch.nextAction.slice(0, 280);
        }
        if ("legendFunction" in patch) {
          m.legendFunction = LEGEND_FUNCTION_KEYS.has(patch.legendFunction)
            ? patch.legendFunction
            : null;
        }
        if ("impact" in patch) {
          m.impact = IMPACT_EFFORT_KEYS.has(patch.impact) ? patch.impact : null;
        }
        if ("effort" in patch) {
          m.effort = IMPACT_EFFORT_KEYS.has(patch.effort) ? patch.effort : null;
        }
        if (BECOMING_STAGE_KEYS.has(patch.becomingStage)) {
          m.becomingStage = patch.becomingStage;
        }
      });
      logEvent("lifemod.updated", { id, keys: Object.keys(patch || {}) });
    },
    /** Archive (active=false) or restore a LifeMod. Never deletes. */
    setLifeModActive(id, active) {
      update((d) => {
        const m = (d.lifemods || []).find((x) => x.id === id);
        if (m) m.active = active !== false;
      });
    },
    /** Delete a LifeMod; seeds grown from it lose the link gracefully. */
    deleteLifeMod(id) {
      update((d) => {
        d.lifemods = (d.lifemods || []).filter((m) => m && m.id !== id);
        for (const s of d.stars || []) {
          if (s.lifemodId === id) s.lifemodId = null;
        }
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
      logEvent("assessment.created", {
        money: entry.money,
        engagement: entry.engagement,
        building: entry.building,
        being: entry.being,
      });
      return entry;
    },

    /* human battery (daily state check) */
    setBattery(key, dim, val) {
      if (!BATTERY.some((b) => b.key === dim)) return;
      update((d) => {
        ensureDay(d, key).battery[dim] = clamp(val);
      });
      logEvent("battery.reading", { dim, value: clamp(val) });
    },

    /* human battery priority — where focus goes (low|med|high).
       Mirrors setBattery; STATE stays untouched. */
    setBatteryPriority(key, dim, level) {
      if (!BATTERY.some((b) => b.key === dim)) return;
      const v = validBatteryPriority(level);
      update((d) => {
        ensureDay(d, key).batteryPriority[dim] = v;
      });
      logEvent("battery.priority", { dim, level: v });
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
          goalId: opts.goalId ?? null,
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
          quest: opts.quest,
          sourceResetId: opts.sourceResetId,
        },
        new Set(["q1", "q2", "q3", "q4"])
      );
      update((d) => {
        // A goal implies its commitment: denormalize so every existing
        // commitment reading keeps working off commitmentId.
        if (entry.goalId) {
          const g = (d.goals || []).find((x) => x.id === entry.goalId);
          if (g) entry.commitmentId = g.commitmentId;
          else entry.goalId = null;
        }
        d.focusItems.push(entry);
      });
      logEvent("focus.created", {
        id: entry.id,
        quadrant: entry.quadrant,
        timeframe: entry.timeframe,
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
      let doneNow = null;
      update((d) => {
        const f = d.focusItems.find((x) => x.id === id);
        if (!f) return;
        f.done = !f.done;
        doneNow = f.done;
        // Completing an action writes it into the action log as history.
        // Reopening never removes the entry — the log is a record, not a mirror.
        if (f.done) {
          d.actions.push({
            id: uid(),
            date: localDateKey(),
            ts: Date.now(),
            text: `Completed: ${f.text}`,
            tag: "focus",
          });
        }
        // The Take Action orientation practice is *taken*, not just named:
        // completing today's linked action practices it; reopening unmarks it.
        const day = ensureDay(d, localDateKey());
        const a = day.orientation?.action;
        if (a && a.focusItemId === id) {
          a.done = f.done;
          day.mantra.action = f.done;
        }
      });
      if (doneNow === true) logEvent("focus.completed", { id });
      else if (doneNow === false) logEvent("focus.reopened", { id });
    },
    deleteFocusItem(id) {
      update((d) => {
        d.focusItems = d.focusItems.filter((x) => x.id !== id);
        // Linked children become top-level rather than orphaned.
        for (const f of d.focusItems) {
          if (f.parentId === id) f.parentId = null;
        }
      });
      logEvent("focus.deleted", { id });
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
        // A day rank-1 is today's one thing — mirror it into Take Action.
        if (r === 1 && f.timeframe === "day" && !f.done) {
          mirrorDayOneThing(d, f);
        } else if (r === null) {
          // Rank cleared — unlink today's Take Action if it pointed here
          // (text/done are kept; the row falls back to the select).
          const day = ensureDay(d, localDateKey());
          if (day.orientation?.action?.focusItemId === id) {
            day.orientation.action.focusItemId = null;
          }
        }
      });
    },
    /**
     * Patch a focus item from its expanded editor. Accepted keys: text,
     * quadrant, commitmentId, notes, subtasks ([{id, text, done}]),
     * timeframe, daysOfWeek, months, mode, pillar, parentId, priority,
     * quest ({isQuest, brief, kinds}), done. priority 1|2|3 claims that rank in the item's timeframe
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
        if ("goalId" in patch || "commitmentId" in patch) {
          // A goal implies its commitment: resolve the commitment from
          // the goal so every commitment reading keeps working.
          const gid = patch.goalId || null;
          const g = gid ? (d.goals || []).find((x) => x.id === gid) : null;
          f.goalId = g ? gid : null;
          f.commitmentId = g ? g.commitmentId : patch.commitmentId || null;
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
        /* Quest patch: normalized (bad kinds dropped, shapes repaired).
           Unposting keeps the brief/kinds — only the flag flips. */
        if (patch.quest && typeof patch.quest === "object") {
          f.quest = normalizeQuest(patch.quest);
        }
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
            // A day rank-1 is today's one thing — mirror it into Take Action.
            if (p === 1 && f.timeframe === "day" && !f.done) {
              mirrorDayOneThing(d, f);
            }
          } else {
            f.priority = null;
            // Rank cleared — unlink today's Take Action if it pointed here.
            const day = ensureDay(d, localDateKey());
            if (day.orientation?.action?.focusItemId === id) {
              day.orientation.action.focusItemId = null;
            }
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
      logEvent("modes.selection", { interval, slot, mode: valid });
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
      logEvent("modes.current", { mode: valid });
    },

    /* guided resets */
    saveReset(fields) {
      const entry = {
        id: uid(),
        ts: Date.now(),
        date: localDateKey(),
        situation: String(fields?.situation ?? "").trim(),
        batteryNote: String(fields?.batteryNote ?? "").trim(),
        reveal: String(fields?.reveal ?? "").trim(),
        interpret: String(fields?.interpret ?? "").trim(),
        align: String(fields?.align ?? "").trim(),
        act: String(fields?.act ?? "").trim(),
        lifemod: String(fields?.lifemod ?? "").trim(),
        integrate: String(fields?.integrate ?? "").trim(),
        // Canonical practice fields.
        frictionReading: FRICTION_READINGS.some(
          (f) => f.key === fields?.frictionReading
        )
          ? fields.frictionReading
          : null,
        readiness:
          fields?.readiness && typeof fields.readiness === "object"
            ? {
                curiosity: fields.readiness.curiosity === true,
                competence: fields.readiness.competence === true,
                congruence: fields.readiness.congruence === true,
                connection: fields.readiness.connection === true,
              }
            : null,
        readinessNote: String(fields?.readinessNote ?? "").trim() || null,
        lifemodTypes: (() => {
          const raw = Array.isArray(fields?.lifemodTypes)
            ? fields.lifemodTypes
            : typeof fields?.lifemodType === "string"
              ? [fields.lifemodType]
              : [];
          return [
            ...new Set(
              raw.filter(
                (k) =>
                  typeof k === "string" &&
                  LIFEMOD_PLAIN_TYPES.some((t) => t.key === k)
              )
            ),
          ];
        })(),
        lifemodId: null, // set later via linkResetLifeMod
        integrateChoice: INTEGRATE_CHOICES.some(
          (c) => c.key === fields?.integrateChoice
        )
          ? fields.integrateChoice
          : null,
        reviewDate:
          typeof fields?.reviewDate === "string" && fields.reviewDate
            ? fields.reviewDate
            : null,
        // When the review was actually done (closes the "Reviews due" loop).
        reviewedAt: null,
        // Optional thread back to the Focus item this reset was
        // triggered from ("Explore in Guided Reset").
        sourceItemId:
          typeof fields?.sourceItemId === "string"
            ? fields.sourceItemId
            : null,
        // Optional thread back to the star (seed) this reset was
        // triggered from (Constellation's "Explore in Guided Reset").
        sourceStarId:
          typeof fields?.sourceStarId === "string"
            ? fields.sourceStarId
            : null,
      };
      update((d) => {
        if (!Array.isArray(d.resets)) d.resets = [];
        d.resets.push(entry);
      });
      logEvent("reset.session", {
        id: entry.id,
        sourceItemId: entry.sourceItemId || null,
        sourceStarId: entry.sourceStarId || null,
      });
      return entry;
    },
    deleteReset(id) {
      update((d) => {
        d.resets = d.resets.filter((r) => r.id !== id);
      });
    },
    /** Link a reset to the LifeMod grown from its LifeMod step. */
    linkResetLifeMod(resetId, lifemodId) {
      update((d) => {
        const r = (d.resets || []).find((x) => x.id === resetId);
        if (r) r.lifemodId = lifemodId || null;
      });
    },
    /** Mark a reset's review as done — clears it from "Reviews due". */
    markResetReviewed(resetId) {
      update((d) => {
        const r = (d.resets || []).find((x) => x.id === resetId);
        if (r) r.reviewedAt = Date.now();
      });
      logEvent("reset.reviewed", { id: resetId });
    },

    /* decision -> journey thread (transient, never persisted) */
    pendingResetSource,
    /**
     * Begin a Guided Reset from a Focus item. Only the source identity is
     * kept — the Journeys view resolves the live item for the Situation
     * autofill and matches any in-progress draft for that source.
     * Returns false when the item no longer exists.
     */
    requestResetFromDecision(id) {
      const item = state.focusItems.find((x) => x.id === id);
      if (!item) return false;
      setPendingResetSource({ kind: "focus", id: item.id });
      return true;
    },
    /**
     * Begin a Guided Reset from a Constellation star (seed): the reset's
     * Situation is pre-filled from the star's name (plus its note), and the
     * saved reset keeps a sourceStarId thread back to the seed.
     * Returns false when the star no longer exists.
     */
    requestResetFromStar(starId) {
      const star = state.stars.find((x) => x.id === starId);
      if (!star) return false;
      setPendingResetSource({ kind: "star", id: star.id });
      return true;
    },
    clearPendingResetSource() {
      setPendingResetSource(null);
    },
    /* growth practice launch thread (transient, never persisted) */
    pendingGrowthSource,
    /**
     * Begin a Growth Practice from a goal, habit, LifeMod, seed, or Focus
     * item. Only the source identity is kept — the Journeys view resolves
     * the live item for prefill. Returns false when the source is gone.
     */
    requestGrowthFrom(kind, id) {
      const ok =
        (kind === "goal" && state.goals.some((x) => x.id === id)) ||
        (kind === "habit" && state.habits.some((x) => x.id === id)) ||
        (kind === "lifemod" &&
          (state.lifemods || []).some((x) => x.id === id)) ||
        (kind === "star" && state.stars.some((x) => x.id === id)) ||
        (kind === "focus" && state.focusItems.some((x) => x.id === id));
      if (!ok) return false;
      setPendingGrowthSource({ kind, id });
      return true;
    },
    clearPendingGrowthSource() {
      setPendingGrowthSource(null);
    },
    /* In-progress Guided Reset drafts (synced — this is what makes resume
       work across devices). Saved on every step/scratch change while a
       reset is open; cleared on completion, explicit restart, or discard.
       One draft per id; source drafts use a deterministic id so a source
       holds at most one in-progress reset. */
    saveResetDraft(draft) {
      const d = normalizeResetDraft(draft);
      if (!d) return;
      update((s) => {
        const list = Array.isArray(s.resetDrafts) ? s.resetDrafts : [];
        const i = list.findIndex((x) => x && x.id === d.id);
        if (i >= 0) list[i] = d;
        else list.push(d);
        s.resetDrafts = list;
      });
    },
    clearResetDraft(id) {
      if (!id) return;
      update((s) => {
        const list = Array.isArray(s.resetDrafts) ? s.resetDrafts : [];
        const next = list.filter((x) => x && x.id !== id);
        if (next.length !== list.length) s.resetDrafts = next;
      });
    },

    /* growth practice drafts (synced, same machinery as reset drafts) */
    saveGrowthDraft(draft) {
      const d = normalizeGrowthDraft(draft);
      if (!d) return;
      update((s) => {
        const list = Array.isArray(s.growthDrafts) ? s.growthDrafts : [];
        const i = list.findIndex((x) => x && x.id === d.id);
        if (i >= 0) list[i] = d;
        else list.push(d);
        s.growthDrafts = list;
      });
    },
    clearGrowthDraft(id) {
      if (!id) return;
      update((s) => {
        const list = Array.isArray(s.growthDrafts) ? s.growthDrafts : [];
        const next = list.filter((x) => x && x.id !== id);
        if (next.length !== list.length) s.growthDrafts = next;
      });
    },

    /* growth practice completions (Growth Cards + review loop) */
    /** Persist a completed Growth Practice session; returns the entry. */
    saveGrowthSession(fields = {}) {
      const entry = {
        id: uid(),
        ts: Date.now(),
        date: localDateKey(),
        subjectKind:
          fields.subjectKind === "goal" || fields.subjectKind === "habit"
            ? fields.subjectKind
            : null,
        subjectId:
          typeof fields.subjectId === "string" && fields.subjectId
            ? fields.subjectId
            : null,
        subjectName:
          typeof fields.subjectName === "string"
            ? fields.subjectName.slice(0, 120)
            : "",
        commitmentId:
          typeof fields.commitmentId === "string" && fields.commitmentId
            ? fields.commitmentId
            : null,
        outcome:
          typeof fields.outcome === "string"
            ? fields.outcome.slice(0, 500)
            : "",
        evolutionNote:
          typeof fields.evolutionNote === "string"
            ? fields.evolutionNote.slice(0, 500)
            : "",
        energy: ["low", "okay", "high"].includes(fields.energy)
          ? fields.energy
          : null,
        capacity:
          fields.capacity && typeof fields.capacity === "object"
            ? {
                time: fields.capacity.time === true,
                energy: fields.capacity.energy === true,
                skill: fields.capacity.skill === true,
                support: fields.capacity.support === true,
              }
            : null,
        capacityNotes:
          typeof fields.capacityNotes === "string"
            ? fields.capacityNotes.slice(0, 500)
            : "",
        children: Array.isArray(fields.children) ? fields.children : [],
        lifemods: Array.isArray(fields.lifemods) ? fields.lifemods : [],
        focusItemIds: Array.isArray(fields.focusItemIds)
          ? fields.focusItemIds
          : [],
        vow:
          typeof fields.vow === "string" ? fields.vow.slice(0, 300) : "",
        reviewDate:
          typeof fields.reviewDate === "string" && fields.reviewDate
            ? fields.reviewDate
            : null,
        reviewedAt: null,
      };
      update((d) => {
        if (!Array.isArray(d.growthSessions)) d.growthSessions = [];
        d.growthSessions.push(entry);
      });
      logEvent("growth.completed", {
        id: entry.id,
        subjectKind: entry.subjectKind,
      });
      return entry;
    },
    /** Mark a growth session's review as done — clears it from "Reviews due". */
    markGrowthReviewed(id) {
      update((d) => {
        const r = (d.growthSessions || []).find((x) => x.id === id);
        if (r) r.reviewedAt = Date.now();
      });
      logEvent("growth.reviewed", { id });
    },

    /* nuclear option */
    /**
     * Replace the entire state envelope (used by cloud sync pulls).
     * Normalizes defensively; never throws on bad input. The caller is
     * responsible for suppressing the echo upsert.
     */
    replaceState(next) {
      setState(normalizeState(next));
    },
    resetAll() {
      const fresh = defaultState();
      armIntentionalErase();
      setState(fresh);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      } catch {
        /* ignore */
      }
    },
  };

  /* Test hook for the headless verification harness (file:// only):
     lets the harness drive store mutations. Absent on real deployments. */
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    window.__axzioTestHooks = window.__axzioTestHooks || {};
    window.__axzioTestHooks.api = api;
  }

  return (
    <AxzioContext.Provider value={api}>{children}</AxzioContext.Provider>
  );
}

/* Test hook: the headless verification harness (file:// only) drives store
   mutations through this. Never present on real deployments. */
if (typeof window !== "undefined" && window.location.protocol === "file:") {
  window.__axzioTestHooks = window.__axzioTestHooks || {};
}

function clamp(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return 1;
  return Math.min(10, Math.max(1, Math.round(n)));
}
