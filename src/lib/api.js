import { apiRequest, apiUpload, crud, unwrapData } from "./api-client";

export const userApi = {
  profile: () => apiRequest("/user/profile").then(unwrapData),
  updateProfile: (body) => apiRequest("/user/profile", { method: "PATCH", body }).then(unwrapData),
  updatePrivacy: (body) => apiRequest("/user/profile/privacy", { method: "PATCH", body }).then(unwrapData),
  stats: () => apiRequest("/user/profile/stats").then(unwrapData),
  activity: () => apiRequest("/user/profile/activity").then(unwrapData),
  sync: (body = {}) => apiRequest("/user/sync", { method: "POST", body }).then(unwrapData),
  updateFcmToken: (token) => apiRequest("/user/fcm-token", { method: "PATCH", body: { fcm_token: token } }).then(unwrapData),
  updateStudyStatus: (study_status) => apiRequest("/user/study-status", { method: "PATCH", body: { study_status } }).then(unwrapData),
};

export const studyApi = {
  spaces: {
    ...crud("/study/spaces"),
    show: (id) => apiRequest(`/study/spaces/${id}`).then(unwrapData),
    list: (params) => apiRequest("/study/spaces", { params }).then((p) => unwrapData(p, [])),
    create: (body) => apiRequest("/study/spaces", { method: "POST", body }).then(unwrapData),
    update: (id, body) => apiRequest(`/study/spaces/${id}`, { method: "PATCH", body }).then(unwrapData),
    remove: (id) => apiRequest(`/study/spaces/${id}`, { method: "DELETE" }),
  },
  domains: {
    list: (params) => apiRequest("/study/domains", { params }).then((p) => unwrapData(p, [])),
    create: (body) => apiRequest("/study/domains", { method: "POST", body }).then(unwrapData),
    show: (id) => apiRequest(`/study/domains/${id}`).then(unwrapData),
    update: (id, body) => apiRequest(`/study/domains/${id}`, { method: "PATCH", body }).then(unwrapData),
    remove: (id) => apiRequest(`/study/domains/${id}`, { method: "DELETE" }),
    toggleActive: (id) => apiRequest(`/study/domains/${id}/toggle-active`, { method: "PATCH" }).then(unwrapData),
    tasks: (domainId) => apiRequest(`/study/domains/${domainId}/tasks`).then((p) => unwrapData(p, [])),
    createTask: (domainId, body) => apiRequest(`/study/domains/${domainId}/tasks`, { method: "POST", body }).then(unwrapData),
    bulkTasks: (domainId, tasks) =>
      apiRequest(`/study/domains/${domainId}/tasks/bulk`, { method: "POST", body: { tasks } }).then((p) => unwrapData(p, [])),
  },
  tasks: {
    list: (params) => apiRequest("/study/tasks", { params }).then((p) => unwrapData(p, [])),
    backlog: (params) => apiRequest("/study/backlog", { params }).then((p) => unwrapData(p, [])),
    create: (body) => apiRequest("/study/tasks", { method: "POST", body }).then(unwrapData),
    show: (id) => apiRequest(`/study/tasks/${id}`).then(unwrapData),
    update: (id, body) => apiRequest(`/study/tasks/${id}`, { method: "PATCH", body }).then(unwrapData),
    remove: (id) => apiRequest(`/study/tasks/${id}`, { method: "DELETE" }),
    updateStatus: (id, status) => apiRequest(`/study/tasks/${id}/status`, { method: "PATCH", body: { status } }).then(unwrapData),
    updateProgress: (id, progress, notes) =>
      apiRequest(`/study/tasks/${id}/progress`, {
        method: "PATCH",
        body: { progress_percentage: progress, ...(notes !== undefined ? { notes } : {}) },
      }).then(unwrapData),
    comments: (id) => apiRequest(`/study/tasks/${id}/comments`).then((p) => unwrapData(p, [])),
    addComment: (id, content) => apiRequest(`/study/tasks/${id}/comments`, { method: "POST", body: { content } }).then(unwrapData),
    addSubtask: (id, body) => apiRequest(`/study/tasks/${id}/subtasks`, { method: "POST", body }).then(unwrapData),
    updateSubtask: (taskId, subtaskId, body) => apiRequest(`/study/tasks/${taskId}/subtasks/${subtaskId}`, { method: "PATCH", body }).then(unwrapData),
    removeSubtask: (taskId, subtaskId) => apiRequest(`/study/tasks/${taskId}/subtasks/${subtaskId}`, { method: "DELETE" }),
    toggleSubtask: (taskId, subtaskId) => apiRequest(`/study/tasks/${taskId}/subtasks/${subtaskId}/toggle`, { method: "PATCH" }).then(unwrapData),
    assign: (id, assigned_to) => apiRequest(`/study/tasks/${id}/assign`, { method: "PATCH", body: { assigned_to } }).then(unwrapData),
  },
  sprints: {
    list: (params) => apiRequest("/study/sprints", { params }).then((p) => unwrapData(p, [])),
    create: (body) => apiRequest("/study/sprints", { method: "POST", body }).then(unwrapData),
    active: (params) => apiRequest("/study/sprints/active", { params }).then(unwrapData),
    show: (id) => apiRequest(`/study/sprints/${id}`).then(unwrapData),
    update: (id, body) => apiRequest(`/study/sprints/${id}`, { method: "PATCH", body }).then(unwrapData),
    remove: (id) => apiRequest(`/study/sprints/${id}`, { method: "DELETE" }),
    close: (id, body = {}) => apiRequest(`/study/sprints/${id}/close`, { method: "POST", body }).then(unwrapData),
    start: (id) => apiRequest(`/study/sprints/${id}/start`, { method: "POST" }).then(unwrapData),
    addTasks: (id, task_ids) => apiRequest(`/study/sprints/${id}/tasks`, { method: "POST", body: { task_ids } }).then(unwrapData),
    removeTask: (id, taskId) => apiRequest(`/study/sprints/${id}/tasks/${taskId}`, { method: "DELETE" }),
    updateTaskStatus: (id, taskId, status) =>
      apiRequest(`/study/sprints/${id}/tasks/${taskId}/status`, { method: "PATCH", body: { status } }).then(unwrapData),
  },
  spacesTasks: (spaceId, task_ids) => apiRequest(`/study/spaces/${spaceId}/tasks`, { method: "POST", body: { task_ids } }).then(unwrapData),
  calendar: {
    list: (params) => apiRequest("/study/calendar/events", { params }).then((p) => unwrapData(p, [])),
    create: (body) => apiRequest("/study/calendar/events", { method: "POST", body }).then(unwrapData),
    show: (id) => apiRequest(`/study/calendar/events/${id}`).then(unwrapData),
    update: (id, body) => apiRequest(`/study/calendar/events/${id}`, { method: "PATCH", body }).then(unwrapData),
    // opts: { scope: "single" | "future" | "all", occurrence_date: "YYYY-MM-DD" }
    remove: (id, opts) => apiRequest(`/study/calendar/events/${id}`, { method: "DELETE", body: opts }),
    bulkCreate: (events) =>
      apiRequest("/study/calendar/events/bulk", { method: "POST", body: { events } }).then((p) => unwrapData(p, [])),
  },
  notifications: {
    list: (params) => apiRequest("/study/notifications", { params }),
    unreadCount: () => apiRequest("/study/notifications/unread-count"),
    readAll: () => apiRequest("/study/notifications/read-all", { method: "PATCH" }),
    read: (id) => apiRequest(`/study/notifications/${id}/read`, { method: "PATCH" }),
  },
};

