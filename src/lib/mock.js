// Mock data for RAQIP web. Replace with real API once backend is wired.
export const me = {
  uid: "u_001",
  name: "Aya Hassan",
  email: "aya@uni.edu",
  avatar: "https://i.pravatar.cc/120?img=47",
  xp: 4280,
  level: 12,
  streak: 17,
};

export const spaces = [
  { id: "s1", name: "FYP — Smart Tutor", template: "Scrum", color_hex: "#1A4D2E", role: "Owner", members: 4 },
  { id: "s2", name: "CS-401 Algorithms", template: "Kanban", color_hex: "#7C3AED", role: "Member", members: 6 },
  { id: "s3", name: "Personal Study", template: "Scrum", color_hex: "#0E7490", role: "Owner", members: 1 },
];

export const domains = [
  { id: "d1", domain_name: "Final Year Project", priority: "High", difficulty: "Hard", area_type: "FYP", weekly_target_hours: 12, preferred_days: ["monday","wednesday","friday"], is_active: true, space_id: "s1" },
  { id: "d2", domain_name: "Algorithms", priority: "High", difficulty: "Very Hard", area_type: "Subject", weekly_target_hours: 8, preferred_days: ["tuesday","thursday"], is_active: true, space_id: "s2" },
  { id: "d3", domain_name: "Linear Algebra", priority: "Medium", difficulty: "Medium", area_type: "Exam", weekly_target_hours: 5, preferred_days: ["saturday"], is_active: true },
  { id: "d4", domain_name: "Reading List", priority: "Low", difficulty: "Easy", area_type: "Other", weekly_target_hours: 2, preferred_days: ["sunday"], is_active: false },
];

export const tasks = [
  { id: "t1", title: "Draft FYP literature review", deadline: "2026-05-22", expected_hours: 6, points: 8, status: "In Progress", priority: "High", difficulty: "Hard", domain_id: "d1", progress_percentage: 40, sprint_id: "sp1" },
  { id: "t2", title: "Implement Dijkstra variant", deadline: "2026-05-20", expected_hours: 4, points: 5, status: "To Do", priority: "Critical", difficulty: "Hard", domain_id: "d2", progress_percentage: 0, sprint_id: "sp1", is_emergency: true },
  { id: "t3", title: "Review eigenvectors chapter", deadline: "2026-05-25", expected_hours: 2, points: 3, status: "To Do", priority: "Medium", difficulty: "Medium", domain_id: "d3", progress_percentage: 0 },
  { id: "t4", title: "Meet supervisor — outline", deadline: "2026-05-19", expected_hours: 1, points: 2, status: "Done", priority: "Medium", difficulty: "Easy", domain_id: "d1", progress_percentage: 100, sprint_id: "sp1" },
  { id: "t5", title: "Annotate week-3 paper", deadline: "2026-05-24", expected_hours: 2, points: 3, status: "In Progress", priority: "Medium", difficulty: "Medium", domain_id: "d1", progress_percentage: 60, sprint_id: "sp1" },
  { id: "t6", title: "Write graph theory cheat sheet", deadline: "2026-05-30", expected_hours: 3, points: 5, status: "To Do", priority: "Low", difficulty: "Medium", domain_id: "d2", progress_percentage: 0 },
  { id: "t7", title: "Schedule study group", deadline: "2026-05-21", expected_hours: 1, points: 1, status: "To Do", priority: "Low", difficulty: "Easy", domain_id: "d3", progress_percentage: 0 },
];

export const sprints = [
  { id: "sp1", name: "Sprint 7 — Lit Review Push", goal: "Finish lit review draft + algo prototypes", start_date: "2026-05-15", end_date: "2026-05-28", is_active: true, is_completed: false, space_id: "s1" },
  { id: "sp2", name: "Sprint 6 — Foundations", goal: "Set up FYP repo and reading", start_date: "2026-05-01", end_date: "2026-05-14", is_active: false, is_completed: true, space_id: "s1" },
];

export const calendarEvents = [
  { id: "e1", title: "Algorithms Lecture", start_time: "2026-05-18T10:00", end_time: "2026-05-18T11:30", color_hex: "#7C3AED", all_day: false },
  { id: "e2", title: "Supervisor Meeting", start_time: "2026-05-19T14:00", end_time: "2026-05-19T14:45", color_hex: "#1A4D2E", all_day: false },
  { id: "e3", title: "Study Block — Linear Algebra", start_time: "2026-05-20T16:00", end_time: "2026-05-20T18:00", color_hex: "#0E7490", all_day: false },
  { id: "e4", title: "Library Day", start_time: "2026-05-23", end_time: "2026-05-23", color_hex: "#B45309", all_day: true },
];

