/* Beta feedback: posts to the axzio_feedback table (see
 * goals/axzio-app-development/files/feedback-inbox.sql).
 *
 * The anon key is public-safe BY DESIGN — it ships in the client bundle.
 * Row Level Security is the real boundary: the table's only policy allows
 * anon INSERT. Nothing can be read, updated, or deleted through this key.
 *
 */

const FEEDBACK_URL = "https://vgmdyczfvlgnvhvlbwfw.supabase.co";
const FEEDBACK_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnbWR5Y3pmdmxnbnZodmxid2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNTI5NjYsImV4cCI6MjEwNjgyODk2Nn0.Pi7rIGzeNxYllS7dXUAovK2v0Mek3DV3ZJ6LlsLjbJ4";

/** Fallback contact when the table isn't reachable. */
export const FEEDBACK_EMAIL = "affinitymojo3@gmail.com";

export function feedbackConfigured() {
  return (
    typeof FEEDBACK_URL === "string" &&
    FEEDBACK_URL.startsWith("https://") &&
    !FEEDBACK_URL.includes("YOUR_PROJECT_REF") &&
    typeof FEEDBACK_ANON_KEY === "string" &&
    FEEDBACK_ANON_KEY.length > 20 &&
    !FEEDBACK_ANON_KEY.includes("YOUR_ANON_KEY")
  );
}

/** POST one feedback row. Throws on network or server error. */
export async function submitFeedback({ body, contact }) {
  const res = await fetch(`${FEEDBACK_URL}/rest/v1/axzio_feedback`, {
    method: "POST",
    headers: {
      apikey: FEEDBACK_ANON_KEY,
      Authorization: `Bearer ${FEEDBACK_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      body: String(body || "").slice(0, 5000),
      contact: String(contact || "").slice(0, 160) || null,
      user_agent:
        typeof navigator !== "undefined"
          ? String(navigator.userAgent).slice(0, 300)
          : null,
    }),
  });
  if (!res.ok) throw new Error(`feedback post failed: ${res.status}`);
}
