import { useEffect, useRef, useState } from "react";
import { Loader2, Plus, Sparkles, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { aiApi } from "@/lib/api";
import { useStudyMutations } from "@/lib/query-hooks";

const PRIORITIES = ["Lowest", "Low", "Medium", "High", "Critical", "Highest"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Very Hard"];

function normaliseTask(t) {
  return {
    title: t.title || "",
    description: t.description || "",
    deadline: (t.deadline || "").slice(0, 10),
    expected_hours: Number(t.expected_hours ?? 2),
    priority: PRIORITIES.includes(t.priority) ? t.priority : "Medium",
    difficulty: DIFFICULTIES.includes(t.difficulty) ? t.difficulty : "Medium",
    task_type: t.task_type === "Emergency" ? "Emergency" : "Normal",
    subtasks: Array.isArray(t.subtasks) ? t.subtasks.map((s) => ({ title: s.title || String(s) })) : [],
  };
}

export default function ImportTasksDialog({ open, onOpenChange, domainId }) {
  const { bulkCreateDomainTasks } = useStudyMutations();
  const fileRef = useRef(null);
  const [stage, setStage] = useState("upload"); // upload | review
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (!open) {
      setStage("upload");
      setLoading(false);
      setError(null);
      setTasks([]);
    }
  }, [open]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const extracted = await aiApi.extractTasks(file, domainId);
      if (!extracted.length) {
        setError("No tasks could be read from that file. Try a clearer image or PDF.");
        return;
      }
      setTasks(extracted.map(normaliseTask));
      setStage("review");
    } catch (err) {
      setError(err.message || "Failed to read the file.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const setTask = (i, key, value) => setTasks((list) => list.map((t, idx) => (idx === i ? { ...t, [key]: value } : t)));
  const removeTask = (i) => setTasks((list) => list.filter((_, idx) => idx !== i));
  const addTask = () => setTasks((list) => [...list, normaliseTask({})]);

  const addSubtask = (i) => setTask(i, "subtasks", [...tasks[i].subtasks, { title: "" }]);
  const setSubtask = (i, j, value) =>
    setTask(i, "subtasks", tasks[i].subtasks.map((s, idx) => (idx === j ? { title: value } : s)));
  const removeSubtask = (i, j) => setTask(i, "subtasks", tasks[i].subtasks.filter((_, idx) => idx !== j));

  const save = () => {
    const cleaned = tasks
      .filter((t) => t.title.trim())
      .map((t) => ({
        title: t.title.trim(),
        description: t.description || undefined,
        deadline: t.deadline || undefined,
        expected_hours: Number(t.expected_hours) || 1,
        priority: t.priority,
        difficulty: t.difficulty,
        task_type: t.task_type,
        subtasks: t.subtasks.filter((s) => s.title.trim()).map((s) => ({ title: s.title.trim() })),
      }));
    if (!cleaned.length) {
      setError("Add at least one task with a title.");
      return;
    }
    bulkCreateDomainTasks.mutate(
      { domainId, tasks: cleaned },
      {
        onSuccess: (created) => {
          toast.success(`${created?.length || cleaned.length} task(s) added`);
          onOpenChange(false);
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--ai)]" /> Import tasks with AI
          </DialogTitle>
        </DialogHeader>

        {stage === "upload" && (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Upload your teaching plan, course outline, or assessment schedule (image or PDF). The AI will
              extract tasks, subtasks, and suggested deadlines & priorities for you to review before saving.
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 px-6 py-10 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/40"
            >
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              {loading ? "Reading your file…" : "Click to choose an image or PDF"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {stage === "review" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review and edit the {tasks.length} extracted task(s). Fill in any missing deadlines, then save.
            </p>
            <div className="space-y-3">
              {tasks.map((t, i) => (
                <div key={i} className="space-y-3 rounded-xl border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <Input
                      value={t.title}
                      onChange={(e) => setTask(i, "title", e.target.value)}
                      placeholder="Task title"
                      className="font-medium"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTask(i)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Deadline</Label>
                      <Input type="date" value={t.deadline} onChange={(e) => setTask(i, "deadline", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Expected hours</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={t.expected_hours}
                        onChange={(e) => setTask(i, "expected_hours", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Priority</Label>
                      <Select value={t.priority} onValueChange={(v) => setTask(i, "priority", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Difficulty</Label>
                      <Select value={t.difficulty} onValueChange={(v) => setTask(i, "difficulty", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIFFICULTIES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select value={t.task_type} onValueChange={(v) => setTask(i, "task_type", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Normal">Normal</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      rows={2}
                      value={t.description}
                      onChange={(e) => setTask(i, "description", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Subtasks</Label>
                    {t.subtasks.map((s, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Input value={s.title} onChange={(e) => setSubtask(i, j, e.target.value)} placeholder="Subtask" />
                        <button type="button" onClick={() => removeSubtask(i, j)}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => addSubtask(i)}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Add subtask
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={addTask}>
              <Plus className="mr-1.5 h-4 w-4" /> Add task
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="button" onClick={save} disabled={bulkCreateDomainTasks.isPending}>
                {bulkCreateDomainTasks.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save {tasks.length} task(s)
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
