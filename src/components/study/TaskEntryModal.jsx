import { useState } from "react";
import { FilePlus2, FolderOpen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateTaskModal from "./CreateTaskModal";
import AddFromDomainModal from "./AddFromDomainModal";

export default function TaskEntryModal({ open, onOpenChange, spaceId, sprintId }) {
  const [next, setNext] = useState(null); // 'create' | 'domain'

  const choose = (mode) => {
    onOpenChange(false);
    setNext(mode);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add a task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <button
              onClick={() => choose("create")}
              className="flex items-center gap-4 rounded-xl border p-4 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <FilePlus2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Create new task</div>
                <div className="text-xs text-muted-foreground mt-0.5">Start from scratch</div>
              </div>
            </button>
            <button
              onClick={() => choose("domain")}
              className="flex items-center gap-4 rounded-xl border p-4 text-left hover:bg-muted/60 transition-colors"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center shrink-0">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">Add from domain</div>
                <div className="text-xs text-muted-foreground mt-0.5">Pick tasks from your study domains</div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateTaskModal
        open={next === "create"}
        onOpenChange={(o) => !o && setNext(null)}
        spaceId={spaceId}
        sprintId={sprintId}
      />
      <AddFromDomainModal
        open={next === "domain"}
        onOpenChange={(o) => !o && setNext(null)}
        spaceId={spaceId}
        sprintId={sprintId}
      />
    </>
  );
}
