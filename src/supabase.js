/* Supabase connection — zero hardcoded secrets.
 *
 * The Project URL + anon key are entered once by the user in the in-app
 * setup screen and kept in localStorage under their own key (never in the
 * repo, never in chat). The anon key is public-safe by design; row-level
 * security (auth.uid() = user_id) protects the data.
 *
 * The client is built lazily on first use. Importing this module performs
 * no network calls.
 */

import { createClient } from "@supabase/supabase-js";

export const SUPABASE_CONFIG_KEY = "axzio-supabase-config";
export const SUPABASE_SKIPPED_KEY = "axzio-supabase-skipped";
export const CLOUD_TABLE = "axzio_state";

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function removeRaw(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/** In-memory fallback: some sandboxes silently drop localStorage writes.
 *  The config always lives here for the session; localStorage is a
 *  best-effort persistence layer on top. */
let memoryConfig = null;

/** { url, anonKey } or null when never saved. */
export function getSupabaseConfig() {
  if (memoryConfig && memoryConfig.url && memoryConfig.anonKey)
    return memoryConfig;
  const raw = readRaw(SUPABASE_CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed.url === "string" &&
      typeof parsed.anonKey === "string" &&
      parsed.url.trim() &&
      parsed.anonKey.trim()
    ) {
      memoryConfig = { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
      return memoryConfig;
    }
  } catch {
    /* malformed — treat as absent */
  }
  return null;
}

/** Loose URL sanity check (not a security boundary). */
export function looksLikeSupabaseUrl(url) {
  return /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test((url || "").trim());
}

export function saveSupabaseConfig(url, anonKey) {
  const cfg = { url: url.trim(), anonKey: anonKey.trim() };
  memoryConfig = cfg; // session truth — always works
  writeRaw(SUPABASE_CONFIG_KEY, JSON.stringify(cfg)); // best-effort persist
  removeRaw(SUPABASE_SKIPPED_KEY);
  dropClient();
  // Verify the save actually stuck; callers can surface this.
  return getSupabaseConfig() != null;
}

export function clearSupabaseConfig() {
  memoryConfig = null;
  removeRaw(SUPABASE_CONFIG_KEY);
  dropClient();
}

/** The user chose "Use offline for now". */
export function skipSupabaseSetup() {
  writeRaw(SUPABASE_SKIPPED_KEY, "1");
}

export function unskipSupabaseSetup() {
  removeRaw(SUPABASE_SKIPPED_KEY);
}

export function supabaseSetupSkipped() {
  return readRaw(SUPABASE_SKIPPED_KEY) === "1";
}

export function isSupabaseConfigured() {
  const cfg = getSupabaseConfig();
  return !!(cfg && cfg.url && cfg.anonKey && looksLikeSupabaseUrl(cfg.url));
}

let client = null;
let clientError = null;

/** Lazily built singleton; null when unconfigured. No network at import. */
export function getSupabaseClient() {
  if (client) return client;
  const cfg = getSupabaseConfig();
  if (!cfg || !cfg.url || !cfg.anonKey) return null;
  try {
    client = createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    clientError = null;
  } catch (e) {
    client = null;
    clientError = e?.message || String(e);
  }
  return client;
}

/** Why the client failed to initialize, if it did. */
export function getClientError() {
  return clientError;
}

function dropClient() {
  client = null;
  clientError = null;
}

/**
 * Pure merge decision for the boot/sign-in sync.
 * - cloudUpdatedAt: ms epoch of the row's updated_at, or null when no row.
 * - hadLocal: whether a local envelope existed before this boot.
 * Returns 'push' | 'pull' | 'synced' (last-write-wins).
 */
export function decideSyncDirection({
  localUpdatedAt,
  hadLocal,
  cloudUpdatedAt,
}) {
  if (cloudUpdatedAt == null) return "push";
  if (!hadLocal) return "pull";
  if (cloudUpdatedAt > localUpdatedAt) return "pull";
  if (localUpdatedAt > cloudUpdatedAt) return "push";
  return "synced";
}

/* Order-stable stringify for content comparison: two snapshots with the
   same data compare equal regardless of key insertion order. */
function stableStringify(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(stableStringify).join(",") + "]";
  const keys = Object.keys(v).sort();
  return (
    "{" +
    keys.map((k) => JSON.stringify(k) + ":" + stableStringify(v[k])).join(",") +
    "}"
  );
}

/**
 * Three-way merge of whole-state snapshots, section by section.
 * `base` is the last snapshot both sides agreed on; `local` and `cloud`
 * are the diverged copies. A top-level section changed on only one side
 * takes that side's value; a section changed on both keeps the local copy
 * (the device in the user's hand) and is reported in `conflicts`.
 * Unlike clock-based last-write-wins, this never silently discards one
 * side's edits — the failure mode that ate focus items on re-login.
 * Returns { merged, conflicts }. merged.updatedAt is bumped so the merged
 * result wins the next sync round on every device.
 */
export function threeWayMerge(base, local, cloud) {
  const b = base && typeof base === "object" ? base : {};
  const l = local && typeof local === "object" ? local : {};
  const c = cloud && typeof cloud === "object" ? cloud : {};
  const merged = {};
  const conflicts = [];
  const keys = new Set([
    ...Object.keys(b),
    ...Object.keys(l),
    ...Object.keys(c),
  ]);
  for (const k of keys) {
    if (k === "updatedAt") continue; // stamped below
    const bv = stableStringify(b[k]);
    const lv = stableStringify(l[k]);
    const cv = stableStringify(c[k]);
    if (lv === cv) {
      if (l[k] !== undefined) merged[k] = l[k];
      else if (c[k] !== undefined) merged[k] = c[k];
    } else if (lv === bv) {
      if (c[k] !== undefined) merged[k] = c[k]; // only cloud moved
    } else if (cv === bv) {
      if (l[k] !== undefined) merged[k] = l[k]; // only local moved
    } else {
      if (l[k] !== undefined) merged[k] = l[k]; // both moved: local wins
      conflicts.push(k);
    }
  }
  merged.updatedAt = Date.now();
  return { merged, conflicts };
}

/* ------------------------------------------------------------------ */
/* Base-absent merge safety (sync-guard patch, 2026-10-09).            */
/*                                                                     */
/* threeWayMerge needs a base — the last snapshot both sides agreed    */
/* on — to tell an edit apart from an absence. When the base is        */
/* missing (fresh install that never synced, cleared storage), the    */
/* naive merge treats every section as "changed on both sides" and the */
/* device-in-hand tie-break lets a sparse local state wipe a full     */
/* cloud: the name reverts to "" (the "defaults back to traveler"     */
/* bug), commitments/goals empty out, day history is replaced.        */
/*                                                                     */
/* mergeWithoutBase replaces the merge for that case with three rules: */
/*  1. Emptiness is the absence of information, never a deletion. A   */
/*     section empty on one side loses to the other side's content.    */
/*  2. Append-only collections are unioned, never chosen: days merge  */
/*     per date, arrays merge by id (same id → local wins).           */
/*  3. Genuine scalar conflicts still go to the device in hand.       */
/* A deliberate wipe still goes through the erase hatch (forcePush);  */
/* there is no silent path from "I deleted everything" to the cloud.  */
/* ------------------------------------------------------------------ */

/** True when a section value carries no information: absence, not an edit. */
function isSectionEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object")
    return Object.keys(v).every((k) => isSectionEmpty(v[k]));
  return false; // numbers, booleans: values, not absence
}

