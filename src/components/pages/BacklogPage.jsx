import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Header } from "./SpacesPage";
import { useBacklog, useSprints, useStudyMutations } from "@/lib/query-hooks";
import CreateTaskModal from "@/components/study/CreateTaskModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);
const isCompleted = (s) => s.is_completed || s.completed || String(s.status || "").toLowerCase() === "completed";

export default function BacklogPage() {
  const { data: backlogPayload = [], isLoading, error } = useBacklog();
  const { data: sprintsPayload = [] } = useSprints();
  const backlog = asArray(backlogPayload);
  const sprints = asArray(sprintsPayload).filter((s) => !isCompleted(s));
  const { addTasksToSprint } = useStudyMutations();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Header title="Backlog" subtitle="Tasks not yet assigned to a sprint.">
        <Button onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Add task</Button>
      </Header>

      <CreateTaskModal open={modalOpen} onOpenChange={setModalOpen} />

      {isLoading && (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading backlog from Laravel...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div>
      )}

      {!isLoading && !error && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Backlog ({backlog.length})</h3>
          <div className="space-y-2">
            {backlog.map((t) => (
              <div key={t.id} className="rounded-xl border bg-card p-3 flex items-center gap-3 hover:shadow-sm">
                <div className="h-2 w-2 rounded-full bg-primary" />
                <div className="flex-1 min-w-0">
                  <Link to="/tasks/$id" params={{ id: String(t.id) }} className="text-sm font-medium hover:text-primary">
                    {t.title || `Task ${t.id}`}
                  </Link>
                  <div className="text-xs text-muted-foreground">
                    {(t.priority || "Medium")} · {(t.expected_hours ?? 0)}h · {(t.points ?? 0)} pts · due {t.deadline || "—"}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" disabled={sprints.length === 0}>Move to sprint</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Add to sprint</DropdownMenuLabel>
                    {sprints.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onClick={() =>
                          addTasksToSprint.mutate(
                            {
                              sprintId: s.id,
                              taskIds: [t.id],
                              spaceId: s.space_id || s.spaceId,
                            },
                            {
                              onSuccess: () => toast.success(`"${t.title || "Task"}" moved to ${s.name || "sprint"}`),
                              onError: (err) => toast.error(err.message),
                            },
                          )
                        }
                      >
                        {s.name || `Sprint ${s.id}`}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            {backlog.length === 0 && (
              <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
                Backlog is empty. Add a task to get started.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
