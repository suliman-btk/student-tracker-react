import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIBadge({ className }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[color:var(--ai-soft)] text-[color:var(--ai)]",
      className
    )}>
      <Sparkles className="h-2.5 w-2.5" /> AI
    </span>
  );
}

export function AIInsightCard({ title, children, action, loading }) {
  return (
    <div className="rounded-xl border bg-card p-4 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[color:var(--ai)] to-transparent opacity-60" />
      <div className="flex items-center gap-2 mb-2">
        <AIBadge />
        <h3 className="text-sm font-semibold">{title}</h3>
        <div className="ml-auto">{action}</div>
      </div>
      {loading ? <div className="h-12 rounded-md ai-shimmer" /> : <div className="text-sm text-foreground/90 leading-relaxed">{children}</div>}
    </div>
  );
  
}
