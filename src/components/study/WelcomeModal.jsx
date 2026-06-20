import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ListChecks, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STORAGE_KEY = "onboarding_complete";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to RAQIP",
    body: "Run the day, don't let it run you. RAQIP turns your semester chaos into clear weekly sprints with an AI coach at your side.",
    action: null,
  },
  {
    icon: CheckCircle2,
    title: "Create a Space",
    body: "A Space is your workspace for a subject or project — like \"FYP\" or \"Database Systems\". Everything lives inside a Space.",
    action: { label: "Create my first space", to: "/spaces" },
  },
  {
    icon: ListChecks,
    title: "Add your tasks",
    body: "Use the \"+ New task\" button in the top bar to brain-dump every task, deadline, and assignment. Don't filter — just dump.",
    action: { label: "Got it, close", to: null },
  },
  {
    icon: Zap,
    title: "Start a Sprint",
    body: "Pick tasks for this week, kick off a sprint, and let the AI coach guide you. One focused week at a time.",
    action: { label: "Go to Spaces", to: "/spaces" },
  },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(() => !localStorage.getItem(STORAGE_KEY));
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleAction = (to) => {
    dismiss();
    if (to) navigate({ to });
  };

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 px-8 pt-10 pb-6 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">{current.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{current.body}</p>
        </div>

        <div className="px-8 py-6 space-y-3">
          {current.action ? (
            <Button className="w-full gap-1.5" onClick={() => handleAction(current.action.to)}>
              {current.action.label} {current.action.to && <ArrowRight className="h-4 w-4" />}
            </Button>
          ) : (
            <Button className="w-full gap-1.5" onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {!isLast && (
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={dismiss}>
              Skip for now
            </Button>
          )}

          <div className="flex justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? "1.5rem" : "0.375rem",
                  background: i === step ? "var(--primary)" : "var(--muted-foreground)",
                  opacity: i === step ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
