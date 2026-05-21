import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiApi, focusApi, socialApi, studyApi, userApi } from "@/lib/api";

export const qk = {
  user: {
    profile: ["user", "profile"],
    stats: ["user", "stats"],
    activity: ["user", "activity"],
  },
  study: {
    spaces: ["study", "spaces"],
    space: (id) => ["study", "spaces", String(id)],
    domains: ["study", "domains"],
    domain: (id) => ["study", "domains", String(id)],
    domainTasks: (id) => ["study", "domains", String(id), "tasks"],
    tasks: (params) => ["study", "tasks", params || {}],
    task: (id) => ["study", "tasks", String(id)],
    taskComments: (id) => ["study", "tasks", String(id), "comments"],
    backlog: (spaceId) => ["study", "backlog", String(spaceId || "all")],
    sprints: (spaceId) => ["study", "sprints", String(spaceId || "all")],
    activeSprint: (spaceId) => ["study", "sprints", "active", String(spaceId || "all")],
    sprint: (id) => ["study", "sprints", String(id)],
    members: (spaceId) => ["study", "spaces", String(spaceId), "members"],
    invitations: ["study", "invitations"],
    notifications: ["study", "notifications"],
    calendar: (params) => ["study", "calendar", params || {}],
  },
  focus: {
    rooms: ["focus", "rooms"],
    pomodoro: ["focus", "pomodoro"],
  },
  social: {
    feed: (params) => ["social", "feed", params || {}],
    friends: ["social", "friends"],
    platforms: (params) => ["social", "platforms", params || {}],
  },
  ai: {
    suggestions: ["ai", "suggestions"],
    capacity: ["ai", "capacity"],
    sprintReview: (id) => ["ai", "sprint-review", String(id)],
    standup: ["ai", "standup", "today"],
  },
};

const enabledAuth = (enabled = true) => Boolean(enabled);

export function useProfile() {
  return useQuery({ queryKey: qk.user.profile, queryFn: userApi.profile, retry: 1 });
}

export function useSpaces() {
  return useQuery({ queryKey: qk.study.spaces, queryFn: () => studyApi.spaces.list(), retry: 1 });
}

export function useSpace(spaceId) {
  return useQuery({
    queryKey: qk.study.space(spaceId),
    queryFn: () => studyApi.spaces.show(spaceId),
    enabled: enabledAuth(spaceId),
  });
}

export function useDomains() {
  return useQuery({ queryKey: qk.study.domains, queryFn: () => studyApi.domains.list(), retry: 1 });
}

export function useDomain(domainId) {
  return useQuery({
    queryKey: qk.study.domain(domainId),
    queryFn: () => studyApi.domains.show(domainId),
    enabled: enabledAuth(domainId),
    retry: 1,
  });
}

export function useDomainTasks(domainId) {
  return useQuery({
    queryKey: qk.study.domainTasks(domainId),
    queryFn: () => studyApi.domains.tasks(domainId),
    enabled: enabledAuth(domainId),
    retry: 1,
  });
}

export function useTasks(params) {
  return useQuery({
    queryKey: qk.study.tasks(params),
    queryFn: () => studyApi.tasks.list(params),
    retry: 1,
  });
}

export function useTask(taskId) {
  return useQuery({
    queryKey: qk.study.task(taskId),
    queryFn: () => studyApi.tasks.show(taskId),
    enabled: enabledAuth(taskId),
    retry: 1,
  });
}

export function useTaskComments(taskId) {
  return useQuery({
    queryKey: qk.study.taskComments(taskId),
    queryFn: () => studyApi.tasks.comments(taskId),
    enabled: enabledAuth(taskId),
    retry: 1,
  });
}

export function useBacklog(spaceId) {
  return useQuery({
    queryKey: qk.study.backlog(spaceId),
    queryFn: () => studyApi.tasks.backlog(spaceId ? { space_id: spaceId } : undefined),
  });
}

export function useActiveSprint(spaceId) {
  return useQuery({
    queryKey: qk.study.activeSprint(spaceId),
    queryFn: () => studyApi.sprints.active(spaceId ? { space_id: spaceId } : undefined),
    enabled: enabledAuth(spaceId),
    retry: false,
  });
}

