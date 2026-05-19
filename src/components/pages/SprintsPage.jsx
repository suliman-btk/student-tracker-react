import { sprints, tasks } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Plus, Sparkles, Calendar } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Header } from "./SpacesPage";
import { AIBadge } from "@/components/ai/AIBubble";

export default function SprintsPage() {
  return (
    <div className="space-y-6">
      <Header title="Sprints" subtitle="Plan, run, and close your study sprints.">
        <Button variant="outline" className="text-[color:var(--ai)] border-[color:var(--ai)]/30">
          <Sparkles className="h-4 w-4 mr-1.5" /> Plan with AI
        </Button>
        <Button><Plus className="h-4 w-4 mr-1.5" /> New sprint</Button>
      </Header>
      <div className="grid lg:grid-cols-2 gap-4">
        {sprints.map((s) => {
          const ts = tasks.filter((t) => t.sprint_id === s.id);
          const done = ts.filter((t) => t.status === "Done").length;
          const pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
          return (
            <Link to="/sprints/$id" params={{ id: s.id }} key={s.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{s.goal}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md ${s.is_active ? "bg-emerald-100 text-emerald-700" : s.is_completed ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700"}`}>
                  {s.is_active ? "Active" : s.is_completed ? "Closed" : "Planned"}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {s.start_date} → {s.end_date}
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{done}/{ts.length} tasks</span>
                  <span className="font-medium">{pct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {s.is_active && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs"><AIBadge /> Capacity 92% · on track</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
