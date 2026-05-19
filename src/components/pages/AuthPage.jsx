import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";

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
      <div className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-10 h-96 w-96 rounded-full bg-[color:var(--ai)]/30 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary-foreground/15 grid place-items-center font-bold">R</div>
          <div className="font-semibold">RAQIP</div>
        </div>
        <div className="relative space-y-4 max-w-md">
          <div className="inline-flex items-center gap-1.5 text-xs bg-primary-foreground/10 px-2 py-1 rounded-md">
            <Sparkles className="h-3 w-3" /> AI Scrum Coach included
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Plan your semester like a sprint.
          </h1>
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Tasks, sprints, Pomodoro, a Google-style calendar, and a coach that
            actually helps you ship your FYP — all in one calm workspace.
          </p>
        </div>
        <div className="relative text-xs text-primary-foreground/60">© 2026 RAQIP</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight">
            {isLogin ? "Welcome back" : "Create your account"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isLogin ? "Sign in to continue your sprint." : "Start your first study sprint in seconds."}
          </p>

          <form onSubmit={submit} className="space-y-3 mt-6">
            <Button type="button" onClick={loginGoogle} variant="outline" className="w-full h-10" disabled={loading}>
              Continue with Google
            </Button>
            <div className="relative my-2 text-center">
              <span className="text-xs text-muted-foreground bg-background px-2 relative z-10">or email</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>
            {!isLogin && (
              <input value={form.name} onChange={update("name")} placeholder="Full name" className="w-full h-10 px-3 rounded-md border bg-background text-sm" />
            )}
            <input value={form.email} onChange={update("email")} placeholder="Email" type="email" required className="w-full h-10 px-3 rounded-md border bg-background text-sm" />
            <input value={form.password} onChange={update("password")} placeholder="Password" type="password" required minLength={6} className="w-full h-10 px-3 rounded-md border bg-background text-sm" />
            {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</div>}
            <Button className="w-full h-10" disabled={loading}>{loading ? "Please wait..." : isLogin ? "Sign in" : "Create account"}</Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            {isLogin ? (
              <>New to RAQIP? <Link to="/register" className="text-primary font-medium">Create an account</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="text-primary font-medium">Sign in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
