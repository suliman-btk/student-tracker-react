import { useState } from "react";
import { CalendarClock, Loader2, Pencil, Repeat, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useStudyMutations } from "@/lib/query-hooks";
import { cn, parseWall, wallDateStr } from "@/lib/utils";

function fmt(value, allDay) {
  if (!value) return "—";
  const d = parseWall(value);
  if (!d || Number.isNaN(d.getTime())) return value;
  return allDay
    ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const localDate = (value) => wallDateStr(value);

const SCOPES = [
  { value: "single", label: "Only this event" },
  { value: "future", label: "This and future events" },
  { value: "all", label: "All events" },
];

export default function EventDetailDialog({ open, onOpenChange, event, onEdit }) {
  const { deleteEvent } = useStudyMutations();
  const [scope, setScope] = useState("single");
  if (!event) return null;

  const isRecurring = Boolean(event.recurrence_type);

  const confirmDelete = (e) => {
    e.preventDefault();
    const args = isRecurring
      ? { id: event.id, scope, occurrence_date: localDate(event.start_time) }
      : { id: event.id };
    deleteEvent.mutate(args, {
      onSuccess: () => { toast.success("Event deleted"); onOpenChange(false); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: event.color_hex || "#4f46e5" }} />
            {event.title}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            {fmt(event.start_time, event.all_day)}
            {event.end_time && ` → ${fmt(event.end_time, event.all_day)}`}
          </div>
          {event.recurrence_type && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Repeat className="h-4 w-4" /> Repeats {event.recurrence_type}
            </div>
          )}
          {event.description && <p className="whitespace-pre-line">{event.description}</p>}
        </div>
        <DialogFooter>
          <AlertDialog onOpenChange={(o) => o && setScope("single")}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {isRecurring ? "recurring event" : "event"}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {isRecurring
                    ? `Choose which occurrences of "${event.title}" to remove.`
                    : `${event.title} will be permanently removed.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              {isRecurring && (
                <div className="space-y-1.5 py-1">
                  {SCOPES.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setScope(s.value)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors",
                        scope === s.value ? "border-foreground bg-muted/60" : "hover:bg-muted/40",
                      )}
                    >
                      {s.label}
                      <span className={cn("h-3.5 w-3.5 rounded-full border", scope === s.value && "bg-foreground")} />
                    </button>
                  ))}
                </div>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>
                  {deleteEvent.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => onEdit(event)}>
            <Pencil className="mr-1.5 h-4 w-4" /> Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
