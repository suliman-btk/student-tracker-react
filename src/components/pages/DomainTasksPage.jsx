import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDomain, useDomainTasks } from "@/lib/query-hooks";
import CreateTaskModal from "@/components/study/CreateTaskModal";

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);

function domainTitle(domain, id) {
  return domain?.domain_name || domain?.name || `Domain ${id}`;
}

function taskTitle(task) {
  return task?.title || task?.name || `Task ${task?.id}`;
}

export default function DomainTasksPage({ id }) {
  const { data: domain, isLoading: loadingDomain, error: domainError } = useDomain(id);
  const { data: tasksPayload = [], isLoading: loadingTasks, error: tasksError } = useDomainTasks(id);
  const tasks = asArray(tasksPayload);
  const title = domainTitle(domain, id);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/domains" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Domains
          </Link>
          <div className="mt-2 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {domain?.is_active !== undefined && (
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${domain.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                {domain.is_active ? "Active" : "Paused"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {(domain?.area_type || domain?.area || "General")} domain tasks from the Laravel API.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add task
        </Button>
      </div>

      <CreateTaskModal open={modalOpen} onOpenChange={setModalOpen} domainId={id} />

      {loadingDomain && (
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading domain...
        </div>
      )}
      {domainError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Domain details were not available, but tasks can still load. {domainError.message}
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Tasks" value={tasks.length} />
        <Stat label="Priority" value={domain?.priority || "Normal"} />
        <Stat label="Weekly target" value={`${domain?.weekly_target_hours ?? domain?.weekly_hours ?? 0}h`} />
      </div>

      {loadingTasks && (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading domain tasks...
        </div>
      )}
      {tasksError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {tasksError.message}
        </div>
      )}

      {!loadingTasks && !tasksError && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Tasks in this domain
          </div>
          <div className="divide-y">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to="/tasks/$id"
                params={{ id: String(task.id) }}
                className="flex items-center gap-3 p-4 hover:bg-muted/30"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-medium">{taskTitle(task)}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{task.priority || "normal"}</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" /> {task.expected_hours || task.estimated_hours || 0}h
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {task.deadline || task.due_date || "No due date"}
                    </span>
                  </div>
                </div>
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {task.status || "todo"}
                </span>
              </Link>
            ))}
            {tasks.length === 0 && (
              <div className="p-8 text-center">
                <h3 className="font-semibold">No tasks in this domain</h3>
                <p className="text-sm text-muted-foreground mt-1">Tasks linked to this domain will appear here.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}
