import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudyMutations } from "@/lib/query-hooks";
import DateTimePicker from "@/components/study/DateTimePicker";
import { cn } from "@/lib/utils";

const COLORS = ["#1A4D2E", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#0891b2"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const NONE = "none";

function toLocalInput(value, fallbackDate) {
  const d = value ? new Date(value) : fallbackDate;
  if (!d || Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CreateEventModal({ open, onOpenChange, event, initialDate, spaceId }) {
  const isEdit = Boolean(event?.id);
  const { createEvent, updateEvent } = useStudyMutations();
  const mutation = isEdit ? updateEvent : createEvent;
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isEdit) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        all_day: Boolean(event.all_day),
        start: toLocalInput(event.start_time),
        end: toLocalInput(event.end_time),
        recurrence_type: event.recurrence_type || NONE,
        recurrence_interval: event.recurrence_interval || 1,
        recurrence_days: event.recurrence_days || [],
        recurrence_end_date: (event.recurrence_end_date || "").slice(0, 10),
        color_hex: event.color_hex || COLORS[0],
        reminder_minutes: event.reminder_minutes ?? "",
      });
    } else {
      const base = initialDate ? new Date(initialDate) : new Date();
      base.setHours(9, 0, 0, 0);
      const end = new Date(base);
      end.setHours(10, 0, 0, 0);
      setForm({
        title: "",
        description: "",
        all_day: false,
        start: toLocalInput(null, base),
        end: toLocalInput(null, end),
        recurrence_type: NONE,
        recurrence_interval: 1,
        recurrence_days: [],
        recurrence_end_date: "",
        color_hex: COLORS[0],
        reminder_minutes: "",
      });
    }
  }, [open, isEdit, event, initialDate]);

  if (!form) return null;
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const toggleDay = (d) =>
    setForm((f) => ({
      ...f,
      recurrence_days: f.recurrence_days.includes(d)
        ? f.recurrence_days.filter((x) => x !== d)
        : [...f.recurrence_days, d],
    }));

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.start) { setError("Start time is required."); return; }
    const body = {
      title: form.title.trim(),
      description: form.description || undefined,
      start_time: form.start,
      end_time: form.end || undefined,
      all_day: form.all_day,
      color_hex: form.color_hex,
      reminder_minutes: form.reminder_minutes === "" ? undefined : Number(form.reminder_minutes),
    };
    if (spaceId && !isEdit) body.space_id = spaceId;
    if (form.recurrence_type !== NONE) {
      body.recurrence_type = form.recurrence_type;
      body.recurrence_interval = Number(form.recurrence_interval) || 1;
      if (form.recurrence_type === "weekly") body.recurrence_days = form.recurrence_days;
      if (form.recurrence_end_date) body.recurrence_end_date = form.recurrence_end_date;
    }
    mutation.mutate(
      isEdit ? { id: event.id, body } : body,
      {
        onSuccess: () => { toast.success(isEdit ? "Event updated" : "Event created"); onOpenChange(false); },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "New event"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-title">Title</Label>
            <Input id="ev-title" value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="Event title" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-desc">Description</Label>
            <Textarea id="ev-desc" rows={2} value={form.description} onChange={(e) => set("description")(e.target.value)} />
          </div>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">All day</span>
            <Switch checked={form.all_day} onCheckedChange={set("all_day")} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <DateTimePicker value={form.start} onChange={set("start")} showTime={!form.all_day} placeholder="Start date" />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <DateTimePicker value={form.end} onChange={set("end")} showTime={!form.all_day} placeholder="End date" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Repeat</Label>
              <Select value={form.recurrence_type} onValueChange={set("recurrence_type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.recurrence_type !== NONE && (
              <div className="space-y-1.5">
                <Label htmlFor="ev-int">Every (interval)</Label>
                <Input id="ev-int" type="number" min="1" value={form.recurrence_interval} onChange={(e) => set("recurrence_interval")(e.target.value)} />
              </div>
            )}
          </div>
          {form.recurrence_type === "weekly" && (
            <div className="space-y-1.5">
              <Label>On days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((d) => (
                  <label key={d} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs capitalize">
                    <Checkbox checked={form.recurrence_days.includes(d)} onCheckedChange={() => toggleDay(d)} />
                    {d.slice(0, 3)}
                  </label>
                ))}
              </div>
            </div>
          )}
          {form.recurrence_type !== NONE && (
            <div className="space-y-1.5">
              <Label htmlFor="ev-rend">Repeat until</Label>
              <Input id="ev-rend" type="date" value={form.recurrence_end_date} onChange={(e) => set("recurrence_end_date")(e.target.value)} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("color_hex")(c)}
                    className={cn("grid h-7 w-7 place-items-center rounded-md", form.color_hex === c && "ring-2 ring-offset-2 ring-foreground")}
                    style={{ background: c }}
                  >
                    {form.color_hex === c && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-rem">Reminder (min before)</Label>
              <Input id="ev-rem" type="number" min="0" value={form.reminder_minutes} onChange={(e) => set("reminder_minutes")(e.target.value)} placeholder="e.g. 15" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
