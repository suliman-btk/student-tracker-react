import { useEffect, useState } from "react";
import {
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Bot,
  CheckCircle2,
  Flame,
  Loader2,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStudyMutations } from "@/lib/query-hooks";
import { normalizeFeedback } from "@/lib/standup";
import { cn } from "@/lib/utils";

const ENERGY = [
  { icon: BatteryLow, label: "Low", value: 1, description: "Slow start" },
  { icon: BatteryMedium, label: "Medium", value: 2, description: "Steady pace" },
  { icon: BatteryFull, label: "High", value: 3, description: "Ready to push" },
];
const DISTRACT = [
  { icon: Target, label: "None", value: 1, description: "Clear focus" },
  { icon: Smartphone, label: "Some", value: 2, description: "Manageable" },
  { icon: Flame, label: "Many", value: 3, description: "Needs guardrails" },
];
const QUESTIONS = [
  {
    key: "productivity",
    text: "Yesterday's output",
    helper: "How much useful work got done?",
    options: ENERGY,
  },
  {
    key: "energy",
    text: "Energy today",
    helper: "Pick the pace you can actually sustain.",
    options: ENERGY,
  },
  {
    key: "distractions",
    text: "Distraction risk",
    helper: "Be honest so Azzam can plan around it.",
    options: DISTRACT,
  },
];

export default function StandupModal({ open, onOpenChange }) {
  const { submitStandup } = useStudyMutations();
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (open) {
      setAnswers({});
      setFeedback(null);
    }
  }, [open]);

  const complete = QUESTIONS.every((q) => answers[q.key]);

  const submit = () => {
    submitStandup.mutate(answers, {
      onSuccess: (data) =>
        setFeedback(normalizeFeedback(data?.ai_feedback) || { coaching: "Check-in saved." }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-[560px] overflow-y-auto p-0 sm:rounded-lg">
        <div className="border-b bg-white px-5 py-4">
          <DialogHeader className="pr-7">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-ai-soft text-ai">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <DialogTitle className="text-lg">Daily Check-in</DialogTitle>
                <DialogDescription className="mt-0.5">Tap one option per row.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="px-5 py-4">
          {feedback ? (
            <div className="space-y-4">
              <div className="rounded-md border bg-white shadow-sm">
                <div className="flex items-start gap-3 border-b bg-ai-soft/50 px-3 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-ai shadow-sm">
                    <Bot className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Azzam's coaching</p>
                    <p className="text-xs text-muted-foreground">Based on today's check-in.</p>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  {feedback.coaching && (
                    <p className="whitespace-pre-line text-sm leading-6 text-foreground">
                      {feedback.coaching}
                    </p>
                  )}
                  {feedback.suggested_task?.title && (
                    <div className="rounded-md border bg-background p-3">
                      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ai">
                        <CheckCircle2 className="h-4 w-4" />
                        Suggested task
                      </div>
                      <div className="text-sm font-semibold">{feedback.suggested_task.title}</div>
                      {feedback.suggested_task.reason && (
                        <p className="mt-2 text-xs leading-6 text-muted-foreground">
                          {feedback.suggested_task.reason}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button className="h-10 rounded-md px-5" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {QUESTIONS.map((q) => (
                <div key={q.key} className="space-y-2">
                  <div>
                    <p className="text-sm font-semibold leading-5 text-foreground">{q.text}</p>
                    <p className="text-xs text-muted-foreground">{q.helper}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {q.options.map((opt) => {
                      const Icon = opt.icon;
                      const selected = answers[q.key] === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt.value }))}
                          className={cn(
                            "group flex min-h-[82px] flex-col items-center justify-center rounded-md border bg-white p-2 text-center shadow-sm transition-colors hover:border-primary/50 hover:bg-secondary/60",
                            selected &&
                              "border-primary bg-primary text-primary-foreground hover:bg-primary",
                          )}
                        >
                          <span
                            className={cn(
                              "grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-background text-primary transition-colors",
                              selected && "border-white/20 bg-white/15 text-primary-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="mt-1">
                            <span className="block text-sm font-semibold leading-5">
                              {opt.label}
                            </span>
                            <span
                              className={cn(
                                "block text-[11px] leading-4 text-muted-foreground",
                                selected && "text-primary-foreground/75",
                              )}
                            >
                              {opt.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <DialogFooter className="gap-2 pt-1">
                <Button
                  variant="outline"
                  className="h-10 rounded-md px-5"
                  onClick={() => onOpenChange(false)}
                >
                  Later
                </Button>
                <Button
                  className="h-10 rounded-md px-5"
                  onClick={submit}
                  disabled={!complete || submitStandup.isPending}
                >
                  {submitStandup.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Submit Check-in
                </Button>
              </DialogFooter>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
