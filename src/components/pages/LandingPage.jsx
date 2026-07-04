import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  ListChecks,
  QrCode,
  ShieldCheck,
  Sparkles,
  Timer,
  Trophy,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const APK_DOWNLOAD_URL =
  import.meta.env.VITE_ANDROID_APK_URL ||
  "https://github.com/suliman-btk/student-tracker-react/releases/latest/download/RAQIP-v1.0.0.apk";
const APK_VERSION = import.meta.env.VITE_ANDROID_APK_VERSION || "1.0.0";
const APK_QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=224x224&margin=12&data=${encodeURIComponent(APK_DOWNLOAD_URL)}`;

const FEATURES = [
  {
    icon: Sparkles,
    title: "An AI coach in your corner",
    desc: "Stuck on what to do next? Your coach plans your week, nudges you before deadlines, and keeps your FYP moving.",
    tint: "text-[color:var(--ai)] bg-[color:var(--ai)]/10",
  },
  {
    icon: Zap,
    title: "Beat big projects in small sprints",
    desc: "That huge assignment feels lighter when it's broken into a week of bite-sized tasks you can actually finish.",
    tint: "text-amber-600 bg-amber-500/10",
  },
  {
    icon: Timer,
    title: "Focus that actually counts",
    desc: "Hit start, silence the noise, and watch every Pomodoro log straight into your study streak.",
    tint: "text-rose-600 bg-rose-500/10",
  },
  {
    icon: CalendarDays,
    title: "Never miss a deadline again",
    desc: "Classes, due dates and sprints land on one calendar you already know how to read.",
    tint: "text-primary bg-primary/10",
  },
];

// New-user onboarding flow — shown as a friendly "how it works" strip.
const STEPS = [
  {
    icon: ListChecks,
    title: "Dump everything in",
    desc: "Brain-dump every task, class and deadline. No more sticky notes or panic at 2am.",
  },
  {
    icon: Wand2,
    title: "Let the AI plan it",
    desc: "Your coach turns the chaos into a realistic week-by-week sprint plan in seconds.",
  },
  {
    icon: Trophy,
    title: "Focus, finish, repeat",
    desc: "Knock out tasks, build your streak, and actually enjoy watching the bar fill up.",
  },
];

const STATS = [
  { value: "5-in-1", label: "tasks, sprints, focus, calendar & coach" },
  { value: "24/7", label: "AI coach on call" },
  { value: "2 min", label: "to set up your first sprint" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/70 px-4 backdrop-blur sm:px-6 lg:px-10">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="RAQIP — Smart Study Companion"
            className="h-8 w-auto object-contain sm:h-10"
          />
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Button asChild variant="ghost" className="h-9 px-2.5 sm:px-4">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild className="h-9 px-2.5 sm:px-4">
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.06] via-background to-background" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14 lg:py-16 grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs bg-card border px-3 py-1 rounded-full text-muted-foreground shadow-sm">
              <Sparkles className="h-3 w-3 text-[color:var(--ai)]" /> Made for final-year students
            </div>
            <h1 className="mt-5 text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.08]">
              Your messy semester,{" "}
              <span className="bg-gradient-to-r from-primary to-[color:var(--ai)] bg-clip-text text-transparent">
                finally sorted.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
              Juggling classes, your FYP, and a dozen deadlines? RAQIP turns the overwhelm into
              clear weekly sprints, focused study sessions, and an AI coach that tells you exactly
              what to tackle next.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button asChild size="lg" className="gap-1.5">
                <Link to="/register">
                  Start your first sprint <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login">I already have an account</Link>
              </Button>
            </div>
            <ApkDownloadQr />
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Free for students
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Works offline
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Set up in 2 minutes
              </span>
            </div>
          </div>

          {/* App preview mockup */}
          <div className="relative lg:-mt-8">
            <div className="absolute -inset-3 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
            <AppPreview />
          </div>
        </div>

        {/* Stats strip */}
        <div className="border-t bg-gradient-to-r from-primary/[0.04] via-[color:var(--ai)]/[0.04] to-primary/[0.04]">
          <div className="max-w-6xl mx-auto grid gap-4 px-4 py-7 sm:grid-cols-3 sm:divide-x sm:divide-border/70 sm:px-6 lg:px-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-[color:var(--ai)] bg-clip-text text-transparent">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — new-user onboarding flow */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-10 pt-14 sm:pt-20 pb-4">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">
            How it works
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
            Up and running in three steps
          </h2>
          <p className="mt-3 text-muted-foreground">
            No setup headaches. Go from "where do I even start?" to a plan you can act on today.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="group relative rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 sm:rounded-3xl sm:p-6"
            >
              <span className="absolute right-5 top-5 text-5xl font-bold leading-none text-muted-foreground/10 transition-colors group-hover:text-primary/15">
                {i + 1}
              </span>
              <div className="h-12 w-12 rounded-2xl grid place-items-center bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-lg">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features — bento layout */}
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">
            Why students stick with it
          </span>
          <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
            Built for how you actually study
          </h2>
          <p className="mt-3 text-muted-foreground">
            From the first scary task to the final demo day — one calm place that has your back.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3 lg:auto-rows-fr">
          {/* Featured AI card */}
          <div className="lg:row-span-2 relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary to-[color:var(--ai)] text-primary-foreground p-5 flex flex-col sm:rounded-3xl sm:p-7">
            <div className="relative h-12 w-12 rounded-2xl bg-primary-foreground/15 grid place-items-center">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="relative mt-5 text-xl font-bold">Meet Azzam, your AI Scrum Coach</h3>
            <p className="relative mt-2 text-sm text-primary-foreground/85 leading-relaxed">
              Think of it as the friend who's great at planning. It maps out your sprints, grooms
              your backlog, reminds you before things blow up, and checks in to keep your FYP on
              track.
            </p>
            <ul className="relative mt-6 space-y-2.5 text-sm">
              {[
                "Plans your week for you",
                "Reminds you before deadlines",
                "Cheers on your progress",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" /> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Other feature cards */}
          {FEATURES.filter((f) => f.title !== "An AI coach in your corner").map(
            ({ icon: Icon, title, desc, tint }) => (
              <div
                key={title}
                className="group rounded-xl border bg-card p-5 text-left transition-all hover:shadow-lg hover:-translate-y-0.5 sm:rounded-3xl sm:p-6"
              >
                <div className={`h-12 w-12 rounded-2xl grid place-items-center ${tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* See it in action — Sprint + Pomodoro spotlights */}
      <section className="border-y bg-muted/30">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-14 sm:py-20">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary">
              See it in action
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-bold tracking-tight">
              Plan the sprint. Focus the hour.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Two tools that do the heavy lifting — turn a big week into a clear board, then lock in
              with a focus timer that counts.
            </p>
          </div>

          {/* Sprint spotlight */}
          <div className="mt-14 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-500/10 px-3 py-1 rounded-full">
                <Zap className="h-3.5 w-3.5" /> Sprints &amp; backlog
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight">
                Watch a heavy week shrink into a board.
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                Drag tasks across To&nbsp;Do → Doing → Done, track velocity, and actually see the
                finish line. Each sprint is a small, winnable game instead of a scary deadline.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "Kanban + backlog in one view",
                  "Live sprint progress & burndown",
                  "Auto-rolls unfinished tasks forward",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <SprintBoardMock />
          </div>

          {/* Pomodoro spotlight */}
          <div className="mt-16 grid lg:grid-cols-2 gap-10 items-center">
            <div className="lg:order-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 bg-rose-500/10 px-3 py-1 rounded-full">
                <Timer className="h-3.5 w-3.5" /> Focus &amp; Pomodoro
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight">
                Hit start. Silence the noise. Get it done.
              </h3>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                A simple 25-minute focus timer that logs every session into your streak and stats —
                so deep work finally shows up on your progress, not just in your memory.
              </p>
              <ul className="mt-5 space-y-2.5 text-sm">
                {[
                  "25 / 5 Pomodoro cycles",
                  "Every session feeds your streak",
                  "Solo or together in Group Rooms",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:order-1">
              <PomodoroMock />
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-4 sm:px-6 lg:px-10 pb-14 sm:pb-20 pt-14 sm:pt-20">
        <div className="max-w-6xl mx-auto relative overflow-hidden rounded-xl bg-primary text-primary-foreground px-5 py-10 text-center sm:rounded-3xl sm:px-8 sm:py-12 lg:py-16">
          <h2 className="relative text-2xl sm:text-3xl font-bold tracking-tight">
            Your future self will thank you.
          </h2>
          <p className="relative mt-3 text-primary-foreground/80 max-w-lg mx-auto">
            Start today and turn this chaotic semester into a series of calm, finishable sprints.
            It's free, and your first plan is minutes away.
          </p>
          <div className="relative mt-7">
            <Button asChild size="lg" variant="secondary" className="gap-1.5">
              <Link to="/register">
                Create my free account <ArrowRight className="h-4 w-4" />
              </Link>
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

function ApkDownloadQr() {
  return (
    <div className="mt-7 flex max-w-xl flex-col gap-4 rounded-xl border bg-card/85 p-4 shadow-sm sm:flex-row sm:items-center sm:rounded-2xl">
      <a
        href={APK_DOWNLOAD_URL}
        className="mx-auto grid h-36 w-36 shrink-0 place-items-center rounded-xl border bg-white p-2 sm:mx-0"
        aria-label="Download RAQIP Android APK"
      >
        <img
          src={APK_QR_URL}
          alt="QR code to download the RAQIP Android APK"
          className="h-full w-full"
        />
      </a>
      <div className="min-w-0 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          <QrCode className="h-3.5 w-3.5" /> Android APK
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight">Scan to download RAQIP</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Version {APK_VERSION}. Scanning the QR opens the public APK download from GitHub Releases.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button asChild className="gap-1.5">
            <a href={APK_DOWNLOAD_URL}>
              Download APK <Download className="h-4 w-4" />
            </a>
          </Button>
          <span className="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Android may ask to allow
            installation.
          </span>
        </div>
      </div>
    </div>
  );
}

/* Lightweight, non-interactive app preview built from divs. */
function AppPreview() {
  return (
    <div className="mx-auto max-w-full overflow-hidden rounded-xl border bg-card shadow-2xl sm:rounded-2xl">
      {/* window bar */}
      <div className="flex items-center gap-1.5 px-3 py-2.5 border-b bg-muted/40">
        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="ml-3 h-5 flex-1 max-w-[55%] rounded bg-background/70" />
      </div>
      <div className="flex h-64 sm:h-72 lg:h-[21rem]">
        {/* mini sidebar */}
        <div className="hidden sm:flex w-32 shrink-0 flex-col gap-2 border-r bg-muted/20 p-3">
          <div className="h-6 rounded-md bg-primary/15" />
          {["w-full", "w-4/5", "w-3/4", "w-5/6"].map((w, i) => (
            <div
              key={i}
              className={`h-3 rounded ${w} ${i === 0 ? "bg-primary/40" : "bg-muted-foreground/20"}`}
            />
          ))}
          <div className="mt-auto h-12 rounded-lg bg-[color:var(--ai)]/10 border border-[color:var(--ai)]/20" />
        </div>
        {/* board */}
        <div className="flex-1 p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-24 rounded bg-muted-foreground/25" />
            <div className="h-6 w-16 rounded-md bg-primary" />
          </div>
          <div className="grid grid-cols-3 gap-1.5 h-[calc(100%-1.75rem)] sm:gap-2">
            {[
              { label: "To Do", accent: "bg-slate-400", cards: 3 },
              { label: "Doing", accent: "bg-amber-400", cards: 2 },
              { label: "Done", accent: "bg-emerald-500", cards: 2 },
            ].map((col) => (
              <div
                key={col.label}
                className="rounded-lg bg-muted/30 p-1.5 space-y-2 overflow-hidden sm:p-2"
              >
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

/* Sprint board mock — a mini Kanban with a live-looking progress bar. */
function SprintBoardMock() {
  const columns = [
    { label: "To Do", accent: "bg-slate-400", cards: 3 },
    { label: "Doing", accent: "bg-amber-400", cards: 2 },
    { label: "Done", accent: "bg-emerald-500", cards: 2, done: true },
  ];
  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-tr from-primary/15 to-amber-400/15 blur-2xl" />
      <div className="rounded-xl border bg-card shadow-xl overflow-hidden sm:rounded-2xl">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
          <div>
            <div className="text-sm font-semibold">SCRUM Sprint 25</div>
            <div className="text-[11px] text-muted-foreground">1 Jun – 7 Jun · 4 days left</div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-primary leading-none">68%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              complete
            </div>
          </div>
        </div>
        {/* progress bar */}
        <div className="px-4 pt-3">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--ai)]"
              style={{ width: "68%" }}
            />
          </div>
          <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Done 5
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Doing 2
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" /> To Do 3
            </span>
          </div>
        </div>
        {/* board */}
        <div className="grid grid-cols-3 gap-1.5 p-3 sm:gap-2 sm:p-4">
          {columns.map((col) => (
            <div key={col.label} className="rounded-lg bg-muted/40 p-1.5 space-y-2 sm:p-2">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                <span className="text-[11px] font-medium text-muted-foreground">{col.label}</span>
              </div>
              {Array.from({ length: col.cards }).map((_, i) => (
                <div key={i} className="rounded-md border bg-card p-2 space-y-1.5 shadow-sm">
                  <div
                    className={`h-2 w-full rounded ${col.done ? "bg-emerald-500/30" : "bg-muted-foreground/25"}`}
                  />
                  <div className="h-2 w-2/3 rounded bg-muted-foreground/15" />
                  <div className="flex items-center gap-1">
                    <span
                      className={`h-3 w-3 rounded-full ${col.done ? "bg-emerald-500/40" : "bg-primary/25"}`}
                    />
                    <div className="h-2 w-6 rounded bg-muted-foreground/15" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Pomodoro mock — an SVG focus-timer ring at ~64% through a 25-min session. */
function PomodoroMock() {
  const r = 86;
  const c = 2 * Math.PI * r;
  const progress = 0.64; // 64% through the session
  return (
    <div className="relative">
      <div className="absolute -inset-3 -z-10 rounded-3xl bg-gradient-to-tr from-rose-400/15 to-primary/15 blur-2xl" />
      <div className="rounded-xl border bg-card shadow-xl px-4 py-6 flex flex-col items-center sm:rounded-2xl sm:px-6 sm:py-8">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-rose-700 bg-rose-500/10 px-2.5 py-1 rounded-full">
          <Timer className="h-3 w-3" /> Focus session
        </div>

        <div className="relative mt-6 h-44 w-44 sm:h-52 sm:w-52">
          <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90">
            <circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke="var(--color-muted)"
              strokeWidth="12"
            />
            <circle
              cx="100"
              cy="100"
              r={r}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - progress)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold tracking-tight tabular-nums">16:08</div>
            <div className="text-xs text-muted-foreground mt-1">remaining</div>
          </div>
        </div>

        {/* session dots */}
        <div className="mt-6 flex items-center gap-2">
          {[true, true, false, false].map((filled, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${filled ? "bg-primary" : "bg-muted-foreground/25"}`}
            />
          ))}
          <span className="ml-2 text-xs text-muted-foreground">session 3 of 4</span>
        </div>

        {/* controls */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full border grid place-items-center text-muted-foreground">
            <Timer className="h-4 w-4" />
          </div>
          <div className="h-12 px-6 rounded-full bg-primary text-primary-foreground grid place-items-center text-sm font-semibold shadow-sm">
            Pause
          </div>
          <div className="h-10 w-10 rounded-full border grid place-items-center text-muted-foreground">
            <Zap className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
