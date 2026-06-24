import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Columns3,
  LayoutDashboard,
  Library,
  Link2,
  ListTodo,
  Loader2,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCircle,
  Zap,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useReducer } from "react";
import { useActiveSprint, useBacklog, useCapacity, useSpace, useSprints, useStudyMutations } from "@/lib/query-hooks";
import { PRIORITY_COLOURS } from "@/lib/priority";
import { aiApi } from "@/lib/api";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";
import CreateTaskModal from "@/components/study/CreateTaskModal";
import TaskEntryModal from "@/components/study/TaskEntryModal";
import CreateSprintModal from "@/components/study/CreateSprintModal";
import AISprintReviewModal from "@/components/study/AISprintReviewModal";
import AISprintPlannerModal from "@/components/study/AISprintPlannerModal";
import AddFromDomainModal from "@/components/study/AddFromDomainModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const tabs = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "board", label: "Board", icon: Columns3 },
  { id: "backlog", label: "Backlog", icon: ListTodo },
];

const statusColumns = [
  { key: "To Do", label: "TO DO", color: "#c9c9c2" },
  { key: "In Progress", label: "IN PROGRESS", color: "#7f99bf" },
  { key: "Done", label: "DONE", color: "#6fa187" },
];

const priorityColors = PRIORITY_COLOURS;

function getTasks(sprint) {
  return sprint?.tasks || sprint?.tasks_data || sprint?.items || [];
}

