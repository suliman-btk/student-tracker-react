/**
 * Cache invalidation strategies keyed by domain event.
 * Each function accepts a react-query QueryClient and the relevant IDs.
 * Centralising here means "which queries refresh when X changes"
 * is answered in one place, not scattered across mutation onSuccess handlers.
 */

export function invalidateWorkspace(qc) {
  // What the user is looking at after a mutation — refetch immediately.
  qc.invalidateQueries({ queryKey: ["study", "backlog"] });
  qc.invalidateQueries({ queryKey: ["study", "sprints"] });
  qc.invalidateQueries({ queryKey: ["study", "tasks"] });
  // Peripheral data (sidebar counts, badges) — mark stale but refetch on next
  // mount/navigation instead of immediately. Called from ~18 mutations; the
  // full 6-way concurrent refetch made every task edit hammer the backend.
  qc.invalidateQueries({ queryKey: ["study", "spaces"], refetchType: "none" });
  qc.invalidateQueries({ queryKey: ["study", "domains"], refetchType: "none" });
  qc.invalidateQueries({ queryKey: ["study", "notifications"], refetchType: "none" });
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
