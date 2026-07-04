import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lock,
  Mail,
  PanelRightOpen,
  Timer,
  User,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

const HIGHLIGHTS = [
  { label: "Tasks organized", value: "24" },
  { label: "Focus logged", value: "6h" },
  { label: "Sprint pace", value: "82%" },
];

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        {...props}
        className="h-12 w-full rounded-md border border-input bg-white pl-11 pr-4 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}

function WorkspacePreview() {
  return (
    <div className="relative hidden min-h-[760px] overflow-hidden bg-[#f1f3f8] lg:block">
      <div className="absolute inset-y-0 left-0 w-20 border-r bg-white" />
      <div className="absolute left-5 top-7 grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
        <PanelRightOpen className="h-5 w-5" />
      </div>
      <div className="absolute left-5 top-24 space-y-4">
        {[CalendarDays, Timer, CheckCircle2].map((Icon, index) => (
          <div
            key={index}
            className="grid h-10 w-10 place-items-center rounded-md border bg-white text-muted-foreground shadow-sm"
          >
            <Icon className="h-5 w-5" />
          </div>
        ))}
      </div>

      <div className="absolute left-32 right-16 top-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">RAQIP workspace</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
              Today&apos;s study plan
            </h1>
          </div>
          <div className="rounded-md border bg-white px-4 py-2 text-sm font-medium text-primary shadow-sm">
            Week 8 Sprint
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.label} className="rounded-md border bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-[1.15fr_0.85fr] gap-5">
          <div className="rounded-md border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Sprint backlog</p>
                <p className="text-xs text-muted-foreground">
                  Keep the FYP moving without clutter.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              {[
                ["Finalize methodology section", "In progress", "bg-ai-soft text-ai"],
                ["Review Firebase auth flow", "Today", "bg-secondary text-secondary-foreground"],
                ["Prepare supervisor update", "Next", "bg-muted text-muted-foreground"],
              ].map(([title, tag, tone]) => (
                <div
                  key={title}
                  className="flex items-center justify-between rounded-md border bg-background px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-md bg-white text-primary shadow-sm">
                      <CheckCircle2 className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{title}</span>
                  </div>
                  <span className={`rounded px-2 py-1 text-xs font-medium ${tone}`}>{tag}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border bg-primary p-5 text-primary-foreground shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-primary-foreground/75">Focus block</p>
              <Clock3 className="h-4 w-4 text-primary-foreground/75" />
            </div>
            <p className="mt-6 text-5xl font-semibold tracking-tight">25:00</p>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/75">
              Literature review sprint with Azzam check-in after the timer ends.
            </p>
            <div className="mt-8 h-2 rounded-full bg-white/20">
              <div className="h-2 w-2/3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const { loginEmail, registerEmail, loginGoogle, loading, error } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (isLogin) await loginEmail(form.email, form.password);
    else await registerEmail(form);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[1fr_1.25fr]">
        <div className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[420px]">
            <div className="mb-10">
              <img
                src="/logo.png"
                alt="RAQIP - Smart Study Companion"
                className="h-11 w-auto object-contain"
              />
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-primary">
                {isLogin ? "Sign in to RAQIP" : "Start with RAQIP"}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {isLogin ? "Welcome back" : "Create your account"}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
                {isLogin
                  ? "Open your workspace, check today's sprint, and keep your study plan moving."
                  : "Create a workspace for tasks, focus blocks, sprints, and calendar planning."}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <Button
                type="button"
                onClick={loginGoogle}
                variant="outline"
                className="h-12 w-full border-input bg-white text-foreground shadow-sm hover:bg-secondary"
                disabled={loading}
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <div className="relative py-1 text-center">
                <span className="relative z-10 bg-background px-3 text-xs font-medium text-muted-foreground">
                  or use email
                </span>
                <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
              </div>

              {!isLogin && (
                <Field
                  icon={User}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Full name"
                />
              )}
              <Field
                icon={Mail}
                value={form.email}
                onChange={update("email")}
                placeholder="Email address"
                type="email"
                required
              />
              <Field
                icon={Lock}
                value={form.password}
                onChange={update("password")}
                placeholder="Password"
                type="password"
                required
                minLength={6}
              />

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <Button className="h-12 w-full rounded-md text-sm font-semibold" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              {isLogin ? (
                <>
                  New to RAQIP?{" "}
                  <Link to="/register" className="font-semibold text-primary hover:underline">
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link to="/login" className="font-semibold text-primary hover:underline">
                    Sign in
                  </Link>
                </>
              )}
            </p>

            <p className="mt-10 text-center text-xs text-muted-foreground">
              © 2026 RAQIP - Smart Study Companion
            </p>
          </div>
        </div>

        <WorkspacePreview />
      </div>
    </div>
  );
}
