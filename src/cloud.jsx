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
import { useAxzio, STORAGE_KEY, isEmptyState, consumeIntentionalErase } from "./store.jsx";
import { peekOutbox, dropEvents } from "./events.js";
import {
  CLOUD_TABLE,
  decideSyncDirection,
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
  const { state, replaceState } = useAxzio();

  const [configured, setConfigured] = useState(() => isSupabaseConfigured());
  const [showSetup, setShowSetup] = useState(
    () => !isSupabaseConfigured() && !supabaseSetupSkipped()
  );
  const [user, setUser] = useState(null);
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
  const markSynced = (ts) => {
    lastSyncedRef.current = ts;
    try {
      localStorage.setItem(LAST_SYNC_KEY, String(ts));
    } catch {
      /* storage full/blocked — the in-memory ref still guards this session */
    }
  };
  const mergeRanRef = useRef(false);
  // A boot/sign-in merge must finish before any push is allowed. Without
  // this gate, a slow merge on a flaky connection lets the debounced push
  // below upload stale local state over newer cloud data.
  const mergeCompletedRef = useRef(false);
  const pendingPushRef = useRef(false);

  // Whether a local envelope existed BEFORE this boot (captured at first
  // render — before the store's persist effect can write one).
  const hadLocalAtBoot = useRef(null);
  if (hadLocalAtBoot.current === null) {
    try {
      hadLocalAtBoot.current = localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      hadLocalAtBoot.current = false;
    }
  }

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
      let direction = forcePush
        ? "push"
        : decideSyncDirection({
            localUpdatedAt: local.updatedAt || 0,
            hadLocal: hadLocalAtBoot.current,
            cloudUpdatedAt: row ? Date.parse(row.updated_at) || 0 : null,
          });
      if (direction === "push" && !forcePush && row) {
        // Clock-skew guard: push only what this device hasn't already
        // synced. If local.updatedAt matches the last agreed sync point,
        // this device holds nothing new — a "newer" local clock is skew,
        // not new data. Pull instead of letting a stale snapshot clobber
        // the cloud (this is how a traveler name came back as "Traveler").
        const unsynced =
          hadLocalAtBoot.current &&
          (local.updatedAt || 0) !== (lastSyncedRef.current || 0);
        if (!unsynced) direction = "pull";
      }
      if (direction === "push") {
        const cloudHasContent = row && row.state && !isEmptyState(row.state);
        if (!forcePush && isEmptyState(local) && cloudHasContent) {
          // Blank-safety: this device holds a blank slate while the cloud
          // holds real data. Never upload the blank over it — take the
          // cloud's copy instead.
          replaceState(row.state);
          markSynced((row.state && row.state.updatedAt) || 0);
        } else {
          const err = await pushState(client, u.id, local);
          if (err) throw err;
          markSynced(local.updatedAt || 0);
        }
      } else if (direction === "pull") {
        replaceState(row.state);
        markSynced((row.state && row.state.updatedAt) || 0);
      } else {
        markSynced(local.updatedAt || 0);
      }
      // The merge finished with a signed-in user: pushes are now safe.
      // Flush anything that queued while the merge was in flight.
      mergeCompletedRef.current = true;
      if (pendingPushRef.current) {
        pendingPushRef.current = false;
        const cur = stateRef.current;
        if ((cur.updatedAt || 0) !== lastSyncedRef.current) {
          const err = await pushState(client, u.id, cur);
          if (err) throw err;
          markSynced(cur.updatedAt || 0);
        }
      }
      setSyncStatus("synced");
    } catch {
      // Fail soft: local remains the source of truth.
      setSyncStatus("offline");
    }
  }, [pushState, replaceState]);

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
      markSynced(cur.updatedAt || 0);
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
