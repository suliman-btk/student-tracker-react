import { tasks } from "@/lib/mock";
import { AIInsightCard } from "@/components/ai/AIBubble";
import { Header } from "./SpacesPage";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLS = ["To Do", "In Progress", "Done"];

export default function KanbanPage() {
  const [items, setItems] = useState(tasks);
  const [drag, setDrag] = useState(null);
  const onDrop = (status) => {
    if (!drag) return;
    setItems(items.map((t) => (t.id === drag ? { ...t, status } : t)));
    setDrag(null);
  };

  return (
    <div className="space-y-6">
      <Header title="Kanban Board" subtitle="Flow view across your active space.">
        <Button><Plus className="h-4 w-4 mr-1.5" /> New card</Button>
      </Header>

      <AIInsightCard title="Kanban Insight">
        Three cards have lived in <strong>In Progress</strong> &gt; 4 days. A WIP limit of
        3 will likely cut cycle time by ~30%. Want me to enable it?
      </AIInsightCard>

      <div className="grid md:grid-cols-3 gap-4">
        {COLS.map((col) => (
          <div
            key={col}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(col)}
            className="rounded-xl bg-muted/40 p-3 min-h-[480px]"
          >
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-semibold text-sm">{col}</h3>
              <span className="text-xs text-muted-foreground">{items.filter((t) => t.status === col).length}</span>
            </div>
            <div className="space-y-2">
              {items.filter((t) => t.status === col).map((t) => (
                <div key={t.id} draggable onDragStart={() => setDrag(t.id)}
                  className="rounded-lg border bg-card p-3 shadow-sm cursor-grab active:cursor-grabbing">
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t.priority} · {t.points} pts</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
