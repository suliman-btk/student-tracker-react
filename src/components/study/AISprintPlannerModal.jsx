import { useEffect } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStudyMutations } from "@/lib/query-hooks";

function taskTitle(plan, id) {
  const d = plan?.task_details?.[id] || plan?.task_details?.[String(id)];
  return d?.title || d || `Task ${id}`;
}

export default function AISprintPlannerModal({ open, onOpenChange, spaceId }) {
  const { multiSprintPlan, applyMultiSprintPlan } = useStudyMutations();
  const plan = multiSprintPlan.data;

  // Generate the plan once when the modal opens.
  useEffect(() => {
    if (open) {
      multiSprintPlan.reset();
      multiSprintPlan.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sprints = plan?.sprints || [];

  const apply = () => {
    applyMultiSprintPlan.mutate(
      { space_id: spaceId, sprints },
      {
        onSuccess: (res) => {
          toast.success(`${res?.created ?? sprints.length} sprint(s) created`);
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--ai)]" /> AI Sprint Planner
          </DialogTitle>
          <DialogDescription>A proposed multi-sprint plan from your backlog.</DialogDescription>
        </DialogHeader>

        {multiSprintPlan.isPending && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Planning sprints...
          </div>
        )}

        {!multiSprintPlan.isPending && multiSprintPlan.isError && (
          <p className="py-4 text-sm text-destructive">{multiSprintPlan.error?.message || "Could not generate a plan."}</p>
        )}

        {!multiSprintPlan.isPending && plan && (
          <div className="space-y-4">
            {plan.advice && (
              <div className="rounded-lg border border-[color:var(--ai)]/30 bg-[color:var(--ai-soft)]/40 p-3 text-sm">
                {plan.advice}
              </div>
            )}
            {sprints.length === 0 && (
              <p className="text-sm text-muted-foreground">No sprints proposed — your backlog may be empty.</p>
            )}
            {sprints.map((s, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{s.goal || `Sprint ${i + 1}`}</h4>
                  <span className="text-xs text-muted-foreground">{s.start_date} → {s.end_date}</span>
                </div>
                {s.rationale && <p className="mt-1 text-xs text-muted-foreground">{s.rationale}</p>}
                <ul className="mt-2 space-y-1">
                  {(s.task_ids || []).map((id) => (
                    <li key={id} className="text-sm text-muted-foreground">• {taskTitle(plan, id)}</li>
                  ))}
                </ul>
              </div>
            ))}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={apply} disabled={sprints.length === 0 || applyMultiSprintPlan.isPending}>
                {applyMultiSprintPlan.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Apply plan
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
