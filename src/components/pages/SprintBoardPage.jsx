import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AlertCircle, Flame, GripVertical, Loader2 } from "lucide-react";
import { Header } from "./SpacesPage";
import { useSprint, useStudyMutations } from "@/lib/query-hooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const COLS = [
  { key: "To Do", aliases: ["todo", "to_do", "To Do", "pending", "open"] },
  { key: "In Progress", aliases: ["in_progress", "In Progress", "doing", "started"] },
  { key: "Done", aliases: ["done", "Done", "completed", "complete"] },
];

const statusKey = (status) =>
  COLS.find((c) => c.aliases.includes(status || "todo"))?.key || "To Do";
const taskStatus = (t) => statusKey(t.pivot_status || t.pivotStatus || t.status);

export default function SprintBoardPage({ sprintId }) {
  const { data: sprint, isLoading, error } = useSprint(sprintId);
  const { updateSprintTaskStatus, closeSprint } = useStudyMutations();
  const [drag, setDrag] = useState(null);

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading sprint...
      </div>
    );
  }
  if (error || !sprint) {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error?.message || "Sprint not found."}</div>;
  }

  const tasks = sprint.tasks || sprint.tasks_data || [];
  const spaceId = sprint.space_id || sprint.spaceId;

  const move = (status) => {
    if (!drag) return;
    updateSprintTaskStatus.mutate({ sprintId: sprint.id, taskId: drag, status, spaceId });
    setDrag(null);
  };

  return (
    <div className="space-y-6">
      <Link to="/spaces" className="text-xs text-muted-foreground hover:text-foreground">← Spaces</Link>
      <Header title={sprint.name || `Sprint ${sprint.id}`} subtitle={sprint.goal}>
        {!sprint.is_completed && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Close sprint</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close this sprint?</AlertDialogTitle>
                <AlertDialogDescription>Incomplete tasks move back to the backlog.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => closeSprint.mutate({ sprintId: sprint.id, body: { move_incomplete_to: "backlog" }, spaceId })}
                >
                  Close sprint
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </Header>

      <div className="grid md:grid-cols-3 gap-4">
        {COLS.map((col) => {
          const colTasks = tasks.filter((t) => taskStatus(t) === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => move(col.key)}
              className="rounded-xl bg-muted/40 p-3 min-h-[400px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-semibold text-sm">{col.key}</h3>
                <span className="text-xs text-muted-foreground">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map((t) => {
                  const overdue = t.deadline && new Date(t.deadline) < new Date() && col.key !== "Done";
                  return (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={() => setDrag(t.id)}
                      className="group rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 opacity-0 group-hover:opacity-100" />
                        <div className="flex-1 min-w-0">
                          <Link to="/tasks/$id" params={{ id: String(t.id) }} className="text-sm font-medium hover:text-primary">
                            {t.title || `Task ${t.id}`}
                          </Link>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            {t.task_type === "Emergency" && <Flame className="h-3 w-3 text-red-500" />}
                            <span>{t.points ?? 0} pts · {t.expected_hours ?? 0}h</span>
                          </div>
                          {overdue && (
                            <div className="mt-2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 text-[11px] flex items-start gap-1.5">
                              <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                              <span>Past deadline — consider splitting or rescheduling.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">Drop tasks here</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
