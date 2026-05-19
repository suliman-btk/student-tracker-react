import { calendarEvents } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

const VIEWS = ["Month", "Week", "Day"];

function startOfMonth(d) { const x = new Date(d); x.setDate(1); return x; }
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a, b) { return a.toDateString() === b.toDateString(); }

export default function CalendarPage() {
  const [view, setView] = useState("Month");
  const [cursor, setCursor] = useState(new Date(2026, 4, 18));

  return (
    <div className="-mx-4 lg:-mx-8 -my-6 h-[calc(100vh-3.5rem)] flex bg-background">
      <aside className="hidden md:flex w-64 shrink-0 border-r flex-col p-4 gap-4">
        <Button className="w-fit"><Plus className="h-4 w-4 mr-1.5" /> Create</Button>
        <MiniMonth cursor={cursor} onPick={setCursor} />
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-2">My calendars</div>
          {["Tasks", "Lectures", "Personal", "Exams"].map((c, i) => (
            <label key={c} className="flex items-center gap-2 text-sm py-1">
              <input type="checkbox" defaultChecked />
              <span className="h-3 w-3 rounded-sm" style={{ background: ["#1A4D2E","#7C3AED","#0E7490","#B45309"][i] }} />
              {c}
            </label>
          ))}
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b flex items-center px-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Today</Button>
          <Button size="icon" variant="ghost" onClick={() => setCursor(addDays(cursor, -30))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setCursor(addDays(cursor, 30))}><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="font-semibold ml-2">{cursor.toLocaleString("en", { month: "long", year: "numeric" })}</h2>
          <div className="ml-auto flex rounded-md border p-0.5">
            {VIEWS.map((v) => (
              <button key={v}
                onClick={() => setView(v)}
                className={cn("px-3 py-1 text-sm rounded", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin">
          {view === "Month" && <MonthView cursor={cursor} />}
          {view === "Week" && <TimeGrid days={7} cursor={cursor} />}
          {view === "Day" && <TimeGrid days={1} cursor={cursor} />}
        </div>
      </div>
    </div>
  );
}

function MiniMonth({ cursor, onPick }) {
  const start = startOfMonth(cursor);
  const offset = start.getDay();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i - offset));
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{cursor.toLocaleString("en", { month: "long", year: "numeric" })}</div>
      <div className="grid grid-cols-7 text-[10px] text-muted-foreground mb-1">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => (
          <button key={i} onClick={() => onPick(d)}
            className={cn("h-6 text-xs rounded grid place-items-center hover:bg-muted",
              sameDay(d, cursor) && "bg-primary text-primary-foreground hover:bg-primary",
              d.getMonth() !== cursor.getMonth() && "text-muted-foreground/40")}>
            {d.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

function MonthView({ cursor }) {
  const start = startOfMonth(cursor);
  const offset = start.getDay();
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i - offset));
  const today = new Date();
  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b text-xs uppercase text-muted-foreground">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="px-2 py-2 border-r last:border-r-0">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6 flex-1">
        {cells.map((d, i) => {
          const events = calendarEvents.filter((e) => sameDay(new Date(e.start_time), d));
          const isToday = sameDay(d, today);
          const otherMonth = d.getMonth() !== cursor.getMonth();
          return (
            <div key={i} className={cn("border-r border-b p-1.5 overflow-hidden", otherMonth && "bg-muted/30")}>
              <div className={cn("text-xs mb-1", otherMonth && "text-muted-foreground/50")}>
                <span className={cn("inline-grid place-items-center h-5 min-w-5 px-1 rounded-full",
                  isToday && "bg-primary text-primary-foreground font-semibold")}>{d.getDate()}</span>
              </div>
              <div className="space-y-1">
                {events.slice(0, 3).map((e) => (
                  <div key={e.id} className="text-[11px] truncate rounded px-1.5 py-0.5 text-white" style={{ background: e.color_hex }}>
                    {e.all_day ? e.title : `${new Date(e.start_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} ${e.title}`}
                  </div>
                ))}
                {events.length > 3 && <div className="text-[11px] text-muted-foreground">+{events.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeGrid({ days, cursor }) {
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
          const dayEvents = calendarEvents.filter((e) => !e.all_day && sameDay(new Date(e.start_time), d));
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
                const s = new Date(e.start_time);
                const en = new Date(e.end_time || e.start_time);
                const top = (s.getHours() + s.getMinutes() / 60) * 56;
                const h = Math.max(28, ((en - s) / 3600000) * 56);
                return (
                  <div key={e.id} className="absolute left-1 right-1 rounded-md px-2 py-1 text-white text-xs shadow-sm overflow-hidden"
                    style={{ top, height: h, background: e.color_hex }}>
                    <div className="font-semibold truncate">{e.title}</div>
                    <div className="opacity-90">{s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
