import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, MoreHorizontal, Loader2, ArrowRight, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useSpaces, useStudyMutations } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";
import CreateSpaceModal from "@/components/study/CreateSpaceModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SpacesPage() {
  const { data: spaces = [], isLoading, error } = useSpaces();
  const { setActiveSpace } = useUI();
  const navigate = useNavigate();
  const { deleteSpace } = useStudyMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (space) => { setEditing(space); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <Header title="Study Spaces" subtitle="Scrum or Kanban workspaces — solo or with classmates.">
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> New space</Button>
      </Header>
      <CreateSpaceModal open={modalOpen} onOpenChange={setModalOpen} space={editing} />
      {isLoading && (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading spaces from Laravel...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {spaces.map((s) => (
          <Link
            key={s.id}
            to="/spaces/$spaceId/summary"
            params={{ spaceId: String(s.id) }}
            onClick={() => setActiveSpace(s.id)}
            className="rounded-xl border bg-card p-5 group hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg grid place-items-center text-white font-bold" style={{ background: s.color_hex || s.color || "var(--primary)" }}>
                {s.name[0]}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  <DropdownMenuItem onClick={() => { setActiveSpace(s.id); navigate({ to: "/spaces/$spaceId/summary", params: { spaceId: String(s.id) } }); }}>
                    <ArrowRight className="mr-2 h-4 w-4" /> Open
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openEdit(s)}>
                    <Pencil className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(s)}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <h3 className="mt-3 font-semibold">{s.name}</h3>
            <div className="text-xs text-muted-foreground mt-1">{s.template} · {s.role}</div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Personal
              </div>
              <span className="text-xs text-primary font-medium">Open {">"}</span>
            </div>
          </Link>
        ))}
      </div>
      {!isLoading && spaces.length === 0 && (
        <div className="rounded-xl border bg-card p-8 text-center">
          <h3 className="font-semibold">No spaces yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Create a space to organize sprints, boards, and backlog.</p>
        </div>
      )}

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete space?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.name || "This space"}, its sprints and board will be removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                deleteSpace.mutate(
                  { id: deleting.id },
                  {
                    onSuccess: () => { toast.success("Space deleted"); setDeleting(null); },
                  },
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Header({ title, subtitle, children }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
