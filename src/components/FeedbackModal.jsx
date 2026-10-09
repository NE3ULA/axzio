/* FeedbackModal — beta feedback form. Posts to the axzio_feedback table;
 * falls back to email when the table isn't reachable. */

import { useState } from "react";
import { Card, MicroLabel, Btn, Field, TextArea } from "./ui.jsx";
import { feedbackConfigured, submitFeedback, FEEDBACK_EMAIL } from "../feedback.js";

export default function FeedbackModal({ onClose }) {
  const [body, setBody] = useState("");
  const [contact, setContact] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);
  const configured = feedbackConfigured();

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() || sending || sent) return;
    setSending(true);
    setFailed(false);
    try {
      await submitFeedback({ body: body.trim(), contact: contact.trim() });
      setSent(true);
    } catch {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Send feedback"
    >
      <Card className="axzio-rise relative w-full max-w-md p-7 md:p-8">
        <button
          onClick={onClose}
          aria-label="Close feedback"
          className="absolute right-4 top-4 rounded-full border border-white/15 p-2 text-white/50 transition-colors hover:border-white/40 hover:text-white"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </button>
        <MicroLabel className="mb-3">Beta feedback</MicroLabel>
        <h2 className="text-2xl font-light tracking-wide">Send feedback</h2>
        {sent ? (
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            Sent — thank you. Every note shapes what gets built next.
          </p>
        ) : (
          <>
            <p className="mt-4 text-[15px] leading-relaxed text-white/60">
              What broke, what's confusing, or what's missing? Plain words
              are perfect.
            </p>
            {!configured && (
              <p className="mt-3 text-[13px] leading-relaxed text-white/40">
                The feedback table isn't wired up in this build — your note
                will go by email instead.
              </p>
            )}
            <form onSubmit={send} className="mt-6 space-y-4">
              <TextArea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What happened?"
                rows={4}
                maxLength={5000}
                autoFocus
              />
              <Field
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="How to reach you (optional)"
                maxLength={160}
              />
              {failed && (
                <p className="text-[13px] leading-relaxed text-white/60">
                  Couldn't send it —{" "}
                  <a
                    href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("AXZIO feedback")}&body=${encodeURIComponent(body)}`}
                    className="underline decoration-white/30 underline-offset-2 hover:text-white"
                  >
                    email it instead
                  </a>
                  .
                </p>
              )}
              <div className="flex justify-end">
                <Btn type="submit" disabled={sending || !body.trim()}>
                  {sending ? "Sending…" : "Send"}
                </Btn>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}
