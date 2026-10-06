/* SupabaseSetup — one-time connection card. Project URL + anon key are
 * entered here by the user and stored in localStorage (never in the repo).
 * Skippable: the app works fully offline without it. */

import { useState } from "react";
import { useCloud } from "../cloud.jsx";
import { looksLikeSupabaseUrl } from "../supabase.js";
import { Btn, Card, Field, MicroLabel } from "./ui.jsx";

export default function SupabaseSetup() {
  const { saveSetup, skipSetup, showSetup } = useCloud();
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!showSetup) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const u = url.trim();
    const k = anonKey.trim();
    if (!u || !k) {
      setError("Both the Project URL and the anon key are required.");
      return;
    }
    if (!looksLikeSupabaseUrl(u)) {
      setError("That URL doesn't look like a Supabase project URL.");
      return;
    }
    setSaving(true);
    try {
      await saveSetup(u, k);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-black/70 p-5 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Connect Supabase"
    >
      <Card className="w-full max-w-md p-7">
        <MicroLabel className="mb-2">Cloud sync</MicroLabel>
        <h2 className="text-xl font-light tracking-wide">Connect Supabase</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">
          Sign in with an account and your entries persist in the cloud,
          across devices. Your keys stay in this browser — they are never
          sent anywhere but your own Supabase project.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <MicroLabel className="mb-1.5">Project URL</MicroLabel>
            <Field
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              autoComplete="off"
              spellCheck={false}
              aria-label="Supabase project URL"
            />
          </div>
          <div>
            <MicroLabel className="mb-1.5">Anon key</MicroLabel>
            <Field
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOi…"
              autoComplete="off"
              spellCheck={false}
              aria-label="Supabase anon key"
            />
          </div>
          <p className="text-[12px] leading-relaxed text-white/40">
            Find both in your Supabase dashboard → Project Settings → API.
            Then run the one-time SQL in the docs to create the
            `axzio_state` table.
          </p>
          {error && (
            <p role="alert" className="text-[13px] text-white/80">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-2 pt-1">
            <Btn type="submit" disabled={saving}>
              {saving ? "Connecting…" : "Save & connect"}
            </Btn>
            <Btn type="button" variant="ghost" onClick={skipSetup}>
              Use offline for now
            </Btn>
          </div>
        </form>
      </Card>
    </div>
  );
}
