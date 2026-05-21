import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useBacklog, useSprints, useStudyMutations } from "@/lib/query-hooks";

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);
const isCompleted = (s) => s.is_completed || s.completed || String(s.status || "").toLowerCase() === "completed";

function parseLocal(value) {
  if (!value) return null;
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(date) {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dayMs(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export default function CreateSprintModal({ open, onOpenChange, spaceId, sprint }) {
  const isEdit = Boolean(sprint?.id);
  const { createSprint, updateSprint } = useStudyMutations();
  const { data: backlogPayload } = useBacklog(spaceId);
  const { data: sprintsPayload } = useSprints(spaceId);
  const backlog = asArray(backlogPayload);
  const allSprints = asArray(sprintsPayload);

  const [form, setForm] = useState({ name: "", goal: "" });
  const [range, setRange] = useState(undefined);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);

  // Date ranges already taken by other (incomplete) sprints in this space.
  const bookedRanges = useMemo(
    () =>
      allSprints
        .filter((s) => !isCompleted(s) && (!isEdit || String(s.id) !== String(sprint.id)))
        .map((s) => ({
          name: s.name || `Sprint ${s.id}`,
          from: parseLocal(s.start_date || s.startDate),
          to: parseLocal(s.end_date || s.endDate),
        }))
        .filter((r) => r.from && r.to),
    [allSprints, isEdit, sprint],
  );

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isEdit) {
      setForm({ name: sprint.name || "", goal: sprint.goal || "" });
      const from = parseLocal(sprint.start_date || sprint.startDate);
      const to = parseLocal(sprint.end_date || sprint.endDate);
      setRange(from && to ? { from, to } : undefined);
    } else {
      setForm({ name: "", goal: "" });
      setRange(undefined);
    }
    setSelected([]);
  }, [open, isEdit, sprint]);

  const today = new Date();
  const disabledMatchers = [
    ...(isEdit ? [] : [{ before: new Date(today.getFullYear(), today.getMonth(), today.getDate()) }]),
    ...bookedRanges.map((r) => ({ from: r.from, to: r.to })),
  ];

  const overlapName = useMemo(() => {
    if (!range?.from || !range?.to) return null;
    const from = dayMs(range.from);
    const to = dayMs(range.to);
    const hit = bookedRanges.find((r) => from <= dayMs(r.to) && to >= dayMs(r.from));
    return hit?.name || null;
  }, [range, bookedRanges]);

  const toggle = (id) =>
    setSelected((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const submit = (event) => {
    event.preventDefault();
    setError(null);
    if (!range?.from || !range?.to) {
      setError("Pick a start and end date.");
      return;
    }
    if (overlapName) {
      setError(`This interval overlaps with "${overlapName}".`);
      return;
    }
    const body = {
      name: form.name.trim() || undefined,
      goal: form.goal.trim() || undefined,
      start_date: toISO(range.from),
      end_date: toISO(range.to),
    };
    if (isEdit) {
      updateSprint.mutate(
        { sprintId: sprint.id, body, spaceId },
        {
          onSuccess: () => { toast.success("Sprint updated"); onOpenChange(false); },
          onError: (err) => setError(err.message),
        },
      );
    } else {
      createSprint.mutate(
        { ...body, space_id: spaceId, task_ids: selected },
        {
          onSuccess: () => { toast.success("Sprint created"); onOpenChange(false); },
          onError: (err) => setError(err.message),
        },
      );
    }
  };

  const pending = isEdit ? updateSprint.isPending : createSprint.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit sprint" : "New sprint"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="sprint-name">Name</Label>
            <Input id="sprint-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Auto-generated if blank" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sprint-goal">Goal</Label>
            <Textarea id="sprint-goal" rows={2} value={form.goal} onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))} placeholder="Optional sprint goal" />
          </div>

          <div className="space-y-1.5">
            <Label>Sprint dates</Label>
            <div className="rounded-lg border p-2">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                disabled={disabledMatchers}
                excludeDisabled
                numberOfMonths={1}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {range?.from && range?.to
                ? `${toISO(range.from)} → ${toISO(range.to)}`
                : "Greyed days are already booked by another sprint."}
            </p>
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Add backlog tasks ({selected.length} selected)</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border p-2">
                {backlog.length === 0 && <p className="px-1 py-2 text-sm text-muted-foreground">No backlog tasks available.</p>}
                {backlog.map((t) => (
                  <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <Checkbox checked={selected.includes(t.id)} onCheckedChange={() => toggle(t.id)} />
                    <span className="flex-1 truncate">{t.title || `Task ${t.id}`}</span>
                    <span className="text-xs text-muted-foreground">{t.priority || "Medium"}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