export const focusApi = {
  pomodoro: {
    sessions: (params) => apiRequest("/focus/pomodoro/sessions", { params }).then((p) => unwrapData(p, [])),
    start: (body) => apiRequest("/focus/pomodoro/sessions", { method: "POST", body }).then(unwrapData),
    active: () => apiRequest("/focus/pomodoro/sessions/active").then(unwrapData),
    completeRound: (id, body = {}) => apiRequest(`/focus/pomodoro/sessions/${id}/round`, { method: "PATCH", body }).then(unwrapData),
    end: (id, body = {}) => apiRequest(`/focus/pomodoro/sessions/${id}/end`, { method: "PATCH", body }).then(unwrapData),
    settings: () => apiRequest("/focus/pomodoro/settings").then(unwrapData),
    saveSettings: (body) => apiRequest("/focus/pomodoro/settings", { method: "PATCH", body }).then(unwrapData),
  },
  rooms: {
    list: () => apiRequest("/focus/rooms").then((p) => unwrapData(p, [])),
    create: (body) => apiRequest("/focus/rooms", { method: "POST", body }).then(unwrapData),
    join: (id) => apiRequest(`/focus/rooms/${id}/join`, { method: "POST" }).then(unwrapData),
    leave: (id) => apiRequest(`/focus/rooms/${id}/leave`, { method: "POST" }).then(unwrapData),
    agoraToken: (params) => apiRequest("/focus/rooms/agora/token", { params }).then(unwrapData),
    findByCode: (code) => apiRequest("/focus/rooms/find-by-code", { params: { code } }).then(unwrapData),
  },
};

