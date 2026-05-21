import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { aiApi } from "@/lib/api";
import { qk, useStudyMutations } from "@/lib/query-hooks";

export default function AISprintReviewModal({ open, onOpenChange, sprintId }) {
  const { generateSprintReview } = useStudyMutations();
  const { data: review, isLoading, error, refetch } = useQuery({
    queryKey: qk.ai.sprintReview(sprintId),
    queryFn: () => aiApi.sprintReview(sprintId),
    enabled: Boolean(open && sprintId),
    retry: false,
  });

  const suggestions = review?.improvement_suggestions || review?.improvements || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--ai)]" /> AI Sprint Review
          </DialogTitle>
          <DialogDescription>Retrospective generated from this sprint's data.</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading review...
          </div>
        )}

        {!isLoading && (error || !review) && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">No review generated for this sprint yet.</p>
            <Button
              disabled={generateSprintReview.isPending}
              onClick={() => generateSprintReview.mutate({ sprintId }, { onSuccess: () => refetch() })}
            >
              {generateSprintReview.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Generate review
            </Button>
          </div>
        )}

        {!isLoading && review && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{review.summary}</p>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Completed" value={review.completed_count ?? 0} />
              <Metric label="Incomplete" value={review.incomplete_count ?? 0} />
            </div>
            {suggestions.length > 0 && (
              <div>
                <h4 className="mb-2 text-sm font-semibold">Improvement suggestions</h4>
                <ul className="space-y-1.5">
                  {suggestions.map((s, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="text-[color:var(--ai)]">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={generateSprintReview.isPending}
              onClick={() => generateSprintReview.mutate({ sprintId }, { onSuccess: () => refetch() })}
            >
              {generateSprintReview.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Regenerate
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
