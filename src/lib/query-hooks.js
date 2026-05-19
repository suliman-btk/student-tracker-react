import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    backlog: (spaceId) => ["study", "backlog", String(spaceId || "all")],
    sprints: (spaceId) => ["study", "sprints", String(spaceId || "all")],
    activeSprint: (spaceId) => ["study", "sprints", "active", String(spaceId || "all")],
    sprint: (id) => ["study", "sprints", String(id)],
    members: (spaceId) => ["study", "spaces", String(spaceId), "members"],
    invitations: ["study", "invitations"],
    notifications: ["study", "notifications"],
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
    qc.invalidateQueries({ queryKey: qk.study.backlog(spaceId) });
    qc.invalidateQueries({ queryKey: qk.study.sprints(spaceId) });
    qc.invalidateQueries({ queryKey: qk.study.activeSprint(spaceId) });
    qc.invalidateQueries({ queryKey: qk.study.notifications });
  };

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
    acceptSuggestion: useMutation({
      mutationFn: aiApi.acceptSuggestion,
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: qk.ai.suggestions });
        qc.invalidateQueries({ queryKey: ["study"] });
      },
    }),
    ignoreSuggestion: useMutation({
      mutationFn: aiApi.ignoreSuggestion,
      onSuccess: () => qc.invalidateQueries({ queryKey: qk.ai.suggestions }),
    }),
  };
}