export function useSprints(spaceId) {
  return useQuery({
    queryKey: qk.study.sprints(spaceId),
    queryFn: () => studyApi.sprints.list(spaceId ? { space_id: spaceId } : undefined),
  });
}

export function useSprint(sprintId) {
  return useQuery({
    queryKey: qk.study.sprint(sprintId),
    queryFn: () => studyApi.sprints.show(sprintId),
    enabled: enabledAuth(sprintId),
  });
}

export function useCalendarEvents(params) {
  return useQuery({
    queryKey: qk.study.calendar(params),
    queryFn: () => studyApi.calendar.list(params),
    retry: 1,
  });
}

export function useSpaceMembers(spaceId) {
  return useQuery({
    queryKey: qk.study.members(spaceId),
    queryFn: () => studyApi.members.list(spaceId),
    enabled: enabledAuth(spaceId),
  });
}

export function useNotifications() {
  return useQuery({ queryKey: qk.study.notifications, queryFn: () => studyApi.notifications.list(), retry: 1 });
}

export function useAiSuggestions() {
  return useQuery({ queryKey: qk.ai.suggestions, queryFn: aiApi.suggestions, retry: false });
}

export function useCapacity() {
  return useQuery({ queryKey: qk.ai.capacity, queryFn: aiApi.capacity, retry: false });
}

export function useStandupToday() {
  return useQuery({ queryKey: qk.ai.standup, queryFn: aiApi.standupToday, retry: false });
}

export function useKanbanInsight(doingCount) {
  return useQuery({
    queryKey: ["ai", "kanban-insight", doingCount],
    queryFn: () => aiApi.scrumCoach("kanban-insight", { doing_count: doingCount }),
    enabled: typeof doingCount === "number",
    retry: false,
  });
}

export function useCapacityCheck(taskIds) {
  return useQuery({
    queryKey: ["ai", "capacity-check", taskIds],
    queryFn: () => aiApi.capacityCheck({ task_ids: taskIds }),
    enabled: Array.isArray(taskIds) && taskIds.length > 0,
    retry: false,
  });
}

export function useUserStats() {
  return useQuery({ queryKey: qk.user.stats, queryFn: userApi.stats, retry: 1 });
}

export function usePomodoroSessions(params) {
  return useQuery({
    queryKey: ["focus", "pomodoro", "sessions", params || {}],
    queryFn: () => focusApi.pomodoro.sessions(params),
    retry: 1,
  });
}

export function useSocialFeed(params) {
  return useQuery({ queryKey: qk.social.feed(params), queryFn: () => socialApi.feed(params) });
}

export function usePlatformUsage(params) {
  return useQuery({ queryKey: qk.social.platforms(params), queryFn: () => socialApi.platforms.usage(params) });
}

export function useFocusRooms() {
  return useQuery({ queryKey: qk.focus.rooms, queryFn: focusApi.rooms.list });
}

