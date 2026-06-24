import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, MoreHorizontal, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Header } from "./SpacesPage";
import { useDomains, useStudyMutations } from "@/lib/query-hooks";
import CreateDomainModal from "@/components/study/CreateDomainModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const priorityColor = {
  Highest: "bg-red-100 text-red-700",
  High: "bg-orange-100 text-orange-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-blue-100 text-blue-700",
  Lowest: "bg-emerald-100 text-emerald-700",
};

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);

export default function DomainsPage() {
  const { data: domainsPayload = [], isLoading, error } = useDomains();
  const domains = asArray(domainsPayload);
  const { toggleDomain, deleteDomain } = useStudyMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [pausedOpen, setPausedOpen] = useState(false);

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (domain) => { setEditing(domain); setModalOpen(true); };

  return (
    <div className="space-y-6">
      <Header title="Study Domains" subtitle="Subjects, exams, FYP, and other tracks you manage.">
        <Button variant="outline" onClick={() => setPausedOpen(true)}>
          <Power className="h-4 w-4 mr-1.5" /> Paused domains
        </Button>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-1.5" /> New domain</Button>
      </Header>
      {isLoading && (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading domains from Laravel...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Domain</th>
              <th className="text-left px-4 py-2.5">Area</th>
              <th className="text-left px-4 py-2.5">Priority</th>
              <th className="text-left px-4 py-2.5">Weekly target</th>
              <th className="text-left px-4 py-2.5">Active</th>
              <th className="w-10 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {domains.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <Link to="/domains/$id" params={{ id: String(d.id) }} className="hover:text-primary">
                    {d.domain_name || d.name || `Domain ${d.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.area_type || d.area || "General"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-md ${priorityColor[d.priority] || "bg-muted"}`}>{d.priority || "Normal"}</span></td>
                <td className="px-4 py-3">{d.weekly_target_hours ?? d.weekly_hours ?? 0}h</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${d.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {d.is_active ? "Active" : "Paused"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(d)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleDomain.mutate({ id: d.id })}>
                        <Power className="mr-2 h-4 w-4" /> {d.is_active ? "Pause" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(d)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && !error && domains.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No domains found.</div>
        )}
      </div>

      <CreateDomainModal open={modalOpen} onOpenChange={setModalOpen} domain={editing} />

      <Dialog open={pausedOpen} onOpenChange={setPausedOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Paused Domains</DialogTitle>
          </DialogHeader>
          <PausedDomainsPanel
            domains={domains}
            toggleDomain={toggleDomain}
            onDelete={(d) => { setPausedOpen(false); setDeleting(d); }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(o) => { if (!o) { setDeleting(null); setDeleteError(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete domain?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.domain_name || "This domain"} will be permanently removed. Domains with tasks cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                setDeleteError(null);
                deleteDomain.mutate(
                  { id: deleting.id },
                  {
                    onSuccess: () => setDeleting(null),
                    onError: (err) => setDeleteError(err.message),
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

function PausedDomainsPanel({ domains, toggleDomain, onDelete }) {
  const paused = domains.filter((d) => !d.is_active);
  if (paused.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No paused domains. All domains are active.</p>;
  }
  return (
    <div className="space-y-2 py-2">
      {paused.map((d) => (
        <div key={d.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{d.domain_name || d.name || `Domain ${d.id}`}</p>
            <p className="text-xs text-muted-foreground">{d.area_type || "General"} · {d.priority || "Normal"}</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toggleDomain.mutate({ id: d.id })}
            disabled={toggleDomain.isPending}
          >
            <Power className="mr-1.5 h-3.5 w-3.5" /> Activate
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(d)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
