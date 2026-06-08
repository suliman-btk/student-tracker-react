// Daily standup ai_feedback is a structured object: { coaching, suggested_task: { title, reason } }.
// Legacy rows may still arrive as a plain labelled string ("COACHING: ... SUGGESTED TASK: ...")
// or null. normalizeFeedback() always returns the structured shape (or null) so the UI never
// has to parse prompt scaffolding.
export function normalizeFeedback(f) {
  if (f && typeof f === "object") return f;

  if (typeof f === "string" && f.trim()) {
    const coaching = (f.match(/COACHING:\s*([\s\S]+?)(?=SUGGESTED TASK:|$)/) || [])[1]?.trim();
    const suggested = (f.match(/SUGGESTED TASK:\s*([\s\S]+)/) || [])[1]?.trim();
    if (coaching || suggested) {
      const [title, ...rest] = (suggested || "").split(/\s+[—-]\s+/);
      return {
        coaching: coaching || "",
        suggested_task: suggested
          ? { title: title?.trim(), reason: rest.join(" — ").trim() }
          : null,
      };
    }
    return { coaching: f }; // unstructured legacy text — show as-is
  }

  return null;
}
