import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, Layers, ListChecks, Sparkles, Timer, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const STORAGE_KEY = "onboarding_complete";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to RAQIP",
    body: "Your all-in-one study companion. Manage tasks, study with peers, and get coached by AI — all in one place.",
    action: null,
  },
  {
    icon: Layers,
    title: "Spaces & Sprints",
    body: 'Create a Space for each subject or project (e.g. "FYP", "Database Systems"). Then plan a Sprint — a focused week of tasks you commit to finishing.',
    action: { label: "Create my first Space", to: "/spaces" },
    actionSkippable: true,
  },
  {
    icon: ListChecks,
    title: "Domains & Tasks",
    body: "Organize tasks inside your Space by Domain (topic area). Use the Backlog to brain-dump everything, then drag tasks into your active Sprint.",
    action: null,
  },
  {
    icon: Timer,
    title: "Focus Mode",
    body: "Use the built-in Pomodoro timer to stay on track. Pick a task, start a session, and RAQIP plays a tone and shows a banner at every phase transition.",
    action: { label: "Try Focus mode", to: "/focus" },
    actionSkippable: true,
  },
  {
    icon: Users,
    title: "Group Study Rooms",
    body: "Create or join a live study room with a shared Pomodoro timer, voice chat, and file sharing. Perfect for study groups or accountability partners.",
    action: { label: "Browse rooms", to: "/rooms" },
    actionSkippable: true,
  },
  {
    icon: Zap,
    title: "Social Feed",
    body: "Post study updates, react to peers' progress, build streaks, and share live study sessions.",
    action: { label: "See the feed", to: "/social" },
    actionSkippable: true,
  },
  {
    icon: Bot,
    title: "Azzam — Your AI Scrum Coach",
    body: "Submit your daily standup, get sprint reviews, and chat with your AI coach anytime. It knows your sprint progress, backlog, and study habits.",
    action: { label: "Let's go!", to: null },
  },
];

export default function WelcomeModal() {
  // typeof-window guard: this initializer would throw during SSR if the modal
  // ever renders on the server (today it's behind the client-only auth gate).
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && !localStorage.getItem(STORAGE_KEY),
  );
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
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) dismiss();
      }}
    >
      <DialogContent className="max-w-[520px] overflow-hidden p-0 sm:rounded-lg">
        <div className="border-b bg-white px-7 pb-6 pt-8">
          <div className="mb-6 flex items-center justify-between">
            <img
              src="/logo.png"
              alt="RAQIP - Smart Study Companion"
              className="h-9 w-auto object-contain"
            />
            <span className="rounded bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {step + 1} of {STEPS.length}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{current.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{current.body}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-7 py-6">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: ListChecks, label: "Plan" },
              { icon: Timer, label: "Focus" },
              { icon: Bot, label: "Coach" },
            ].map(({ icon: StepIcon, label }) => (
              <div key={label} className="rounded-md border bg-background p-3 text-center">
                <StepIcon className="mx-auto h-4 w-4 text-primary" />
                <p className="mt-2 text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {isLast ? (
            <Button
              className="h-11 w-full rounded-md"
              onClick={() => handleAction(current.action?.to ?? null)}
            >
              {current.action?.label ?? "Get started"} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : current.action ? (
            <>
              <Button
                className="h-11 w-full rounded-md"
                onClick={() => handleAction(current.action.to)}
              >
                {current.action.label} {current.action.to && <ArrowRight className="h-4 w-4" />}
              </Button>
              {current.actionSkippable && (
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-md"
                  onClick={() => setStep((s) => s + 1)}
                >
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
          ) : (
            <Button className="h-11 w-full rounded-md" onClick={() => setStep((s) => s + 1)}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          )}

          {!isLast && (
            <Button
              variant="ghost"
              className="h-10 w-full rounded-md text-muted-foreground"
              onClick={dismiss}
            >
              Skip for now
            </Button>
          )}

          <div className="flex justify-center gap-1.5 pt-1" aria-hidden="true">
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
