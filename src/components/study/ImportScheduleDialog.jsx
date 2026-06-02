import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { aiApi } from "@/lib/api";
import { useStudyMutations } from "@/lib/query-hooks";

const COLORS = ["#4f46e5", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#0891b2"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const VALID_DAYS = new Set(DAYS);

function normaliseEvent(e, i) {
  const days = Array.isArray(e.recurrence_days)
    ? e.recurrence_days.map((d) => String(d).toLowerCase()).filter((d) => VALID_DAYS.has(d))
    : [];
  return {
    title: e.title || "",
    description: e.description || "",
    recurrence_days: days,
    start_time_of_day: (e.start_time_of_day || "").slice(0, 5),
    end_time_of_day: (e.end_time_of_day || "").slice(0, 5),
    color_hex: COLORS[i % COLORS.length],
  };
}

export default function ImportScheduleDialog({ open, onOpenChange }) {
  const { bulkCreateEvents } = useStudyMutations();
  const fileRef = useRef(null);
  const [stage, setStage] = useState("upload");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [repeat, setRepeat] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) {
      setStage("upload");
      setLoading(false);
      setError(null);
      setEvents([]);
      setRepeat(true);
      setStartDate("");
      setEndDate("");
    }
  }, [open]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const extracted = await aiApi.extractSchedule(file);
      if (!extracted.length) {
        setError("No classes could be read from that file. Try a clearer image or PDF.");
        return;
      }
      setEvents(extracted.map(normaliseEvent));
      setStage("review");
    } catch (err) {
      setError(err.message || "Failed to read the file.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setEvent = (i, key, value) => setEvents((list) => list.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));
  const removeEvent = (i) => setEvents((list) => list.filter((_, idx) => idx !== i));
  const toggleDay = (i, d) =>
    setEvent(i, "recurrence_days", events[i].recurrence_days.includes(d)
      ? events[i].recurrence_days.filter((x) => x !== d)
      : [...events[i].recurrence_days, d]);

  const save = () => {
    setError(null);
    if (!startDate) {
      setError("Pick a start date for the schedule.");
      return;
    }
    const payload = [];
    for (const e of events) {
      if (!e.title.trim() || !e.start_time_of_day) continue;
      const start = `${startDate}T${e.start_time_of_day}`;
      const end = e.end_time_of_day ? `${startDate}T${e.end_time_of_day}` : undefined;
      const ev = {
        title: e.title.trim(),
        description: e.description || undefined,
        start_time: start,
        end_time: end,
        all_day: false,
        color_hex: e.color_hex,
      };
      if (repeat) {
        ev.recurrence_type = "weekly";
        ev.recurrence_interval = 1;
        if (e.recurrence_days.length) ev.recurrence_days = e.recurrence_days;
        if (endDate) ev.recurrence_end_date = endDate;
      }
      payload.push(ev);
    }
    if (!payload.length) {
      setError("Each class needs a title and a start time.");
      return;
    }
    bulkCreateEvents.mutate(payload, {
      onSuccess: (created) => {
        toast.success(`${created?.length || payload.length} class event(s) added`);
        onOpenChange(false);
      },
      onError: (err) => setError(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--ai)]" /> Import class schedule with AI
          </DialogTitle>
        </DialogHeader>

        {stage === "upload" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Upload your class timetable (image or PDF). The AI will extract each class, its room, day, and
              times as recurring weekly events for you to review before saving.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-10 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              {loading ? "Reading your schedule…" : "Click to choose an image or PDF"}
            </button>
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile} />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {stage === "review" && (
          <div className="space-y-4">
            <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium">Repeat weekly</span>
                <Switch checked={repeat} onCheckedChange={setRepeat} />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">{repeat ? "Semester start date" : "Date"}</Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                {repeat && (
                  <div className="space-y-1">
                    <Label className="text-xs">Repeat until (optional)</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {events.map((e, i) => (
                <div key={i} className="space-y-3 rounded-xl border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 h-3 w-3 shrink-0 rounded-full" style={{ background: e.color_hex }} />
                    <Input
                      value={e.title}
                      onChange={(ev) => setEvent(i, "title", ev.target.value)}
                      placeholder="Class name (e.g. C IT6224 Lecture)"
                      className="font-medium"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeEvent(i)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Start time</Label>
                      <Input type="time" value={e.start_time_of_day} onChange={(ev) => setEvent(i, "start_time_of_day", ev.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">End time</Label>
                      <Input type="time" value={e.end_time_of_day} onChange={(ev) => setEvent(i, "end_time_of_day", ev.target.value)} />
                    </div>
                  </div>

                  {repeat && (
                    <div className="space-y-1">
                      <Label className="text-xs">On days</Label>
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS.map((d) => (
                          <label key={d} className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs capitalize">
                            <Checkbox checked={e.recurrence_days.includes(d)} onCheckedChange={() => toggleDay(i, d)} />
                            {d.slice(0, 3)}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs">Room / notes</Label>
                    <Textarea rows={1} value={e.description} onChange={(ev) => setEvent(i, "description", ev.target.value)} placeholder="Room / location" />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={save} disabled={bulkCreateEvents.isPending}>
                {bulkCreateEvents.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save {events.length} class event(s)
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
