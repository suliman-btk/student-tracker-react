import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useSpaces } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";

export default function CompatibilityWorkspaceRedirect({ tab = "summary" }) {
  const navigate = useNavigate();
  const { activeSpaceId, setActiveSpace } = useUI();
  const { data: spaces = [], isLoading, error } = useSpaces();
  const target = activeSpaceId || spaces[0]?.id;

  useEffect(() => {
    if (!target) return;
    setActiveSpace(target);
    navigate({ to: `/spaces/${target}/${tab}`, replace: true });
  }, [target, tab, navigate, setActiveSpace]);

  if (isLoading) {
    return <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Finding active workspace...</div>;
  }
  if (error) return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error.message}</div>;
  return <div className="rounded-lg border bg-card p-8 text-sm text-muted-foreground">Create a study space first.</div>;
}
