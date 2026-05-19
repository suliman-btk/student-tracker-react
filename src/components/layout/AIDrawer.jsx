import { Sparkles, X, Send } from "lucide-react";
import { useUI } from "@/store/ui";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const seedThread = [
  { from: "ai", text: "Hi Aya — I'm your Scrum Coach. I can plan sprints, review your standup, or unblock overdue tasks. Ask me anything." },
];

export default function AIDrawer() {
  const { aiOpen, closeAI, aiContext } = useUI();
  const [thread, setThread] = useState(seedThread);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const send = () => {
    if (!draft.trim()) return;
    const msg = draft.trim();
    setThread((t) => [...t, { from: "me", text: msg }]);
    setDraft("");
    setLoading(true);
    setTimeout(() => {
      setThread((t) => [...t, {
        from: "ai",
        text: contextualReply(msg, aiContext),
      }]);
      setLoading(false);
    }, 900);
  };

  return (
    <>
      <div
        onClick={closeAI}
        className={cn("fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity",
          aiOpen ? "opacity-100" : "opacity-0 pointer-events-none")}
      />
      <aside className={cn(
        "fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-card border-l shadow-2xl flex flex-col transition-transform",
        aiOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-14 px-4 border-b flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[color:var(--ai-soft)] text-[color:var(--ai)] grid place-items-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">AI Scrum Coach</div>
            <div className="text-[11px] text-muted-foreground">
              Context: {aiContext || "global"}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={closeAI}><X className="h-4 w-4" /></Button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {thread.map((m, i) => (
            <div key={i} className={cn("flex gap-2", m.from === "me" && "flex-row-reverse")}>
              {m.from === "ai" && (
                <div className="h-7 w-7 rounded-full bg-[color:var(--ai-soft)] text-[color:var(--ai)] grid place-items-center shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.from === "ai"
                  ? "bg-[color:var(--ai-soft)] text-foreground rounded-tl-sm"
                  : "bg-primary text-primary-foreground rounded-tr-sm"
              )}>
                {m.from === "ai" && (
                  <div className="text-[10px] font-semibold tracking-wider text-[color:var(--ai)] mb-0.5">AI</div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="h-7 w-7 rounded-full bg-[color:var(--ai-soft)] text-[color:var(--ai)] grid place-items-center">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="h-10 w-32 rounded-2xl rounded-tl-sm ai-shimmer" />
            </div>
          )}
        </div>

        <div className="border-t p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your sprint, backlog, or focus…"
              className="flex-1 h-10 px-3 rounded-lg bg-muted/60 border text-sm focus:outline-none focus:border-ring"
            />
            <Button onClick={send} size="icon" className="bg-[color:var(--ai)] hover:bg-[color:var(--ai)]/90">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 text-center">
            Coach uses your active space, sprint and recent activity.
          </div>
        </div>
      </aside>
    </>
  );
}

function contextualReply(msg, ctx) {
  const m = msg.toLowerCase();
  if (m.includes("plan")) return "Here's a draft plan: 5 tasks ≈ 12h, including 2 carry-overs. Want me to apply it to your active sprint?";
  if (m.includes("stuck") || m.includes("block")) return "Your Dijkstra task hasn't moved in 3 days. I'd split it into: 1) graph adapter, 2) priority queue, 3) tests. Generate subtasks?";
  if (ctx === "sprint-board") return "Based on velocity (28 → 23 → 21 pts), you're ~12% under capacity. Pull one Medium task or finish the lit review draft.";
  if (ctx === "kanban") return "Three cards have lived in 'In Progress' >4 days. Consider a WIP limit of 3 on this column.";
  return "Got it. I'll keep this in mind for tomorrow's standup. Anything else?";
}
