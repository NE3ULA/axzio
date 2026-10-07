/* AccountControl — quiet auth + sync status for the top nav.
 *
 * States:
 *  - not configured → subtle "Connect" (reopens the Supabase setup)
 *  - configured, signed out → "Sign in" (email/password modal, two tabs)
 *  - signed in → email + sync dot + "Sign out"
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCloud } from "../cloud.jsx";
import { useAxzio } from "../store.jsx";
import { Btn, Card, Field, MicroLabel } from "./ui.jsx";

function SyncDot({ status }) {
  const tone =
    status === "synced"
      ? "bg-white/80"
      : status === "syncing"
        ? "bg-white/40 animate-pulse"
        : status === "offline"
          ? "bg-white/25"
          : "bg-white/15";
  const label =
    status === "synced"
      ? "Synced"
      : status === "syncing"
        ? "Syncing…"
        : status === "offline"
          ? "Offline — will retry"
          : "Local only";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/45"
      title={label}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone}`} aria-hidden="true" />
      <span className="hidden lg:inline">{label}</span>
    </span>
  );
}

/* The sign-in / create-account form, shared by the gear-menu modal and
   the full-page login gate. onAuthenticated fires after a successful
   sign-in (the gate also lifts on its own via the auth subscription). */
export function AuthForm({ onAuthenticated }) {
  const { signIn, signUp, authBusy } = useCloud();
  const [tab, setTab] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const em = email.trim();
    if (!em || !password) {
      setError("Email and password are both required.");
      return;
    }
    const res =
      tab === "signin" ? await signIn(em, password) : await signUp(em, password);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.needsConfirmation) {
      setNotice(
        "Account created — check your email to confirm it, then sign in."
      );
      setTab("signin");
      return;
    }
    if (onAuthenticated) onAuthenticated();
  };

  return (
    <>
      <div className="mb-5 flex gap-2" role="tablist" aria-label="Sign in or create account">
        {[
          ["signin", "Sign in"],
          ["signup", "Create account"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => {
              setTab(key);
              setError("");
              setNotice("");
            }}
            className={`rounded-lg px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] transition-colors ${
              tab === key
                ? "bg-white/10 text-white"
                : "text-white/45 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <MicroLabel className="mb-1.5">Email</MicroLabel>
          <Field
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            aria-label="Email"
          />
        </div>
        <div>
          <MicroLabel className="mb-1.5">Password</MicroLabel>
          <Field
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === "signin" ? "current-password" : "new-password"}
            aria-label="Password"
          />
        </div>
        {error && (
          <p role="alert" className="text-[13px] leading-relaxed text-white/80">
            {error}
          </p>
        )}
        {notice && (
          <p className="text-[13px] leading-relaxed text-white/65">{notice}</p>
        )}
        <Btn type="submit" disabled={authBusy} className="w-full">
          {authBusy
            ? "Working…"
            : tab === "signin"
              ? "Sign in"
              : "Create account"}
        </Btn>
      </form>
      <p className="mt-4 text-[12px] leading-relaxed text-white/40">
        Your entries sync to your own Supabase project. Nothing is shared.
      </p>
    </>
  );
}

function AuthModal({ onClose }) {
  /* Portaled to document.body: the header carries a backdrop-blur, which
   * makes it a containing block for fixed descendants — without the portal
   * this modal would position itself relative to the header instead of the
   * viewport ("stuck in the header"). */
  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Account sign in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-sm p-7">
        <div className="mb-4 flex items-center justify-between">
          <MicroLabel>Account</MicroLabel>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/40 transition-colors hover:text-white"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1.5 1.5l9 9M10.5 1.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
          </button>
        </div>
        <AuthForm onAuthenticated={onClose} />
      </Card>
    </div>,
    document.body
  );
}

function GearIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function AiToggle() {
  const { state, setAiEnabled } = useAxzio();
  const aiEnabled = !!(state.settings && state.settings.aiEnabled);
  return (
    <div className="px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium tracking-wide text-white/80">
          AI.d reflections
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={aiEnabled}
          aria-label="AI.d reflections"
          onClick={() => setAiEnabled(!aiEnabled)}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
            aiEnabled ? "bg-white/70" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
              aiEnabled ? "left-[18px]" : "left-0.5"
            }`}
            aria-hidden="true"
          />
        </button>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-white/40">
        {aiEnabled
          ? "On — you'll be first in line when the intelligence layer launches."
          : "Off. AXZIO is fully usable without it."}{" "}
        AI.d is coming in a future update as an optional paid tier.
      </p>
    </div>
  );
}

export default function AccountControl() {
  const { configured, reopenSetup, user, signOut, syncStatus } = useCloud();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const openAuth = () => {
    setMenuOpen(false);
    setAuthOpen(true);
  };

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-label="Account and settings"
        className={`rounded-lg p-2 transition-colors ${
          menuOpen ? "text-white" : "text-white/45 hover:text-white"
        }`}
      >
        <GearIcon />
      </button>

      {menuOpen && (
        <div
          className="absolute right-0 top-full z-40 mt-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 shadow-2xl shadow-black/60 backdrop-blur-md"
          role="menu"
          aria-label="Account and settings"
        >
          <div className="px-3 pb-1 pt-3">
            <MicroLabel>Account</MicroLabel>
          </div>

          {!configured && (
            <div className="px-3 py-2">
              <p className="mb-2.5 text-[12px] leading-relaxed text-white/50">
                Connect your own Supabase project to sync entries across
                devices.
              </p>
              <Btn
                className="w-full"
                onClick={() => {
                  setMenuOpen(false);
                  reopenSetup();
                }}
              >
                Connect Supabase
              </Btn>
            </div>
          )}

          {configured && !user && (
            <div className="px-3 py-2">
              <Btn className="w-full" onClick={openAuth}>
                Sign in
              </Btn>
              <p className="mt-2 text-[11px] leading-relaxed text-white/40">
                No account yet? Sign in opens the create-account tab.
              </p>
            </div>
          )}

          {configured && user && (
            <div className="px-3 py-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="min-w-0 flex-1 truncate text-[12px] text-white/70">
                  {user.email}
                </span>
                <SyncDot status={syncStatus} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.18em] text-white/45 transition-colors hover:bg-white/5 hover:text-white"
              >
                Sign out
              </button>
            </div>
          )}

          <div className="mx-3 my-1 border-t border-white/10" />

          <div className="px-3 pb-1 pt-2">
            <MicroLabel>Intelligence</MicroLabel>
          </div>
          <AiToggle />
          <div className="h-2" />
          <div className="border-t border-white/10 px-3 py-2">
            <p className="text-[10px] tracking-[0.14em] text-white/25">
              BUILD {typeof __BUILD_SHA__ !== "undefined" ? __BUILD_SHA__ : "dev"}
            </p>
          </div>
        </div>
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
