import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  Columns3,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { useActiveSprint, useBacklog, useCapacity, useSpace, useSpaceMembers, useStudyMutations } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "backlog", label: "Backlog", icon: ListTodo },
  { id: "board", label: "Board", icon: Columns3 },
];

const statusColumns = [
  { key: "To Do", aliases: ["todo", "to_do", "To Do", "pending"], label: "TO DO" },
  { key: "In Progress", aliases: ["in_progress", "In Progress", "doing"], label: "IN PROGRESS" },
  { key: "Done", aliases: ["done", "Done", "completed"], label: "DONE" },
];

function getTasks(sprint) {
  return sprint?.tasks || sprint?.tasks_data || sprint?.items || [];
}

function statusKey(status) {
  const found = statusColumns.find((col) => col.aliases.includes(status));
  return found?.key || status || "To Do";
}

function taskStatusForApi(status) {
  if (status === "In Progress") return "in_progress";
  if (status === "Done") return "done";
  return "todo";
}

function fallbackBurndown(tasks) {
  const total = tasks.reduce((sum, t) => sum + Number(t.points || t.story_points || 1), 0);
  return Array.from({ length: 7 }, (_, index) => ({
    day: `D${index + 1}`,
    remaining: Math.max(0, total - Math.round((total / 6) * index)),
  }));
}

