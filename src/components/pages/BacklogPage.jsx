import { tasks, aiSuggestions } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Plus, X, Check, Sparkles } from "lucide-react";
import { AIBadge } from "@/components/ai/AIBubble";
import { Header } from "./SpacesPage";
import { useState } from "react";

export default function BacklogPage() {
  const [suggestions, setSuggestions] = useState(aiSuggestions);
  const backlog = tasks.filter((t) => !t.sprint_id);

  return (
    <div className="space-y-6">
      <Header title="Backlog" subtitle="Tasks not yet in a sprint. AI suggestions appear inline.">
        <Button><Plus className="h-4 w-4 mr-1.5" /> Add task</Button>
      </Header>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <AIBadge />
          <h3 className="text-sm font-semibold">Coach suggestions</h3>
          <Button variant="ghost" size="sm" className="ml-auto text-[color:var(--ai)]">
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Generate more
          </Button>
        </div>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <div key={s.id} className="rounded-xl border border-dashed border-[color:var(--ai)]/40 bg-[color:var(--ai-soft)]/40 p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{s.title}</div>
                <div className="text-xs text-muted-foreground">{s.reason} · {s.expected_hours}h · {s.points} pts</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSuggestions(suggestions.filter((x) => x.id !== s.id))}>
                <Check className="h-3.5 w-3.5 mr-1" /> Accept
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setSuggestions(suggestions.filter((x) => x.id !== s.id))}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {suggestions.length === 0 && <p className="text-sm text-muted-foreground">All caught up. Generate fresh suggestions anytime.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Backlog ({backlog.length})</h3>
        <div className="space-y-2">
          {backlog.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-3 flex items-center gap-3 hover:shadow-sm">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.priority} · {t.expected_hours}h · {t.points} pts · due {t.deadline}</div>
              </div>
              <Button size="sm" variant="ghost">Move to sprint</Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
