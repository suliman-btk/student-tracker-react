import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { aiApi, focusApi, socialApi, studyApi, userApi } from "@/lib/api";
import { normaliseTask, normaliseSprint } from "@/lib/task";
import { invalidateWorkspace, invalidateTask, invalidateDomains } from "@/lib/cache";

const asArr = (d) => (Array.isArray(d) ? d : d?.data ?? []);

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
    select: (data) => asArr(data).map(normaliseTask),
    enabled: enabledAuth(domainId),
    retry: 1,
  });
}

export function useTasks(params) {
  return useQuery({
    queryKey: qk.study.tasks(params),
    queryFn: () => studyApi.tasks.list(params),
    select: (data) => asArr(data).map(normaliseTask),
    retry: 1,
  });
}

export function useTask(taskId) {
  return useQuery({
    queryKey: qk.study.task(taskId),
    queryFn: () => studyApi.tasks.show(taskId),
    select: (data) => (data ? normaliseTask(data) : data),
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
    select: (data) => asArr(data).map(normaliseTask),
  });
}

export function useActiveSprint(spaceId) {
  return useQuery({
    queryKey: qk.study.activeSprint(spaceId),
    queryFn: () => studyApi.sprints.active(spaceId ? { space_id: spaceId } : undefined),
    select: (data) => (data ? normaliseSprint(data) : data),
    enabled: enabledAuth(spaceId),
    retry: false,
  });
}

export function useSprints(spaceId) {
  return useQuery({
    queryKey: qk.study.sprints(spaceId),
    queryFn: () => studyApi.sprints.list(spaceId ? { space_id: spaceId } : undefined),
    select: (data) => asArr(data).map(normaliseSprint),
  });
}

