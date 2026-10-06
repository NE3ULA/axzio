/* events.js — append-only event journal for AXZIO.
 *
 * logEvent(type, payload) is fire-and-forget: events land in a
 * localStorage-backed outbox (capped), and the cloud layer drains the
 * outbox into the Supabase `axzio_events` table when online. Missing
 * table / offline / signed-out → events stay queued and retry later.
 *
 * Event types are stable strings, e.g. "battery.reading",
 * "focus.completed", "seed.transition". Payloads are small JSON.
 * This journal is what future identity-signal readings and AI.d will
 * reconstruct history from — it records what happened, not just the
 * current state.
 */

const OUTBOX_KEY = "axzio-event-outbox-v1";
const CAP = 500;

function uid() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

function readOutbox() {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeOutbox(arr) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(arr.slice(-CAP)));
  } catch {
    /* storage unavailable — events are best-effort */
  }
}

/** Append an event to the outbox. Never throws. */
export function logEvent(type, payload = {}) {
  if (!type || typeof type !== "string") return;
  try {
    const entry = {
      id: uid(),
      ts: Date.now(),
      type,
      payload: payload && typeof payload === "object" ? payload : {},
    };
    const box = readOutbox();
    box.push(entry);
    writeOutbox(box);
  } catch {
    /* best-effort */
  }
}

/** Peek at queued events (oldest first). */
export function peekOutbox() {
  return readOutbox();
}

/** Remove events by local id after a successful drain. */
export function dropEvents(ids) {
  if (!ids || !ids.length) return;
  const set = new Set(ids);
  writeOutbox(readOutbox().filter((e) => !set.has(e.id)));
}

/** Local recent history (for readings UI when cloud is unavailable). */
export function recentLocalEvents(type, sinceTs, limit = 200) {
  return readOutbox()
    .filter(
      (e) =>
        (!type || e.type === type) &&
        (!sinceTs || e.ts >= sinceTs)
    )
    .slice(-limit);
}
