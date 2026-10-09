/* Cloud sync + auth — Supabase-backed persistence for AXZIO.
 *
 * Layered on top of the local store (store.jsx). localStorage remains the
 * source of truth at all times; the cloud is a synced copy. Every failure
 * mode fails soft: the app works fully offline, and syncing resumes on
 * the next mutation or boot.
 *
 * Conflict rule: last-write-wins by `updatedAt` (local mutation clock)
 * vs the row's `updated_at`. Documented in APP_ARCHITECTURE.md.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAxzio, STORAGE_KEY, SYNC_VERSION, isEmptyState, isBarelyStarted, consumeIntentionalErase } from "./store.jsx";
import { peekOutbox, dropEvents, logEvent } from "./events.js";
import {
  CLOUD_TABLE,
  threeWayMerge,
  mergeWithoutBase,
  unionDayData,
  getSupabaseClient,
  getClientError,
  getSupabaseConfig,
  isSupabaseConfigured,
  saveSupabaseConfig,
  clearSupabaseConfig,
  skipSupabaseSetup,
  unskipSupabaseSetup,
  supabaseSetupSkipped,
} from "./supabase.js";

const CloudContext = createContext(null);

export function useCloud() {
  const ctx = useContext(CloudContext);
  if (!ctx) throw new Error("useCloud must be used inside CloudProvider");
  return ctx;
}

/* syncStatus: idle | syncing | synced | offline */
export function CloudProvider({ children }) {
  const { state, replaceState, addSignal } = useAxzio();
  // Ref so the boot merge (run once) always reaches the latest addSignal
  // without re-triggering the merge effect on store re-renders.
  const addSignalRef = useRef(null);
  addSignalRef.current = addSignal;

  const [configured, setConfigured] = useState(() => isSupabaseConfigured());
  const [showSetup, setShowSetup] = useState(
    () => !isSupabaseConfigured() && !supabaseSetupSkipped()
  );
  const [user, setUser] = useState(null);
  // True once the first session check has completed — lets the app tell
  // "signed out" apart from "haven't checked yet" (no login-screen flash).
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [authBusy, setAuthBusy] = useState(false);

  const stateRef = useRef(state);
  // The updatedAt both sides agree on, persisted across boots. Lets the
  // merge distinguish "this device has unsynced edits" from "this device's
  // clock just runs fast" — a stale snapshot must never clobber the cloud.
  const LAST_SYNC_KEY = "axzio-last-synced-v1";
  const lastSyncedRef = useRef(null); // updatedAt already reflected in cloud
  if (lastSyncedRef.current === null) {
    try {
      const v = localStorage.getItem(LAST_SYNC_KEY);
      lastSyncedRef.current = v === null ? null : Number(v) || 0;
    } catch {
      lastSyncedRef.current = null;
    }
  }
  // The last snapshot both sides agreed on, persisted across boots.
  // The merge compares each side's content against this base instead of
  // comparing wall clocks across devices.
  const LAST_SNAPSHOT_KEY = "axzio-last-synced-snapshot-v1";
  const markSynced = (snapshot) => {
    const ts = (snapshot && snapshot.updatedAt) || 0;
    lastSyncedRef.current = ts;
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(ts));
      localStorage.setItem(LAST_SNAPSHOT_KEY, JSON.stringify(snapshot));
    } catch {
      /* storage full/blocked — the in-memory ref still guards this session */
    }
  };
  const loadBaseSnapshot = () => {
    try {
      const raw = localStorage.getItem(LAST_SNAPSHOT_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  };
  const mergeRanRef = useRef(false);
  // A boot/sign-in merge must finish before any push is allowed. Without
  // this gate, a slow merge on a flaky connection lets the debounced push
  // below upload stale local state over newer cloud data.
  const mergeCompletedRef = useRef(false);
  const pendingPushRef = useRef(false);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const userRef = useRef(null);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const pushState = useCallback(async (client, userId, snapshot) => {
    const { error } = await client.from(CLOUD_TABLE).upsert(
      {
        user_id: userId,
        state: snapshot,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    return error || null;
  }, []);

  /* Capture inbox drain (the seamless-capture pipeline). The iOS
     "Capture to AXZIO" Shortcut POSTs text rows to axzio_inbox (anon
     INSERT-only RLS). After a successful signed-in merge, each row becomes
     a spark via addSignal and the ingested rows are deleted. Fully
     defensive: if the table doesn't exist yet (SQL not run) or the network
     fails, capture simply isn't wired up — nothing breaks, nothing shows. */
  const drainInbox = useCallback(async (client, userId) => {
    try {
      const { data: rows, error } = await client
        .from("axzio_inbox")
        .select("id, text")
        .eq("user_id", userId);
      if (error) return;
      if (!rows || rows.length === 0) return;
      const add = addSignalRef.current;
      if (typeof add !== "function") return;
      const ingested = [];
      for (const row of rows) {
        try {
          const entry = add(row.text);
          if (entry) ingested.push(row.id);
        } catch {
          /* one bad row never blocks the rest */
        }
      }
      if (ingested.length > 0) {
        await client.from("axzio_inbox").delete().in("id", ingested);
      }
    } catch {
      /* inbox unreachable — fail soft, local remains source of truth */
    }
  }, []);

  /**
   * Boot / sign-in merge. With an active session: fetch the cloud row.
   * - No cloud row → push local.
   * - Fresh local (no envelope at boot) → pull cloud.
   * - Both → newer `updatedAt`/`updated_at` wins (last-write-wins).
   */
  const runBootMerge = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setSyncStatus("syncing");
    try {
      const {
        data: { session },
        error: sessErr,
      } = await client.auth.getSession();
      if (sessErr) throw sessErr;
      const u = session?.user ?? null;
      setUser(u);
      setAuthReady(true);
      if (!u) {
        setSyncStatus("idle");
        return;
      }
      const { data: row, error } = await client
        .from(CLOUD_TABLE)
        .select("state, updated_at")
        .eq("user_id", u.id)
        .maybeSingle();
      if (error) throw error;

      const local = stateRef.current;
      // An intentional "erase everything" always pushes, even when the
      // snapshot is blank — the blank-safety guard below must not stop it.
      const forcePush = consumeIntentionalErase();
      const cloudState =
        row && row.state && typeof row.state === "object" ? row.state : null;
      // Content-based sync: compare each side against the last snapshot
      // both sides agreed on. No wall clocks — device clocks disagree, and
      // clock-based last-write-wins silently discarded this device's
      // unsynced edits on re-login (lost focus items, placements, name).
      const base = loadBaseSnapshot();
      // Fall back to the persisted sync clock for containers that synced
      // under a previous protocol (timestamp but no snapshot persisted).
      const baseTs = (base && base.updatedAt) || lastSyncedRef.current || 0;
      // An empty local state is NEVER dirty: emptiness is the absence of
      // information, not an edit. Without this, a container that lost its
      // state envelope (cleared storage, corrupt JSON quarantine) but kept
      // its old sync point would 3-way merge "reverted to empty" as a
      // legitimate change — and the empty side wins conflicts, wiping the
      // cloud. (The desktop web-app overwrite.)
      const localDirty =
        !isEmptyState(local) && (local.updatedAt || 0) !== baseTs;
      const cloudDirty = !!cloudState && (cloudState.updatedAt || 0) !== baseTs;
      if (forcePush) {
        // Intentional "erase everything": the blank slate pushes
        // unconditionally — this is the one path where emptiness propagates.
        const err = await pushState(client, u.id, local);
        if (err) throw err;
        markSynced(local);
      } else if (!cloudState) {
        // No cloud row yet: seed it. Nothing exists to clobber.
        const err = await pushState(client, u.id, local);
        if (err) throw err;
        markSynced(local);
      } else if (!forcePush && isBarelyStarted(local)) {
        // A barely-started device — day check-ins and captured sparks, but
        // no durable structure — must never push over (or merge-wipe) a
        // cloud that holds real state. Without this, a fresh install that
        // did a morning check-in would three-way merge its emptiness over
        // the full cloud from a null base, and the device-in-hand
        // tie-break would even revert the traveler's name to "".
        // Pull the cloud instead, folding this device's day data in so
        // today's work survives. A deliberate wipe still goes through the
        // erase hatch (forcePush above).
        const merged = unionDayData(cloudState, local);
        replaceState(merged);
        const err = await pushState(client, u.id, merged);
        if (err) throw err;
        markSynced(merged);
      } else if ((cloudState.syncVersion || 0) < SYNC_VERSION) {
        // The cloud was written by a stale client (pre-protocol version).
        // Never pull that poison in — heal the cloud by pushing this
        // device's state instead. Exception: this device is empty, in
        // which case the cloud's copy is the best available — take it.
        // (A DB CHECK constraint now rejects stale writes outright, so
        // this branch only ever handles pre-constraint rows.)
        if (!forcePush && isEmptyState(local) && !isEmptyState(cloudState)) {
          replaceState(cloudState);
          markSynced(cloudState);
        } else {
          const err = await pushState(client, u.id, local);
          if (err) throw err;
          markSynced(local);
        }
      } else if (!localDirty && !cloudDirty) {
        // Already in agreement.
        markSynced(local);
      } else if (localDirty && !cloudDirty) {
        // Only this device moved: push. Blank-safety still applies —
        // never upload a blank slate over real cloud data.
        if (!forcePush && isEmptyState(local) && !isEmptyState(cloudState)) {
          replaceState(cloudState);
          markSynced(cloudState);
        } else {
          const err = await pushState(client, u.id, local);
          if (err) throw err;
          markSynced(local);
        }
      } else if (!localDirty && cloudDirty) {
        // Only the cloud moved: pull.
        replaceState(cloudState);
        markSynced(cloudState);
      } else {
        // Genuine conflict: both sides moved since the last agreement.
        // With a base snapshot, per-section 3-way merge keeps each side's
        // non-overlapping edits and the device in hand wins ties. Without
        // a base there is no common ancestor, so emptiness is read as
        // absence (never a deletion) and append-only collections union —
        // a sparse device can no longer wipe a full cloud from a null base.
        const baseAbsent =
          !base || typeof base !== "object" || Object.keys(base).length === 0;
        const { merged, conflicts } = baseAbsent
          ? mergeWithoutBase(local, cloudState)
          : threeWayMerge(base, local, cloudState);
        if (conflicts.length > 0) {
          logEvent("sync.conflict", { keys: conflicts, baseAbsent });
        }
        replaceState(merged);
        const err = await pushState(client, u.id, merged);
        if (err) throw err;
        markSynced(merged);
      }
      // The merge finished with a signed-in user: pushes are now safe.
      // Flush anything that queued while the merge was in flight.
      mergeCompletedRef.current = true;
      // Drain the capture inbox: the iOS Shortcut POSTs rows to
      // axzio_inbox while the user is out in the world. Each row becomes
      // a spark, then the row is deleted. Silent — the sparks simply
      // appear in the Bridge's Sparks section.
      await drainInbox(client, u.id);
      if (pendingPushRef.current) {
        pendingPushRef.current = false;
        const cur = stateRef.current;
        if ((cur.updatedAt || 0) !== lastSyncedRef.current) {
          const err = await pushState(client, u.id, cur);
          if (err) throw err;
          markSynced(cur);
        }
      }
      setSyncStatus("synced");
    } catch {
      // Fail soft: local remains the source of truth.
      setAuthReady(true);
      setSyncStatus("offline");
    }
  }, [pushState, replaceState, drainInbox]);

  /* Run the merge once the client is configured; track session changes.
     The effect depends only on `configured` — the merge itself is reached
     through a ref so store re-renders never re-trigger it. */
  const mergeRef = useRef(null);
  mergeRef.current = runBootMerge;
  useEffect(() => {
    if (!configured) {
      setSyncStatus("idle");
      setUser(null);
      return;
    }
    const client = getSupabaseClient();
    if (!client) return;
    if (!mergeRanRef.current) {
      mergeRanRef.current = true;
      mergeRef.current();
    }
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      try {
        sub?.subscription?.unsubscribe();
      } catch {
        /* ignore */
      }
    };
  }, [configured]);

  /* Immediate push of whatever this device hasn't synced yet. The
     debounced effect below schedules it; page-hide and reconnect call it
     directly so a quick final edit (rename the traveler, tap done, switch
     apps) still lands, and a failed push is retried when the connection
     returns instead of waiting for the next edit. */
  const pushNow = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const u = userRef.current;
    if (!u || !mergeCompletedRef.current) return;
    const cur = stateRef.current;
    if ((cur.updatedAt || 0) === lastSyncedRef.current) return;
    // Blank-safety: never upload a blank slate over the cloud.
    // (An intentional "erase everything" consumes its escape hatch.)
    if (isEmptyState(cur) && !consumeIntentionalErase()) return;
    const client = getSupabaseClient();
    if (!client) {
      setSyncStatus("offline");
      return;
    }
    setSyncStatus((s) => (s === "synced" || s === "idle" ? "syncing" : s));
    try {
      const err = await pushState(client, u.id, cur);
      if (err) throw err;
      markSynced(cur);
      setSyncStatus("synced");
    } catch {
      setSyncStatus("offline");
    }
  }, [pushState]);

  /* Debounced upsert after every local mutation (signed in only).
     Never pushes before the boot/sign-in merge completes: on a flaky
     connection an early push would overwrite newer cloud data with
     whatever this device had locally. While the merge is pending,
     changes are held and the merge is retried. */
  useEffect(() => {
    if (!configured || !user) return;
    const cur = stateRef.current;
    if ((cur.updatedAt || 0) === lastSyncedRef.current) return;
    if (!mergeCompletedRef.current) {
      pendingPushRef.current = true;
      setSyncStatus((s) => (s === "synced" || s === "idle" ? "syncing" : s));
      const rt = setTimeout(() => {
        try {
          mergeRef.current?.();
        } catch {
          /* the merge fails soft on its own */
        }
      }, 8000);
      return () => clearTimeout(rt);
    }
    // Blank-safety: never upload a blank slate over the cloud. The merge
    // already ran, so if local is empty here while a cloud row exists, the
    // merge would have pulled it — reaching this point with an empty local
    // means something went wrong; hold the push and retry the merge.
    // (An intentional "erase everything" consumes its escape hatch.)
    if (isEmptyState(cur) && !consumeIntentionalErase()) {
      pendingPushRef.current = true;
      const rt = setTimeout(() => {
        try {
          mergeRef.current?.();
        } catch {
          /* the merge fails soft on its own */
        }
      }, 8000);
      return () => clearTimeout(rt);
    }
    setSyncStatus((s) => (s === "synced" || s === "idle" ? "syncing" : s));
    const t = setTimeout(() => {
      pushNow();
    }, 1500);
    return () => clearTimeout(t);
  }, [state, configured, user, pushNow]);

  /* Flush unsynced changes when the page hides (a closing tab kills the
     1.5s debounce above — the classic mobile "quick edit, switch apps"
     loss) and retry the push when the browser reports the connection
     back. Best-effort: strictly better than losing the edit. */
  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState === "hidden") pushNow();
    };
    const onPageHide = () => pushNow();
    const onOnline = () => pushNow();
    document.addEventListener("visibilitychange", onHidden);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("online", onOnline);
    return () => {
      document.removeEventListener("visibilitychange", onHidden);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("online", onOnline);
    };
  }, [pushNow]);

  /* Event journal drain: append-only history for readings + future AI.d.
     Signed-in only; missing table / offline → events stay queued. */
  const drainEvents = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    let sessionUser = null;
    try {
      const {
        data: { session },
      } = await client.auth.getSession();
      sessionUser = session?.user ?? null;
    } catch {
      return;
    }
    if (!sessionUser) return;
    const queued = peekOutbox();
    if (!queued.length) return;
    const batch = queued.slice(0, 100);
    try {
      const { error } = await client.from("axzio_events").insert(
        batch.map((e) => ({
          user_id: sessionUser.id,
          ts: new Date(e.ts).toISOString(),
          type: e.type,
          payload: e.payload,
        }))
      );
      if (!error) dropEvents(batch.map((e) => e.id));
      // On error (e.g. table not created yet): keep queued, retry later.
    } catch {
      /* soft-fail */
    }
  }, []);

  useEffect(() => {
    if (!configured || !user) return;
    drainEvents();
    const t = setInterval(drainEvents, 45000);
    return () => clearInterval(t);
  }, [configured, user, drainEvents]);

  /* ---------- setup ---------- */

  const saveSetup = useCallback(
    async (url, anonKey) => {
      const ok = saveSupabaseConfig(url, anonKey);
      if (!ok) return { error: "The configuration couldn't be saved in this browser. Please try again." };
      mergeRanRef.current = false;
      mergeCompletedRef.current = false;
      pendingPushRef.current = false;
      setConfigured(true);
      setShowSetup(false);
      // The configured-effect picks up from here and runs the merge.
      return { ok: true };
    },
    []
  );

  const disconnect = useCallback(() => {
    clearSupabaseConfig();
    setConfigured(false);
    setUser(null);
    setSyncStatus("idle");
    setShowSetup(true);
    mergeRanRef.current = false;
    mergeCompletedRef.current = false;
    pendingPushRef.current = false;
  }, []);

  const skipSetup = useCallback(() => {
    skipSupabaseSetup();
    setShowSetup(false);
  }, []);

  const reopenSetup = useCallback(() => {
    unskipSupabaseSetup();
    setShowSetup(true);
  }, []);

  const closeSetup = useCallback(() => {
    // Only closable without saving when skipping is allowed.
    setShowSetup(false);
  }, []);

  /* ---------- auth (email + password; no magic link, so no redirect-URL
     configuration is needed across surfaces) ---------- */

  const signUp = useCallback(async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      if (!getSupabaseConfig())
        return {
          error:
            "The Supabase configuration wasn't saved. Please re-enter your Project URL and anon key.",
        };
      return {
        error:
          "Couldn't start the Supabase client. " +
          (getClientError() ||
            "Check that the Project URL looks like https://xyz.supabase.co and the anon key is correct."),
      };
    }
    setAuthBusy(true);
    try {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) return { error: error.message };
      if (!data.session) {
        // "Confirm email" is enabled in the project: no session yet.
        return { needsConfirmation: true };
      }
      setUser(data.session.user);
      await runBootMerge();
      return { ok: true };
    } finally {
      setAuthBusy(false);
    }
  }, [runBootMerge]);

  const signIn = useCallback(async (email, password) => {
    const client = getSupabaseClient();
    if (!client) {
      if (!getSupabaseConfig())
        return {
          error:
            "The Supabase configuration wasn't saved. Please re-enter your Project URL and anon key.",
        };
      return {
        error:
          "Couldn't start the Supabase client. " +
          (getClientError() ||
            "Check that the Project URL looks like https://xyz.supabase.co and the anon key is correct."),
      };
    }
    setAuthBusy(true);
    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      setUser(data.user ?? data.session?.user ?? null);
      await runBootMerge();
      return { ok: true };
    } finally {
      setAuthBusy(false);
    }
  }, [runBootMerge]);

  const signOut = useCallback(async () => {
    const client = getSupabaseClient();
    try {
      await client?.auth.signOut();
    } catch {
      /* signing out is local-first; ignore network errors */
    }
    // Stop syncing; local data stays intact.
    setUser(null);
    setSyncStatus("idle");
    mergeCompletedRef.current = false;
    pendingPushRef.current = false;
  }, []);

  const value = {
    configured,
    showSetup,
    saveSetup,
    disconnect,
    skipSetup,
    reopenSetup,
    closeSetup,
    user,
    authReady,
    authBusy,
    signUp,
    signIn,
    signOut,
    syncStatus,
    syncNow: runBootMerge,
  };

  /* Test hook (file:// only): lets the headless harness drive auth. */
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    window.__axzioTestHooks = window.__axzioTestHooks || {};
    window.__axzioTestHooks.cloud = value;
  }

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}