export const pomodoroHistory = [
  { id: "p1", date: "2026-05-17", focus_duration: 25, rounds_completed: 4, total_focus_minutes: 100, status: "completed" },
  { id: "p2", date: "2026-05-16", focus_duration: 25, rounds_completed: 6, total_focus_minutes: 150, status: "completed" },
  { id: "p3", date: "2026-05-15", focus_duration: 25, rounds_completed: 3, total_focus_minutes: 75, status: "completed" },
];

export const rooms = [
  { id: "r1", name: "Late Night Algo Crunch", is_private: false, focus_duration: 50, break_duration: 10, status: "active", participants: 5 },
  { id: "r2", name: "Quiet FYP Co-work", is_private: true, focus_duration: 25, break_duration: 5, status: "idle", participants: 2 },
];

export const feedPosts = [
  { id: "f1", author: { name: "Sara K.", avatar: "https://i.pravatar.cc/64?img=12" }, content: "Hit a 30-day streak studying algorithms. Spaced repetition really works 🌿", subject_tag: "algorithms", likes: 24, comments: 3, time: "2h" },
  { id: "f2", author: { name: "Omar D.", avatar: "https://i.pravatar.cc/64?img=14" }, content: "Sharing my linear algebra notes — eigenvalues finally clicked.", attachment_type: "pdf", subject_tag: "math", likes: 12, comments: 5, time: "5h" },
  { id: "f3", author: { name: "Lina M.", avatar: "https://i.pravatar.cc/64?img=23" }, content: "Anyone joining the group room at 8pm? Doing 4×50 pomodoros.", likes: 9, comments: 7, time: "1d" },
];

export const friends = [
  { uid: "u_002", name: "Sara K.", avatar: "https://i.pravatar.cc/64?img=12", online: true, status: "Studying" },
  { uid: "u_003", name: "Omar D.", avatar: "https://i.pravatar.cc/64?img=14", online: true, status: "Available" },
  { uid: "u_004", name: "Lina M.", avatar: "https://i.pravatar.cc/64?img=23", online: false, status: "Offline" },
];

export const notifications = [
  { id: "n1", title: "Sprint 7 ends in 3 days", body: "2 tasks still in progress", read: false, time: "1h" },
  { id: "n2", title: "Sara liked your note", body: "Linear algebra cheat sheet", read: false, time: "3h" },
  { id: "n3", title: "Daily standup ready", body: "AI is waiting for your check-in", read: true, time: "1d" },
];

export const aiSuggestions = [
  { id: "ai1", title: "Skim 'Attention Is All You Need' intro", expected_hours: 0.75, points: 2, priority: "Medium", reason: "Aligns with FYP literature review milestone." },
  { id: "ai2", title: "Run 3 unit tests on graph module", expected_hours: 1, points: 3, priority: "High", reason: "Unblocks Dijkstra variant task." },
  { id: "ai3", title: "Re-derive eigenvector proof by hand", expected_hours: 0.5, points: 2, priority: "Medium", reason: "Exam in 12 days; spaced repetition due." },
];

export const platforms = [
  { name: "Instagram", icon: "📷", daily_minutes: 42, limit: 30 },
  { name: "TikTok", icon: "🎵", daily_minutes: 18, limit: 20 },
  { name: "YouTube", icon: "▶️", daily_minutes: 55, limit: 60 },
  { name: "Twitter", icon: "🐦", daily_minutes: 8, limit: 15 },
];

export const weeklyXP = [
  { day: "Mon", xp: 320 }, { day: "Tue", xp: 410 }, { day: "Wed", xp: 280 },
  { day: "Thu", xp: 520 }, { day: "Fri", xp: 380 }, { day: "Sat", xp: 610 }, { day: "Sun", xp: 240 },
];

export const burndown = [
  { day: "D1", remaining: 28 }, { day: "D2", remaining: 26 }, { day: "D3", remaining: 24 },
  { day: "D4", remaining: 21 }, { day: "D5", remaining: 18 }, { day: "D6", remaining: 15 },
  { day: "D7", remaining: 13 }, { day: "D8", remaining: 10 },
];

export const heatmap = Array.from({ length: 7 * 20 }, (_, i) => ({
  x: i % 20, y: Math.floor(i / 20), v: Math.floor(Math.random() * 5),
}));
