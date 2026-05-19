import { tasks, domains } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, Flame } from "lucide-react";
import { Header } from "./SpacesPage";

const statusColor = {
  "To Do": "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-700",
  "Done": "bg-emerald-100 text-emerald-700",
};
const priColor = { Low: "text-slate-500", Medium: "text-amber-600", High: "text-orange-600", Critical: "text-red-600" };

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <Header title="All Tasks" subtitle="Every task across your spaces and domains.">
        <Button variant="outline"><Filter className="h-4 w-4 mr-1.5" /> Filter</Button>
        <Button><Plus className="h-4 w-4 mr-1.5" /> New task</Button>
      </Header>
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full h-9 pl-8 pr-3 rounded-lg border bg-card text-sm" placeholder="Search tasks…" />
      </div>
      <div className="rounded-xl border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2.5">Task</th>
              <th className="text-left px-4 py-2.5">Domain</th>
              <th className="text-left px-4 py-2.5">Status</th>
              <th className="text-left px-4 py-2.5">Priority</th>
              <th className="text-left px-4 py-2.5">Points</th>
              <th className="text-left px-4 py-2.5">Deadline</th>
              <th className="text-left px-4 py-2.5">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {tasks.map((t) => {
              const d = domains.find((x) => x.id === t.domain_id);
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    {t.is_emergency && <Flame className="h-3.5 w-3.5 text-red-500" />}
                    {t.title}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{d?.domain_name || "—"}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-md ${statusColor[t.status]}`}>{t.status}</span></td>
                  <td className={`px-4 py-3 font-medium ${priColor[t.priority]}`}>{t.priority}</td>
                  <td className="px-4 py-3">{t.points}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.deadline}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${t.progress_percentage}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{t.progress_percentage}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
