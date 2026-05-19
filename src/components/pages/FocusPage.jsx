import { pomodoroHistory } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { AIInsightCard } from "@/components/ai/AIBubble";
import { Header } from "./SpacesPage";
import { useEffect, useState } from "react";

export default function FocusPage() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(25 * 60);
  const [mode, setMode] = useState("focus");

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  const total = mode === "focus" ? 25 * 60 : 5 * 60;
  const pct = ((total - seconds) / total) * 100;
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <Header title="Focus" subtitle="Pomodoro timer, history, and AI focus coaching." />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border bg-card p-8 text-center">
          <div className="inline-flex rounded-md border p-0.5 mb-6">
            {["focus","break"].map((m) => (
              <button key={m} onClick={() => { setMode(m); setSeconds(m === "focus" ? 25*60 : 5*60); }}
                className={`px-4 py-1 text-sm capitalize rounded ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                {m}
              </button>
            ))}
          </div>
          <div className="relative h-64 w-64 mx-auto">
            <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--muted)" strokeWidth="4" />
              <circle cx="50" cy="50" r="46" fill="none" stroke="var(--primary)" strokeWidth="4"
                strokeDasharray={2 * Math.PI * 46}
                strokeDashoffset={2 * Math.PI * 46 * (1 - pct / 100)}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="text-5xl font-bold tabular-nums">{mm}:{ss}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{mode}</div>
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            <Button size="lg" onClick={() => setRunning(!running)} className="px-8">
              {running ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
              {running ? "Pause" : "Start"}
            </Button>
            <Button size="lg" variant="outline" onClick={() => { setRunning(false); setSeconds(total); }}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="ghost"><Settings className="h-4 w-4" /></Button>
          </div>
        </div>

        <div className="space-y-4">
          <AIInsightCard title="Pomodoro Insight">
            You averaged 4.3 sessions/day this week, best in 25-min blocks before noon.
            Try 2 deep blocks tomorrow morning for the FYP.
          </AIInsightCard>
          <AIInsightCard title="Focus mode">
            Block Instagram & TikTok during the next focus block? You're 12 min over today.
          </AIInsightCard>
          <AIInsightCard title="Accountability nudge">
            Sara just started a 50-min session. Join her?
          </AIInsightCard>
        </div>
      </div>

      <section>
        <h3 className="font-semibold mb-2">History</h3>
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left px-4 py-2.5">Date</th><th className="text-left px-4 py-2.5">Block</th><th className="text-left px-4 py-2.5">Rounds</th><th className="text-left px-4 py-2.5">Total focus</th><th className="text-left px-4 py-2.5">Status</th></tr>
            </thead>
            <tbody className="divide-y">
              {pomodoroHistory.map((p) => (
                <tr key={p.id}><td className="px-4 py-3">{p.date}</td><td className="px-4 py-3">{p.focus_duration}m</td><td className="px-4 py-3">{p.rounds_completed}</td><td className="px-4 py-3">{p.total_focus_minutes}m</td><td className="px-4 py-3 text-emerald-600 capitalize">{p.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
