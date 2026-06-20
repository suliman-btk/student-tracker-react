import { parseWall } from "./utils";

export function daysUntil(date) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / 86400000);
}

export function daysLeftLabel(days) {
  if (days === null) return "No deadline";
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `${days}d left`;
}

/**
 * Normalise a raw task object from any API endpoint into a canonical shape.
 * All field aliases are resolved here so callers never need to inspect
 * multiple property names for the same concept.
 *
 * Canonical properties added/overridden:
 *   title, domain, points, hours, code   — field aliases resolved
 *   deadline (string|null)               — canonical from deadline ?? due_date
 *   deadlineDate (Date|null)             — parsed, for display / computation
 *   daysLeft (number|null)               — days until deadline (negative = overdue)
 *   deadlineLabel (string)               — e.g. "3d left", "2d overdue", "No deadline"
 *   status                               — already resolved by backend accessor
 *   priority                             — defaulted to "Medium"
 *   isEmergency (boolean)                — true when task_type === "Emergency"
 */
export function normaliseTask(raw) {
  if (!raw) return raw;
  const deadline = raw.deadline ?? raw.due_date ?? null;
  const deadlineDate = parseWall(deadline);
  const days = daysUntil(deadlineDate);
  return {
    ...raw,
    title: raw.title ?? raw.name ?? `Task ${raw.id}`,
    domain:
      raw.domain?.domain_name ??
      raw.domain?.domainName ??
      raw.domain_name ??
      (typeof raw.domain === "string" ? raw.domain : null) ??
      "FYP",
    points: Number(raw.points ?? raw.story_points ?? raw.pivot?.points ?? 0),
    hours: Number(raw.expected_hours ?? raw.estimated_hours ?? raw.hours ?? 0),
    code: raw.key ?? raw.code ?? raw.task_key ?? `TS-${raw.id}`,
    deadline,
    deadlineDate,
    daysLeft: days,
    deadlineLabel: daysLeftLabel(days),
    status: raw.status ?? "To Do",
    priority: raw.priority ?? "Medium",
    isEmergency: (raw.task_type ?? raw.taskType) === "Emergency",
  };
}

/** Normalise the tasks array nested inside a sprint object. */
export function normaliseSprint(raw) {
  if (!raw) return raw;
  const tasks = (raw.tasks ?? raw.tasks_data ?? raw.items ?? []).map(normaliseTask);
  return { ...raw, tasks };
}
