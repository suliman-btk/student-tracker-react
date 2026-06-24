import { useState } from "react";
import { ChevronRight, FolderOpen, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDomains } from "@/lib/query-hooks";
import CreateTaskModal from "@/components/study/CreateTaskModal";

const asArray = (p) => (Array.isArray(p) ? p : p?.data || []);

export default function SelectDomainModal({ open, onOpenChange, spaceId, sprintId }) {
  const { data: domainsPayload } = useDomains();
  const domains = asArray(domainsPayload).filter((d) => d.is_active !== false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState(null);

  const handleSelect = (domainId) => {
    setSelectedDomainId(domainId);
    setTaskOpen(true);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-xl">Select a domain</DialogTitle>
            <p className="text-sm text-muted-foreground">Pick where this task lives, or start fresh.</p>
          </DialogHeader>

          <div className="px-4 pb-2">
            <button
              onClick={() => handleSelect(null)}
              className="flex w-full items-center gap-3 rounded-xl bg-foreground px-4 py-4 text-background transition-opacity hover:opacity-90"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/20">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Create new task</p>
                <p className="text-xs opacity-70">Start from scratch</p>
              </div>
              <ChevronRight className="ml-auto h-4 w-4 opacity-60" />
            </button>
          </div>

          {domains.length > 0 && (
            <div className="px-4 pb-4">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Your Domains
              </p>
              <div className="space-y-1">
                {domains.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleSelect(d.id)}
                    className="flex w-full items-center gap-3 rounded-xl border bg-card px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                      <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="truncate text-sm font-medium">{d.domain_name || d.name || `Domain ${d.id}`}</p>
                      <p className="text-xs text-muted-foreground">{d.area_type || "General"}</p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateTaskModal
        open={taskOpen}
        onOpenChange={setTaskOpen}
        domainId={selectedDomainId}
        spaceId={spaceId}
        sprintId={sprintId}
      />
    </>
  );
}