export function useStudyMutations() {
  const qc = useQueryClient();
  const invalidateWorkspace = (spaceId) => {
    qc.invalidateQueries({ queryKey: qk.study.spaces });
    qc.invalidateQueries({ queryKey: qk.study.domains });
    qc.invalidateQueries({ queryKey: ["study", "backlog"] });
    qc.invalidateQueries({ queryKey: ["study", "sprints"] });
    qc.invalidateQueries({ queryKey: ["study", "tasks"] });
    qc.invalidateQueries({ queryKey: qk.study.notifications });
  };

  const invalidateTask = (taskId) => {
    qc.invalidateQueries({ queryKey: ["study", "tasks"] });
    if (taskId) qc.invalidateQueries({ queryKey: qk.study.task(taskId) });
  };

  const invalidateDomains = () => {
    qc.invalidateQueries({ queryKey: qk.study.domains });
  };

  const toastError = (err) => toast.error(err?.message || "Something went wrong");

  return {
    createSpace: useMutation({
      mutationFn: studyApi.spaces.create,
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.study.spaces }),
    }),
    createTask: useMutation({
      mutationFn: studyApi.tasks.create,
      onSuccess: (_, vars) => invalidateWorkspace(vars?.space_id),
    }),
    addTasksToSpace: useMutation({
      mutationFn: ({ spaceId, taskIds }) => studyApi.spacesTasks(spaceId, taskIds),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    createSprint: useMutation({
      mutationFn: studyApi.sprints.create,
      onSuccess: (_, vars) => invalidateWorkspace(vars?.space_id),
    }),
    startSprint: useMutation({
      mutationFn: ({ sprintId }) => studyApi.sprints.start(sprintId),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    closeSprint: useMutation({
      mutationFn: ({ sprintId, body }) => studyApi.sprints.close(sprintId, body),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    updateSprintTaskStatus: useMutation({
      mutationFn: ({ sprintId, taskId, status }) => studyApi.sprints.updateTaskStatus(sprintId, taskId, status),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    addTasksToSprint: useMutation({
      mutationFn: ({ sprintId, taskIds }) => studyApi.sprints.addTasks(sprintId, taskIds),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    removeTaskFromSprint: useMutation({
      mutationFn: ({ sprintId, taskId }) => studyApi.sprints.removeTask(sprintId, taskId),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    updateTask: useMutation({
      mutationFn: ({ id, body }) => studyApi.tasks.update(id, body),
      onSuccess: (_, vars) => {
        invalidateTask(vars.id);
        invalidateWorkspace(vars.spaceId);
      },
    }),
    deleteTask: useMutation({
      mutationFn: ({ id }) => studyApi.tasks.remove(id),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
    }),
    updateTaskStatus: useMutation({
      mutationFn: ({ id, status }) => studyApi.tasks.updateStatus(id, status),
      onSuccess: (_, vars) => {
        invalidateTask(vars.id);
        invalidateWorkspace(vars.spaceId);
      },
    }),
    updateTaskProgress: useMutation({
      mutationFn: ({ id, progress, notes }) => studyApi.tasks.updateProgress(id, progress, notes),
      onSuccess: (_, vars) => invalidateTask(vars.id),
    }),
    assignTask: useMutation({
      mutationFn: ({ id, assignedTo }) => studyApi.tasks.assign(id, assignedTo),
      onSuccess: (_, vars) => invalidateTask(vars.id),
    }),
    addSubtask: useMutation({
      mutationFn: ({ taskId, body }) => studyApi.tasks.addSubtask(taskId, body),
      onSuccess: (_, vars) => invalidateTask(vars.taskId),
    }),
    updateSubtask: useMutation({
      mutationFn: ({ taskId, subtaskId, body }) => studyApi.tasks.updateSubtask(taskId, subtaskId, body),
      onSuccess: (_, vars) => invalidateTask(vars.taskId),
    }),
    removeSubtask: useMutation({
      mutationFn: ({ taskId, subtaskId }) => studyApi.tasks.removeSubtask(taskId, subtaskId),
      onSuccess: (_, vars) => invalidateTask(vars.taskId),
    }),
    toggleSubtask: useMutation({
      mutationFn: ({ taskId, subtaskId }) => studyApi.tasks.toggleSubtask(taskId, subtaskId),
      onSuccess: (_, vars) => invalidateTask(vars.taskId),
    }),
    addComment: useMutation({
      mutationFn: ({ taskId, content }) => studyApi.tasks.addComment(taskId, content),
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: qk.study.taskComments(vars.taskId) });
      },
    }),
    createDomain: useMutation({
      mutationFn: studyApi.domains.create,
      onSuccess: invalidateDomains,
    }),
    updateDomain: useMutation({
      mutationFn: ({ id, body }) => studyApi.domains.update(id, body),
      onSuccess: (_, vars) => {
        invalidateDomains();
        qc.invalidateQueries({ queryKey: qk.study.domain(vars.id) });
      },
    }),
    deleteDomain: useMutation({
      mutationFn: ({ id }) => studyApi.domains.remove(id),
      onSuccess: invalidateDomains,
    }),
    toggleDomain: useMutation({
      mutationFn: ({ id }) => studyApi.domains.toggleActive(id),
      onSuccess: (_, vars) => {
        invalidateDomains();
        qc.invalidateQueries({ queryKey: qk.study.domain(vars.id) });
      },
    }),
    createDomainTask: useMutation({
      mutationFn: ({ domainId, body }) => studyApi.domains.createTask(domainId, body),
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: qk.study.domainTasks(vars.domainId) });
        invalidateWorkspace(vars.body?.space_id);
      },
    }),
    updateSprint: useMutation({
      mutationFn: ({ sprintId, body }) => studyApi.sprints.update(sprintId, body),
      onSuccess: (_, vars) => {
        invalidateWorkspace(vars.spaceId);
        qc.invalidateQueries({ queryKey: qk.study.sprint(vars.sprintId) });
      },
      onError: toastError,
    }),
    deleteSprint: useMutation({
      mutationFn: ({ sprintId }) => studyApi.sprints.remove(sprintId),
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
      onError: toastError,
    }),
    updateSpace: useMutation({
      mutationFn: ({ id, body }) => studyApi.spaces.update(id, body),
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: qk.study.spaces });
        qc.invalidateQueries({ queryKey: qk.study.space(vars.id) });
      },
      onError: toastError,
    }),
    deleteSpace: useMutation({
      mutationFn: ({ id }) => studyApi.spaces.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.study.spaces }),
      onError: toastError,
    }),
    moveTaskToBacklog: useMutation({
      mutationFn: async ({ fromSprintId, taskId, spaceId }) => {
        if (fromSprintId) await studyApi.sprints.removeTask(fromSprintId, taskId);
        if (spaceId) await studyApi.spacesTasks(spaceId, [taskId]);
      },
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
      onError: toastError,
    }),
    moveTaskToSprint: useMutation({
      mutationFn: async ({ fromSprintId, toSprintId, taskId }) => {
        if (fromSprintId && String(fromSprintId) !== String(toSprintId)) {
          await studyApi.sprints.removeTask(fromSprintId, taskId);
        }
        await studyApi.sprints.addTasks(toSprintId, [taskId]);
      },
      onSuccess: (_, vars) => invalidateWorkspace(vars.spaceId),
      onError: toastError,
    }),
    acceptSuggestion: useMutation({
      mutationFn: aiApi.acceptSuggestion,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: qk.ai.suggestions });
        qc.invalidateQueries({ queryKey: ["study"] });
      },
      onError: toastError,
    }),
    ignoreSuggestion: useMutation({
      mutationFn: aiApi.ignoreSuggestion,
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.ai.suggestions }),
      onError: toastError,
    }),
    generateSuggestions: useMutation({
      mutationFn: () => aiApi.generateSuggestions(),
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.ai.suggestions }),
      onError: toastError,
    }),
    submitStandup: useMutation({
      mutationFn: (body) => aiApi.submitStandup(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.ai.standup }),
      onError: toastError,
    }),
    weeklyPlan: useMutation({
      mutationFn: () => aiApi.weeklyPlan({}),
      onError: toastError,
    }),
    generateSprintReview: useMutation({
      mutationFn: ({ sprintId }) => aiApi.generateSprintReview(sprintId),
      onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: qk.ai.sprintReview(vars.sprintId) }),
      onError: toastError,
    }),
    multiSprintPlan: useMutation({
      mutationFn: () => aiApi.multiSprintPlan({}),
      onError: toastError,
    }),
    applyMultiSprintPlan: useMutation({
      mutationFn: (body) => aiApi.applyMultiSprintPlan(body),
      onSuccess: (_, vars) => invalidateWorkspace(vars?.space_id),
      onError: toastError,
    }),
    createEvent: useMutation({
      mutationFn: (body) => studyApi.calendar.create(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
    updateEvent: useMutation({
      mutationFn: ({ id, body }) => studyApi.calendar.update(id, body),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
    deleteEvent: useMutation({
      mutationFn: ({ id }) => studyApi.calendar.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
  };
}