/** Union two arrays by id (falling back to value for id-less items).
 *  The cloud's order is kept; the local side's version wins same-id ties
 *  and its new items are appended. Nothing either side created is lost. */
function unionById(cloudArr, localArr) {
  const out = [];
  const at = new Map();
  const idOf = (item) =>
    item && typeof item === "object" && item.id !== undefined && item.id !== null
      ? "id:" + String(item.id)
      : "v:" + stableStringify(item);
  for (const item of cloudArr || []) {
    const id = idOf(item);
    if (!at.has(id)) {
      at.set(id, out.length);
      out.push(item);
    }
  }
  for (const item of localArr || []) {
    const id = idOf(item);
    if (at.has(id)) out[at.get(id)] = item;
    else {
      at.set(id, out.length);
      out.push(item);
    }
  }
  return out;
}

/** Union two day maps: every date survives; per date the fields shallow-
 *  merge with the local side winning ties (both check-ins happened). */
function unionDays(cloudDays, localDays) {
  const out = { ...(cloudDays || {}) };
  for (const [date, localDay] of Object.entries(localDays || {})) {
    const cloudDay = out[date];
    if (
      cloudDay &&
      typeof cloudDay === "object" &&
      !Array.isArray(cloudDay) &&
      localDay &&
      typeof localDay === "object" &&
      !Array.isArray(localDay)
    ) {
      out[date] = { ...cloudDay, ...localDay };
    } else if (localDay !== undefined) {
      out[date] = localDay;
    }
  }
  return out;
}

