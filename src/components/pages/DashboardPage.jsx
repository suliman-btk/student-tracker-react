import { me, tasks, sprints, calendarEvents, weeklyXP, aiSuggestions } from "@/lib/mock";
import { AIInsightCard, AIBadge } from "@/components/ai/AIBubble";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Target, Clock, CheckCircle2, Plus } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { useState } from "react";
import { useUI } from "@/store/ui";

export default function DashboardPage() {
  const sprint = sprints.find((s) => s.is_active);
  const sprintTasks = tasks.filter((t) => t.sprint_id === sprint?.id);
  const done = sprintTasks.filter((t) => t.status === "Done").length;
  const total = sprintTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const { openAI } = useUI();
  const [standup, setStandup] = useState({ y: "", t: "", b: "" });
  const [reply, setReply] = useState(null);

  const submitStandup = () => {
    setReply(null);
    setTimeout(() => setReply(
      "Solid plan. Yesterday's momentum on the lit review is great — keep that block first. The Dijkstra task is blocking 2 dependents; budget 90 min for the priority queue refactor before lunch. End the day with a 20-min review."
    ), 800);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Hey, {me.name.split(" ")[0]} 👋</h1>
        <p className="text-sm text-muted-foreground">Here's your day. You're {pct}% through Sprint 7.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Flame} label="Streak" value={`${me.streak} days`} accent="text-orange-600" />
        <Stat icon={Trophy} label="XP" value={me.xp.toLocaleString()} accent="text-yellow-600" />
        <Stat icon={Target} label="Sprint progress" value={`${pct}%`} accent="text-primary" />
        <Stat icon={Clock} label="Focus today" value="2h 15m" accent="text-[color:var(--ai)]" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <AIInsightCard
            title="Daily Standup"
            action={<Button size="sm" variant="ghost" onClick={() => openAI("standup")}>Open chat</Button>}
          >
            <div className="grid gap-2">
              {[
                { k: "y", label: "What did you do yesterday?" },
                { k: "t", label: "What will you do today?" },
                { k: "b", label: "Any blockers?" },
              ].map((q) => (
                <div key={q.k}>
                  <label className="text-xs text-muted-foreground">{q.label}</label>
                  <input
                    value={standup[q.k]}
                    onChange={(e) => setStandup({ ...standup, [q.k]: e.target.value })}
                    className="mt-1 w-full h-9 px-3 rounded-md border bg-background text-sm"
                    placeholder="Type a quick note…"
                  />
                </div>
              ))}
              <Button onClick={submitStandup} size="sm" className="w-fit mt-1 bg-[color:var(--ai)] hover:bg-[color:var(--ai)]/90">
                Get coaching
              </Button>
              {reply && (
                <div className="mt-2 rounded-lg bg-[color:var(--ai-soft)] p-3 text-sm">
                  <AIBadge className="mb-1" />
                  <p className="leading-relaxed">{reply}</p>
                </div>
              )}
            </div>
          </AIInsightCard>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">{sprint?.name}</h3>
                <p className="text-xs text-muted-foreground">{sprint?.goal}</p>
              </div>
              <span className="text-xs text-muted-foreground">{done}/{total} done</span>
            </div>
            <Progress value={pct} className="h-2 mb-4" />
            <ul className="divide-y">
              {sprintTasks.slice(0, 4).map((t) => (
                <li key={t.id} className="py-2.5 flex items-center gap-3">
                  <CheckCircle2 className={`h-4 w-4 ${t.status === "Done" ? "text-primary" : "text-muted-foreground/40"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{t.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {t.priority} · {t.expected_hours}h · due {t.deadline}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-muted">{t.status}</span>
                </li>
              ))}
            </ul>
          </div>

          <AIInsightCard
            title="Suggested tasks for today"
            action={<Button size="sm" variant="outline">Refresh</Button>}
          >
            <div className="space-y-2">
              {aiSuggestions.slice(0, 3).map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border bg-background p-2.5">
                  <Plus className="h-4 w-4 text-[color:var(--ai)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <div className="text-xs text-muted-foreground">{s.reason}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{s.expected_hours}h</span>
                  <Button size="sm" variant="ghost">Add</Button>
                </div>
              ))}
            </div>
          </AIInsightCard>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm">This week's XP</h3>
            <div className="h-32 mt-2">
              <ResponsiveContainer>
                <BarChart data={weeklyXP}>
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                  <Bar dataKey="xp" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Upcoming</h3>
              <Button size="sm" variant="ghost">View calendar</Button>
            </div>
            <ul className="space-y-2">
              {calendarEvents.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: e.color_hex }} />
                  <div className="flex-1">
                    <div className="font-medium truncate">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.all_day ? "All day" : new Date(e.start_time).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="mt-3 text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