export function useSprint(sprintId) {
  return useQuery({
    queryKey: qk.study.sprint(sprintId),
    queryFn: () => studyApi.sprints.show(sprintId),
    select: (data) => (data ? normaliseSprint(data) : data),
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

  // Bind query-client to the imported strategies so call sites stay terse.
  const iWorkspace = () => invalidateWorkspace(qc);
  const iTask      = (id) => invalidateTask(qc, id);
  const iDomains   = () => invalidateDomains(qc);

  const toastError = (err) => toast.error(err?.message || "Something went wrong");

  return {
    createSpace: useMutation({
      mutationFn: studyApi.spaces.create,
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.study.spaces }),
    }),
    createTask: useMutation({
      mutationFn: studyApi.tasks.create,
      onSuccess: () => iWorkspace(),
    }),
    addTasksToSpace: useMutation({
      mutationFn: ({ spaceId, taskIds }) => studyApi.spacesTasks(spaceId, taskIds),
      onSuccess: () => iWorkspace(),
    }),
    createSprint: useMutation({
      mutationFn: studyApi.sprints.create,
      onSuccess: () => iWorkspace(),
    }),
    startSprint: useMutation({
      mutationFn: ({ sprintId }) => studyApi.sprints.start(sprintId),
      onSuccess: () => iWorkspace(),
    }),
    closeSprint: useMutation({
      mutationFn: ({ sprintId, body }) => studyApi.sprints.close(sprintId, body),
      onSuccess: () => iWorkspace(),
    }),
    updateSprintTaskStatus: useMutation({
      mutationFn: ({ sprintId, taskId, status }) => studyApi.sprints.updateTaskStatus(sprintId, taskId, status),
      onSuccess: () => iWorkspace(),
    }),
    addTasksToSprint: useMutation({
      mutationFn: ({ sprintId, taskIds }) => studyApi.sprints.addTasks(sprintId, taskIds),
      onSuccess: () => iWorkspace(),
    }),
    removeTaskFromSprint: useMutation({
      mutationFn: ({ sprintId, taskId }) => studyApi.sprints.removeTask(sprintId, taskId),
      onSuccess: () => iWorkspace(),
    }),
    updateTask: useMutation({
      mutationFn: ({ id, body }) => studyApi.tasks.update(id, body),
      onSuccess: (_, vars) => {
        iTask(vars.id);
        iWorkspace();
      },
    }),
    deleteTask: useMutation({
      mutationFn: ({ id }) => studyApi.tasks.remove(id),
      onSuccess: () => iWorkspace(),
    }),
    updateTaskStatus: useMutation({
      mutationFn: ({ id, status }) => studyApi.tasks.updateStatus(id, status),
      onSuccess: (_, vars) => {
        iTask(vars.id);
        iWorkspace();
      },
    }),
    updateTaskProgress: useMutation({
      mutationFn: ({ id, progress, notes }) => studyApi.tasks.updateProgress(id, progress, notes),
      onSuccess: (_, vars) => iTask(vars.id),
    }),
    assignTask: useMutation({
      mutationFn: ({ id, assignedTo }) => studyApi.tasks.assign(id, assignedTo),
      onSuccess: (_, vars) => iTask(vars.id),
    }),
    addSubtask: useMutation({
      mutationFn: ({ taskId, body }) => studyApi.tasks.addSubtask(taskId, body),
      onSuccess: (_, vars) => iTask(vars.taskId),
    }),
    updateSubtask: useMutation({
      mutationFn: ({ taskId, subtaskId, body }) => studyApi.tasks.updateSubtask(taskId, subtaskId, body),
      onSuccess: (_, vars) => iTask(vars.taskId),
    }),
    removeSubtask: useMutation({
      mutationFn: ({ taskId, subtaskId }) => studyApi.tasks.removeSubtask(taskId, subtaskId),
      onSuccess: (_, vars) => iTask(vars.taskId),
    }),
    toggleSubtask: useMutation({
      mutationFn: ({ taskId, subtaskId }) => studyApi.tasks.toggleSubtask(taskId, subtaskId),
      onSuccess: (_, vars) => iTask(vars.taskId),
    }),
    addComment: useMutation({
      mutationFn: ({ taskId, content }) => studyApi.tasks.addComment(taskId, content),
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: qk.study.taskComments(vars.taskId) });
      },
    }),
    createDomain: useMutation({
      mutationFn: studyApi.domains.create,
      onSuccess: () => iDomains(),
    }),
    updateDomain: useMutation({
      mutationFn: ({ id, body }) => studyApi.domains.update(id, body),
      onSuccess: (_, vars) => {
        iDomains();
        qc.invalidateQueries({ queryKey: qk.study.domain(vars.id) });
      },
    }),
    deleteDomain: useMutation({
      mutationFn: ({ id }) => studyApi.domains.remove(id),
      onSuccess: () => iDomains(),
    }),
    toggleDomain: useMutation({
      mutationFn: ({ id }) => studyApi.domains.toggleActive(id),
      onSuccess: (_, vars) => {
        iDomains();
        qc.invalidateQueries({ queryKey: qk.study.domain(vars.id) });
      },
    }),
    createDomainTask: useMutation({
      mutationFn: ({ domainId, body }) => studyApi.domains.createTask(domainId, body),
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: qk.study.domainTasks(vars.domainId) });
        iWorkspace();
      },
    }),
    updateSprint: useMutation({
      mutationFn: ({ sprintId, body }) => studyApi.sprints.update(sprintId, body),
      onSuccess: (_, vars) => {
        iWorkspace();
        qc.invalidateQueries({ queryKey: qk.study.sprint(vars.sprintId) });
      },
      onError: toastError,
    }),
    deleteSprint: useMutation({
      mutationFn: ({ sprintId }) => studyApi.sprints.remove(sprintId),
      onSuccess: () => iWorkspace(),
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
      onSuccess: () => iWorkspace(),
      onError: toastError,
    }),
    moveTaskToSprint: useMutation({
      mutationFn: async ({ fromSprintId, toSprintId, taskId }) => {
        if (fromSprintId && String(fromSprintId) !== String(toSprintId)) {
          await studyApi.sprints.removeTask(fromSprintId, taskId);
        }
        await studyApi.sprints.addTasks(toSprintId, [taskId]);
      },
      onSuccess: () => iWorkspace(),
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
      onSuccess: () => iWorkspace(),
      onError: toastError,
    }),
    bulkCreateDomainTasks: useMutation({
      mutationFn: ({ domainId, tasks }) => studyApi.domains.bulkTasks(domainId, tasks),
      onSuccess: (_, vars) => {
        qc.invalidateQueries({ queryKey: qk.study.domainTasks(vars.domainId) });
        iWorkspace();
      },
      onError: toastError,
    }),
    createEvent: useMutation({
      mutationFn: (body) => studyApi.calendar.create(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
    bulkCreateEvents: useMutation({
      mutationFn: (events) => studyApi.calendar.bulkCreate(events),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
    updateEvent: useMutation({
      mutationFn: ({ id, body }) => studyApi.calendar.update(id, body),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
    deleteEvent: useMutation({
      mutationFn: ({ id, scope, occurrence_date }) =>
        studyApi.calendar.remove(id, scope ? { scope, occurrence_date } : undefined),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "calendar"] }),
      onError: toastError,
    }),
  };
}