function asArray(payload) {
  return Array.isArray(payload) ? payload : payload?.data || [];
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(value, fallback = "Not set") {
  const date = parseDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dateRange(sprint) {
  const start = dateLabel(sprint?.start_date || sprint?.startDate, "Start");
  const end = dateLabel(sprint?.end_date || sprint?.endDate, "End");
  return `${start} - ${end}`;
}

function sprintVelocity(sprint, tasks) {
  const done = tasks.filter((task) => task.status === "Done").length;
  if (Number.isFinite(Number(sprint?.velocity))) return Number(sprint.velocity);
  return tasks.length ? (done / tasks.length) * 100 : 0;
}

function sprintPoints(tasks) {
  const total = tasks.reduce((sum, task) => sum + task.points, 0);
  const done = tasks
    .filter((task) => task.status === "Done")
    .reduce((sum, task) => sum + task.points, 0);
  return { done, total };
}

function countByStatus(tasks) {
  return statusColumns.map((column) => ({
    ...column,
    count: tasks.filter((task) => task.status === column.key).length,
  }));
}

function priorityData(tasks) {
  return ["Highest", "High", "Medium", "Low", "Lowest"].map((priority) => ({
    priority,
    count: tasks.filter((task) => task.priority === priority).length,
    color: priorityColors[priority],
  }));
}

function openDeadlineTasks(tasks) {
  return tasks
    .filter((task) => task.status !== "Done" && task.deadlineDate)
    .sort((a, b) => a.deadlineDate - b.deadlineDate);
}

export default function WorkspacePage({ tab = "summary", spaceId }) {
  const navigate = useNavigate();
  const { openAI, setActiveSpace } = useUI();

  const triggerSprintReview = async (sprintId) => {
    try {
      const review = await aiApi.generateSprintReview(sprintId);
      openAI({ sprintReview: review?.data?.summary || review?.summary });
    } catch {
      openAI({});
    }
  };
  const { data: space, isLoading: loadingSpace, error: spaceError } = useSpace(spaceId);
  const { data: sprint, isLoading: loadingSprint } = useActiveSprint(spaceId);
  const mutations = useStudyMutations();
  const [pendingSprintId, setPendingSprintId] = useState(null);
  const [headerPlannerOpen, setHeaderPlannerOpen] = useState(false);
  const [modals, dispatchModal] = useReducer(
    (state, action) => {
      switch (action) {
        case "OPEN_CREATE_TASK":   return { ...state, createTask: true };
        case "OPEN_CREATE_SPRINT": return { ...state, createSprint: true };
        case "OPEN_COMPLETE":      return { ...state, complete: true };
        case "CLOSE_TASK":         return { ...state, createTask: false };
        case "CLOSE_SPRINT":       return { ...state, createSprint: false };
        case "CLOSE_COMPLETE":     return { ...state, complete: false };
        default:                   return state;
      }
    },
    { createTask: false, createSprint: false, complete: false },
  );

  useEffect(() => {
    if (spaceId) setActiveSpace(spaceId);
  }, [spaceId, setActiveSpace]);

  if (loadingSpace) return <WorkspaceLoading />;
  if (spaceError) return <WorkspaceError message={spaceError.message} />;

  const actions = {
    createTask:           () => { setPendingSprintId(null); dispatchModal("OPEN_CREATE_TASK"); },
    createSprintTask:     (sprintId) => { setPendingSprintId(sprintId); dispatchModal("OPEN_CREATE_TASK"); },
    createSprint:         () => dispatchModal("OPEN_CREATE_SPRINT"),
    completeSprint:       () => dispatchModal("OPEN_COMPLETE"),
  };

  const spaceName = space?.name || space?.space_name || space?.title || `Space ${spaceId}`;
  const spaceKey = space?.key || space?.slug || spaceName.slice(0, 3).toUpperCase();
  const spaceColor = space?.color_hex || space?.color || "var(--primary)";

  return (
    // Scope a subtle compaction to this page only so its density matches the
    // sidebar. `zoom` is layout-affecting in Chromium, so percentage widths
    // still fill the column correctly — no width override needed.
    <div className="space-y-0" style={{ zoom: 0.9 }}>
      <div className="-mx-4 -mt-6 border-b bg-background px-4 pb-4 pt-4 lg:-mx-8 lg:px-8">
        <div className="flex h-9 items-center gap-2 text-xs text-muted-foreground">
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
          <div className="grid h-10 w-10 place-items-center rounded-lg text-sm font-bold text-white" style={{ background: spaceColor }}>
            {spaceName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{spaceName}</h1>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{space?.description || "Sprint workspace for summary, board, and backlog."}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {sprint && (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <Zap className="h-3.5 w-3.5" /> Sprint Active
              </span>
            )}
            <Button
              variant="outline"
              className="border-[color:var(--ai)]/50 text-[color:var(--ai)] hover:bg-[color:var(--ai)]/5"
              onClick={() => openAI({ spaceId, sprintId: sprint?.id })}
            >
              <Sparkles className="mr-1.5 h-4 w-4" /> Azzam
            </Button>
            <Button
              variant="outline"
              className="border-[color:var(--ai)]/50 text-[color:var(--ai)] hover:bg-[color:var(--ai)]/5"
              onClick={() => setHeaderPlannerOpen(true)}
            >
              <Bot className="mr-1.5 h-4 w-4" /> Azzam · Sprint Planner
            </Button>
          </div>
        </div>

        <div className="grid w-full grid-cols-3 rounded-lg bg-muted p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => navigate({ to: `/spaces/${spaceId}/${id}` })}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors",
                tab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="py-5">
        {tab === "summary" && <WorkspaceSummary sprint={sprint} loadingSprint={loadingSprint} spaceId={spaceId} />}
        {tab === "board" && <WorkspaceBoard sprint={sprint} loadingSprint={loadingSprint} spaceId={spaceId} actions={actions} />}
        {tab === "backlog" && <WorkspaceBacklog spaceId={spaceId} activeSprintId={sprint?.id} actions={actions} onSprintComplete={triggerSprintReview} />}
        {tab === "sprints" && <WorkspaceBacklog spaceId={spaceId} activeSprintId={sprint?.id} actions={actions} onSprintComplete={triggerSprintReview} />}
        {tab === "members" && <WorkspaceMembersPlaceholder />}
      </div>

      <TaskEntryModal
        open={modals.createTask}
        onOpenChange={(o) => { if (!o) { dispatchModal("CLOSE_TASK"); setPendingSprintId(null); } }}
        spaceId={spaceId}
        sprintId={pendingSprintId}
      />
      <CreateSprintModal open={modals.createSprint} onOpenChange={(o) => !o && dispatchModal("CLOSE_SPRINT")} spaceId={spaceId} />
      <AISprintPlannerModal open={headerPlannerOpen} onOpenChange={setHeaderPlannerOpen} spaceId={spaceId} />
      <AlertDialog open={modals.complete} onOpenChange={(o) => !o && dispatchModal("CLOSE_COMPLETE")}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete this sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              {sprint?.name || "The active sprint"} will be closed. Incomplete tasks move back to the backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (!sprint?.id) return;
                mutations.closeSprint.mutate(
                  { sprintId: sprint.id, body: { move_incomplete_to: "backlog" }, spaceId },
                  { onSuccess: () => { dispatchModal("CLOSE_COMPLETE"); triggerSprintReview(sprint.id); } },
                );
              }}
            >
              Complete sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkspaceSummary({ sprint, loadingSprint, spaceId }) {
  const { data: capacity } = useCapacity();
  const [reviewOpen, setReviewOpen] = useState(false);
  const tasks = getTasks(sprint);
  const done = tasks.filter((task) => task.status === "Done").length;
  const counts = countByStatus(tasks);
  const points = sprintPoints(tasks);
  const velocity = sprintVelocity(sprint, tasks);
  const deadlineTasks = openDeadlineTasks(tasks);

  if (loadingSprint) return <WorkspaceLoading label="Loading active sprint..." />;
  if (!sprint) return <EmptySprint spaceId={spaceId} />;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start justify-between gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-bold uppercase tracking-wide">Active</span>
                <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{dateLabel(sprint.end_date || sprint.endDate, "No end date")}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight">{sprint.name || "Active Sprint"}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dateRange(sprint)}</p>
              {sprint.goal && <p className="mt-3 max-w-2xl text-sm text-muted-foreground">{sprint.goal}</p>}
            </div>
            <ProgressRing value={velocity} />
          </div>
        </div>

        <div className="grid grid-cols-3 rounded-xl border bg-card p-5 text-center">
          <Metric icon={CheckCircle2} label="Tasks Done" value={`${done}/${tasks.length}`} />
          <Metric icon={Zap} label="Points" value={`${points.done}/${points.total || capacity?.capacity_points || 0}`} />
          <Metric icon={TrendingUp} label="Velocity" value={`${velocity.toFixed(1)}%`} />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <StatusDistribution counts={counts} total={tasks.length} />
          <PriorityBreakdown tasks={tasks} />
          <SprintTaskPreview tasks={tasks} />
        </div>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="h-14 w-full border-[color:var(--ai)]/40 text-[color:var(--ai)]"
            onClick={() => setReviewOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" /> AI Review
          </Button>
          <DeadlineAwareness tasks={deadlineTasks} />
        </div>
      </section>

      <AISprintReviewModal open={reviewOpen} onOpenChange={setReviewOpen} sprintId={sprint.id} />
    </div>
  );
}

function WorkspaceBoard({ sprint, loadingSprint, spaceId, actions }) {
  const [dragged, setDragged] = useState(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState({});
  const [addFromDomainOpen, setAddFromDomainOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const mutations = useStudyMutations();
  const tasks = getTasks(sprint);

  // Clear optimistic entries when server data catches up
  useEffect(() => {
    if (Object.keys(optimisticStatuses).length === 0) return;
    setOptimisticStatuses((prev) => {
      const next = { ...prev };
      let changed = false;
      tasks.forEach((task) => {
        const serverStatus = task.status;
        if (task.id in next && next[task.id] === serverStatus) {
          delete next[task.id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [tasks]);

  const resolvedStatus = (task) =>
    task.id in optimisticStatuses
      ? optimisticStatuses[task.id]
      : task.status;

  const tasksWithResolved = tasks.map((t) => ({ ...t, _resolvedStatus: resolvedStatus(t) }));
  const inProgress = tasksWithResolved.filter((t) => t._resolvedStatus === "In Progress").length;

  const setTaskStatus = (taskId, newStatus, prevStatus) => {
    if (!sprint?.id) return;
    setOptimisticStatuses((prev) => ({ ...prev, [taskId]: newStatus }));
    mutations.updateSprintTaskStatus.mutate(
      { sprintId: sprint.id, taskId, status: newStatus, spaceId },
      { onError: () => setOptimisticStatuses((prev) => ({ ...prev, [taskId]: prevStatus })) }
    );
  };

  const moveTask = (status) => {
    if (!dragged) return;
    const prev = resolvedStatus(dragged);
    setTaskStatus(dragged.id, status, prev);
    setDragged(null);
  };

  const stepTask = (task, dir) => {
    const current = resolvedStatus(task);
    const index = statusColumns.findIndex((col) => col.key === current);
    const next = statusColumns[index + dir];
    if (next) setTaskStatus(task.id, next.key, current);
  };

  if (loadingSprint) return <WorkspaceLoading label="Loading board..." />;
  if (!sprint) return <EmptySprint spaceId={spaceId} />;

  return (
    <div className="space-y-4">
      {inProgress >= 3 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="inline-flex min-w-0 items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="truncate">{inProgress} tasks in progress. Consider narrowing your focus to complete one item before starting another.</span>
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
        <div className="font-semibold">{sprint.name || "Active Sprint"}</div>
        <div className="text-sm text-muted-foreground">{dateRange(sprint)}</div>
        <Button variant="outline" className="ml-auto border-emerald-200 text-emerald-700" onClick={actions?.completeSprint}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Complete
        </Button>
        <Button variant="outline" onClick={() => setCreateTaskOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add task
        </Button>
      </div>

      <TaskEntryModal
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        spaceId={spaceId}
        sprintId={sprint?.id}
      />

      <AddFromDomainModal
        open={addFromDomainOpen}
        onOpenChange={setAddFromDomainOpen}
        spaceId={spaceId}
        sprintId={sprint?.id}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {statusColumns.map((col) => {
          const colTasks = tasksWithResolved.filter((task) => task._resolvedStatus === col.key);
          return (
            <section
              key={col.key}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => moveTask(col.key)}
              className="min-h-[560px] rounded-xl border bg-card"
            >
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <span className="h-3 w-3 rounded-full" style={{ background: col.color }} />
                <h3 className="text-sm font-bold tracking-wide text-muted-foreground">{col.label}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{colTasks.length}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="ml-auto h-7 w-7"><MoreVertical className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={actions?.createTask}>
                      <Plus className="mr-2 h-4 w-4" /> Add task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="space-y-3 p-3">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    draggable
                    onDragStart={() => setDragged(task)}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">Drop tasks here</div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function WorkspaceBacklog({ spaceId, activeSprintId, actions, onSprintComplete }) {
  const { data: backlogPayload = [], isLoading: loadingBacklog, error: backlogError } = useBacklog(spaceId);
  const { data: sprintsPayload = [], isLoading: loadingSprints, error: sprintsError } = useSprints(spaceId);
  const m = useStudyMutations();
  const backlog = asArray(backlogPayload);
  const sprints = asArray(sprintsPayload);
  const activeOrPlanned = sprints.filter((sprint) => !isSprintCompleted(sprint));
  const completed = sprints.filter(isSprintCompleted);

  const [dragged, setDragged] = useState(null);
  const [editSprint, setEditSprint] = useState(null);
  const [startEarly, setStartEarly] = useState(null);
  const [forceStart, setForceStart] = useState(null);
  const [completeFor, setCompleteFor] = useState(null);
  const [deleteFor, setDeleteFor] = useState(null);
  const [addFromDomainOpen, setAddFromDomainOpen] = useState(false);
  const [createTaskOpen2, setCreateTaskOpen2] = useState(false);

  if (loadingBacklog || loadingSprints) return <WorkspaceLoading label="Loading backlog and sprints..." />;
  if (backlogError) return <WorkspaceError message={backlogError.message} />;
  if (sprintsError) return <WorkspaceError message={sprintsError.message} />;

  const moveToSprint = (task, fromSprintId, toSprintId) => {
    if (String(fromSprintId ?? "") === String(toSprintId)) return;
    m.moveTaskToSprint.mutate(
      { fromSprintId: fromSprintId ?? null, toSprintId, taskId: task.id, spaceId },
      { onSuccess: () => toast.success(`"${task.title}" moved to sprint`) },
    );
  };
  const moveToBacklog = (task, fromSprintId) => {
    if (!fromSprintId) return;
    m.moveTaskToBacklog.mutate(
      { fromSprintId, taskId: task.id, spaceId },
      { onSuccess: () => toast.success(`"${task.title}" moved to backlog`) },
    );
  };
  const deleteTask = (task) =>
    m.deleteTask.mutate({ id: task.id, spaceId }, { onSuccess: () => toast.success("Task deleted") });

  const changeStatus = (task, fromSprintId, newStatus) => {
    if (fromSprintId) {
      m.updateSprintTaskStatus.mutate({ sprintId: fromSprintId, taskId: task.id, status: newStatus, spaceId });
    } else {
      m.updateTaskStatus.mutate({ id: task.id, status: newStatus, spaceId });
    }
  };

  const dropToSprint = (toSprintId) => {
    if (dragged) moveToSprint(dragged.task, dragged.fromSprintId, toSprintId);
    setDragged(null);
  };
  const dropToBacklog = () => {
    if (dragged) moveToBacklog(dragged.task, dragged.fromSprintId);
    setDragged(null);
  };

  const doStart = (sprint, updateDate) => {
    setStartEarly(null);
    const run = () =>
      m.startSprint.mutate({ sprintId: sprint.id, spaceId }, { onSuccess: () => toast.success("Sprint started") });
    if (updateDate) {
      m.updateSprint.mutate(
        { sprintId: sprint.id, body: { start_date: todayISO() }, spaceId },
        { onSuccess: run },
      );
    } else {
      run();
    }
  };
  const startSprint = (sprint) => {
    const alreadyActive = activeOrPlanned.find(
      (s) => (s.status === "active" || s.is_active) && String(s.id) !== String(sprint.id),
    );
    if (alreadyActive) {
      setForceStart({ newSprint: sprint, existingSprint: alreadyActive });
      return;
    }
    const start = parseDate(sprint.start_date || sprint.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start && start.setHours(0, 0, 0, 0) > today.getTime()) setStartEarly(sprint);
    else doStart(sprint, false);
  };

  const move = { toSprint: moveToSprint, toBacklog: moveToBacklog, deleteTask, changeStatus };
  const sprintActions = {
    start: startSprint,
    complete: (sprint) => setCompleteFor(sprint),
    edit: (sprint) => setEditSprint(sprint),
    remove: (sprint) => setDeleteFor(sprint),
  };

  const completeTasks = completeFor ? getTasks(completeFor) : [];
  const completeDone = completeTasks.filter(
    (t) => t.status === "Done",
  ).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" className="ml-auto" onClick={actions?.createSprint}>
          <Zap className="mr-1.5 h-4 w-4" /> Create sprint
        </Button>
        <Button onClick={() => setCreateTaskOpen2(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Add task
        </Button>
      </div>

      <BacklogSection
        tasks={backlog}
        onCreateTask={actions?.createTask}
        sprints={activeOrPlanned}
        activeSprintId={activeSprintId}
        move={move}
        onDragStart={setDragged}
        onDropHere={dropToBacklog}
      />

      {activeOrPlanned.map((sprint) => (
        <SprintBacklogSection
          key={sprint.id}
          sprint={sprint}
          active={String(sprint.id) === String(activeSprintId) || sprint.status === "active"}
          onCreateTask={() => actions?.createSprintTask(sprint.id)}
          sprints={activeOrPlanned}
          activeSprintId={activeSprintId}
          move={move}
          onDragStart={setDragged}
          onDropHere={() => dropToSprint(sprint.id)}
          sprintActions={sprintActions}
        />
      ))}

      {completed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3 pt-2 text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Completed
            <div className="h-px flex-1 bg-border" />
          </div>
          {completed.map((sprint) => (
            <SprintBacklogSection
              key={sprint.id}
              sprint={sprint}
              completed
              sprints={activeOrPlanned}
              activeSprintId={activeSprintId}
              move={move}
              onDragStart={setDragged}
              onDropHere={() => dropToSprint(sprint.id)}
              sprintActions={sprintActions}
            />
          ))}
        </section>
      )}

      <CreateSprintModal
        open={Boolean(editSprint)}
        onOpenChange={(o) => !o && setEditSprint(null)}
        spaceId={spaceId}
        sprint={editSprint}
      />

      <AddFromDomainModal open={addFromDomainOpen} onOpenChange={setAddFromDomainOpen} spaceId={spaceId} />
      <TaskEntryModal open={createTaskOpen2} onOpenChange={setCreateTaskOpen2} spaceId={spaceId} />

      <AlertDialog open={Boolean(forceStart)} onOpenChange={(o) => !o && setForceStart(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Another sprint is already active</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{forceStart?.existingSprint?.name || "A sprint"}</strong> is currently active. Starting{" "}
              <strong>{forceStart?.newSprint?.name || "this sprint"}</strong> will close the active sprint and update its end date to today. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const { newSprint, existingSprint } = forceStart;
                setForceStart(null);
                m.closeSprint.mutate(
                  { sprintId: existingSprint.id, body: { move_incomplete_to: "backlog" }, spaceId },
                  {
                    onSuccess: () => doStart(newSprint, false),
                  },
                );
              }}
            >
              Yes, force start
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(startEarly)} onOpenChange={(o) => !o && setStartEarly(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start sprint early?</AlertDialogTitle>
            <AlertDialogDescription>
              {startEarly?.name || "This sprint"} is scheduled to start on{" "}
              {dateLabel(startEarly?.start_date || startEarly?.startDate)}. Update the start date to today?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={() => doStart(startEarly, false)}>Start anyway</Button>
            <Button onClick={() => doStart(startEarly, true)}>Yes, update date</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(completeFor)} onOpenChange={(o) => !o && setCompleteFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              {completeDone} of {completeTasks.length} tasks done.{" "}
              {completeTasks.length - completeDone > 0
                ? `${completeTasks.length - completeDone} unfinished task(s) move back to the backlog.`
                : "All tasks completed."}{" "}
              If the sprint ends early, its end date is set to today.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const sprint = completeFor;
                m.closeSprint.mutate(
                  { sprintId: sprint.id, body: { move_incomplete_to: "backlog" }, spaceId },
                  { onSuccess: () => { toast.success("Sprint completed"); setCompleteFor(null); onSprintComplete?.(sprint.id); } },
                );
              }}
            >
              Complete sprint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(deleteFor)} onOpenChange={(o) => !o && setDeleteFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete sprint?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteFor?.name || "This sprint"} will be removed. Its tasks return to the backlog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                const sprint = deleteFor;
                m.deleteSprint.mutate(
                  { sprintId: sprint.id, spaceId },
                  { onSuccess: () => { toast.success("Sprint deleted"); setDeleteFor(null); } },
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BacklogSection({ tasks, onCreateTask, sprints, activeSprintId, move, onDragStart, onDropHere }) {
  const counts = countByStatus(tasks);
  const [over, setOver] = useState(false);
  return (
    <section
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDropHere(); }}
      className={cn("rounded-xl border bg-card transition-shadow", over && "ring-2 ring-primary")}
    >
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Backlog</h2>
        <div className="ml-auto flex items-center gap-2">
          {counts.map((item) => (
            <span key={item.key} className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ background: item.color }}>
              {item.count}
            </span>
          ))}
          <Button size="icon" variant="outline" onClick={onCreateTask}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {tasks.length > 0 ? (
        <div className="divide-y border-t">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              fromSprintId={null}
              sprints={sprints}
              activeSprintId={activeSprintId}
              move={move}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-muted-foreground">
          Backlog is empty. Drag a task here or create one.
        </div>
      )}
    </section>
  );
}

function SprintBacklogSection({ sprint, active, completed, onCreateTask, sprints, activeSprintId, move, onDragStart, onDropHere, sprintActions }) {
  const [expanded, setExpanded] = useState(active || !completed);
  const [over, setOver] = useState(false);
  const tasks = getTasks(sprint);
  const done = tasks.filter((task) => task.status === "Done").length;
  const counts = countByStatus(tasks);
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <section
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={() => { setOver(false); onDropHere?.(); }}
      className={cn("rounded-xl border bg-card transition-shadow", over && "ring-2 ring-primary")}
    >
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button onClick={() => setExpanded((value) => !value)} className="rounded-md p-1 hover:bg-muted">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{sprint.name || `Sprint ${sprint.id}`}</h3>
            {active && <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>}
            {completed && <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">Completed</span>}
          </div>
          <p className="text-xs text-muted-foreground">{dateRange(sprint)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="rounded-md bg-muted px-2.5 py-1 text-sm font-semibold">{done}/{tasks.length}</span>
          {counts.map((item) => (
            <span key={item.key} className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ background: item.color }}>
              {item.count}
            </span>
          ))}
          {!completed && (
            <Button size="icon" variant="outline" onClick={onCreateTask}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!active && !completed && (
                <DropdownMenuItem onClick={() => sprintActions?.start(sprint)}>
                  <Play className="mr-2 h-4 w-4" /> Start sprint
                </DropdownMenuItem>
              )}
              {active && (
                <DropdownMenuItem onClick={() => sprintActions?.complete(sprint)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Complete sprint
                </DropdownMenuItem>
              )}
              {!completed && (
                <DropdownMenuItem onClick={() => sprintActions?.edit(sprint)}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit sprint
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-destructive" onClick={() => sprintActions?.remove(sprint)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete sprint
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="px-5 pb-4">
        <div className="flex items-center gap-3 rounded-lg border bg-muted/20 px-4 py-3">
          <span className="text-sm text-muted-foreground">{tasks.length} work items</span>
          <span className="text-sm text-muted-foreground">{done} done</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-emerald-600" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-sm font-semibold text-emerald-700">{percent}%</span>
        </div>
      </div>
      {expanded && (
        <div className="divide-y border-t">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              fromSprintId={sprint.id}
              sprints={sprints}
              activeSprintId={activeSprintId}
              move={move}
              onDragStart={onDragStart}
            />
          ))}
          {tasks.length === 0 && <div className="p-5 text-sm text-muted-foreground">No tasks in this sprint yet. Drag tasks here.</div>}
        </div>
      )}
    </section>
  );
}

function TaskCard({ task, draggable, onDragStart }) {
  const atRisk = task.daysLeft !== null && task.daysLeft <= 5 && task.status !== "Done";
  const priorityColour = PRIORITY_COLOURS[task.priority] || PRIORITY_COLOURS.Medium;

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      className="cursor-grab rounded-lg border bg-background p-4 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
      style={{ borderLeft: `4px solid ${priorityColour}` }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            to="/tasks/$id"
            params={{ id: String(task.id) }}
            className={cn(
              "text-base font-semibold hover:text-primary",
              task.status === "Done" && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Chip>{task.domain}</Chip>
            {task.deadline && <Chip className="bg-emerald-50 text-emerald-700">{dateLabel(task.deadline)}</Chip>}
            {atRisk && <Chip className="bg-amber-50 text-amber-800"><AlertTriangle className="h-3 w-3" /> At Risk</Chip>}
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{task.code}</span>
            {task.points > 0 && <span className="ml-auto rounded bg-muted px-2 py-1 text-xs font-semibold">{task.points} pt</span>}
          </div>
        </div>
      </div>
    </article>
  );
}

function TaskRow({ task, fromSprintId = null, sprints = [], activeSprintId, move, onDragStart }) {
  const status = task.status;
  const inSprint = fromSprintId != null;
  const moveTargets = sprints.filter((s) => String(s.id) !== String(fromSprintId ?? ""));
  const priorityColour = PRIORITY_COLOURS[task.priority] || PRIORITY_COLOURS.Medium;

  return (
    <div
      draggable
      onDragStart={() => onDragStart?.({ task, fromSprintId: fromSprintId ?? null })}
      className="flex items-center gap-4 px-5 py-4 cursor-grab active:cursor-grabbing"
      style={{ borderLeft: `4px solid ${priorityColour}` }}
    >
      {status === "Done"
        ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
        : <Circle className="h-5 w-5 text-muted-foreground/50" />
      }
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/tasks/$id"
            params={{ id: String(task.id) }}
            className={cn("font-semibold hover:text-primary", status === "Done" && "text-muted-foreground line-through")}
          >
            {task.title}
          </Link>
          <Chip>{task.domain}</Chip>
          {task.deadline && <Chip className="bg-emerald-50 text-emerald-700">{dateLabel(task.deadline)}</Chip>}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {task.code} · {task.priority} · {task.points} pts · {task.hours}h · {task.deadlineLabel}
        </div>
      </div>

      <Select
        value={status}
        onValueChange={(v) => move?.changeStatus(task, fromSprintId, v)}
      >
        <SelectTrigger
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "h-7 w-32 rounded-full border-0 px-3 text-xs font-semibold shadow-none focus:ring-1 focus:ring-primary",
            status === "Done"        && "bg-emerald-100 text-emerald-700",
            status === "In Progress" && "bg-primary/10 text-primary",
            status === "To Do"       && "bg-muted text-muted-foreground",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="To Do">To Do</SelectItem>
          <SelectItem value="In Progress">In Progress</SelectItem>
          <SelectItem value="Done">Done</SelectItem>
        </SelectContent>
      </Select>


      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost"><MoreVertical className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/tasks/$id" params={{ id: String(task.id) }}>Open task</Link>
          </DropdownMenuItem>
          {moveTargets.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Move to sprint</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {moveTargets.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => move?.toSprint(task, fromSprintId ?? null, s.id)}>
                    {s.name || `Sprint ${s.id}`}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
          {inSprint && (
            <DropdownMenuItem onClick={() => move?.toBacklog(task, fromSprintId)}>Move to backlog</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={() => move?.deleteTask(task)}>
            Delete task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ProgressRing({ value }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div
      className="grid h-28 w-28 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(var(--primary) ${safe}%, var(--muted) 0)` }}
    >
      <div className="grid h-20 w-20 place-items-center rounded-full bg-card text-center">
        <div>
          <div className="text-xl font-bold">{safe.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">done</div>
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center justify-center border-r px-4 last:border-r-0">
      <Icon className="mb-2 h-5 w-5 text-muted-foreground" />
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function StatusDistribution({ counts, total }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Status Distribution</h3>
          <p className="text-sm text-muted-foreground">Active sprint tasks</p>
        </div>
        <span className="text-sm text-muted-foreground">{total} tasks</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted">
        {counts.map((item) => (
          <div key={item.key} style={{ width: `${total ? (item.count / total) * 100 : 0}%`, background: item.color }} />
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {counts.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
            {item.key} <strong className="text-foreground">{item.count}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function PriorityBreakdown({ tasks }) {
  const data = priorityData(tasks);
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Priority Breakdown</h3>
      <p className="text-sm text-muted-foreground">Active sprint tasks</p>
      <div className="mt-4 h-56">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis dataKey="priority" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {data.map((entry) => <Cell key={entry.priority} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function SprintTaskPreview({ tasks }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">Sprint Tasks</h3>
        <span className="text-sm text-muted-foreground">{tasks.length} total</span>
      </div>
      <div className="divide-y">
        {tasks.slice(0, 8).map((task) => (
          <div key={task.id} className="flex items-center gap-3 py-3">
            <span className="h-8 w-1 rounded-full bg-primary/60" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{task.title}</div>
              <div className="text-xs text-muted-foreground">{task.code} · {task.domain}</div>
            </div>
            <Chip>{task.priority || "Medium"}</Chip>
            <span className="text-xs text-muted-foreground">{dateLabel(task.deadline, "")}</span>
          </div>
        ))}
        {tasks.length === 0 && <div className="py-6 text-sm text-muted-foreground">No tasks in this sprint.</div>}
      </div>
    </section>
  );
}

function DeadlineAwareness({ tasks }) {
  const dueSoon = tasks.filter((task) => {
    const days = task.daysLeft;
    return days !== null && days <= 7;
  });
  return (
    <section className="rounded-xl border bg-card p-5">
      <h3 className="font-semibold">Deadline Awareness</h3>
      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-amber-700">
        <Calendar className="h-4 w-4" /> Due in 7 days <span className="rounded-full bg-amber-50 px-2 py-0.5">{dueSoon.length}</span>
      </div>
      <div className="mt-4 space-y-3">
        {dueSoon.slice(0, 6).map((task) => (
          <div key={task.id} className="flex items-center gap-3">
            <span className="h-9 w-1 rounded-full bg-amber-400" />
            <div className="min-w-0 flex-1 truncate text-sm">{task.title}</div>
            <span className="text-sm text-muted-foreground">{dateLabel(task.deadline)}</span>
          </div>
        ))}
        {dueSoon.length === 0 && <p className="text-sm text-muted-foreground">No urgent deadlines in the active sprint.</p>}
      </div>
    </section>
  );
}

function isSprintCompleted(sprint) {
  const status = String(sprint?.status || "").toLowerCase();
  return sprint?.is_completed || sprint?.completed || status === "completed" || status === "closed" || status === "done";
}

function Chip({ children, className }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground", className)}>
      {children}
    </span>
  );
}


function EmptySprint({ spaceId }) {
  return (
    <div className="rounded-xl border bg-card p-12 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
        <LayoutDashboard className="h-7 w-7 text-primary/60" />
      </div>
      <h2 className="mt-5 text-xl font-semibold">No active sprint</h2>
      <p className="mt-2 text-sm text-muted-foreground">Plan your work in the Backlog, then start a sprint for this space.</p>
      <Link to="/spaces/$spaceId/backlog" params={{ spaceId: String(spaceId) }}>
        <Button className="mt-5">Go to Backlog</Button>
      </Link>
    </div>
  );
}

function WorkspaceMembersPlaceholder() {
  return (
    <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">
      Members stay available from the space actions, but the main workspace follows Summary, Board, and Backlog.
    </div>
  );
}

function WorkspaceLoading({ label = "Loading workspace..." }) {
  return (
    <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

function WorkspaceError({ message }) {
  return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{message}</div>;
}
