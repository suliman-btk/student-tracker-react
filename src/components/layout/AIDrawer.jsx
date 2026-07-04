import { useEffect, useRef, useState } from "react";
import { Bot, CheckCircle2, Loader2, MessageSquareText, Send, Sparkles, X } from "lucide-react";
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
      seed.push(
        bubble(
          "ai",
          "Good to see you! You haven't done your daily check-in yet. Tap below to check in and get today's coaching.",
        ),
      );
    } else if (coaching) {
      seed.push(bubble("ai", coaching));
    }

    if (suggestions.length > 0) {
      const list = suggestions
        .slice(0, 3)
        .map((s) => `• ${s.title || s.task?.title}`)
        .join("\n");
      seed.push(bubble("ai", `Here are some task suggestions based on your backlog:\n${list}`));
    }

    if (seed.length === 0) {
      seed.push(
        bubble(
          "ai",
          'Hey! I\'m Azzam, your AI Scrum Coach. Ask me anything — "am I on track?", "what should I focus on today?", or "is my sprint realistic?"',
        ),
      );
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
      setMessages((prev) => [
        ...prev,
        bubble("ai", data?.reply || "I'm not sure how to answer that. Try rephrasing."),
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        bubble("ai", "Sorry, I couldn't reach the AI right now. Try again in a moment."),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
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
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l bg-background shadow-2xl transition-transform sm:w-[460px]",
          aiOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="shrink-0 border-b bg-white px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-primary text-primary-foreground shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-base font-semibold leading-tight">Azzam</div>
                <span className="rounded bg-ai-soft px-2 py-0.5 text-[11px] font-medium text-ai">
                  Coach
                </span>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                Sprint planning, focus advice, and task triage
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-md" onClick={closeAI}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!submitted && (
            <Button
              size="sm"
              variant="outline"
              className="mt-4 h-10 w-full justify-start rounded-md bg-background text-sm"
              onClick={() => setStandupOpen(true)}
            >
              <CheckCircle2 className="h-4 w-4 text-ai" />
              Complete daily check-in
            </Button>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin">
          {messages.length === 0 && !loading && (
            <div className="rounded-md border bg-white p-4 text-sm text-muted-foreground shadow-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
                <MessageSquareText className="h-4 w-4 text-ai" />
                Ask your coach
              </div>
              Try asking what to focus on today, whether your sprint is realistic, or how to recover
              after a slow day.
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role === "ai" && (
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ai-soft text-ai">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[82%] whitespace-pre-line rounded-md px-3.5 py-3 text-sm leading-6 shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border bg-white text-foreground",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-2">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-ai-soft text-ai">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5 rounded-md border bg-white px-4 py-3 shadow-sm">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex shrink-0 items-end gap-2 border-t bg-white p-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask your coach anything…"
            rows={1}
            className="max-h-32 flex-1 resize-none rounded-md border bg-background px-3.5 py-3 text-sm shadow-sm scrollbar-thin focus:outline-none focus:ring-2 focus:ring-primary/10"
            style={{ fieldSizing: "content" }}
          />
          <Button
            size="icon"
            disabled={!input.trim() || loading}
            onClick={send}
            className="h-11 w-11 shrink-0 rounded-md"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <StandupModal open={standupOpen} onOpenChange={setStandupOpen} />
    </>
  );
}
