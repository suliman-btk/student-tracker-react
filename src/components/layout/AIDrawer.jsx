import { useState } from "react";
import { Check, Gauge, Loader2, Sparkles, X } from "lucide-react";
import { useUI } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAiSuggestions, useCapacity, useStandupToday, useStudyMutations } from "@/lib/query-hooks";
import { normalizeFeedback } from "@/lib/standup";
import StandupModal from "@/components/study/StandupModal";

const asArray = (p) => (Array.isArray(p) ? p : p?.data || []);

export default function AIDrawer() {
  const { aiOpen, closeAI } = useUI();
  const { data: standup } = useStandupToday();
  const { data: capacity } = useCapacity();
  const { data: suggestionsPayload } = useAiSuggestions();
  const { acceptSuggestion, ignoreSuggestion, generateSuggestions } = useStudyMutations();
  const suggestions = asArray(suggestionsPayload);
  const [standupOpen, setStandupOpen] = useState(false);

  const submitted = standup?.submitted;
  const feedback = normalizeFeedback(standup?.data?.ai_feedback);

  return (
    <>
      <div
        onClick={closeAI}
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity",
          aiOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-card border-l shadow-2xl flex flex-col transition-transform",
          aiOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="h-14 px-4 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[color:var(--ai-soft)] text-[color:var(--ai)] grid place-items-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">AI Scrum Coach</div>
            <div className="text-[11px] text-muted-foreground">Standup · capacity · suggestions</div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeAI}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {/* Daily standup */}
          <section className="rounded-xl border p-4">
            <h3 className="mb-2 text-sm font-semibold">Today's check-in</h3>
            {submitted && feedback ? (
              <div className="space-y-3">
                {feedback.coaching && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                    {feedback.coaching}
                  </p>
                )}
                {feedback.suggested_task?.title && (
                  <div className="rounded-lg border bg-background p-3">
                    <div className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-[color:var(--ai)]">
                      Suggested task
                    </div>
                    <div className="text-sm font-medium">{feedback.suggested_task.title}</div>
                    {feedback.suggested_task.reason && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {feedback.suggested_task.reason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : submitted ? (
              <p className="text-sm text-muted-foreground">Check-in done. No coaching feedback returned.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Not checked in yet today.</p>
                <Button size="sm" onClick={() => setStandupOpen(true)}>Check in</Button>
              </div>
            )}
          </section>

          {/* Capacity */}
          <section className="rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-[color:var(--ai)]" />
              <h3 className="text-sm font-semibold">Capacity</h3>
            </div>
            {capacity ? (
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. hours / week</span>
                  <strong>{capacity.estimated_hours_per_week ?? "—"}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg velocity (3 sprints)</span>
                  <strong>{capacity.avg_velocity_last_3_sprints ?? "—"}%</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pomodoro sessions</span>
                  <strong>{capacity.total_pomodoro_sessions ?? "—"}</strong>
                </div>
                {capacity.insight && <p className="pt-1 text-muted-foreground">{capacity.insight}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No capacity data yet.</p>
            )}
          </section>

          {/* Suggestions */}
          <section className="rounded-xl border p-4">
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold">Task suggestions</h3>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                disabled={generateSuggestions.isPending}
                onClick={() => generateSuggestions.mutate()}
              >
                {generateSuggestions.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Generate
              </Button>
            </div>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border bg-background p-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s.title || s.task?.title || `Suggestion ${s.id}`}</div>
                    {s.reason && <div className="truncate text-xs text-muted-foreground">{s.reason}</div>}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => acceptSuggestion.mutate(s.id)} aria-label="Accept">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => ignoreSuggestion.mutate(s.id)} aria-label="Ignore">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {suggestions.length === 0 && (
                <p className="text-sm text-muted-foreground">No suggestions. Generate some from your backlog.</p>
              )}
            </div>
          </section>
        </div>
      </aside>

      <StandupModal open={standupOpen} onOpenChange={setStandupOpen} />
    </>
  );
}
