import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Sparkles, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Scrum Coach",
    desc: "A built-in coach that plans your sprints, nudges you, and keeps your FYP on track.",
  },
  {
    icon: Zap,
    title: "Sprints & backlog",
    desc: "Break the semester into sprints. Groom a backlog and ship work week by week.",
  },
  {
    icon: Timer,
    title: "Focus & Pomodoro",
    desc: "Deep-work timers and focus sessions that log straight into your progress.",
  },
  {
    icon: CalendarDays,
    title: "Google-style calendar",
    desc: "Events, deadlines and sprint ranges in one clean, familiar calendar.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 lg:px-10 h-16 border-b">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">R</div>
          <div>
            <div className="font-semibold tracking-tight leading-none">RAQIP</div>
            <div className="text-[11px] text-muted-foreground">Smart Study Companion</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="h-9">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="h-9">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[color:var(--ai)]/20 blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 lg:px-10 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
            <Sparkles className="h-3 w-3 text-[color:var(--ai)]" /> AI Scrum Coach included
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
            Plan your semester
            <br className="hidden sm:block" /> like a sprint.
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
            Tasks, sprints, Pomodoro, and a Google-style calendar — with a coach that actually
            helps you ship your final-year project. All in one calm workspace.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-1.5">
              <Link to="/register">Start for free <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto w-full px-6 lg:px-10 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-2xl border bg-card p-5 text-left">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 RAQIP — Smart Study Companion
      </footer>
    </div>
  );
}
