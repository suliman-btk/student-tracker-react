import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, Layers, ListChecks, Sparkles, Timer, Users, Zap } from "lucide-react";
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
    body: "Create a Space for each subject or project (e.g. \"FYP\", \"Database Systems\"). Then plan a Sprint — a focused week of tasks you commit to finishing.",
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
    body: "Post study updates and react to peers' progress with 👍 Like, 🔥 Motivated me, or 💪 Keep going. Build streaks and share live study sessions.",
    action: { label: "See the feed", to: "/social" },
    actionSkippable: true,
  },
  {
    icon: Bot,
    title: "AI Scrum Coach",
    body: "Submit your daily standup, get sprint reviews, and chat with your AI coach anytime. It knows your sprint progress, backlog, and study habits.",
    action: { label: "Let's go!", to: null },
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
          {isLast ? (
            <Button className="w-full gap-1.5" onClick={() => handleAction(current.action?.to ?? null)}>
              {current.action?.label ?? "Get started"} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : current.action ? (
            <>
              <Button className="w-full gap-1.5" onClick={() => handleAction(current.action.to)}>
                {current.action.label} {current.action.to && <ArrowRight className="h-4 w-4" />}
              </Button>
              {current.actionSkippable && (
                <Button variant="outline" className="w-full" onClick={() => setStep((s) => s + 1)}>
                  Next <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </>
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
