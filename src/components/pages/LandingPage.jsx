import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, CheckCircle2, Sparkles, Timer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Scrum Coach",
    desc: "A built-in coach that plans your sprints, nudges you, and keeps your FYP on track.",
    tint: "text-[color:var(--ai)] bg-[color:var(--ai)]/10",
  },
  {
    icon: Zap,
    title: "Sprints & backlog",
    desc: "Break the semester into sprints. Groom a backlog and ship work week by week.",
    tint: "text-amber-600 bg-amber-500/10",
  },
  {
    icon: Timer,
    title: "Focus & Pomodoro",
    desc: "Deep-work timers and focus sessions that log straight into your progress.",
    tint: "text-rose-600 bg-rose-500/10",
  },
  {
    icon: CalendarDays,
    title: "Google-style calendar",
    desc: "Events, deadlines and sprint ranges in one clean, familiar calendar.",
    tint: "text-primary bg-primary/10",
  },
];

const STATS = [
  { value: "6", label: "study spaces" },
  { value: "100%", label: "in one place" },
  { value: "AI", label: "scrum coach" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10 h-16 border-b bg-background/70 backdrop-blur">
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
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-background to-background" />
        <div className="absolute -top-32 right-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 -left-24 -z-10 h-80 w-80 rounded-full bg-[color:var(--ai)]/15 blur-3xl" />

        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs bg-card border px-3 py-1 rounded-full text-muted-foreground shadow-sm">
              <Sparkles className="h-3 w-3 text-[color:var(--ai)]" /> AI Scrum Coach included
            </div>
            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.05]">
              Plan your semester like a{" "}
              <span className="bg-gradient-to-r from-primary to-[color:var(--ai)] bg-clip-text text-transparent">sprint.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Tasks, sprints, Pomodoro, and a Google-style calendar — with a coach that actually
              helps you ship your final-year project. All in one calm workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-1.5">
                <Link to="/register">Start for free <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Free for students</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card</span>
            </div>
          </div>

          {/* App preview mockup */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-primary/20 to-[color:var(--ai)]/20 blur-2xl" />
            <AppPreview />
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t bg-gradient-to-r from-primary/[0.04] via-[color:var(--ai)]/[0.04] to-primary/[0.04]">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 py-7 grid grid-cols-3 divide-x divide-border/70">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-[color:var(--ai)] bg-clip-text text-transparent">{s.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — bento layout */}
      <section className="max-w-6xl mx-auto w-full px-6 lg:px-10 py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">Features</span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">Everything to run your semester</h2>
          <p className="mt-3 text-muted-foreground">From the first task to the final demo — one focused workspace.</p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:auto-rows-fr">
          {/* Featured AI card */}
          <div className="lg:row-span-2 relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary to-[color:var(--ai)] text-primary-foreground p-7 flex flex-col">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
            <div className="relative h-12 w-12 rounded-2xl bg-primary-foreground/15 grid place-items-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="relative mt-5 text-xl font-bold">AI Scrum Coach</h3>
            <p className="relative mt-2 text-sm text-primary-foreground/85 leading-relaxed">
              A built-in coach that plans your sprints, grooms your backlog, nudges you at the
              right time, and keeps your FYP on track — like a personal scrum master.
            </p>
            <ul className="relative mt-6 space-y-2.5 text-sm">
              {["Auto sprint planning", "Smart deadline nudges", "Progress check-ins"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Other feature cards */}
          {FEATURES.filter((f) => f.title !== "AI Scrum Coach").map(({ icon: Icon, title, desc, tint }) => (
            <div key={title} className="group rounded-3xl border bg-card p-6 text-left transition-all hover:shadow-lg hover:-translate-y-0.5">
              <div className={`h-12 w-12 rounded-2xl grid place-items-center ${tint}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA band */}
      <section className="px-6 lg:px-10 pb-20">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-3xl bg-primary text-primary-foreground px-8 py-12 lg:py-16 text-center">
          <div className="absolute -top-16 -right-10 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-[color:var(--ai)]/30 blur-3xl" />
          <h2 className="relative text-2xl sm:text-3xl font-bold tracking-tight">Ready to ship your FYP?</h2>
          <p className="relative mt-3 text-primary-foreground/80 max-w-lg mx-auto">
            Join RAQIP and turn a chaotic semester into a series of calm, finishable sprints.
          </p>
          <div className="relative mt-7">
            <Button asChild size="lg" variant="secondary" className="gap-1.5">
              <Link to="/register">Create your account <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t py-6 text-center text-xs text-muted-foreground">
        © 2026 RAQIP — Smart Study Companion
      </footer>
    </div>
  );
}

/* Lightweight, non-interactive app preview built from divs. */
function AppPreview() {
  return (
    <div className="rounded-2xl border bg-card shadow-2xl overflow-hidden">
      {/* window bar */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b bg-muted/40">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 h-5 flex-1 max-w-[55%] rounded bg-background/70" />
      </div>
      <div className="flex h-72">
        {/* mini sidebar */}
        <div className="hidden sm:flex w-32 shrink-0 flex-col gap-2 border-r bg-muted/20 p-3">
          <div className="h-6 rounded-md bg-primary/15" />
          {["w-full", "w-4/5", "w-3/4", "w-5/6"].map((w, i) => (
            <div key={i} className={`h-3 rounded ${w} ${i === 0 ? "bg-primary/40" : "bg-muted-foreground/20"}`} />
          ))}
          <div className="mt-auto h-12 rounded-lg bg-[color:var(--ai)]/10 border border-[color:var(--ai)]/20" />
        </div>
        {/* board */}
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 rounded bg-muted-foreground/25" />
            <div className="h-6 w-16 rounded-md bg-primary" />
          </div>
          <div className="grid grid-cols-3 gap-2 h-[calc(100%-1.75rem)]">
            {[
              { label: "To Do", accent: "bg-slate-400", cards: 3 },
              { label: "Doing", accent: "bg-amber-400", cards: 2 },
              { label: "Done", accent: "bg-emerald-500", cards: 2 },
            ].map((col) => (
              <div key={col.label} className="rounded-lg bg-muted/30 p-2 space-y-2 overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                  <div className="h-2.5 w-12 rounded bg-muted-foreground/25" />
                </div>
                {Array.from({ length: col.cards }).map((_, i) => (
                  <div key={i} className="rounded-md border bg-card p-2 space-y-1.5 shadow-sm">
                    <div className="h-2 w-full rounded bg-muted-foreground/25" />
                    <div className="h-2 w-2/3 rounded bg-muted-foreground/15" />
                    <div className="h-3 w-8 rounded bg-primary/20" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