export default function WorkspacePage({ tab = "summary", spaceId }) {
  const navigate = useNavigate();
  const { openAI, setActiveSpace } = useUI();
  const { data: space, isLoading: loadingSpace, error: spaceError } = useSpace(spaceId);
  const { data: sprint, isLoading: loadingSprint } = useActiveSprint(spaceId);

  useEffect(() => {
    if (spaceId) setActiveSpace(spaceId);
  }, [spaceId, setActiveSpace]);

  if (loadingSpace) return <WorkspaceLoading />;
  if (spaceError) return <WorkspaceError message={spaceError.message} />;

  const spaceName = space?.name || `Space ${spaceId}`;
  const spaceKey = space?.key || space?.slug || spaceName.slice(0, 3).toUpperCase();
  const spaceColor = space?.color_hex || space?.color || "var(--primary)";

  return (
    <div className="space-y-5">
      <div className="border-b bg-background -mx-4 lg:-mx-8 -mt-6 px-4 lg:px-8 pt-4">
        <div className="h-9 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/spaces" className="inline-flex items-center gap-1 hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Spaces
          </Link>
          <span>/</span>
          <span className="rounded px-1.5 py-0.5 font-semibold" style={{ color: spaceColor, background: "color-mix(in oklab, currentColor 10%, transparent)" }}>
            {spaceKey}
          </span>
          <span className="text-foreground">{spaceName}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 py-4">
          <div className="h-10 w-10 rounded-lg grid place-items-center text-white font-bold" style={{ background: spaceColor }}>
            {spaceName[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{spaceName}</h1>
            <p className="text-sm text-muted-foreground">{space?.description || "Space workspace for sprint summary, board, and backlog."}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {sprint && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Sprint Active
              </span>
            )}
            <Button variant="outline" onClick={() => openAI({ spaceId, sprintId: sprint?.id })}>
              <Bot className="h-4 w-4 mr-1.5" /> AI Scrum
            </Button>
            <Link
              to="/spaces/$spaceId/members"
              params={{ spaceId: String(spaceId) }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
            >
              <Users className="h-4 w-4" /> Members
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-3 rounded-lg bg-muted p-1 mb-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate({ to: `/spaces/${spaceId}/${id}` })}
              className={cn(
                "h-9 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                tab === id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "summary" && <WorkspaceSummary sprint={sprint} loadingSprint={loadingSprint} spaceId={spaceId} />}
      {tab === "board" && <WorkspaceBoard sprint={sprint} loadingSprint={loadingSprint} spaceId={spaceId} />}
      {tab === "backlog" && <WorkspaceBacklog spaceId={spaceId} />}
      {tab === "members" && <WorkspaceMembers spaceId={spaceId} />}
    </div>
  );
}

function WorkspaceSummary({ sprint, loadingSprint, spaceId }) {
  const { data: capacity } = useCapacity();
  const tasks = getTasks(sprint);
  const done = tasks.filter((t) => statusKey(t.status) === "Done").length;
  const points = tasks.reduce((sum, t) => sum + Number(t.points || t.story_points || 0), 0);
  const chart = sprint?.burndown || fallbackBurndown(tasks);

  if (loadingSprint) return <WorkspaceLoading label="Loading active sprint..." />;
  if (!sprint) return <EmptySprint spaceId={spaceId} />;

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-4">
      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{sprint.name || "Active Sprint"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{sprint.goal || "Current sprint execution summary."}</p>
          </div>
          <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {sprint.start_date || "Start"} {">"} {sprint.end_date || "End"}
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-3 mt-4">
          <Metric label="Tasks done" value={`${done}/${tasks.length}`} />
          <Metric label="Points" value={points || "-"} />
          <Metric label="Capacity" value={capacity?.capacity_points || capacity?.capacity || "-"} />
        </div>
        <div className="h-56 mt-5">
          <ResponsiveContainer>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" fontSize={11} />
              <YAxis fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
              <Line type="monotone" dataKey="remaining" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
      <aside className="space-y-3">
        <Insight title="Sprint Analysis">Live sprint data is connected. Ask the AI Scrum Coach for a server-generated analysis.</Insight>
        <Insight title="Next Sprint Advice">Use the planning endpoints to generate weekly, sprint, or multi-sprint plans.</Insight>
      </aside>
    </div>
  );
}

function WorkspaceBoard({ sprint, loadingSprint, spaceId }) {
  const [dragged, setDragged] = useState(null);
  const mutations = useStudyMutations();
  const tasks = getTasks(sprint);

  const moveTask = (status) => {
    if (!dragged || !sprint?.id) return;
    mutations.updateSprintTaskStatus.mutate({
      sprintId: sprint.id,
      taskId: dragged.id,
      status: taskStatusForApi(status),
      spaceId,
    });
    setDragged(null);
  };

  if (loadingSprint) return <WorkspaceLoading label="Loading board..." />;
  if (!sprint) return <EmptySprint spaceId={spaceId} />;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {statusColumns.map((col) => {
        const colTasks = tasks.filter((task) => statusKey(task.status) === col.key);
        return (
          <section
            key={col.key}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => moveTask(col.key)}
            className="rounded-lg bg-muted/45 p-3 min-h-[520px]"
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground">{col.label}</h3>
              <span className="text-xs text-muted-foreground">{colTasks.length}</span>
            </div>
            <div className="space-y-2">
              {colTasks.map((task) => (
                <article
                  key={task.id}
                  draggable
                  onDragStart={() => setDragged(task)}
                  className="rounded-md border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing"
                >
                  <h4 className="text-sm font-medium">{task.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {task.priority || "normal"} · {task.points || task.story_points || 0} pts · {task.expected_hours || task.estimated_hours || 0}h
                  </p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function WorkspaceBacklog({ spaceId }) {
  const { data: backlog = [], isLoading, error } = useBacklog(spaceId);
  const mutations = useStudyMutations();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Backlog</h2>
          <p className="text-sm text-muted-foreground">Unplanned tasks available for this space.</p>
        </div>
        <Button><Plus className="h-4 w-4 mr-1.5" /> Add task</Button>
      </div>
      {isLoading && <WorkspaceLoading label="Loading backlog..." />}
      {error && <WorkspaceError message={error.message} />}
      <div className="space-y-2">
        {backlog.map((task) => (
          <div key={task.id} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium">{task.title}</h3>
              <p className="text-xs text-muted-foreground">
                {task.priority || "normal"} · {task.points || task.story_points || 0} pts · due {task.deadline || task.due_date || "not set"}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={mutations.addTasksToSpace.isPending}
              onClick={() => mutations.addTasksToSpace.mutate({ spaceId, taskIds: [task.id] })}
            >
              Add to space
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceMembers({ spaceId }) {
  const { data: members = [], isLoading, error } = useSpaceMembers(spaceId);
  if (isLoading) return <WorkspaceLoading label="Loading members..." />;
  if (error) return <WorkspaceError message={error.message} />;
  return (
    <div className="space-y-3">
      <h2 className="font-semibold">Members</h2>
      {members.map((member) => (
        <div key={member.id || member.uid || member.user_id} className="rounded-lg border bg-card p-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">{member.name || member.user?.name || member.email || member.uid}</div>
            <div className="text-xs text-muted-foreground">{member.role || "member"}</div>
          </div>
          <span className="text-xs text-muted-foreground">{member.status || ""}</span>
        </div>
      ))}
      {members.length === 0 && <p className="text-sm text-muted-foreground">No members returned for this space.</p>}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function Insight({ title, children }) {
  return (
    <div className="rounded-lg border border-[color:var(--ai)]/30 bg-[color:var(--ai-soft)]/30 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--ai)]">
        <Sparkles className="h-4 w-4" /> {title}
      </div>
      <p className="text-sm text-muted-foreground mt-2">{children}</p>
    </div>
  );
}

function EmptySprint({ spaceId }) {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h2 className="font-semibold">No active sprint</h2>
      <p className="text-sm text-muted-foreground mt-1">Plan work in the backlog, then start a sprint for this space.</p>
      <Link to="/spaces/$spaceId/backlog" params={{ spaceId: String(spaceId) }}>
        <Button className="mt-4">Go to backlog</Button>
      </Link>
    </div>
  );
}

function WorkspaceLoading({ label = "Loading workspace..." }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

function WorkspaceError({ message }) {
  return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{message}</div>;
}
