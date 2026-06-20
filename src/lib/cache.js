/**
 * Cache invalidation strategies keyed by domain event.
 * Each function accepts a react-query QueryClient and the relevant IDs.
 * Centralising here means "which queries refresh when X changes"
 * is answered in one place, not scattered across mutation onSuccess handlers.
 */

export function invalidateWorkspace(qc) {
  qc.invalidateQueries({ queryKey: ["study", "spaces"] });
  qc.invalidateQueries({ queryKey: ["study", "domains"] });
  qc.invalidateQueries({ queryKey: ["study", "backlog"] });
  qc.invalidateQueries({ queryKey: ["study", "sprints"] });
  qc.invalidateQueries({ queryKey: ["study", "tasks"] });
  qc.invalidateQueries({ queryKey: ["study", "notifications"] });
}

export function invalidateTask(qc, taskId) {
  qc.invalidateQueries({ queryKey: ["study", "tasks"] });
  // Sprint/kanban boards embed tasks, so a task-level change must refresh sprints too.
  qc.invalidateQueries({ queryKey: ["study", "sprints"] });
  if (taskId) qc.invalidateQueries({ queryKey: ["study", "tasks", String(taskId)] });
}

export function invalidateDomains(qc) {
  qc.invalidateQueries({ queryKey: ["study", "domains"] });
}