/** Identity is nested (name/becoming/commitments/values), so it gets its
 *  own field-wise pass: empty loses, arrays union, real scalar conflicts
 *  go to the device in hand. */
function mergeIdentityWithoutBase(lv, cv, conflicts) {
  const out = {};
  const keys = new Set([
    ...Object.keys(lv && typeof lv === "object" ? lv : {}),
    ...Object.keys(cv && typeof cv === "object" ? cv : {}),
  ]);
  for (const k of keys) {
    const a = lv && typeof lv === "object" ? lv[k] : undefined;
    const b = cv && typeof cv === "object" ? cv[k] : undefined;
    if (stableStringify(a) === stableStringify(b)) {
      if (a !== undefined) out[k] = a;
      else if (b !== undefined) out[k] = b;
    } else if (isSectionEmpty(a)) {
      if (b !== undefined) out[k] = b;
    } else if (isSectionEmpty(b)) {
      out[k] = a;
    } else if (Array.isArray(a) && Array.isArray(b)) {
      out[k] = unionById(b, a);
    } else {
      out[k] = a; // genuine conflict: device in hand wins
      conflicts.push("identity." + k);
    }
  }
  return out;
}

/**
 * Merge two diverged states with no common ancestor. See the block comment
 * above for the rules. Returns { merged, conflicts } like threeWayMerge.
 */
export function mergeWithoutBase(local, cloud) {
  const l = local && typeof local === "object" ? local : {};
  const c = cloud && typeof cloud === "object" ? cloud : {};
  const merged = {};
  const conflicts = [];
  const keys = new Set([...Object.keys(l), ...Object.keys(c)]);
  for (const k of keys) {
    if (k === "updatedAt") continue; // stamped below
    const lv = l[k];
    const cv = c[k];
    if (stableStringify(lv) === stableStringify(cv)) {
      if (lv !== undefined) merged[k] = lv;
      else if (cv !== undefined) merged[k] = cv;
    } else if (isSectionEmpty(lv)) {
      if (cv !== undefined) merged[k] = cv; // absence is not a deletion
    } else if (isSectionEmpty(cv)) {
      merged[k] = lv;
    } else if (k === "days") {
      merged[k] = unionDays(cv, lv);
    } else if (
      k === "identity" &&
      lv && typeof lv === "object" &&
      cv && typeof cv === "object"
    ) {
      merged[k] = mergeIdentityWithoutBase(lv, cv, conflicts);
    } else if (Array.isArray(lv) && Array.isArray(cv)) {
      merged[k] = unionById(cv, lv);
      conflicts.push(k);
    } else if (
      lv && typeof lv === "object" && !Array.isArray(lv) &&
      cv && typeof cv === "object" && !Array.isArray(cv)
    ) {
      merged[k] = { ...cv, ...lv }; // shallow union, local wins ties
      conflicts.push(k);
    } else {
      merged[k] = lv; // genuine scalar conflict: device in hand wins
      conflicts.push(k);
    }
  }
  merged.updatedAt = Date.now();
  return { merged, conflicts };
}

/**
 * Day-data union for the barely-started rule: the cloud's full state wins
 * wholesale, with this device's days and captured sparks folded in so
 * today's check-in is never lost in the rescue.
 */
export function unionDayData(cloudState, local) {
  const merged = { ...(cloudState || {}) };
  merged.days = unionDays(
    cloudState && cloudState.days,
    local && local.days
  );
  if (local && Array.isArray(local.signals)) {
    merged.signals = unionById(
      cloudState && Array.isArray(cloudState.signals) ? cloudState.signals : [],
      local.signals
    );
  }
  merged.updatedAt = Date.now();
  return merged;
}
