import { useEffect, useRef, useState, useCallback } from "react";
import { useBlocker } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Play, Pause, RotateCcw, Settings, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Header } from "./SpacesPage";
import { focusApi, studyApi } from "@/lib/api";
import { usePomodoroSessions, qk } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";

// ─── helpers ─────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? v
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// Quiet synthesised tones for phase transitions.
// Three distinct sounds: focus start (ascending 2-note), break start (single
// calm low tone), break end (gentle 2-note pull-back). All at low volume.
function synthTone(freq, volume, delaySeconds = 0) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const now = ctx.currentTime + delaySeconds;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
    osc.start(now);
    osc.stop(now + 0.8);
  } catch (_) {}
}

function soundFocusStart() {
  synthTone(523.25, 0.08); // C5 — soft ascending start
  synthTone(659.25, 0.06, 0.2); // E5
}

function soundBreakStart() {
  synthTone(392, 0.08); // G4 — lower, calmer
}

function soundBreakEnd() {
  synthTone(587.33, 0.08); // D5 — gentle return
  synthTone(698.46, 0.06, 0.2); // F5
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function FocusPage() {
  const qc = useQueryClient();
  const { activeSpaceId } = useUI();
  // Active sprint for the post-session task list. Fetch even when no space is
  // selected — the backend returns the user's active sprint across spaces — so
  // stopping a session always surfaces its tasks.
  const { data: sprint } = useQuery({
    queryKey: qk.study.activeSprint(activeSpaceId),
    queryFn: () => studyApi.sprints.active(activeSpaceId ? { space_id: activeSpaceId } : undefined),
    retry: false,
  });
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["focus", "pomodoro", "settings"] });
      toast.success("Settings saved");
    },
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
      setFocusMins(f);
      setBreakMins(b);
    }
  }, [savedSettings]);

  // ── Timer state ───────────────────────────────────────────────────────────
  const [mode, setMode] = useState("focus"); // "focus" | "break"
  const [seconds, setSeconds] = useState(focusMins * 60);
  const [running, setRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const sessionIdRef = useRef(null);
  const leavingFocusRef = useRef(false);
  const leaveWarningText = "Leaving this screen will close your current focus session.";

  // ── Transition banner ─────────────────────────────────────────────────────
  const [banner, setBanner] = useState(null);
  const bannerTimer = useRef(null);
  const showBanner = useCallback((msg) => {
    setBanner(msg);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 2500);
  }, []);
  useEffect(
    () => () => {
      if (bannerTimer.current) clearTimeout(bannerTimer.current);
    },
    [],
  );
  // Mirror the id in a ref so we can read/clear it synchronously — guarantees a
  // session is never ended twice (a 2nd /end 404s as "Active session not found").
  const setSession = useCallback((id) => {
    sessionIdRef.current = id;
    setSessionId(id);
  }, []);

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
    mutationFn: () =>
      focusApi.pomodoro.start({ focus_duration: focusMins, break_duration: breakMins }),
    onSuccess: (data) => {
      const id = data?.id ?? data?.session_id ?? null;
      if (leavingFocusRef.current && id) {
        focusApi.pomodoro
          .end(id, { status: "abandoned" })
          .then(() => qc.invalidateQueries({ queryKey: qk.focus.pomodoro }))
          .catch(() => {});
        return;
      }
      setSession(id);
    },
    onError: (e) => toast.error(e?.message || "Could not start session"),
  });
  const endMut = useMutation({
    mutationFn: ({ id, status }) => focusApi.pomodoro.end(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.focus.pomodoro }),
    onError: (e) => {
      // A 404 just means the session was already ended elsewhere — harmless.
      if (/not found/i.test(e?.message || "") || e?.status === 404) return;
      toast.error(e?.message || "Could not end session");
    },
  });

  // End the current session exactly once. Clearing the ref first ensures a
  // second trigger (timer + stop, or a StrictMode re-run) can't re-end it.
  const endSession = useCallback(
    (status) => {
      const id = sessionIdRef.current;
      if (!id) return;
      sessionIdRef.current = null;
      setSessionId(null);
      endMut.mutate({ id, status });
    },
    [endMut],
  );

  const {
    status: blockStatus,
    proceed: blockProceed,
    reset: blockReset,
  } = useBlocker({
    shouldBlockFn: () => Boolean(running || sessionIdRef.current || startMut.isPending),
    withResolver: true,
  });

  useEffect(() => {
    if (!running && !sessionId && !startMut.isPending) return;
    const warnBeforeLeaving = (event) => {
      event.preventDefault();
      event.returnValue = leaveWarningText;
      return leaveWarningText;
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [running, sessionId, startMut.isPending]);

  // ── Tick: count down only (no side effects inside the state updater) ────────
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [running]);

  // ── Completion: fires once when the countdown reaches zero ──────────────────
  useEffect(() => {
    if (!running || seconds > 0) return;
    endSession("completed");
    setRunning(false);
    if (mode === "focus") {
      soundBreakStart();
      showBanner("Focus complete — take a break!");
      toast.success("Focus session complete! Take a break.");
    } else {
      soundBreakEnd();
      showBanner("Break over — back to focus!");
      toast.success("Break over! Ready to focus?");
    }
  }, [running, seconds, mode]); // eslint-disable-line

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStart = () => {
    if (!running) {
      leavingFocusRef.current = false;
      if (!sessionIdRef.current) startMut.mutate();
      setRunning(true);
      if (mode === "focus") {
        soundFocusStart();
        showBanner("Focus session started");
      } else {
        soundBreakStart();
        showBanner("Break started");
      }
    } else {
      setRunning(false);
    }
  };

  const handleReset = () => {
    setRunning(false);
    setSeconds(total);
    endSession("abandoned");
  };

  // ── Stop → task progress dialog ────────────────────────────────────────────
  const [stopOpen, setStopOpen] = useState(false);
  const sprintTasks = sprint?.tasks || sprint?.tasks_data || [];

  const handleStop = () => {
    setRunning(false);
    endSession("abandoned");
    if (sprintTasks.length > 0) setStopOpen(true);
  };

  const closeSessionAndLeave = () => {
    leavingFocusRef.current = true;
    setRunning(false);
    endSession("abandoned");
    blockProceed();
  };

  // ── Mode switch ───────────────────────────────────────────────────────────
  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSeconds((m === "focus" ? focusMins : breakMins) * 60);
  };

  // ── Settings dialog ───────────────────────────────────────────────────────
  const openSettings = () => {
    setDraftFocus(focusMins);
    setDraftBreak(breakMins);
    setSettingsOpen(true);
  };
  const saveSettings = () => {
    setFocusMins(draftFocus);
    setBreakMins(draftBreak);
    if (!running) setSeconds((mode === "focus" ? draftFocus : draftBreak) * 60);
    saveSettingsMut.mutate({ focus_duration: draftFocus, break_duration: draftBreak });
    setSettingsOpen(false);
  };

  const circumference = 2 * Math.PI * 46;

  return (
    <div className="space-y-5 sm:space-y-6">
      <Header title="Focus" subtitle="Pomodoro timer, history, and AI focus coaching." />

      {/* ── Timer card ── */}
      <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-5 sm:rounded-2xl sm:p-8 sm:gap-6">
        {/* Phase transition banner */}
        {banner && (
          <div className="w-full text-center py-2.5 px-4 rounded-lg bg-primary/10 text-primary text-sm font-medium animate-in slide-in-from-top-3 duration-300">
            {banner}
          </div>
        )}
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
        <div className="relative h-44 w-44 sm:h-56 sm:w-56">
          <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90 h-full w-full">
            <circle cx="50" cy="50" r="46" fill="none" stroke="var(--muted)" strokeWidth="5" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - pct / 100)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-4xl font-bold tabular-nums sm:text-5xl">
                {mm}:{ss}
              </div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                {mode}
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex w-full flex-wrap items-center justify-center gap-2">
          <Button
            size="lg"
            onClick={handleStart}
            className="min-w-[110px] flex-1 px-6 sm:flex-none sm:px-8"
            disabled={startMut.isPending}
          >
            {startMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : running ? (
              <>
                <Pause className="h-4 w-4 mr-1.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                Start
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" onClick={handleReset} title="Reset">
            <RotateCcw className="h-4 w-4" />
          </Button>
          {(running || sessionId) && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleStop}
              title="Stop session"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
            >
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
        <div className="rounded-xl border bg-card overflow-x-auto flex-1">
          <table className="min-w-[560px] w-full text-sm">
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
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No sessions yet.
                  </td>
                </tr>
              )}
              {sessions.slice(0, 10).map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    {fmtDate(p.started_at || p.startedAt || p.created_at)}
                  </td>
                  <td className="px-4 py-3">{p.focus_duration ?? p.focusDuration ?? "25"}m</td>
                  <td className="px-4 py-3">{p.rounds_completed ?? p.roundsCompleted ?? "—"}</td>
                  <td className="px-4 py-3">
                    {p.total_focus_minutes ?? p.totalFocusMinutes ?? "—"}m
                  </td>
                  <td
                    className={`px-4 py-3 capitalize font-medium ${p.status === "completed" ? "text-emerald-600" : "text-muted-foreground"}`}
                  >
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
          <DialogHeader>
            <DialogTitle>Session Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Focus duration</span>
                <span className="font-bold text-primary">{draftFocus} min</span>
              </div>
              <Slider
                min={5}
                max={90}
                step={5}
                value={[draftFocus]}
                onValueChange={([v]) => setDraftFocus(v)}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>5 min</span>
                <span>90 min</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Break duration</span>
                <span className="font-bold text-primary">{draftBreak} min</span>
              </div>
              <Slider
                min={1}
                max={30}
                step={1}
                value={[draftBreak]}
                onValueChange={([v]) => setDraftBreak(v)}
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>1 min</span>
                <span>30 min</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={saveSettingsMut.isPending}>
              {saveSettingsMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Post-session task progress dialog ── */}
      <TaskProgressDialog open={stopOpen} onOpenChange={setStopOpen} tasks={sprintTasks} />

      <AlertDialog open={blockStatus === "blocked"}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave focus session?</AlertDialogTitle>
            <AlertDialogDescription>
              {leaveWarningText} Your current timer will stop and the session will be marked as
              abandoned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blockReset?.()}>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={closeSessionAndLeave}>
              Leave and close session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      tasks.forEach((t) => {
        init[t.id] = t.progress_percentage ?? t.progressPercentage ?? 0;
      });
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
        Object.entries(progMap).map(([id, progress]) => updateMut.mutateAsync({ id, progress })),
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
          {tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks in active sprint.
            </p>
          )}
          {tasks.map((t) => {
            const val = progMap[t.id] ?? 0;
            return (
              <div key={t.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${statusColor(t)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{t.title}</div>
                    {t.priority && (
                      <div className="text-xs text-muted-foreground">{t.priority}</div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">{val}%</span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[val]}
                  onValueChange={([v]) => setProgMap((m) => ({ ...m, [t.id]: v }))}
                />
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Skip
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Progress"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
