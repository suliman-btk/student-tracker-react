import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, CalendarDays, CheckCircle2, Circle, Clock3,
  Loader2, Plus, TrendingUp, AlertCircle, BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDomain, useDomainTasks } from "@/lib/query-hooks";
import CreateTaskModal from "@/components/study/CreateTaskModal";

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);

function fmtDate(raw) {
  if (!raw) return "No due date";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function isOverdue(raw) {
  if (!raw) return false;
  const d = new Date(raw);
  return !isNaN(d.getTime()) && d < new Date() ;
}

function normaliseStatus(s = "") {
  const v = String(s).toLowerCase().replace(/[-_ ]/g, "");
  if (v === "done" || v === "completed") return "Done";
  if (v === "inprogress" || v === "doing") return "In Progress";
  return "To Do";
}

const STATUS_STYLE = {
  "Done":        "bg-emerald-100 text-emerald-700",
  "In Progress": "bg-primary/10 text-primary",
  "To Do":       "bg-muted text-muted-foreground",
};

const PRIORITY_DOT = {
  High: "bg-rose-500", Critical: "bg-rose-500", Highest: "bg-rose-500",
  Medium: "bg-amber-500",
  Low: "bg-sky-400", Lowest: "bg-sky-400",
};

export default function DomainTasksPage({ id }) {
  const { data: domain, isLoading: loadingDomain, error: domainError } = useDomain(id);
  const { data: tasksPayload = [], isLoading: loadingTasks, error: tasksError } = useDomainTasks(id);
  const tasks = asArray(tasksPayload);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("All");

  const title = domain?.domain_name || domain?.name || `Domain ${id}`;

  // ── Analytics ────────────────────────────────────────────────────────────────
  const done        = tasks.filter((t) => normaliseStatus(t.status) === "Done").length;
  const inProgress  = tasks.filter((t) => normaliseStatus(t.status) === "In Progress").length;
  const toDo        = tasks.filter((t) => normaliseStatus(t.status) === "To Do").length;
  const overdue     = tasks.filter((t) => normaliseStatus(t.status) !== "Done" && isOverdue(t.deadline || t.due_date)).length;
  const totalEst    = tasks.reduce((s, t) => s + parseFloat(t.expected_hours || t.estimated_hours || 0), 0);
  const doneEst     = tasks.filter((t) => normaliseStatus(t.status) === "Done")
                          .reduce((s, t) => s + parseFloat(t.expected_hours || t.estimated_hours || 0), 0);
  const pct         = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  // ── Filtered list ────────────────────────────────────────────────────────────
  const visible = filter === "All" ? tasks : tasks.filter((t) => normaliseStatus(t.status) === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/domains" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Domains
          </Link>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {domain?.is_active !== undefined && (
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${domain.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {domain.is_active ? "Active" : "Paused"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {domain?.area_type || domain?.area || "General"} · {domain?.priority || "Normal"} priority
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add task
        </Button>
      </div>

      <CreateTaskModal open={modalOpen} onOpenChange={setModalOpen} domainId={id} />

      {loadingDomain && (
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading domain…
        </div>
      )}
      {domainError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Domain details unavailable. {domainError.message}
        </div>
      )}

      {/* ── Analytics grid ────────────────────────────────────────────────── */}
      {!loadingTasks && tasks.length > 0 && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              label="Completed"
              value={done}
              sub={`of ${tasks.length} tasks`}
              tint="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-primary" />}
              label="In Progress"
              value={inProgress}
              sub="tasks active"
              tint="bg-primary/5 text-primary"
            />
            <StatCard
              icon={<Clock3 className="h-5 w-5 text-amber-600" />}
              label="Est. hours"
              value={`${totalEst.toFixed(1)}h`}
              sub={`${doneEst.toFixed(1)}h done`}
              tint="bg-amber-50 text-amber-600"
            />
            <StatCard
              icon={<AlertCircle className="h-5 w-5 text-rose-600" />}
              label="Overdue"
              value={overdue}
              sub="need attention"
              tint="bg-rose-50 text-rose-600"
            />
          </div>

          {/* Progress bar */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Domain progress
              </div>
              <span className="text-sm font-semibold text-primary">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--ai)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex gap-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />{done} Done</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />{inProgress} In Progress</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" />{toDo} To Do</span>
            </div>
          </div>
        </>
      )}

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      {loadingTasks && (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…
        </div>
      )}
      {tasksError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {tasksError.message}
        </div>
      )}

      {!loadingTasks && !tasksError && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/40 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tasks in this domain
            </span>
            <div className="flex gap-1">
              {["All", "To Do", "In Progress", "Done"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    filter === f ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y">
            {visible.map((task) => {
              const status = normaliseStatus(task.status);
              const raw    = task.deadline || task.due_date;
              const od     = status !== "Done" && isOverdue(raw);
              const hours  = parseFloat(task.expected_hours || task.estimated_hours || 0);
              const prio   = task.priority || "Normal";
              return (
                <Link
                  key={task.id}
                  to="/tasks/$id"
                  params={{ id: String(task.id) }}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors"
                >
                  {status === "Done"
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    : <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  }
                  <div className="min-w-0 flex-1">
                    <h3 className={`truncate text-sm font-medium ${status === "Done" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title || task.name || `Task ${task.id}`}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT[prio] || "bg-muted-foreground/40"}`} />
                        {prio}
                      </span>
                      {hours > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" /> {hours}h
                        </span>
                      )}
                      <span className={`flex items-center gap-1 ${od ? "text-rose-600 font-medium" : ""}`}>
                        <CalendarDays className="h-3 w-3" />
                        {fmtDate(raw)}{od ? " · overdue" : ""}
                      </span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
                    {status}
                  </span>
                </Link>
              );
            })}
            {visible.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                {filter === "All" ? "No tasks in this domain yet." : `No "${filter}" tasks.`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, tint }) {
  return (
    <div className="rounded-xl border bg-card p-4 flex items-start gap-3">
      <div className={`h-10 w-10 shrink-0 rounded-xl grid place-items-center ${tint}`}>
        {icon}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold mt-0.5">{value}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}
