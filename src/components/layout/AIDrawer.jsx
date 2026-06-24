import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles, X } from "lucide-react";
import { useUI } from "@/store/ui";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAiSuggestions, useStandupToday } from "@/lib/query-hooks";
import { normalizeFeedback } from "@/lib/standup";
import { aiApi } from "@/lib/api";
import StandupModal from "@/components/study/StandupModal";

const asArray = (p) => (Array.isArray(p) ? p : p?.data || []);

function bubble(role, text) {
  return { role, text, id: Math.random() };
}

export default function AIDrawer() {
  const { aiOpen, aiContext, closeAI } = useUI();
  const { data: standup } = useStandupToday();
  const { data: suggestionsPayload } = useAiSuggestions();
  const suggestions = asArray(suggestionsPayload);
  const [standupOpen, setStandupOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const seededRef = useRef(false);

  const feedback = normalizeFeedback(standup?.data?.ai_feedback);
  const coaching = feedback?.coaching;
  const submitted = standup?.submitted;

  // Reset the thread when the drawer closes so the next open re-seeds fresh.
  useEffect(() => {
    if (!aiOpen) {
      seededRef.current = false;
      setMessages([]);
    }
  }, [aiOpen]);

  // Seed the thread once per open, but only after the standup query has resolved
  // so we read the real check-in state rather than the loading-undefined default.
  useEffect(() => {
    if (!aiOpen || seededRef.current || standup === undefined) return;
    seededRef.current = true;
    const seed = [];

    if (!submitted) {
      seed.push(bubble("ai", "Good to see you! You haven't done your daily check-in yet. Tap below to check in and get today's coaching."));
    } else if (coaching) {
      seed.push(bubble("ai", coaching));
    }

    if (suggestions.length > 0) {
      const list = suggestions.slice(0, 3).map((s) => `• ${s.title || s.task?.title}`).join("\n");
      seed.push(bubble("ai", `Here are some task suggestions based on your backlog:\n${list}`));
    }

    if (seed.length === 0) {
      seed.push(bubble("ai", "Hey! I'm Azzam, your AI Scrum Coach. Ask me anything — \"am I on track?\", \"what should I focus on today?\", or \"is my sprint realistic?\""));
    }

    setMessages(seed);
  }, [aiOpen, standup, submitted, coaching, suggestions]);

  // Inject sprint review when it arrives via aiContext
  useEffect(() => {
    if (!aiOpen || !aiContext?.sprintReview) return;
    setMessages((prev) => [
      ...prev,
      bubble("ai", `Sprint complete! Here's your retrospective:\n\n${aiContext.sprintReview}`),
    ]);
  }, [aiOpen, aiContext?.sprintReview]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when drawer opens
  useEffect(() => {
    if (aiOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [aiOpen]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((prev) => [...prev, bubble("user", text)]);
    setLoading(true);
    try {
      const data = await aiApi.chat(text);
      setMessages((prev) => [...prev, bubble("ai", data?.reply || "I'm not sure how to answer that. Try rephrasing.")]);
    } catch {
      setMessages((prev) => [...prev, bubble("ai", "Sorry, I couldn't reach the AI right now. Try again in a moment.")]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      <div
        onClick={closeAI}
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity",
          aiOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-card border-l shadow-2xl flex flex-col transition-transform",
          aiOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="h-14 px-4 border-b flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-lg bg-[color:var(--ai-soft)] text-[color:var(--ai)] grid place-items-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Azzam</div>
            <div className="text-[11px] text-muted-foreground">Ask me anything about your work</div>
          </div>
          {!submitted && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStandupOpen(true)}>
              Check in
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={closeAI}><X className="h-4 w-4" /></Button>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              {msg.role === "ai" && (
                <div className="h-6 w-6 rounded-full bg-[color:var(--ai-soft)] grid place-items-center shrink-0 mr-2 mt-0.5">
                  <Sparkles className="h-3 w-3 text-[color:var(--ai)]" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="h-6 w-6 rounded-full bg-[color:var(--ai-soft)] grid place-items-center shrink-0 mr-2 mt-0.5">
                <Sparkles className="h-3 w-3 text-[color:var(--ai)]" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t p-3 flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your coach anything…"
            rows={1}
            className="flex-1 resize-none rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary max-h-32 scrollbar-thin"
            style={{ fieldSizing: "content" }}
          />
          <Button
            size="icon"
            disabled={!input.trim() || loading}
            onClick={send}
            className="h-10 w-10 shrink-0 rounded-xl"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <StandupModal open={standupOpen} onOpenChange={setStandupOpen} />
    </>
  );
}
