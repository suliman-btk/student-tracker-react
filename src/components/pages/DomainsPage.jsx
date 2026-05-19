import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Header } from "./SpacesPage";
import { useDomains } from "@/lib/query-hooks";

const priorityColor = { High: "bg-red-100 text-red-700", Medium: "bg-amber-100 text-amber-700", Low: "bg-emerald-100 text-emerald-700" };

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);

export default function DomainsPage() {
  const { data: domainsPayload = [], isLoading, error } = useDomains();
  const domains = asArray(domainsPayload);

  return (
    <div className="space-y-6">
      <Header title="Study Domains" subtitle="Subjects, exams, FYP, and other tracks you manage.">
        <Button><Plus className="h-4 w-4 mr-1.5" /> New domain</Button>
      </Header>
      {isLoading && (
        <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading domains from Laravel...
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error.message}
        </div>
      )}
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Domain</th>
              <th className="text-left px-4 py-2.5">Area</th>
              <th className="text-left px-4 py-2.5">Priority</th>
              <th className="text-left px-4 py-2.5">Difficulty</th>
              <th className="text-left px-4 py-2.5">Weekly target</th>
              <th className="text-left px-4 py-2.5">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {domains.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">
                  <Link to="/domains/$id" params={{ id: String(d.id) }} className="hover:text-primary">
                    {d.domain_name || d.name || `Domain ${d.id}`}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{d.area_type || d.area || "General"}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-md ${priorityColor[d.priority] || "bg-muted"}`}>{d.priority || "Normal"}</span></td>
                <td className="px-4 py-3 text-muted-foreground">{d.difficulty || "-"}</td>
                <td className="px-4 py-3">{d.weekly_target_hours ?? d.weekly_hours ?? 0}h</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-md ${d.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    {d.is_active ? "Active" : "Paused"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && !error && domains.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">No domains found.</div>
        )}
      </div>
    </div>
  );
}
