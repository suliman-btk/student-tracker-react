import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDomains, useStudyMutations } from "@/lib/query-hooks";
import { PRIORITIES, PRIORITY_COLOURS } from "@/lib/priority";
import { cn } from "@/lib/utils";

const HOUR_CHIPS = [
  { label: "30m", value: 0.5 },
  { label: "1h", value: 1 },
  { label: "2h", value: 2 },
  { label: "4h", value: 4 },
  { label: "8h", value: 8 },
];

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Very Hard"];
const NO_DOMAIN = "__none__";
const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);

function defaultDeadline() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function emptyForm(domainId) {
  return {
    title: "",
    domain_id: domainId ? String(domainId) : NO_DOMAIN,
    deadline: defaultDeadline(),
    expected_hours: 2,
    priority: "Medium",
    difficulty: "Medium",
    task_type: "Normal",
    description: "",
  };
}

export default function CreateTaskModal({ open, onOpenChange, domainId, spaceId, sprintId, task }) {
  const isEdit = Boolean(task?.id);
  const lockedDomain = Boolean(domainId);
  const { data: domainsPayload } = useDomains();
  const domains = asArray(domainsPayload);
  const { createTask, createDomainTask, updateTask } = useStudyMutations();
  const mutation = isEdit ? updateTask : domainId ? createDomainTask : createTask;
  const [form, setForm] = useState(emptyForm(domainId));
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [error, setError] = useState(null);
  const [customHours, setCustomHours] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubtaskDraft("");
    setCustomHours(false);
    if (isEdit) {
      setForm({
        title: task.title || "",
        domain_id: task.domain_id ? String(task.domain_id) : NO_DOMAIN,
        deadline: (task.deadline || task.due_date || defaultDeadline()).slice(0, 10),
        expected_hours: Number(task.expected_hours ?? 2),
        priority: task.priority || "Medium",
        difficulty: task.difficulty || "Medium",
        task_type: task.task_type || "Normal",
        description: task.description || "",
      });
      setSubtasks((task.subtasks || task.sub_tasks || []).map((s) => ({ title: s.title, status: s.status || "Pending" })));
    } else {
      setForm(emptyForm(domainId));
      setSubtasks([]);
    }
  }, [open, isEdit, task, domainId]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const addSubtask = () => {
    if (!subtaskDraft.trim()) return;
    setSubtasks((s) => [...s, { title: subtaskDraft.trim(), status: "Pending" }]);
    setSubtaskDraft("");
  };

  const submit = (event) => {
    event.preventDefault();
    setError(null);
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    const body = {
      title: form.title.trim(),
      deadline: form.deadline,
      expected_hours: Number(form.expected_hours) || 1,
      priority: form.priority,
      difficulty: form.difficulty,
      task_type: form.task_type,
      description: form.description || undefined,
      subtasks: subtasks.length ? subtasks : undefined,
    };
    if (form.domain_id !== NO_DOMAIN) body.domain_id = Number(form.domain_id);
    if (spaceId) body.space_id = spaceId;
    if (sprintId && !isEdit) body.sprint_id = sprintId;

    let payload;
    if (isEdit) payload = { id: task.id, body, spaceId };
    else if (domainId) payload = { domainId, body };
    else payload = body;

    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => setError(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
          {sprintId && !isEdit && (
            <p className="text-xs text-muted-foreground mt-0.5">Will be added to the selected sprint</p>
          )}
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title")(e.target.value)} placeholder="What needs to be done?" />
          </div>

          {!lockedDomain && (
            <div className="space-y-1.5">
              <Label>Domain</Label>
              <Select value={form.domain_id} onValueChange={set("domain_id")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_DOMAIN}>No domain</SelectItem>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.domain_name || d.name || `Domain ${d.id}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <Input id="deadline" type="date" value={form.deadline} onChange={(e) => set("deadline")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Expected hours</Label>
              <div className="flex flex-wrap gap-1.5">
                {HOUR_CHIPS.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => { set("expected_hours")(chip.value); setCustomHours(false); }}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      !customHours && form.expected_hours === chip.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomHours(true)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                    customHours
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:bg-muted",
                  )}
                >
                  Custom
                </button>
              </div>
              {customHours && (
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.expected_hours}
                  onChange={(e) => set("expected_hours")(e.target.value)}
                  placeholder="e.g. 1.5"
                  className="mt-1.5"
                  autoFocus
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("priority")(p)}
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                      form.priority === p
                        ? "border-transparent text-white"
                        : "border-border bg-background hover:bg-muted",
                    )}
                    style={form.priority === p ? { background: PRIORITY_COLOURS[p] } : {}}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={form.difficulty} onValueChange={set("difficulty")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.task_type} onValueChange={set("task_type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-desc">Description</Label>
            <Textarea id="task-desc" rows={2} value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label>Subtasks</Label>
            {subtasks.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
                <span className="flex-1">{s.title}</span>
                <button type="button" onClick={() => setSubtasks((list) => list.filter((_, idx) => idx !== i))}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                placeholder="Add a subtask"
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtask}><Plus className="h-4 w-4" /></Button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
