import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useStudyMutations } from "@/lib/query-hooks";

const PRIORITY_STYLES = {
  Critical: "border-red-200 bg-red-50 text-red-700",
  High: "border-orange-200 bg-orange-50 text-orange-700",
  Medium: "border-blue-200 bg-blue-50 text-blue-700",
  Low: "border-slate-200 bg-slate-50 text-slate-600",
};

let keyCounter = 0;
const nextKey = () => `sprint_${Date.now()}_${keyCounter++}`;

const getDetail = (details, id) => details?.[id] || details?.[String(id)];

const toDateStr = (d) => d.toISOString().slice(0, 10);
const todayStr = () => toDateStr(new Date());
const addDays = (dateStr, n) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  d.setDate(d.getDate() + n);
  return toDateStr(d);
};

export default function AISprintPlannerModal({ open, onOpenChange, spaceId }) {
  const { multiSprintPlan, applyMultiSprintPlan } = useStudyMutations();
  const plan = multiSprintPlan.data;
  const details = plan?.task_details || {};

  const [sprints, setSprints] = useState([]);

  // Generate a fresh plan each time the modal opens.
  useEffect(() => {
    if (open) {
      multiSprintPlan.reset();
      setSprints([]);
      multiSprintPlan.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Seed the editable copy from the AI plan. Drop any task ids the AI invented
  // that don't map to a real task (this is what caused "task not found").
  useEffect(() => {
    if (!plan?.sprints) return;
    const d = plan.task_details || {};
    setSprints(
      plan.sprints.map((s) => ({
        key: nextKey(),
        goal: s.goal || "",
        start_date: s.start_date || "",
        end_date: s.end_date || "",
        rationale: s.rationale || "",
        task_ids: (s.task_ids || [])
          .map(Number)
          .filter((id) => getDetail(d, id)),
      })),
    );
  }, [plan]);

  const allIds = useMemo(() => Object.keys(details).map(Number), [details]);
  const assignedIds = useMemo(
    () => new Set(sprints.flatMap((s) => s.task_ids)),
    [sprints],
  );
  const unassignedIds = useMemo(
    () => allIds.filter((id) => !assignedIds.has(id)),
    [allIds, assignedIds],
  );

  // --- mutators ---
  const patchSprint = (key, fn) =>
    setSprints((prev) => prev.map((s) => (s.key === key ? fn(s) : s)));
  const setField = (key, field, val) =>
    patchSprint(key, (s) => ({ ...s, [field]: val }));
  const removeTask = (key, id) =>
    patchSprint(key, (s) => ({ ...s, task_ids: s.task_ids.filter((t) => t !== id) }));
  const addTask = (key, id) =>
    setSprints((prev) =>
      prev.map((s) =>
        s.key === key
          ? { ...s, task_ids: [...s.task_ids, id] }
          : { ...s, task_ids: s.task_ids.filter((t) => t !== id) },
      ),
    );
  const deleteSprint = (key) =>
    setSprints((prev) => prev.filter((s) => s.key !== key));
  const addSprint = () =>
    setSprints((prev) => {
      const last = prev[prev.length - 1];
      const start = last?.end_date ? addDays(last.end_date, 1) : todayStr();
      return [
        ...prev,
        {
          key: nextKey(),
          goal: "",
          start_date: start,
          end_date: addDays(start, 6),
          rationale: "",
          task_ids: [],
        },
      ];
    });

  const apply = () => {
    const payload = sprints
      .filter((s) => s.start_date && s.end_date)
      .map((s) => ({
        goal: s.goal?.trim() || null,
        start_date: s.start_date,
        end_date: s.end_date,
        task_ids: s.task_ids,
      }));

    if (payload.length === 0) {
      toast.error("Add at least one sprint with start and end dates.");
      return;
    }

    applyMultiSprintPlan.mutate(
      { space_id: spaceId, sprints: payload },
      {
        onSuccess: (res) => {
          toast.success(`${res?.created ?? payload.length} sprint(s) created`);
          onOpenChange(false);
        },
      },
    );
  };

  const overdue = plan?.overdue_tasks || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--ai)]" /> AI Sprint Planner
          </DialogTitle>
          <DialogDescription>
            Review and edit the proposed plan, then apply it. Everything below is editable.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {multiSprintPlan.isPending && (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Planning sprints...
            </div>
          )}

          {!multiSprintPlan.isPending && multiSprintPlan.isError && (
            <p className="py-4 text-sm text-destructive">
              {multiSprintPlan.error?.message || "Could not generate a plan."}
            </p>
          )}

          {!multiSprintPlan.isPending && plan && (
            <>
              {plan.advice && (
                <div className="rounded-lg border border-[color:var(--ai)]/30 bg-[color:var(--ai-soft)]/40 p-3 text-sm leading-relaxed">
                  {plan.advice}
                </div>
              )}

              {overdue.length > 0 && (
                <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <strong>{overdue.length} overdue task(s)</strong> were excluded from this plan.
                    Update their deadlines, then re-plan to include them.
                  </div>
                </div>
              )}

              {unassignedIds.length > 0 && (
                <div className="rounded-lg border border-dashed bg-muted/40 p-3 text-xs text-muted-foreground">
                  {unassignedIds.length} task(s) not assigned to any sprint yet — add them from any
                  sprint's “Add a task” menu below.
                </div>
              )}

              {sprints.map((s, i) => (
                <SprintCard
                  key={s.key}
                  index={i}
                  sprint={s}
                  details={details}
                  unassignedIds={unassignedIds}
                  onField={setField}
                  onAddTask={addTask}
                  onRemoveTask={removeTask}
                  onDelete={() => deleteSprint(s.key)}
                  canDelete={sprints.length > 1}
                />
              ))}

              <Button variant="outline" size="sm" className="w-full" onClick={addSprint}>
                <Plus className="mr-1.5 h-4 w-4" /> Add sprint
              </Button>
            </>
          )}
        </div>

        {!multiSprintPlan.isPending && plan && (
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={apply} disabled={applyMultiSprintPlan.isPending}>
              {applyMultiSprintPlan.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Apply plan
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SprintCard({
  index,
  sprint,
  details,
  unassignedIds,
  onField,
  onAddTask,
  onRemoveTask,
  onDelete,
  canDelete,
}) {
  const hours = sprint.task_ids.reduce(
    (sum, id) => sum + (getDetail(details, id)?.expected_hours || 0),
    0,
  );

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[color:var(--ai-soft)] text-xs font-semibold text-[color:var(--ai)]">
              {index + 1}
            </span>
            <Input
              value={sprint.goal}
              onChange={(e) => onField(sprint.key, "goal", e.target.value)}
              placeholder="Sprint goal"
              className="h-8 font-medium"
            />
          </div>
          <div className="flex items-center gap-2 pl-8">
            <Input
              type="date"
              value={sprint.start_date}
              onChange={(e) => onField(sprint.key, "start_date", e.target.value)}
              className="h-8 w-[150px] text-xs"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <Input
              type="date"
              value={sprint.end_date}
              onChange={(e) => onField(sprint.key, "end_date", e.target.value)}
              className="h-8 w-[150px] text-xs"
            />
          </div>
        </div>
        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            aria-label="Delete sprint"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {sprint.rationale && (
        <p className="mt-2 pl-8 text-xs text-muted-foreground">{sprint.rationale}</p>
      )}

      <div className="mt-3 space-y-1.5 pl-8">
        {sprint.task_ids.length === 0 && (
          <p className="text-xs italic text-muted-foreground">No tasks — a rest sprint.</p>
        )}
        {sprint.task_ids.map((id) => {
          const d = getDetail(details, id) || {};
          return (
            <div
              key={id}
              className="group flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5"
            >
              <Badge
                variant="outline"
                className={cn("shrink-0 text-[10px]", PRIORITY_STYLES[d.priority])}
              >
                {d.priority || "—"}
              </Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{d.title || `Task ${id}`}</div>
                {d.domain && (
                  <div className="truncate text-[11px] text-muted-foreground">{d.domain}</div>
                )}
              </div>
              {d.expected_hours ? (
                <span className="shrink-0 text-xs text-muted-foreground">~{d.expected_hours}h</span>
              ) : null}
              <button
                onClick={() => onRemoveTask(sprint.key, id)}
                className="shrink-0 text-muted-foreground opacity-60 transition hover:text-destructive group-hover:opacity-100"
                aria-label="Remove task"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-1">
          {unassignedIds.length > 0 ? (
            <Select value="" onValueChange={(v) => onAddTask(sprint.key, Number(v))}>
              <SelectTrigger className="h-7 w-[180px] text-xs">
                <SelectValue placeholder="+ Add a task" />
              </SelectTrigger>
              <SelectContent>
                {unassignedIds.map((id) => {
                  const d = getDetail(details, id) || {};
                  return (
                    <SelectItem key={id} value={String(id)} className="text-xs">
                      {d.title || `Task ${id}`}
                      {d.domain ? ` · ${d.domain}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          ) : (
            <span />
          )}
          {hours > 0 && (
            <span className="text-xs text-muted-foreground">{Math.round(hours * 10) / 10}h planned</span>
          )}
        </div>
      </div>
    </div>
  );
}
