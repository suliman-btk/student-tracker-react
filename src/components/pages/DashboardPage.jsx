import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Timer,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useActiveSprint,
  useCapacityCheck,
  usePomodoroSessions,
  useProfile,
  useSpaces,
  useStandupToday,
  useTasks,
  useUserStats,
} from "@/lib/query-hooks";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";
import { normalizeFeedback } from "@/lib/standup";
import StandupModal from "@/components/study/StandupModal";

const asArray = (p) => (Array.isArray(p) ? p : p?.data || []);
const isDone = (t) => t?.status === "Done";
const isProg = (t) => t?.status === "In Progress";
const PRIORITY_WEIGHT = { Critical: 4, Highest: 4, High: 3, Medium: 2, Low: 1, Lowest: 1 };

function parseDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function monthShort(m) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m];
}
function fmtDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function DashboardPage() {
  const { activeSpaceId, setActiveSpace } = useUI();
  const { data: spaces = [] } = useSpaces();
  const { data: profile } = useProfile();

  // Auto-select first space so sprint appears without user manually opening one
  useEffect(() => {
    if (!activeSpaceId && spaces.length > 0) {
      setActiveSpace(spaces[0].id);
    }
  }, [activeSpaceId, spaces, setActiveSpace]);
  const { data: stats } = useUserStats();
  const { data: tasksPayload } = useTasks();
  const { data: sprint } = useActiveSprint(activeSpaceId);
  const { data: pomoPayload } = usePomodoroSessions();
  const { data: standup } = useStandupToday();

  const tasks = asArray(tasksPayload);
  const pomodoro = asArray(pomoPayload);
  const [standupOpen, setStandupOpen] = useState(false);
  const [autoChecked, setAutoChecked] = useState(false);

  const submitted = standup?.submitted;
  const feedback = normalizeFeedback(standup?.data?.ai_feedback);
  const coaching = feedback?.coaching;
  const suggestedTask = feedback?.suggested_task?.title;

  useEffect(() => {
    if (standup && !submitted && !autoChecked) {
      setAutoChecked(true);
      setStandupOpen(true);
    }
  }, [standup, submitted, autoChecked]);

  const firstName = (profile?.name || profile?.display_name || "there").split(" ")[0];
  const streak = stats?.current_streak ?? 0;
  const weeklyXp = stats?.weekly_xp ?? 0;
  const totalXp = stats?.total_xp ?? 0;

  const sprintTasks = sprint?.tasks || sprint?.tasks_data || [];
  const sprintDone = sprintTasks.filter(isDone).length;
  const sprintProg = sprintTasks.filter(isProg).length;
  const sprintTodo = sprintTasks.length - sprintDone - sprintProg;
  // Same math as the workspace summary ring (points-based velocity from the
  // server when present, task ratio as fallback) so the two screens can never
  // show different percentages for the same sprint.
  const sprintPct = Number.isFinite(Number(sprint?.velocity))
    ? Math.round(Number(sprint.velocity))
    : sprintTasks.length
      ? Math.round((sprintDone / sprintTasks.length) * 100)
      : 0;
  const sprintSpaceName = spaces.find((s) => String(s.id) === String(sprint?.space_id))?.name;
  const sprintEnd = parseDate(sprint?.end_date || sprint?.endDate);
  const daysLeft = sprintEnd ? Math.ceil((sprintEnd - new Date()) / 86400000) : null;

  // Sprint capacity check.
  const sprintTaskIds = useMemo(() => sprintTasks.map((t) => t.id).filter(Boolean), [sprintTasks]);
  const { data: capacity } = useCapacityCheck(sprintTaskIds);

  // Heavy-week banner — client-side, 3-day sliding window over 14 days.
  const heavyWeek = useMemo(() => {
    const now = new Date();
    for (let d = 0; d < 14; d++) {
      const ws = new Date(now);
      ws.setDate(ws.getDate() + d);
      const we = new Date(ws);
      we.setDate(we.getDate() + 3);
      const count = tasks.filter((t) => {
        const dl = t.deadlineDate;
        return dl && !isDone(t) && dl >= new Date(ws.getTime() - 86400000) && dl < we;
      }).length;
      if (count >= 3)
        return `Heavy week: ${count} tasks due around ${monthShort(ws.getMonth())} ${ws.getDate()}–${we.getDate()}. Consider rescheduling.`;
    }
    return null;
  }, [tasks]);

  const urgentTasks = tasks.filter((t) => t.priority === "Critical" || t.isEmergency).slice(0, 4);

  const workload = useMemo(() => {
    const now = new Date();
    const scores = [];
    for (let w = 0; w < 17; w++) {
      const start = new Date(now);
      start.setDate(start.getDate() + w * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      let score = 0;
      tasks.forEach((t) => {
        const dl = t.deadlineDate;
        if (dl && !isDone(t) && dl > start && dl < end) score += PRIORITY_WEIGHT[t.priority] || 1;
      });
      scores.push({ start, score });
    }
    const max = Math.max(0, ...scores.map((s) => s.score));
    const avg = scores.reduce((s, x) => s + x.score, 0) / scores.length;
    const heavy = avg * 1.8;
    return scores.map((s, i) => ({
      label:
        i === 0
          ? "Now"
          : i % 4 === 0
            ? `${monthShort(s.start.getMonth())} ${s.start.getDate()}`
            : "",
      score: s.score,
      kind:
        s.score > 0 && s.score === max
          ? "Peak"
          : s.score >= heavy && s.score > 0
            ? "Heavy"
            : "Normal",
    }));
  }, [tasks]);

  const focus = useMemo(() => {
    let completed = 0,
      abandoned = 0,
      minutes = 0;
    const days = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    pomodoro.forEach((s) => {
      const status = s.status || "";
      if (status === "completed") {
        completed += 1;
        // Focus time counts completed sessions only — same rule as the server
        // stats block and the mobile dashboard.
        minutes += Number(s.total_focus_minutes ?? s.totalFocusMinutes ?? 0);
      }
      if (status === "abandoned") abandoned += 1;
      const started = parseDate(s.started_at || s.startedAt || s.created_at);
      if (started && (now - started) / 86400000 < 7) {
        const idx = (started.getDay() + 6) % 7; // Mon=0
        days[idx] += 1;
      }
    });
    return { completed, abandoned, minutes, days };
  }, [pomodoro]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Good day, {firstName}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {sprint && daysLeft !== null && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-foreground">
              Sprint · {Math.max(0, daysLeft)}d left
            </span>
          )}
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            ✨ {weeklyXp} XP this week
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {totalXp} total XP
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            🔥 {streak}-day streak
          </span>
        </div>
      </div>

      {heavyWeek && (
        <div
          className="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
          style={{ background: "#F2E8D4", color: "#6B4F1E" }}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{heavyWeek}</span>
        </div>
      )}

      {/* Sprint Progress + Urgent Tasks — core utility first */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionHead label="Current Sprint" title="Sprint Progress" />
          {sprint ? (
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{sprint.name || "Active Sprint"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {fmtDate(sprint.start_date)} – {fmtDate(sprint.end_date)}
                    {sprintSpaceName ? ` · ${sprintSpaceName}` : ""}
                  </p>
                </div>
                <span className="text-2xl font-bold text-primary">{sprintPct}%</span>
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-muted">
                <div
                  style={{
                    width: `${(sprintDone / Math.max(1, sprintTasks.length)) * 100}%`,
                    background: "#6fa187",
                  }}
                />
                <div
                  style={{
                    width: `${(sprintProg / Math.max(1, sprintTasks.length)) * 100}%`,
                    background: "#27326b",
                  }}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <Legend color="#6fa187" label="Done" value={sprintDone} />
                <Legend color="#27326b" label="In Progress" value={sprintProg} />
                <Legend color="#c9c9c2" label="To Do" value={sprintTodo} />
              </div>
              {capacity?.exceeds_capacity && (
                <div
                  className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
                  style={{ background: "#F2E8D4", color: "#6B4F1E" }}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Sprint exceeds capacity by {Number(capacity.excess_hours || 0).toFixed(1)}h
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              No active sprint.{" "}
              <Link to="/spaces" className="text-primary">
                Open a space
              </Link>{" "}
              to start one.
            </div>
          )}
        </section>

        <section>
          <SectionHead label="Action Required" title="Urgent Tasks" />
          {urgentTasks.length > 0 ? (
            <div className="space-y-2">
              {urgentTasks.map((t) => {
                const isEmergency = t.isEmergency;
                const dueDate = t.deadlineDate;
                const formattedDue =
                  dueDate && !Number.isNaN(dueDate.getTime())
                    ? dueDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : null;
                const overdue = dueDate && dueDate < new Date();
                return (
                  <Link
                    key={t.id}
                    to="/tasks/$id"
                    params={{ id: String(t.id) }}
                    className="flex items-start gap-3 rounded-xl border bg-card px-3 py-3 transition-colors hover:bg-muted/40 sm:items-center sm:px-4"
                    style={{ borderLeft: `4px solid ${isEmergency ? "#BA1A1A" : "#dc2626"}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={cn(
                          "text-sm font-medium leading-5 sm:truncate",
                          isDone(t) && "text-muted-foreground line-through",
                        )}
                      >
                        {t.title}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">{t.domain || "—"}</span>
                        {formattedDue && (
                          <>
                            <span>·</span>
                            <span className={overdue ? "text-red-500 font-medium" : ""}>
                              Due {formattedDue}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex"
                      style={{
                        background: isEmergency ? "#FEE2E2" : "#FEF9C3",
                        color: isEmergency ? "#991B1B" : "#854D0E",
                      }}
                    >
                      {isEmergency ? "Emergency" : t.priority}
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
              No urgent tasks right now.
            </div>
          )}
        </section>
      </div>

      {/* Today's Coaching */}
      <div
        className="max-h-[220px] overflow-y-auto rounded-xl border-l-4 p-4 sm:max-h-none"
        style={{ background: "#F1EDE2", borderColor: "#C9A66B" }}
      >
        <div className="mb-2 flex items-center gap-2">
          <BrainCircuit className="h-4 w-4" style={{ color: "#6B4F1E" }} />
          <span
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: "#6B4F1E" }}
          >
            Today's Coaching
          </span>
          {submitted ? (
            <span className="ml-auto text-xs text-emerald-700">Checked in</span>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto h-7"
              onClick={() => setStandupOpen(true)}
            >
              Check in
            </Button>
          )}
        </div>
        {coaching ? (
          <p className="text-sm leading-relaxed">{coaching}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Do your 3-tap check-in to get today's coaching.
          </p>
        )}
        {suggestedTask && (
          <div className="mt-2 flex items-start gap-1.5 text-sm" style={{ color: "#7C6FDB" }}>
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>Suggested: {suggestedTask}</span>
          </div>
        )}
      </div>

      {/* Workload Timeline + Focus Analytics — side by side */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Workload Timeline */}
        <section>
          <SectionHead label="Workload Planning" title="Workload Timeline" />
          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 text-xs text-muted-foreground">
              Task density over the next 4 months
            </p>
            <div className="h-40">
              <ResponsiveContainer>
                <BarChart data={workload}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    interval={0}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {workload.map((w, i) => (
                      <Cell
                        key={i}
                        fill={
                          w.kind === "Peak"
                            ? "var(--primary)"
                            : w.kind === "Heavy"
                              ? "#BA1A1A"
                              : "#E8E8EF"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <Legend color="var(--primary)" label="Peak" />
              <Legend color="#BA1A1A" label="Heavy" />
              <Legend color="#E8E8EF" label="Normal" />
            </div>
          </div>
        </section>

        {/* Focus Analytics */}
        <section>
          <SectionHead label="Focus Habits" title="Focus Analytics" />
          <div className="rounded-xl border bg-card p-4">
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-3">
              <FocusStat
                icon={CheckCircle2}
                color="#2E7D32"
                label="Completed"
                value={focus.completed}
              />
              <FocusStat
                icon={Timer}
                color="var(--primary)"
                label="Focus Time"
                value={`${Math.floor(focus.minutes / 60)}h ${focus.minutes % 60}m`}
              />
              <FocusStat icon={XCircle} color="#BA1A1A" label="Abandoned" value={focus.abandoned} />
            </div>
            <div className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Sessions — last 7 days
            </div>
            <div className="mt-2 flex items-end gap-1.5 h-16">
              {(() => {
                const max = Math.max(1, ...focus.days);
                return focus.days.map((c, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-sm bg-primary"
                      style={{ height: `${c ? (c / max) * 48 : 3}px`, opacity: c ? 1 : 0.25 }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {["M", "T", "W", "T", "F", "S", "S"][i]}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      </div>

      {/* Activity Heatmap — full width, last */}
      <section>
        <SectionHead label="Study Activity" title="Activity Heatmap" />
        <div className="rounded-xl border bg-card p-4">
          <YearHeatmap activity={stats?.activity || {}} />
        </div>
      </section>

      <StandupModal open={standupOpen} onOpenChange={setStandupOpen} />
    </div>
  );
}

function SectionHead({ label, title }) {
  return (
    <div className="mb-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    </div>
  );
}

function Legend({ color, label, value }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
      {value !== undefined && <strong className="text-foreground">{value}</strong>}
    </span>
  );
}

function FocusStat({ icon: Icon, color, label, value }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <Icon className="mx-auto h-4 w-4" style={{ color }} />
      <div className="mt-1.5 text-xl font-semibold">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function YearHeatmap({ activity }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  // activity[date] is focus MINUTES that day → map to a colour band.
  const heatColor = (mins) => {
    if (!mins) return "#E8E8EF";
    if (mins < 30) return "#B3B7DB";
    if (mins < 60) return "#7880C0";
    if (mins < 120) return "#4C56AF";
    return "#000666";
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Week-columns covering the whole selected calendar year (Mon→Sun).
  const yearEnd = new Date(year, 11, 31);
  const gridStart = new Date(year, 0, 1);
  gridStart.setDate(gridStart.getDate() - ((gridStart.getDay() + 6) % 7));
  const weeks = [];
  const cur = new Date(gridStart);
  while (cur <= yearEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(cur.getFullYear() === year ? new Date(cur) : null);
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }

  const keyOf = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  // Month label above the first week-column of each month.
  const monthLabels = weeks.map((w, i) => {
    const first = w.find(Boolean);
    if (!first) return "";
    const prev = i > 0 ? weeks[i - 1].find(Boolean) : null;
    return !prev || prev.getMonth() !== first.getMonth() ? monthShort(first.getMonth()) : "";
  });

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{year}</span>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setYear((y) => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              disabled={year >= currentYear}
              onClick={() => setYear((y) => Math.min(currentYear, y + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex gap-1 pl-8 text-[10px] text-muted-foreground">
          {monthLabels.map((m, i) => (
            <div key={i} className="flex-1 min-w-[16px]">
              {m}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <div key={i} className="flex flex-1 items-center">
                {i % 2 === 0 ? d : ""}
              </div>
            ))}
          </div>
          <div className="flex flex-1 gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-1">
                {week.map((d, di) => {
                  if (!d) return <div key={di} className="aspect-square min-h-[16px]" />;
                  const future = d > today;
                  const mins = activity[keyOf(d)] || 0;
                  return (
                    <div
                      key={di}
                      className="aspect-square min-h-[16px] rounded-[3px]"
                      style={{ background: future ? "#F3F3F3" : heatColor(mins) }}
                      title={
                        future
                          ? ""
                          : `${monthShort(d.getMonth())} ${d.getDate()}: ${mins} min focused`
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-muted-foreground">
          Less
          {["#E8E8EF", "#B3B7DB", "#7880C0", "#4C56AF", "#000666"].map((c) => (
            <span key={c} className="h-3 w-3 rounded-sm" style={{ background: c }} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
