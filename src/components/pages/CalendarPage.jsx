import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2, Plus, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn, parseWall, wallDateStr } from "@/lib/utils";
import { useCalendarEvents, useSprints, useTasks } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateSprintModal from "@/components/study/CreateSprintModal";
import CreateEventModal from "@/components/study/CreateEventModal";
import CreateTaskModal from "@/components/study/CreateTaskModal";
import EventDetailDialog from "@/components/study/EventDetailDialog";
import ImportScheduleDialog from "@/components/study/ImportScheduleDialog";

const VIEWS = ["Month", "Week", "Day"];
const asArray = (p) => (Array.isArray(p) ? p : p?.data || []);
const PRIORITY_COLOR = {
  Critical: "#dc2626", Highest: "#dc2626", High: "#ea580c",
  Medium: "#9b8fb8", Low: "#7e9cc4", Lowest: "#7e9cc4",
};

function startOfMonth(d) { const x = new Date(d); x.setDate(1); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a, b) { return a.toDateString() === b.toDateString(); }
function dayMs(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
function parseLocal(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const WEEKDAY = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diffDays = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / 86400000);

// Does a recurring event occur on `day`? `base` is the series' first occurrence.
function occursOn(ev, day, base) {
  const d0 = startOfDay(base);
  const dd = startOfDay(day);
  if (dd < d0) return false;
  if (ev.recurrence_end_date) {
    const end = parseWall(ev.recurrence_end_date);
    if (end && dd > startOfDay(end)) return false;
  }
  if (Array.isArray(ev.excluded_dates) && ev.excluded_dates.some((x) => String(x).slice(0, 10) === wallDateStr(dd))) return false;
  const interval = ev.recurrence_interval || 1;
  const delta = diffDays(dd, d0);
  switch (ev.recurrence_type) {
    case "daily":
      return delta % interval === 0;
    case "weekly": {
      const days = (ev.recurrence_days || []).map((x) => WEEKDAY[String(x).toLowerCase()]).filter((n) => n != null);
      if (days.length) {
        const baseWeek = addDays(d0, -d0.getDay());
        const curWeek = addDays(dd, -dd.getDay());
        const weekDelta = Math.round(diffDays(curWeek, baseWeek) / 7);
        return days.includes(dd.getDay()) && weekDelta % interval === 0;
      }
      return dd.getDay() === d0.getDay() && Math.floor(delta / 7) % interval === 0;
    }
    case "monthly":
      return dd.getDate() === d0.getDate()
        && (((dd.getFullYear() - d0.getFullYear()) * 12 + dd.getMonth() - d0.getMonth()) % interval === 0);
    default:
      return false;
  }
}

// Expand recurring events into individual occurrences within [rangeStart, rangeEnd].
// Non-recurring events pass through unchanged. Occurrences carry Date objects for
// start_time/end_time (parseWall accepts Dates) plus an _occurrence_date marker.
function expandEvents(events, rangeStart, rangeEnd) {
  const out = [];
  for (const ev of events) {
    if (!ev.recurrence_type) { out.push(ev); continue; }
    const base = parseWall(ev.start_time);
    if (!base) { out.push(ev); continue; }
    const baseEnd = parseWall(ev.end_time);
    const durationMs = baseEnd ? baseEnd - base : 0;
    const from = startOfDay(rangeStart) > startOfDay(base) ? startOfDay(rangeStart) : startOfDay(base);
    for (let day = new Date(from); day <= rangeEnd; day = addDays(day, 1)) {
      if (!occursOn(ev, day, base)) continue;
      const s = new Date(day.getFullYear(), day.getMonth(), day.getDate(), base.getHours(), base.getMinutes());
      out.push({
        ...ev,
        start_time: s,
        end_time: durationMs ? new Date(s.getTime() + durationMs) : null,
        _occurrence_date: wallDateStr(s),
      });
    }
  }
  return out;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [view, setView] = useState("Month");
  const [cursor, setCursor] = useState(new Date());
  const { activeSpaceId } = useUI();

  const { data: eventsPayload = [] } = useCalendarEvents();
  const { data: sprintsPayload = [] } = useSprints();
  const { data: tasksPayload = [] } = useTasks();
  const events = asArray(eventsPayload);
  const sprints = asArray(sprintsPayload);
  const tasks = asArray(tasksPayload);

  // Expand recurring events into occurrences across the visible window.
  const visibleEvents = useMemo(
    () => expandEvents(events, addDays(cursor, -42), addDays(cursor, 42)),
    [events, cursor],
  );

  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [importScheduleOpen, setImportScheduleOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [createDate, setCreateDate] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  const ranges = useMemo(() => {
    const today = startOfDay(new Date());
    return sprints
      .map((s) => {
        const from = parseLocal(s.start_date || s.startDate);
        const to = parseLocal(s.end_date || s.endDate);
        return {
          id: s.id,
          name: s.name || `Sprint ${s.id}`,
          from,
          to,
          // Only "active" if flagged AND today is within the sprint window — the
          // backend doesn't auto-close, so an expired sprint can keep is_active=true.
          active: Boolean(s.is_active) && from && to && today >= startOfDay(from) && today <= startOfDay(to),
        };
      })
      .filter((r) => r.from && r.to);
  }, [sprints]);
  const activeSprint = ranges.find((r) => r.active);
  const sprintOnDay = (d) => {
    const t = dayMs(d);
    return ranges.find((r) => t >= dayMs(r.from) && t <= dayMs(r.to));
  };

  const openNewEvent = (date) => { setEditingEvent(null); setCreateDate(date || null); setEventModalOpen(true); };
  const openEditEvent = (ev) => { setDetailEvent(null); setEditingEvent(ev); setCreateDate(null); setEventModalOpen(true); };
  const openTaskChip = (taskId) => navigate({ to: "/tasks/$id", params: { id: String(taskId) } });
  const newSprint = () => {
    if (!activeSpaceId) { toast.error("Open a space first to create a sprint."); return; }
    setSprintModalOpen(true);
  };

  return (
    <div className="-mx-4 lg:-mx-8 -my-6 h-[calc(100vh-3.5rem)] flex bg-background">
      {/* Calendar side panel */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-5 border-r bg-card/40 p-4 overflow-y-auto scrollbar-thin">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full justify-center gap-1.5 shadow-sm h-11 rounded-xl text-[15px]">
              <Plus className="h-4 w-4" /> Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[14.5rem]">
            <DropdownMenuItem onClick={() => openNewEvent(cursor)}>New event</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTaskModalOpen(true)}>New task</DropdownMenuItem>
            <DropdownMenuItem onClick={newSprint}>New sprint</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setImportScheduleOpen(true)}>Import schedule (AI)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <MiniMonth cursor={cursor} onPick={setCursor} />

        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sprints</span>
            <span className="text-[11px] text-muted-foreground">{ranges.length}</span>
          </div>
          <div className="space-y-1">
            {ranges.map((r) => {
              const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    r.active ? "bg-emerald-500/10" : "hover:bg-muted/60",
                  )}
                >
                  <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", r.active ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                  <div className="min-w-0">
                    <div className="truncate font-medium leading-tight">{r.name}</div>
                    <div className="text-[11px] text-muted-foreground">{fmt(r.from)} – {fmt(r.to)}</div>
                  </div>
                  {r.active && <span className="ml-auto text-[10px] font-semibold text-emerald-600 uppercase">Now</span>}
                </div>
              );
            })}
            {ranges.length === 0 && <p className="px-2.5 text-xs text-muted-foreground">No sprints yet.</p>}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b flex items-center px-4 gap-3">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <div className="flex items-center">
            <Button size="icon" variant="ghost" onClick={() => setCursor(addDays(cursor, -30))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => setCursor(addDays(cursor, 30))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <h2 className="text-lg font-semibold ml-1">{cursor.toLocaleString("en", { month: "long", year: "numeric" })}</h2>
          <div className="ml-auto flex rounded-lg border bg-muted/40 p-0.5">
            {VIEWS.map((v) => (
              <button key={v}
                onClick={() => setView(v)}
                className={cn("px-3 py-1 text-sm rounded-md transition-colors", view === v ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>
        </div>
        {activeSprint && <SprintBar sprint={activeSprint} />}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {view === "Month" && (
            <MonthView
              cursor={cursor}
              events={visibleEvents}
              tasks={tasks}
              sprintOnDay={sprintOnDay}
              onEventClick={setDetailEvent}
              onTaskClick={openTaskChip}
              onDayClick={openNewEvent}
            />
          )}
          {view === "Week" && <TimeGrid days={7} cursor={cursor} events={visibleEvents} onEventClick={setDetailEvent} />}
          {view === "Day" && <TimeGrid days={1} cursor={cursor} events={visibleEvents} onEventClick={setDetailEvent} />}
        </div>
      </div>

      <CreateSprintModal open={sprintModalOpen} onOpenChange={setSprintModalOpen} spaceId={activeSpaceId} />
      <CreateTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} spaceId={activeSpaceId} />
      <CreateEventModal
        open={eventModalOpen}
        onOpenChange={setEventModalOpen}
        event={editingEvent}
        initialDate={createDate}
        spaceId={activeSpaceId}
      />
      <EventDetailDialog
        open={Boolean(detailEvent)}
        onOpenChange={(o) => !o && setDetailEvent(null)}
        event={detailEvent}
        onEdit={openEditEvent}
      />
      <ImportScheduleDialog open={importScheduleOpen} onOpenChange={setImportScheduleOpen} />
    </div>
  );
}

function SprintBar({ sprint }) {
  const total = Math.max(1, Math.round((dayMs(sprint.to) - dayMs(sprint.from)) / 86400000) + 1);
  const day = Math.min(total, Math.max(1, Math.round((dayMs(new Date()) - dayMs(sprint.from)) / 86400000) + 1));
  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return (
    <div className="mx-4 my-2 flex items-center gap-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm">
      <Zap className="h-4 w-4 text-emerald-600" />
      <span className="font-medium text-emerald-800">{sprint.name}</span>
      <span className="text-emerald-700">{fmt(sprint.from)} – {fmt(sprint.to)}</span>
      <span className="ml-auto text-xs text-emerald-700">day {day} of {total}</span>
    </div>
  );
}

function MiniMonth({ cursor, onPick }) {
  const start = startOfMonth(cursor);
  const offset = start.getDay();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i - offset));
  const today = new Date();
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold">{cursor.toLocaleString("en", { month: "long", year: "numeric" })}</span>
        <div className="flex">
          <button onClick={() => onPick(addDays(start, -1))} className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => onPick(addDays(startOfMonth(addDays(start, 35)), 0))} className="h-6 w-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted">
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-[10px] text-muted-foreground mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          const isToday = sameDay(d, today);
          const selected = sameDay(d, cursor);
          return (
            <button
              key={i}
              onClick={() => onPick(d)}
              className={cn(
                "h-7 text-xs rounded-full grid place-items-center transition-colors",
                d.getMonth() !== cursor.getMonth() && "text-muted-foreground/40",
                !selected && isToday && "text-primary font-semibold",
                !selected && "hover:bg-muted",
                selected && "bg-primary text-primary-foreground font-semibold hover:bg-primary",
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ cursor, events, tasks, sprintOnDay, onEventClick, onTaskClick, onDayClick }) {
  const start = startOfMonth(cursor);
  const offset = start.getDay();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i - offset));
  const today = new Date();
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b bg-muted/20 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="px-2 py-2 text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {cells.map((d, i) => {
          const dayEvents = events.filter((e) => sameDay(parseWall(e.start_time), d));
          const dayTasks = tasks.filter((t) => {
            const dl = t.deadline || t.due_date;
            return dl && sameDay(parseWall(dl), d);
          });
          const isToday = sameDay(d, today);
          const otherMonth = d.getMonth() !== cursor.getMonth();
          const sprint = sprintOnDay(d);
          return (
            <div
              key={i}
              onClick={() => onDayClick(d)}
              className={cn(
                "group border-r border-b border-border/60 p-1.5 overflow-hidden cursor-pointer transition-colors hover:bg-muted/40",
                "[&:nth-child(7n)]:border-r-0",
                otherMonth && "bg-muted/20 text-muted-foreground",
                sprint && !otherMonth && "bg-emerald-500/[0.06]",
              )}
            >
              <div className={cn("mb-1 flex items-center justify-center", otherMonth && "opacity-60")}>
                <span className={cn("grid h-6 min-w-6 place-items-center rounded-full px-1 text-xs",
                  isToday && "bg-primary text-primary-foreground font-semibold")}>{d.getDate()}</span>
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 2).map((t) => (
                  <button
                    key={`t${t.id}`}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(t.id); }}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] text-white"
                    style={{ background: PRIORITY_COLOR[t.priority] || "#7e9cc4" }}
                  >
                    ◷ {t.title || `Task ${t.id}`}
                  </button>
                ))}
                {dayEvents.slice(0, 3).map((e) => (
                  <button
                    key={`e${e.id}`}
                    onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
                    className="block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] text-white"
                    style={{ background: e.color_hex || "#4f46e5" }}
                  >
                    {e.all_day ? e.title : `${parseWall(e.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} ${e.title}`}
                  </button>
                ))}
                {dayEvents.length + dayTasks.length > 5 && (
                  <div className="text-[11px] text-muted-foreground">+{dayEvents.length + dayTasks.length - 5} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeGrid({ days, cursor, events, onEventClick }) {
  const startDay = days === 7 ? addDays(cursor, -cursor.getDay()) : cursor;
  const dayList = useMemo(() => Array.from({ length: days }, (_, i) => addDays(startDay, i)), [startDay, days]);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const now = new Date();
  const nowPct = (now.getHours() + now.getMinutes() / 60) / 24 * 100;

  return (
    <div className="min-h-full">
      <div className="grid sticky top-0 z-10 bg-background border-b" style={{ gridTemplateColumns: `64px repeat(${days}, 1fr)` }}>
        <div />
        {dayList.map((d, i) => {
          const isToday = sameDay(d, now);
          return (
            <div key={i} className="px-2 py-2 border-l text-center">
              <div className="text-xs text-muted-foreground uppercase">{d.toLocaleString("en", { weekday: "short" })}</div>
              <div className={cn("text-xl font-semibold", isToday && "text-primary")}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>
      <div className="relative grid" style={{ gridTemplateColumns: `64px repeat(${days}, 1fr)` }}>
        <div>
          {hours.map((h) => (
            <div key={h} className="h-14 text-[10px] text-muted-foreground text-right pr-2 -mt-2">
              {h === 0 ? "" : `${h}:00`}
            </div>
          ))}
        </div>
        {dayList.map((d, i) => {
          const dayEvents = events.filter((e) => !e.all_day && sameDay(parseWall(e.start_time), d));
          const isToday = sameDay(d, now);
          return (
            <div key={i} className="relative border-l">
              {hours.map((h) => <div key={h} className="h-14 border-b border-border/60" />)}
              {isToday && (
                <div className="absolute inset-x-0 z-10 flex items-center" style={{ top: `${nowPct}%` }}>
                  <div className="h-2 w-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-0.5 bg-red-500" />
                </div>
              )}
              {dayEvents.map((e) => {
                const s = parseWall(e.start_time);
                const en = parseWall(e.end_time || e.start_time);
                const top = (s.getHours() + s.getMinutes() / 60) * 56;
                const h = Math.max(28, ((en - s) / 3600000) * 56);
                return (
                  <button
                    key={e.id}
                    onClick={() => onEventClick(e)}
                    className="absolute left-1 right-1 rounded-md px-2 py-1 text-left text-white text-xs shadow-sm overflow-hidden"
                    style={{ top, height: h, background: e.color_hex || "#4f46e5" }}
                  >
                    <div className="font-semibold truncate">{e.title}</div>
                    <div className="opacity-90">{s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>{/* wall-clock */}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
