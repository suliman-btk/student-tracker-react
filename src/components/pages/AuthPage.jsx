import { Link } from "@tanstack/react-router";
import { CalendarDays, CheckCircle2, Lock, Mail, Sparkles, Timer, User, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

const HIGHLIGHTS = [
  { icon: Sparkles, text: "AI Scrum Coach that plans your sprints" },
  { icon: Zap, text: "Turn the semester into finishable sprints" },
  { icon: Timer, text: "Focus timers that log your progress" },
  { icon: CalendarDays, text: "A clean, Google-style calendar" },
];

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        {...props}
        className="w-full h-11 pl-10 pr-3 rounded-lg border bg-background text-sm transition-colors focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}

export default function AuthPage({ mode = "login" }) {
  const isLogin = mode === "login";
  const { loginEmail, registerEmail, loginGoogle, loading, error } = useAuthStore();
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    if (isLogin) await loginEmail(form.email, form.password);
    else await registerEmail(form);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand / marketing panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 xl:p-14 bg-gradient-to-br from-primary via-primary to-[color:var(--ai)] text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 h-[28rem] w-[28rem] rounded-full bg-[color:var(--ai)]/30 blur-3xl" />

        <div className="relative">
          <div className="inline-flex bg-white rounded-xl px-3.5 py-2.5 shadow-sm">
            <img src="/logo.png" alt="RAQIP — Smart Study Companion" className="h-7 w-auto object-contain" />
          </div>
        </div>

        <div className="relative space-y-6 max-w-md">
          <div className="inline-flex items-center gap-1.5 text-xs bg-primary-foreground/10 px-2.5 py-1 rounded-full">
            <Sparkles className="h-3 w-3" /> AI Scrum Coach included
          </div>
          <h1 className="text-4xl xl:text-5xl font-bold leading-[1.08] tracking-tight">
            Plan your semester like a sprint.
          </h1>
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Tasks, sprints, Pomodoro, and a Google-style calendar — with a coach that actually
            helps you ship your FYP. All in one calm workspace.
          </p>
          <ul className="space-y-3 pt-2">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm">
                <span className="h-8 w-8 shrink-0 rounded-lg bg-primary-foreground/10 grid place-items-center">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/60">© 2026 RAQIP — Smart Study Companion</div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          {/* mobile brand */}
          <div className="lg:hidden mb-8">
            <img src="/logo.png" alt="RAQIP — Smart Study Companion" className="h-9 w-auto object-contain" />
          </div>

          <h2 className="text-2xl font-semibold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1.5">
            {isLogin ? "Sign in to continue your sprint." : "Start your first study sprint in seconds."}
          </p>

          <form onSubmit={submit} className="space-y-3.5 mt-7">
            <Button type="button" onClick={loginGoogle} variant="outline" className="w-full h-11 gap-2" disabled={loading}>
              <GoogleIcon className="h-4 w-4" />
              Continue with Google
            </Button>
            <div className="relative my-1 text-center">
              <span className="text-xs text-muted-foreground bg-background px-2 relative z-10">or with email</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>
            {!isLogin && (
              <Field icon={User} value={form.name} onChange={update("name")} placeholder="Full name" />
            )}
            <Field icon={Mail} value={form.email} onChange={update("email")} placeholder="Email" type="email" required />
            <Field icon={Lock} value={form.password} onChange={update("password")} placeholder="Password" type="password" required minLength={6} />
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>
            )}
            <Button className="w-full h-11" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            {isLogin ? (
              <>New to RAQIP? <Link to="/register" className="text-primary font-medium hover:underline">Create an account</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
