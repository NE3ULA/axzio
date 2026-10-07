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
