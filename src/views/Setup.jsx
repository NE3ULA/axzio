import { useState } from "react";
import { useAxzio } from "../store.jsx";
import { Card, MicroLabel, Btn, Field, TextArea } from "../components/ui.jsx";

/**
 * First-run identity setup. Grounded in the Identity Core concept:
 * the identity the participant is consciously authoring — distinct from
 * inherited scripts, moods, or performance.
 */
export default function Setup({ onComplete }) {
  const { completeSetup } = useAxzio();
  const [name, setName] = useState("");
  const [authored, setAuthored] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the interface a name to address you by.");
      return;
    }
    completeSetup(name, authored);
    onComplete();
  };

  return (
    <div className="relative z-10 flex min-h-full items-center justify-center px-5 py-12">
      <Card className="axzio-rise w-full max-w-xl p-8 md:p-12">
        <MicroLabel className="mb-3">Initiation</MicroLabel>
        <h2 className="text-3xl font-light tracking-wide md:text-4xl">
          Who is entering?
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
          AXZIO reads everything against your Identity Core — the identity you
          are <span className="text-white">consciously authoring</span>, not a
          mood, a role, or a performance. Name it plainly.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6">
          <div>
            <MicroLabel className="mb-2">Display name</MicroLabel>
            <Field
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should the interface call you?"
              maxLength={40}
              autoFocus
            />
          </div>
          <div>
            <MicroLabel className="mb-2">
              Authored identity <span className="text-white/30">(optional)</span>
            </MicroLabel>
            <TextArea
              value={authored}
              onChange={(e) => setAuthored(e.target.value)}
              placeholder="The person I am consciously becoming is…"
              rows={3}
              maxLength={400}
            />
          </div>
          {error && (
            <p className="text-sm tracking-wide text-white/70">{error}</p>
          )}
          <Btn type="submit" className="w-full">
            Enter the deck
          </Btn>
        </form>
      </Card>
    </div>
  );
}
