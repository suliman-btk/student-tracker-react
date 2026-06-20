import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStudyMutations } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

const COLORS = ["#4f46e5", "#2563eb", "#7c3aed", "#db2777", "#dc2626", "#ea580c", "#16a34a", "#0891b2"];

const generateKey = (name) => {
  const words = name.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, "").split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  let key = "";
  for (const w of words) {
    key += /^\d+$/.test(w) ? w : w[0];
    if (key.length >= 10) break;
  }
  return key.slice(0, 10);
};

export default function CreateSpaceModal({ open, onOpenChange, space }) {
  const isEdit = Boolean(space?.id);
  const { createSpace, updateSpace } = useStudyMutations();
  const mutation = isEdit ? updateSpace : createSpace;
  const [form, setForm] = useState({ name: "", key: "", template: "Scrum", color_hex: COLORS[0] });
  const [keyTouched, setKeyTouched] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setKeyTouched(false);
    setForm(
      isEdit
        ? {
            name: space.name || "",
            key: space.key || "",
            template: space.template || "Scrum",
            color_hex: space.color_hex || space.color || COLORS[0],
          }
        : { name: "", key: "", template: "Scrum", color_hex: COLORS[0] },
    );
  }, [open, isEdit, space]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm((f) => ({ ...f, name, ...(!keyTouched && !isEdit ? { key: generateKey(name) } : {}) }));
  };

  const handleKeyChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/\s/g, "");
    setKeyTouched(true);
    setForm((f) => ({ ...f, key: val }));
  };

  const submit = (event) => {
    event.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError("Space name is required.");
      return;
    }
    if (!form.key.trim()) {
      setError("Space key is required.");
      return;
    }
    const body = { name: form.name.trim(), template: form.template, color_hex: form.color_hex };
    if (!isEdit) body.key = form.key.trim();
    mutation.mutate(
      isEdit ? { id: space.id, body } : body,
      {
        onSuccess: () => onOpenChange(false),
        onError: (err) => setError(err.message),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit space" : "New study space"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="space-name">Name</Label>
            <Input id="space-name" value={form.name} onChange={handleNameChange} placeholder="e.g. Semester 8" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="space-key">Key</Label>
              <Input
                id="space-key"
                value={form.key}
                maxLength={10}
                disabled={isEdit}
                onChange={handleKeyChange}
                placeholder="SEM8"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select value={form.template} onValueChange={set("template")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Scrum">Scrum</SelectItem>
                  <SelectItem value="Kanban">Kanban</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set("color_hex")(c)}
                  className={cn("grid h-8 w-8 place-items-center rounded-md", form.color_hex === c && "ring-2 ring-offset-2 ring-foreground")}
                  style={{ background: c }}
                >
                  {form.color_hex === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create space"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
