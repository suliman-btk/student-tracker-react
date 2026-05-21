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

function fmt(value, allDay) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return allDay
    ? d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : d.toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function EventDetailDialog({ open, onOpenChange, event, onEdit }) {
  const { deleteEvent } = useStudyMutations();
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm" style={{ background: event.color_hex || "#1A4D2E" }} />
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">
                <Trash2 className="mr-1.5 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete event?</AlertDialogTitle>
                <AlertDialogDescription>{event.title} will be permanently removed.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    deleteEvent.mutate(
                      { id: event.id },
                      { onSuccess: () => { toast.success("Event deleted"); onOpenChange(false); } },
                    );
                  }}
                >
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