export const socialApi = {
  feed: (params) => apiRequest("/social/feed", { params }).then((p) => unwrapData(p, [])),
  posts: {
    create: (body) => apiRequest("/social/posts", { method: "POST", body }).then(unwrapData),
    show: (id) => apiRequest(`/social/posts/${id}`).then(unwrapData),
    remove: (id) => apiRequest(`/social/posts/${id}`, { method: "DELETE" }),
    like: (id, reactionType = "like") => apiRequest(`/social/posts/${id}/like`, { method: "POST", body: { reaction_type: reactionType } }),
    unlike: (id) => apiRequest(`/social/posts/${id}/like`, { method: "DELETE" }),
    comments: (id) => apiRequest(`/social/posts/${id}/comments`).then((p) => unwrapData(p, [])),
    addComment: (id, content) => apiRequest(`/social/posts/${id}/comments`, { method: "POST", body: { content } }).then(unwrapData),
  },
  friends: {
    list: () => apiRequest("/social/friends").then((p) => unwrapData(p, [])),
    requests: () => apiRequest("/social/friends/requests").then((p) => unwrapData(p, [])),
    online: () => apiRequest("/social/friends/online").then((p) => unwrapData(p, [])),
    send: (uid) => apiRequest(`/social/friends/request/${uid}`, { method: "POST" }).then(unwrapData),
    accept: (uid) => apiRequest(`/social/friends/accept/${uid}`, { method: "POST" }).then(unwrapData),
    reject: (uid) => apiRequest(`/social/friends/reject/${uid}`, { method: "POST" }).then(unwrapData),
    remove: (uid) => apiRequest(`/social/friends/${uid}`, { method: "DELETE" }),
  },
  discovery: {
    search: (q) => apiRequest("/social/users/search", { params: { q } }).then((p) => unwrapData(p, [])),
    profile: (uid) => apiRequest(`/social/users/${uid}/profile`).then(unwrapData),
  },
  platforms: {
    usage: (params) => apiRequest("/social/platforms/usage", { params }).then((p) => unwrapData(p, [])),
    log: (body) => apiRequest("/social/platforms/usage", { method: "POST", body }).then(unwrapData),
    updateSetting: (platform, body) => apiRequest(`/social/platforms/settings/${platform}`, { method: "PATCH", body }).then(unwrapData),
    daySettings: () => apiRequest("/social/platforms/day-settings").then(unwrapData),
    updateDaySettings: (body) => apiRequest("/social/platforms/day-settings", { method: "PATCH", body }).then(unwrapData),
  },
};

export const aiApi = {
  // Returns the raw { submitted, data } payload — callers need the submitted flag.
  standupToday: () => apiRequest("/ai/daily-standup/today"),
  submitStandup: (body) => apiRequest("/ai/daily-standup", { method: "POST", body }).then(unwrapData),
  capacity: () => apiRequest("/ai/capacity").then(unwrapData),
  capacityCheck: (body) => apiRequest("/ai/capacity-check", { method: "POST", body }).then(unwrapData),
  suggestions: () => apiRequest("/ai/suggest-tasks").then((p) => unwrapData(p, [])),
  generateSuggestions: (body = {}) => apiRequest("/ai/suggest-tasks", { method: "POST", body }).then((p) => unwrapData(p, [])),
  acceptSuggestion: (id) => apiRequest(`/ai/suggest-tasks/${id}/accept`, { method: "POST" }).then(unwrapData),
  ignoreSuggestion: (id) => apiRequest(`/ai/suggest-tasks/${id}`, { method: "DELETE" }),
  sprintReview: (id) => apiRequest(`/ai/sprint/${id}/review`).then(unwrapData),
  generateSprintReview: (id) => apiRequest(`/ai/sprint/${id}/review`, { method: "POST" }).then(unwrapData),
  sprintPlan: (body) => apiRequest("/ai/sprint-plan", { method: "POST", body }).then(unwrapData),
  multiSprintPlan: (body) => apiRequest("/ai/multi-sprint-plan", { method: "POST", body }).then(unwrapData),
  applyMultiSprintPlan: (body) => apiRequest("/ai/multi-sprint-plan/apply", { method: "POST", body }).then(unwrapData),
  weeklyPlan: (body) => apiRequest("/ai/weekly-plan", { method: "POST", body }).then(unwrapData),
  scrumCoach: (kind, body) => apiRequest(`/ai/${kind}`, { method: "POST", body }).then(unwrapData),
  chat: (message) => apiRequest("/ai/chat", { method: "POST", body: { message } }).then(unwrapData),
  extractTasks: (file, domainId) => {
    const fd = new FormData();
    fd.append("file", file);
    if (domainId != null) fd.append("domain_id", String(domainId));
    return apiUpload("/ai/extract-tasks", fd).then((p) => unwrapData(p)?.tasks ?? []);
  },
  extractSchedule: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiUpload("/ai/extract-schedule", fd).then((p) => unwrapData(p)?.events ?? []);
  },
};

export const api = { user: userApi, study: studyApi, focus: focusApi, social: socialApi, ai: aiApi };
