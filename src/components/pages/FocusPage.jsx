import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Settings, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "./SpacesPage";
import { focusApi, studyApi } from "@/lib/api";
import { useActiveSprint, usePomodoroSessions, qk } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";

// ─── helpers ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.15, 0.3].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.13);
    });
  } catch (_) {}
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function FocusPage() {
  const qc = useQueryClient();
  const { activeSpaceId } = useUI();
  const { data: sprint } = useActiveSprint(activeSpaceId);
  const { data: sessionsPayload } = usePomodoroSessions();
  const sessions = Array.isArray(sessionsPayload) ? sessionsPayload : sessionsPayload?.data || [];

  // ── Settings ──────────────────────────────────────────────────────────────
  const { data: savedSettings } = useQuery({
    queryKey: ["focus", "pomodoro", "settings"],
    queryFn: focusApi.pomodoro.settings,
    retry: 1,
  });
  const saveSettingsMut = useMutation({
    mutationFn: focusApi.pomodoro.saveSettings,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["focus", "pomodoro", "settings"] }); toast.success("Settings saved"); },
    onError: (e) => toast.error(e?.message || "Could not save settings"),
  });

  const [focusMins, setFocusMins] = useState(25);
  const [breakMins, setBreakMins] = useState(5);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftFocus, setDraftFocus] = useState(25);
  const [draftBreak, setDraftBreak] = useState(5);

  useEffect(() => {
    if (savedSettings) {
      const f = savedSettings.focus_duration ?? savedSettings.focusDuration ?? 25;
      const b = savedSettings.break_duration ?? savedSettings.breakDuration ?? 5;
      setFocusMins(f); setBreakMins(b);
    }
  }, [savedSettings]);

  // ── Timer state ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState("focus"); // "focus" | "break"
  const [seconds, setSeconds] = useState(focusMins * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const finishedRef = useRef(false);

  // keep seconds in sync when settings change (only if not running)
  useEffect(() => {
    if (!running) setSeconds((mode === "focus" ? focusMins : breakMins) * 60);
  }, [focusMins, breakMins]); // eslint-disable-line

  const total = (mode === "focus" ? focusMins : breakMins) * 60;
  const pct = total > 0 ? ((total - seconds) / total) * 100 : 0;
  const mm = pad(Math.floor(seconds / 60));
  const ss = pad(seconds % 60);

  // ── Session mutations ─────────────────────────────────────────────────────
  const startMut = useMutation({
    mutationFn: () => focusApi.pomodoro.start({ focus_duration: focusMins, break_duration: breakMins }),
    onSuccess: (data) => setSessionId(data?.id ?? data?.session_id ?? null),
    onError: (e) => toast.error(e?.message || "Could not start session"),
  });
  const endMut = useMutation({
    mutationFn: ({ id, status }) => focusApi.pomodoro.end(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.focus.pomodoro });
      setSessionId(null);
    },
    onError: (e) => toast.error(e?.message || "Could not end session"),
  });

  // ── Tick ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!running) return;
    finishedRef.current = false;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            playBeep();
            // complete the session on finish
            if (sessionId) endMut.mutate({ id: sessionId, status: "completed" });
            setRunning(false);
            if (mode === "focus") {
              toast.success("Focus session complete! Take a break.");
            } else {
              toast.success("Break over! Ready to focus?");
            }
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running, sessionId, mode]); // eslint-disable-line

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!running) {
      if (!sessionId) startMut.mutate();
      setRunning(true);
    } else {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(total);
    if (sessionId) { endMut.mutate({ id: sessionId, status: "abandoned" }); }
  };

  // ── Stop → task progress dialog ────────────────────────────────────────────
  const [stopOpen, setStopOpen] = useState(false);
  const sprintTasks = sprint?.tasks || sprint?.tasks_data || [];

  const handleStop = () => {
    setRunning(false);
    if (sessionId) endMut.mutate({ id: sessionId, status: "abandoned" });
    if (sprintTasks.length > 0) setStopOpen(true);
  };

  // ── Mode switch ───────────────────────────────────────────────────────────
  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSeconds((m === "focus" ? focusMins : breakMins) * 60);
  };

  // ── Settings dialog ───────────────────────────────────────────────────────
  const openSettings = () => { setDraftFocus(focusMins); setDraftBreak(breakMins); setSettingsOpen(true); };
  const saveSettings = () => {
    setFocusMins(draftFocus); setBreakMins(draftBreak);
    if (!running) setSeconds((mode === "focus" ? draftFocus : draftBreak) * 60);
    saveSettingsMut.mutate({ focus_duration: draftFocus, break_duration: draftBreak });
    setSettingsOpen(false);
  };

  const circumference = 2 * Math.PI * 46;

  return (
    <div className="space-y-6">
      <Header title="Focus" subtitle="Pomodoro timer, history, and AI focus coaching." />

      {/* ── Timer card ── */}
      <div className="rounded-2xl border bg-card p-8 flex flex-col items-center gap-6">
        {/* Mode tabs */}
        <div className="inline-flex rounded-md border p-0.5">
          {["focus", "break"].map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-5 py-1.5 text-sm capitalize rounded transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "focus" ? "Focus" : "Break"}
            </button>
          ))}
        </div>

        {/* Ring */}
        <div className="relative h-56 w-56">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 h-full w-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--muted)" strokeWidth="5" />
            <circle
              cx="50" cy="50" r="46" fill="none"
              stroke="var(--primary)" strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-5xl font-bold tabular-nums">{mm}:{ss}</div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{mode}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button size="lg" onClick={handleStart} className="px-8 min-w-[110px]" disabled={startMut.isPending}>
            {startMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : running ? <><Pause className="h-4 w-4 mr-1.5" />Pause</> : <><Play className="h-4 w-4 mr-1.5" />Start</>}
          </Button>
          <Button size="lg" variant="outline" onClick={handleReset} title="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {(running || sessionId) && (
            <Button size="lg" variant="outline" onClick={handleStop} title="Stop session" className="text-destructive border-destructive/40 hover:bg-destructive/10">
              <Square className="h-4 w-4" />
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={openSettings} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── History ── */}
      <section className="flex flex-col">
        <h3 className="font-semibold mb-2">History</h3>
        <div className="rounded-xl border bg-card overflow-hidden flex-1">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-left px-4 py-2.5">Block</th>
                <th className="text-left px-4 py-2.5">Rounds</th>
                <th className="text-left px-4 py-2.5">Total Focus</th>
                <th className="text-left px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sessions.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">No sessions yet.</td></tr>
              )}
              {sessions.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{fmtDate(p.started_at || p.startedAt || p.created_at)}</td>
                  <td className="px-4 py-3">{p.focus_duration ?? p.focusDuration ?? "25"}m</td>
                  <td className="px-4 py-3">{p.rounds_completed ?? p.roundsCompleted ?? "—"}</td>
                  <td className="px-4 py-3">{p.total_focus_minutes ?? p.totalFocusMinutes ?? "—"}m</td>
                  <td className={`px-4 py-3 capitalize font-medium ${(p.status === "completed") ? "text-emerald-600" : "text-muted-foreground"}`}>
                    {p.status || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>


      {/* ── Settings dialog ── */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Session Settings</DialogTitle></DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Focus duration</span>
                <span className="font-bold text-primary">{draftFocus} min</span>
              </div>
              <Slider min={5} max={90} step={5} value={[draftFocus]} onValueChange={([v]) => setDraftFocus(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground"><span>5 min</span><span>90 min</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Break duration</span>
                <span className="font-bold text-primary">{draftBreak} min</span>
              </div>
              <Slider min={1} max={30} step={1} value={[draftBreak]} onValueChange={([v]) => setDraftBreak(v)} />
              <div className="flex justify-between text-[11px] text-muted-foreground"><span>1 min</span><span>30 min</span></div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={saveSettings} disabled={saveSettingsMut.isPending}>
              {saveSettingsMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Post-session task progress dialog ── */}
      <TaskProgressDialog open={stopOpen} onOpenChange={setStopOpen} tasks={sprintTasks} />
    </div>
  );
}

// ─── Task progress dialog ──────────────────────────────────────────────────────
function TaskProgressDialog({ open, onOpenChange, tasks }) {
  const qc = useQueryClient();
  const [progMap, setProgMap] = useState({});

  useEffect(() => {
    if (open) {
      const init = {};
      tasks.forEach((t) => { init[t.id] = t.progress_percentage ?? t.progressPercentage ?? 0; });
      setProgMap(init);
    }
  }, [open, tasks]);

  const updateMut = useMutation({
    mutationFn: ({ id, progress }) => studyApi.tasks.updateProgress(id, progress),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "tasks"] }),
    onError: (e) => toast.error(e?.message || "Could not update progress"),
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(progMap).map(([id, progress]) => updateMut.mutateAsync({ id, progress }))
      );
      toast.success("Progress updated");
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const statusColor = (t) => {
    const s = t.pivot_status || t.pivotStatus || t.status || "";
    if (["done", "Done", "completed"].includes(s)) return "bg-emerald-500";
    if (["in_progress", "In Progress"].includes(s)) return "bg-primary";
    return "bg-muted-foreground/30";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Update Task Progress</DialogTitle>
          <p className="text-sm text-muted-foreground">Session ended — update your sprint tasks.</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {tasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks in active sprint.</p>}
          {tasks.map((t) => {
            const val = progMap[t.id] ?? 0;
            return (
              <div key={t.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${statusColor(t)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    {t.priority && <div className="text-xs text-muted-foreground">{t.priority}</div>}
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{val}%</span>
                </div>
                <Slider
                  min={0} max={100} step={5}
                  value={[val]}
                  onValueChange={([v]) => setProgMap((m) => ({ ...m, [t.id]: v }))}
                />
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${val}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Skip</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Progress"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
