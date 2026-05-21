import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useStudyMutations } from "@/lib/query-hooks";

const PRIORITIES = ["Highest", "High", "Medium", "Low", "Lowest"];
const AREA_TYPES = ["FYP", "Subject", "Exam", "Task", "Core", "Elective", "Research", "Project", "Lab", "Other"];

function emptyForm() {
  return { domain_name: "", priority: "Medium", area_type: "Subject", weekly_target_hours: 5, description: "" };
}

export default function CreateDomainModal({ open, onOpenChange, domain }) {
  const isEdit = Boolean(domain?.id);
  const { createDomain, updateDomain } = useStudyMutations();
  const mutation = isEdit ? updateDomain : createDomain;
  const [form, setForm] = useState(emptyForm());
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(
      isEdit
        ? {
            domain_name: domain.domain_name || domain.name || "",
            priority: domain.priority || "Medium",
            area_type: domain.area_type || domain.area || "Subject",
            weekly_target_hours: Number(domain.weekly_target_hours ?? domain.weekly_hours ?? 5),
            description: domain.description || "",
          }
        : emptyForm(),
    );
  }, [open, isEdit, domain]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    setError(null);
    if (!form.domain_name.trim()) {
      setError("Domain name is required.");
      return;
    }
    const body = { ...form, domain_name: form.domain_name.trim() };
    const payload = isEdit ? { id: domain.id, body } : body;
    mutation.mutate(payload, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => setError(err.message),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit domain" : "New study domain"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="domain_name">Domain name</Label>
            <Input id="domain_name" value={form.domain_name} onChange={(e) => set("domain_name")(e.target.value)} placeholder="e.g. Final Year Project" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={set("priority")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area type</Label>
              <Select value={form.area_type} onValueChange={set("area_type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREA_TYPES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Weekly target: {form.weekly_target_hours}h</Label>
            <Slider
              min={0}
              max={40}
              step={0.5}
              value={[form.weekly_target_hours]}
              onValueChange={([v]) => set("weekly_target_hours")(v)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description")(e.target.value)} placeholder="Optional notes" />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create domain"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
