import { useState } from "react";
import { ArrowLeft, CheckSquare, ChevronRight, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDomains, useDomainTasks, useStudyMutations } from "@/lib/query-hooks";

export default function AddFromDomainModal({ open, onOpenChange, spaceId, sprintId }) {
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const { addTasksToSpace, addTasksToSprint } = useStudyMutations();

  const { data: domains = [], isLoading: loadingDomains } = useDomains();
  const { data: domainTasks = [], isLoading: loadingTasks } = useDomainTasks(
    selectedDomain?.id ?? null,
  );

  const isPending = addTasksToSpace.isPending || addTasksToSprint.isPending;

  const close = () => {
    onOpenChange(false);
    setSelectedDomain(null);
    setSelectedIds(new Set());
  };

  const toggleTask = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isDone = (t) => {
    const s = String(t?.status || t?.pivot_status || "").toLowerCase();
    return s === "done" || s === "completed" || s === "complete";
  };

  const toggleAll = () => {
    const selectable = domainTasks.filter((t) => !isDone(t)).map((t) => t.id);
    if (selectedIds.size === selectable.length && selectable.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectable));
    }
  };

  const confirm = () => {
    if (!selectedIds.size) return;
    const taskIds = [...selectedIds];
    const opts = {
      onSuccess: () => {
        toast.success(`${taskIds.length} task${taskIds.length > 1 ? "s" : ""} added`);
        close();
      },
      onError: (err) => toast.error(err.message),
    };
    if (sprintId) {
      addTasksToSprint.mutate({ sprintId, taskIds, spaceId }, opts);
    } else {
      addTasksToSpace.mutate({ spaceId, taskIds }, opts);
    }
  };

  const domainName = (d) => d?.domain_name || d?.name || `Domain ${d?.id}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedDomain && (
              <button
                className="rounded p-1 hover:bg-muted"
                onClick={() => { setSelectedDomain(null); setSelectedIds(new Set()); }}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            {selectedDomain ? domainName(selectedDomain) : "Add tasks from domain"}
          </DialogTitle>
        </DialogHeader>

        {!selectedDomain ? (
          <div className="max-h-80 overflow-y-auto space-y-1 py-1">
            {loadingDomains && (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading domains…
              </div>
            )}
            {!loadingDomains && domains.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No domains found. Create a domain first.</p>
            )}
            {domains.map((d) => (
              <button
                key={d.id}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                onClick={() => setSelectedDomain(d)}
              >
                <span className="font-medium">{domainName(d)}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="max-h-80 overflow-y-auto space-y-1 py-1">
              {loadingTasks && (
                <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…
                </div>
              )}
              {!loadingTasks && domainTasks.length === 0 && (
                <p className="p-4 text-sm text-muted-foreground">No tasks in this domain.</p>
              )}
              {!loadingTasks && domainTasks.length > 0 && (() => {
                const selectable = domainTasks.filter((t) => !isDone(t));
                return (
                  <button
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
                    onClick={toggleAll}
                  >
                    {selectedIds.size === selectable.length && selectable.length > 0
                      ? <CheckSquare className="h-4 w-4" />
                      : <Square className="h-4 w-4" />}
                    Select all ({selectable.length})
                  </button>
                );
              })()}
              {domainTasks.map((t) => {
                const done = isDone(t);
                const checked = selectedIds.has(t.id);
                return (
                  <button
                    key={t.id}
                    disabled={done}
                    className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => !done && toggleTask(t.id)}
                  >
                    {checked
                      ? <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      : <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                    <div className="min-w-0 text-left">
                      <div className="font-medium truncate">{t.title || t.name}</div>
                      {(t.priority || t.status) && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {t.priority && <span>{t.priority}</span>}
                          {t.priority && t.status && <span> · </span>}
                          {t.status && <span>{t.status}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close}>Cancel</Button>
              <Button onClick={confirm} disabled={selectedIds.size === 0 || isPending}>
                {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                {sprintId ? "Add to sprint" : "Add to backlog"} {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
