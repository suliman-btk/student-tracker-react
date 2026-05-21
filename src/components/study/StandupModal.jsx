import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useStudyMutations } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

const ENERGY = [
  { emoji: "😴", label: "Low", value: 1 },
  { emoji: "😐", label: "Medium", value: 2 },
  { emoji: "⚡", label: "High", value: 3 },
];
const DISTRACT = [
  { emoji: "🎯", label: "None", value: 1 },
  { emoji: "📱", label: "Some", value: 2 },
  { emoji: "🔥", label: "Many", value: 3 },
];
const QUESTIONS = [
  { key: "productivity", text: "How productive were you yesterday?", options: ENERGY },
  { key: "energy", text: "How is your energy level today?", options: ENERGY },
  { key: "distractions", text: "Expecting distractions today?", options: DISTRACT },
];

export default function StandupModal({ open, onOpenChange }) {
  const { submitStandup } = useStudyMutations();
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (open) { setAnswers({}); setFeedback(null); }
  }, [open]);

  const complete = QUESTIONS.every((q) => answers[q.key]);

  const submit = () => {
    submitStandup.mutate(answers, {
      onSuccess: (data) => setFeedback(data?.ai_feedback || "Check-in saved."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--ai)]" /> Daily Check-in
          </DialogTitle>
          <DialogDescription>Quick 3-tap check-in. Tap to select.</DialogDescription>
        </DialogHeader>

        {feedback ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-[color:var(--ai)]/30 bg-[color:var(--ai-soft)]/40 p-4 text-sm leading-relaxed whitespace-pre-line">
              {feedback}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-5">
            {QUESTIONS.map((q) => (
              <div key={q.key} className="space-y-2">
                <p className="text-sm font-medium">{q.text}</p>
                <div className="grid grid-cols-3 gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: opt.value }))}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors",
                        answers[q.key] === opt.value
                          ? "border-primary bg-primary/10 font-medium"
                          : "hover:bg-muted",
                      )}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Later</Button>
              <Button onClick={submit} disabled={!complete || submitStandup.isPending}>
                {submitStandup.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Submit Check-in
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
