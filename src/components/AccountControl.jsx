/* AccountControl — quiet auth + sync status for the top nav.
 *
 * States:
 *  - not configured → subtle "Connect" (reopens the Supabase setup)
 *  - configured, signed out → "Sign in" (email/password modal, two tabs)
 *  - signed in → email + sync dot + "Sign out"
 */

import { useState } from "react";
import { useCloud } from "../cloud.jsx";
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

function AuthModal({ onClose }) {
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
    onClose();
  };

  return (
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

        <div className="mb-5 flex gap-2" role="tablist" aria-label="Sign in or create account">
          {[
            ["signin", "Sign in"],
            ["signup", "Create account"],
          ].map(([key, label]) => (
            <button
              key={key}
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
      </Card>
    </div>
  );
}

export default function AccountControl() {
  const { configured, reopenSetup, user, signOut, syncStatus } = useCloud();
  const [authOpen, setAuthOpen] = useState(false);

  if (!configured) {
    return (
      <button
        onClick={reopenSetup}
        className="whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
      >
        Connect
      </button>
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={() => setAuthOpen(true)}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
        >
          Sign in
        </button>
        {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
      </>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <SyncDot status={syncStatus} />
      <span className="hidden max-w-[140px] truncate text-[11px] uppercase tracking-[0.18em] text-white/55 md:block">
        {user.email}
      </span>
      <button
        onClick={signOut}
        className="whitespace-nowrap rounded-lg px-2 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white"
      >
        Sign out
      </button>
    </span>
  );
}
