import { sprints, tasks, burndown } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { AIInsightCard } from "@/components/ai/AIBubble";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Header } from "./SpacesPage";
import { useState } from "react";
import { Flame, AlertCircle, GripVertical } from "lucide-react";

const COLS = ["To Do", "In Progress", "Done"];

export default function SprintBoardPage({ sprintId }) {
  const sprint = sprints.find((s) => s.id === sprintId) || sprints[0];
  const [items, setItems] = useState(tasks.filter((t) => t.sprint_id === sprint.id));
  const [drag, setDrag] = useState(null);

  const onDrop = (status) => {
    if (!drag) return;
    setItems(items.map((t) => (t.id === drag ? { ...t, status } : t)));
    setDrag(null);
  };

  return (
    <div className="space-y-6">
      <Header title={sprint.name} subtitle={sprint.goal}>
        <Button variant="outline">Close sprint</Button>
      </Header>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold mb-2">Burndown</h3>
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={burndown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Line type="monotone" dataKey="remaining" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-4">
          <AIInsightCard title="Sprint Analysis">
            Velocity is 92% of last 3 sprints. Friday is your strongest focus day — schedule
            the Dijkstra implementation there. Two Critical tasks remain.
          </AIInsightCard>
          <AIInsightCard title="Next Sprint Advice">
            Capacity for next sprint: ~26 pts. Carry over 1 task, pull 2 medium domain
            tasks, and protect 4 hours for the FYP supervisor demo.
          </AIInsightCard>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {COLS.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col)}
            className="rounded-xl bg-muted/40 p-3 min-h-[400px]"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm">{col}</h3>
              <span className="text-xs text-muted-foreground">
                {items.filter((t) => t.status === col).length}
              </span>
            </div>
            <div className="space-y-2">
              {items.filter((t) => t.status === col).map((t) => {
                const overdue = new Date(t.deadline) < new Date() && t.status !== "Done";
                return (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDrag(t.id)}
                    className="group rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 opacity-0 group-hover:opacity-100" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{t.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {t.is_emergency && <Flame className="h-3 w-3 text-red-500" />}
                          <span>{t.points} pts · {t.expected_hours}h</span>
                        </div>
                        {overdue && (
                          <div className="mt-2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-1 text-[11px] flex items-start gap-1.5">
                            <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span><strong>AI Task Delay:</strong> 3 days overdue. Split into 2 subtasks?</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
