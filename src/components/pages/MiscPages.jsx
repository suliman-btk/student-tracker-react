import {
  friends,
  notifications,
  weeklyXP,
  heatmap,
  me,
  tasks,
  domains,
  spaces,
  calendarEvents,
} from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Header } from "./SpacesPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Users,
  MessageCircle,
  BellRing,
  Check,
  Mic,
  MicOff,
  LogOut,
  Send,
  Lock,
  Globe,
  Hash,
  Copy,
  Play,
  Pause,
  SkipForward,
  Square,
  ChevronRight,
} from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Link, useNavigate, useBlocker } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, Suspense, memo } from "react";
import { ArrowLeft, Loader2, Pencil, Trash2, X } from "lucide-react";
import {
  useTask,
  useTaskComments,
  useStudyMutations,
  useActiveSprint,
  useProfile,
} from "@/lib/query-hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialApi, userApi } from "@/lib/api";
import {
  Pencil as PencilIcon,
  Flame,
  Trophy,
  UserPlus as UserPlusIcon,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { lazy } from "react";
const CreateTaskModal = lazy(() => import("@/components/study/CreateTaskModal"));
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { focusApi, studyApi } from "@/lib/api";
import {
  createFirestoreRoom,
  joinRoomByCode,
  watchPublicRooms,
  joinRoom,
  leaveRoom,
  sendRoomMessage,
  uploadRoomFile,
  updateAgoraUid,
  updateRoomPhase,
  updateMutedState,
  endRoom,
  incrementRound,
  uploadUserAvatar,
  uploadUserBanner,
  setRoomMemberCount,
  kickMember,
} from "@/lib/realtime";
import { createAgoraRoomClient } from "@/lib/agora";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/store/auth-store";
import { useRoomLiveState } from "@/lib/useRoomLiveState";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ─── RoomsPage ───────────────────────────────────────────────────────────────

export function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    subject_tag: "",
    focus_duration: 25,
    break_duration: 5,
    is_private: false,
    allowVoiceDuringFocus: true,
    allowChatDuringFocus: true,
  });
  const [pendingShare, setPendingShare] = useState(null); // { firestoreId, name, subject_tag } after room created

  const SUBJECT_TAGS = ["Math", "CS", "Science", "Engineering", "Languages", "Other"];
  const DURATION_PRESETS = [
    { label: "25 / 5", desc: "Classic Pomodoro", focus: 25, brk: 5 },
    { label: "50 / 10", desc: "Deep Work", focus: 50, brk: 10 },
    { label: "Custom", desc: "", focus: null, brk: null },
  ];
  const [activePreset, setActivePreset] = useState(0);

  useEffect(() => watchPublicRooms(setRooms, console.error), []);

  const handleJoinByCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) {
      setCodeError("Code must be 6 characters");
      return;
    }
    setCodeLoading(true);
    setCodeError("");
    try {
      let firestoreId = null;
      try {
        const room = await focusApi.rooms.findByCode(code);
        firestoreId = room?.firestore_room_id;
      } catch {}
      if (!firestoreId) firestoreId = await joinRoomByCode(code);
      if (!firestoreId) {
        setCodeError("Room not found");
        return;
      }
      // Hand the code to the room page: private rooms only auto-join when the
      // visitor arrived with the correct code.
      sessionStorage.setItem(`raqip:room-code:${firestoreId}`, code);
      navigate({ to: "/rooms/$id", params: { id: firestoreId } });
    } catch {
      setCodeError("Room not found");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const user = auth.currentUser;
      const roomCode = generateRoomCode();
      const firestoreId = await createFirestoreRoom({
        name: form.name,
        subjectTag: form.subject_tag,
        focusDuration: form.focus_duration,
        breakDuration: form.break_duration,
        hostUid: user?.uid,
        hostName: user?.displayName || user?.email?.split("@")[0] || "Host",
        roomCode,
        isPrivate: form.is_private,
        allowVoiceDuringFocus: form.allowVoiceDuringFocus,
        allowChatDuringFocus: form.allowChatDuringFocus,
      });
      try {
        await focusApi.rooms.create({
          name: form.name,
          subject_tag: form.subject_tag || null,
          focus_duration: form.focus_duration,
          break_duration: form.break_duration,
          firestore_room_id: firestoreId,
          is_private: form.is_private,
          allow_voice_during_focus: form.allowVoiceDuringFocus,
          allow_chat_during_focus: form.allowChatDuringFocus,
        });
      } catch {}
      setShowCreate(false);
      if (!form.is_private) {
        setPendingShare({ firestoreId, name: form.name, subject_tag: form.subject_tag });
      } else {
        navigate({ to: "/rooms/$id", params: { id: firestoreId } });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const phaseLabel = (r) => {
    if (r.phase === "focus") return { label: "FOCUSING", cls: "bg-red-100 text-red-700" };
    if (r.phase === "breakTime")
      return { label: "ON BREAK", cls: "bg-emerald-100 text-emerald-700" };
    return { label: "WAITING", cls: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <Users className="h-3.5 w-3.5" />
                Live study
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">Group Study Rooms</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Run a shared Pomodoro session with classmates, keep voice/chat under control, and
                make focused work visible.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="h-11 gap-1.5 sm:shrink-0">
              <Plus className="h-4 w-4" /> New room
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-background p-3">
              <div className="text-2xl font-semibold">{rooms.length}</div>
              <div className="text-xs text-muted-foreground">Active rooms</div>
            </div>
            <div className="rounded-md border bg-background p-3">
              <div className="text-2xl font-semibold">
                {rooms.reduce((sum, room) => sum + Math.max(0, room.memberCount || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Students online</div>
            </div>
            <div className="rounded-md border bg-background p-3">
              <div className="text-2xl font-semibold">25/5</div>
              <div className="text-xs text-muted-foreground">Default focus block</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-primary">
              <Hash className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Join with code</h2>
              <p className="text-xs text-muted-foreground">Enter the 6-character room code.</p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-1">
              <Input
                value={codeInput}
                onChange={(e) => {
                  setCodeInput(
                    e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6),
                  );
                  setCodeError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
                placeholder="ABC123"
                className="h-11 bg-background pl-4 font-mono text-sm tracking-[0.2em]"
                maxLength={6}
              />
              {codeError && (
                <p className="absolute -bottom-5 left-0 text-[11px] text-red-500">{codeError}</p>
              )}
            </div>
            <Button
              onClick={handleJoinByCode}
              disabled={codeLoading || codeInput.length !== 6}
              className="h-11 shrink-0 px-4"
            >
              {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card">
        <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold">Available rooms</h2>
            <p className="text-xs text-muted-foreground">
              Join an active session or create a new room for your group.
            </p>
          </div>
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
            {rooms.length} active
          </span>
        </div>
        <div className="p-4">
          {rooms.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed bg-background px-4 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-md bg-secondary text-primary">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <p className="mt-4 font-semibold text-foreground">No rooms active right now</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create one and invite friends to study together
                </p>
              </div>
              <Button onClick={() => setShowCreate(true)} className="gap-1.5 mt-5">
                <Plus className="h-4 w-4" /> Create a room
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rooms.map((r) => {
                  const { label, cls } = phaseLabel(r);
                  const isFocusing = r.phase === "focus";
                  const isBreak = r.phase === "breakTime";
                  return (
                    <div
                      key={r.id}
                      className={`rounded-2xl border bg-card flex flex-col gap-0 overflow-hidden hover:shadow-lg transition-all duration-200 group
                      ${isFocusing ? "border-indigo-200/60" : isBreak ? "border-amber-200/60" : ""}`}
                    >
                      {/* Colored top stripe */}
                      <div
                        className={`h-1 w-full ${isFocusing ? "bg-indigo-500" : isBreak ? "bg-amber-400" : "bg-muted"}`}
                      />

                      <div className="p-5 flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-base truncate">
                                {r.roomName || r.name}
                              </span>
                              {r.isPrivate && (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{r.hostName}</p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${cls}`}
                          >
                            {label}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {(r.subjectTag || r.subject_tag) && (
                            <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold">
                              {r.subjectTag || r.subject_tag}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full">
                            ⏱ {r.focusDuration || 25}m / {r.breakDuration || 5}m
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-border/50">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>
                              {Math.max(0, r.memberCount || 0)}{" "}
                              {Math.max(0, r.memberCount || 0) === 1 ? "person" : "people"}
                            </span>
                          </div>
                          <Link to="/rooms/$id" params={{ id: r.id }}>
                            <Button size="sm" className="h-8 px-4 text-xs font-semibold gap-1">
                              Join <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create study room</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Room name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Late Night Algo Crunch"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subject</Label>
              <div className="flex flex-wrap gap-1.5">
                {SUBJECT_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, subject_tag: f.subject_tag === tag ? "" : tag }))
                    }
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.subject_tag === tag ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <div className="flex gap-2">
                {DURATION_PRESETS.map((p, i) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setActivePreset(i);
                      if (p.focus)
                        setForm((f) => ({ ...f, focus_duration: p.focus, break_duration: p.brk }));
                    }}
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs text-center transition-colors ${activePreset === i ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}
                  >
                    <div className="font-semibold">{p.label}</div>
                    {p.desc && <div className="opacity-70 mt-0.5">{p.desc}</div>}
                  </button>
                ))}
              </div>
              {activePreset === 2 && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Focus: {form.focus_duration}m</Label>
                    <Slider
                      min={5}
                      max={90}
                      step={5}
                      value={[form.focus_duration]}
                      onValueChange={([v]) => setForm((f) => ({ ...f, focus_duration: v }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Break: {form.break_duration}m</Label>
                    <Slider
                      min={1}
                      max={30}
                      step={1}
                      value={[form.break_duration]}
                      onValueChange={([v]) => setForm((f) => ({ ...f, break_duration: v }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Private room</Label>
                  <p className="text-xs text-muted-foreground">Require a code to join</p>
                </div>
                <Switch
                  checked={form.is_private}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_private: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Voice during focus</Label>
                  <p className="text-xs text-muted-foreground">Allow mic use in focus phase</p>
                </div>
                <Switch
                  checked={form.allowVoiceDuringFocus}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, allowVoiceDuringFocus: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Chat during focus</Label>
                  <p className="text-xs text-muted-foreground">Allow messages in focus phase</p>
                </div>
                <Switch
                  checked={form.allowChatDuringFocus}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, allowChatDuringFocus: v }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Create & Enter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share to feed dialog — shown after creating a public room */}
      <Dialog
        open={!!pendingShare}
        onOpenChange={(open) => {
          if (!open && pendingShare) {
            navigate({ to: "/rooms/$id", params: { id: pendingShare.firestoreId } });
            setPendingShare(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Share to Social Feed?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Let your friends see your study session and join you in real time.
          </p>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                navigate({ to: "/rooms/$id", params: { id: pendingShare?.firestoreId } });
                setPendingShare(null);
              }}
            >
              Skip
            </Button>
            <Button
              onClick={async () => {
                if (!pendingShare) return;
                try {
                  const tag = pendingShare.subject_tag;
                  await socialApi.posts.create({
                    type: "live_session",
                    room_id: pendingShare.firestoreId,
                    content: `📚 I just started a study session${tag ? ` — ${tag}` : ""}! Join me in the "${pendingShare.name}" room.`,
                    subject_tag: tag || null,
                    visibility: "public",
                  });
                } catch {}
                navigate({ to: "/rooms/$id", params: { id: pendingShare.firestoreId } });
                setPendingShare(null);
              }}
            >
              Share &amp; Enter Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── RoomDetailPage ──────────────────────────────────────────────────────────

function useCountdown(room) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!room?.isRunning || !room?.phaseEndsAt) {
      setSecs(room?.remainingSeconds || 0);
      return;
    }
    const tick = () => {
      const end = room.phaseEndsAt?.toDate ? room.phaseEndsAt.toDate() : new Date(room.phaseEndsAt);
      setSecs(Math.max(0, Math.round((end - Date.now()) / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [room?.isRunning, room?.phaseEndsAt, room?.remainingSeconds]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { timer: `${mm}:${ss}`, secs };
}

// Owns the 1-second countdown so the tick re-renders only this ring subtree,
// not the whole 3-panel room page.
function TimerRing({ room, phase }) {
  const { timer, secs: timerSecs } = useCountdown(room);
  const phaseLabel =
    phase === "focus" ? "FOCUSING" : phase === "breakTime" ? "ON BREAK" : "WAITING TO START";
  const ringColor =
    phase === "focus" ? "#6366f1" : phase === "breakTime" ? "#f59e0b" : "var(--muted-foreground)";
  const ringTrack =
    phase === "focus"
      ? "rgba(99,102,241,0.12)"
      : phase === "breakTime"
        ? "rgba(245,158,11,0.12)"
        : "rgba(0,0,0,0.06)";
  const totalSecs = (phase === "focus" ? room.focusDuration || 25 : room.breakDuration || 5) * 60;
  const timerPct = totalSecs > 0 ? Math.max(0, Math.min(1, timerSecs / totalSecs)) : 0;
  const circumference = 2 * Math.PI * 44;

  return (
    <div className="relative h-52 w-52 shrink-0 sm:h-64 sm:w-64">
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full -rotate-90">
        {/* Track — phase-tinted neutral */}
        <circle cx="50" cy="50" r="44" fill="none" stroke={ringTrack} strokeWidth="4" />
        {/* Progress — arc length = timerPct × circumference, starts full and depletes.
            Uses ringColor (a real hex); hsl(var(--primary)) was invalid here because
            --primary is a hex value, not an HSL triple, so the arc never rendered. */}
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke={ringColor}
          strokeWidth="4"
          strokeDasharray={`${circumference * timerPct} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span className="text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
          {timer}
        </span>
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {phaseLabel}
        </span>
      </div>
    </div>
  );
}

// memo + primitive props: only rows whose speaking/mute state actually flips
// re-render when a volume snapshot arrives.
const MemberRow = memo(function MemberRow({
  uid,
  name,
  isMuted,
  speaking,
  isStudying,
  voiceLocked,
  canKick,
  onKick,
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300
        ${
          speaking
            ? "border-indigo-300/60 bg-indigo-50/80 dark:bg-indigo-950/30 shadow-sm"
            : isStudying
              ? "border-border/50 bg-card/60"
              : "border-border/50 bg-card/60"
        }`}
    >
      <div className="relative shrink-0">
        {speaking && <span className="absolute inset-0 rounded-full animate-ping bg-primary/20" />}
        <Avatar
          className={`h-9 w-9 relative ${speaking ? "ring-2 ring-primary ring-offset-1" : ""}`}
        >
          <AvatarFallback
            className={`text-sm font-bold ${speaking ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
          >
            {(name || "?")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {isMuted && (
          <span className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 shadow">
            <MicOff className="h-2 w-2 text-white" />
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{name || "Member"}</p>
        <p
          className={`text-[10px] font-medium ${speaking ? "text-indigo-600" : voiceLocked ? "text-red-400" : "text-muted-foreground"}`}
        >
          {voiceLocked
            ? "🔇 Blocked"
            : speaking
              ? "Speaking…"
              : isMuted
                ? "Muted"
                : isStudying
                  ? "Focusing"
                  : "Listening"}
        </p>
      </div>
      {speaking && (
        <div className="flex items-end gap-[2px] shrink-0" style={{ height: 14 }}>
          {[0.4, 1, 0.6, 0.9, 0.5].map((h, i) => (
            <span
              key={i}
              className="w-0.5 rounded-full animate-bounce bg-primary"
              style={{
                height: `${h * 12}px`,
                animationDelay: `${i * 80}ms`,
                animationDuration: "600ms",
              }}
            />
          ))}
        </div>
      )}
      {canKick && (
        <button
          onClick={() => onKick(uid, name)}
          title="Remove from room"
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <UserX className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});

// Owns the Agora volumes state so volume snapshots re-render only this panel.
// The parent hands us a ref; we register our state setter into it on mount and
// the parent's onVolume callback writes through it.
function VoicePanel({
  members,
  phase,
  voiceLocked,
  isMuted,
  toggleMute,
  onVolumeRef,
  isHost,
  currentUid,
  onKick,
}) {
  const [volumes, setVolumes] = useState({});

  useEffect(() => {
    onVolumeRef.current = setVolumes;
    return () => {
      onVolumeRef.current = null;
    };
  }, [onVolumeRef]);

  const moodPanelBg =
    phase === "focus"
      ? "bg-indigo-950/[0.08] border-indigo-200/30"
      : phase === "breakTime"
        ? "bg-amber-50 dark:bg-amber-900/20"
        : "bg-background";

  return (
    <div
      className={`flex max-h-72 w-full shrink-0 flex-col border-b transition-colors duration-700 lg:max-h-none lg:w-60 lg:border-b-0 lg:border-r ${moodPanelBg}`}
    >
      <div className="px-3 py-2.5 border-b flex items-center justify-between sm:px-4 sm:py-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Participants
        </p>
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          {members.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 sm:p-3">
        {members.map((m) => {
          const vol = volumes[m.agoraUid] || 0;
          // Muted/blocked members never show waves — Agora keeps the last
          // volume value around after someone stops publishing, so raw volume
          // alone draws phantom "speaking" rings.
          const speaking = !voiceLocked && !m.isMuted && vol > 5;
          const isStudying = phase === "focus" && !speaking;
          return (
            <MemberRow
              key={m.uid}
              uid={m.uid}
              name={m.displayName}
              isMuted={!!m.isMuted}
              speaking={speaking}
              isStudying={isStudying}
              voiceLocked={voiceLocked}
              canKick={Boolean(isHost && m.uid !== currentUid)}
              onKick={onKick}
            />
          );
        })}
      </div>
      {/* Mic control */}
      <div className="p-2 border-t sm:p-3">
        <button
          onClick={toggleMute}
          disabled={voiceLocked}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all
            ${
              voiceLocked
                ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                : isMuted
                  ? "bg-muted hover:bg-muted/70 text-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
        >
          {voiceLocked ? (
            <MicOff className="h-4 w-4" />
          ) : isMuted ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {voiceLocked ? "Voice blocked" : isMuted ? "Unmute" : "Mute"}
        </button>
      </div>
    </div>
  );
}

function TaskSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="flex justify-between">
        <div className="h-4 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-8" />
      </div>
      <div className="h-2 bg-muted rounded w-full" />
    </div>
  );
}

function LeaveTaskSheet({ onDone, onSkip }) {
  const { data: sprint, isLoading } = useActiveSprint();
  const tasks = sprint?.tasks || [];
  const [progress, setProgress] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const init = {};
      tasks.forEach((t) => {
        init[t.id] = t.progress_percentage ?? 0;
      });
      setProgress(init);
    }
  }, [isLoading, tasks.length]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        tasks
          .filter((t) => progress[t.id] !== (t.progress_percentage ?? 0))
          .map((t) => studyApi.tasks.updateProgress(t.id, progress[t.id])),
      );
    } catch {
    } finally {
      setSaving(false);
      onDone();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">How did it go?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update your sprint task progress before leaving.
          </p>
        </div>
        <div className="p-6 space-y-5 max-h-[26rem] overflow-y-auto">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <TaskSkeleton key={i} />)}
          {!isLoading && tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              No tasks in active sprint.
            </p>
          )}
          {!isLoading &&
            tasks.map((t) => (
              <div key={t.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{t.title}</span>
                  <span className="text-xs font-semibold text-primary shrink-0 ml-2 tabular-nums">
                    {progress[t.id] ?? 0}%
                  </span>
                </div>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[progress[t.id] ?? 0]}
                  onValueChange={([v]) => setProgress((p) => ({ ...p, [t.id]: v }))}
                />
              </div>
            ))}
        </div>
        <div className="p-4 border-t flex gap-3 justify-end">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Update & Leave
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RoomDetailPage({ id }) {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  const {
    room,
    members,
    messages,
    phase,
    isHost,
    isJoined,
    allowVoice,
    allowChat,
    voiceLocked,
    chatLocked,
  } = useRoomLiveState(id);

  // joined tracks whether Agora has been initialised (distinct from isJoined in Firestore)
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const agoraRef = useRef(null);
  // VoicePanel registers its volumes setter here; Agora's onVolume writes
  // through it so volume snapshots re-render only that panel.
  const onVolumeRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoJoinedRef = useRef(false);
  // Set true right before any intentional exit (Leave button, host-ended bounce)
  // so the navigation-guard blocker doesn't double-prompt on those paths.
  const intentionalLeaveRef = useRef(false);
  // Mirror isHost into a ref so the unmount/unload cleanup (which closes over a
  // fixed [id]) can read the current value and end the room when the host exits.
  const isHostRef = useRef(false);

  // Confirm before leaving when navigating away via the sidebar/back button.
  // withResolver lets us render our own dialog; proceed()/reset() resolve it.
  const {
    status: blockStatus,
    proceed: blockProceed,
    reset: blockReset,
  } = useBlocker({
    shouldBlockFn: () => !intentionalLeaveRef.current && joined && room?.isEnded !== true,
    withResolver: true,
  });

  // Self-heal a drifted memberCount: while the host is present, reconcile the
  // stored count to the real number of members (fixes counts corrupted by
  // earlier join/leave bugs). Guarded on members.length > 0 so a transient
  // empty snapshot during load never writes a bogus 0.
  useEffect(() => {
    if (!isHost || !joined || !room) return;
    if (members.length > 0 && room.memberCount !== members.length) {
      setRoomMemberCount(id, members.length).catch(() => {});
    }
  }, [isHost, joined, members.length, room?.memberCount, id]);

  // Sync joined flag when another tab/device already put this user in the room
  useEffect(() => {
    if (isJoined && !joined) setJoined(true);
  }, [isJoined, joined]);

  // Auto-join: anyone who opens the room (host or guest) is added to the lobby
  // immediately. Clicking "Join" on a room card should put you in without a
  // second manual step — otherwise a guest sits in the room with no member doc
  // and never shows up to the host. The "Join lobby" button stays as a fallback.
  useEffect(() => {
    if (!room || !currentUser || autoJoinedRef.current || isJoined) return;
    if (room.isEnded === true) return; // don't (re)join a closed room
    autoJoinedRef.current = true;
    joinRoom(id, sessionStorage.getItem(`raqip:room-code:${id}`) || undefined)
      .then(() => initAgora().then(() => setJoined(true)))
      .catch((e) => {
        if (e?.code === "room/banned" || e?.code === "room/private") {
          intentionalLeaveRef.current = true;
          toast.error(e.message);
          navigate({ to: "/rooms" });
          return;
        }
        console.error(e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.hostUid, currentUser?.uid, isJoined]);

  // Kicked mid-session: the host put our UID on the room's banned list and
  // deleted our member doc — tear down voice and bounce to the rooms list.
  const amBanned = Boolean(
    room &&
      currentUser &&
      Array.isArray(room.banned) &&
      room.banned.includes(currentUser.uid) &&
      room.hostUid !== currentUser.uid,
  );
  useEffect(() => {
    if (!amBanned) return;
    (async () => {
      intentionalLeaveRef.current = true;
      if (agoraRef.current) {
        await agoraRef.current.leave().catch(() => {});
        agoraRef.current = null;
      }
      toast.error("You were removed from this room by the host");
      navigate({ to: "/rooms" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amBanned]);

  const handleKick = useCallback(
    async (uid, name) => {
      if (!window.confirm(`Remove ${name || "this member"}? They won't be able to join again.`))
        return;
      try {
        await kickMember(id, uid);
        toast.success(`${name || "Member"} was removed`);
      } catch (e) {
        toast.error(e?.message || "Could not remove member");
      }
    },
    [id],
  );

  // Auto-navigate when host ends the session or room is deleted.
  // Clean up Firestore membership before navigating so memberCount decrements
  // (errors are swallowed so they never block navigation). leaveRoom is
  // idempotent, so the unmount-cleanup call below is a safe no-op.
  useEffect(() => {
    if (!room) return;
    if (room.isEnded === true) {
      (async () => {
        intentionalLeaveRef.current = true;
        if (agoraRef.current) {
          await agoraRef.current.leave().catch(() => {});
          agoraRef.current = null;
        }
        await leaveRoom(id).catch(() => {});
        navigate({ to: "/rooms" });
      })();
    }
  }, [room?.isEnded]); // eslint-disable-line

  useEffect(() => {
    if (voiceLocked && agoraRef.current) {
      agoraRef.current.mute(true);
      setIsMuted(true);
    }
  }, [voiceLocked]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep the host flag current for the unmount/unload cleanup below.
  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Stop mic immediately on unmount (covers sidebar nav, back button, tab close)
  useEffect(() => {
    const stopOnUnload = () => {
      if (agoraRef.current) agoraRef.current.leave().catch(() => {});
      // Host exit closes the room for everyone — best-effort on tab close.
      if (isHostRef.current) endRoom(id).catch(() => {});
    };
    window.addEventListener("beforeunload", stopOnUnload);
    return () => {
      window.removeEventListener("beforeunload", stopOnUnload);
      if (agoraRef.current) {
        agoraRef.current.leave().catch(() => {});
        agoraRef.current = null;
      }
      // Host leaving by ANY path closes the room; everyone else just leaves.
      if (isHostRef.current) endRoom(id).catch(() => {});
      leaveRoom(id).catch(() => {});
    };
  }, [id]);

  const initAgora = async () => {
    const client = await createAgoraRoomClient({
      roomId: id,
      uid: null,
      onVolume: (vols) => {
        const m = {};
        vols.forEach(({ uid, volume }) => {
          m[uid] = volume;
        });
        onVolumeRef.current?.(m);
      },
      onUserJoined: () => {},
      onUserLeft: () => {},
    });
    agoraRef.current = client;
    try {
      await updateAgoraUid(id, client.uid);
    } catch {}
  };

  const handleJoin = async () => {
    if (joined || joining) return;
    setJoining(true);
    try {
      await joinRoom(id, sessionStorage.getItem(`raqip:room-code:${id}`) || undefined);
      await initAgora();
      setJoined(true);
    } catch (e) {
      if (e?.code === "room/banned" || e?.code === "room/private") {
        intentionalLeaveRef.current = true;
        toast.error(e.message);
        navigate({ to: "/rooms" });
        return;
      }
      console.error(e);
    } finally {
      setJoining(false);
    }
  };

  const doLeave = async () => {
    intentionalLeaveRef.current = true;
    if (agoraRef.current) {
      await agoraRef.current.leave().catch(() => {});
      agoraRef.current = null;
    }
    // Host leaving ends the session for everyone — mark the room ended so all
    // members are auto-bounced and it stops showing in the active list.
    if (isHost) await endRoom(id).catch(() => {});
    await leaveRoom(id).catch(() => {});
    navigate({ to: "/rooms" });
  };

  // Confirmed leave from the navigation-guard dialog: clean up membership, then
  // let the blocked navigation continue to wherever the user was headed.
  const confirmLeaveAndProceed = async () => {
    intentionalLeaveRef.current = true;
    if (agoraRef.current) {
      await agoraRef.current.leave().catch(() => {});
      agoraRef.current = null;
    }
    if (isHost) await endRoom(id).catch(() => {});
    await leaveRoom(id).catch(() => {});
    blockProceed();
  };

  const handleLeaveClick = () => {
    if (phase !== "idle") setShowLeaveSheet(true);
    else doLeave();
  };

  const toggleMute = useCallback(async () => {
    if (!agoraRef.current || voiceLocked) return;
    const next = !isMuted;
    try {
      // Await the SDK call: only flip the UI once the track actually
      // (un)muted, otherwise the button says "unmuted" while you're silent.
      await agoraRef.current.mute(next);
    } catch (e) {
      console.error("mute toggle failed", e);
      return;
    }
    setIsMuted(next);
    await updateMutedState(id, next).catch(() => {});
  }, [isMuted, voiceLocked, id]);

  const handleSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLocked) return;
    setChatInput("");
    await sendRoomMessage(id, text).catch(() => {});
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || chatLocked) return;
    setUploading(true);
    try {
      await uploadRoomFile(id, file);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const copyCode = () => {
    if (room?.roomCode) {
      navigator.clipboard.writeText(room.roomCode).catch(() => {});
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  const handleStart = async () => {
    if (!isHost) return;
    await updateRoomPhase(id, "focus", room.focusDuration || 25);
  };
  const handleSkip = async () => {
    if (!isHost) return;
    if (phase === "focus") {
      await incrementRound(id);
      await updateRoomPhase(id, "breakTime", room.breakDuration || 5);
    } else await updateRoomPhase(id, "focus", room.focusDuration || 25);
  };
  const handleEnd = async () => {
    if (!isHost) return;
    await endRoom(id);
  };

  // Confirm dialog shown when the user tries to navigate away while still in the
  // room (sidebar click, back button). Leaving here cleans up membership.
  const leaveGuardDialog = (
    <AlertDialog open={blockStatus === "blocked"}>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Leave this room?</AlertDialogTitle>
          <AlertDialogDescription>
            {isHost
              ? "You're the host — leaving will end the session for everyone in the room."
              : "You'll exit the study session. You can rejoin anytime with the room code."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blockReset?.()}>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={() => confirmLeaveAndProceed()}>Leave room</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (!room)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const phaseColor =
    phase === "focus"
      ? "text-red-500"
      : phase === "breakTime"
        ? "text-emerald-600"
        : "text-muted-foreground";
  const phaseDot =
    phase === "focus"
      ? "bg-red-500"
      : phase === "breakTime"
        ? "bg-emerald-500"
        : "bg-muted-foreground";
  const phaseLabel =
    phase === "focus" ? "FOCUSING" : phase === "breakTime" ? "ON BREAK" : "WAITING TO START";
  const roundNum = (room.roundsCompleted || 0) + (phase === "focus" ? 1 : 0);

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="flex flex-col -mx-4 lg:-mx-8 -my-6" style={{ height: "calc(100% + 3rem)" }}>
        {showLeaveSheet && <LeaveTaskSheet onDone={doLeave} onSkip={doLeave} />}
        {leaveGuardDialog}

        {/* Hero header — full width */}
        <div className="border-b px-6 lg:px-8 py-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl shrink-0">
              📚
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold truncate">{room.roomName || room.name}</h1>
                {(room.subjectTag || room.subject_tag) && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                    {room.subjectTag || room.subject_tag}
                  </span>
                )}
                {room.isPrivate && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                  <Play className="h-2.5 w-2.5 inline mr-1" />
                  {room.focusDuration || 25}m focus
                </span>
                <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                  ☕ {room.breakDuration || 5}m break
                </span>
                {room.isPrivate && (
                  <span className="text-xs text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5 inline mr-1" />
                    Private
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {room.roomCode && (
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 font-mono text-xs bg-muted hover:bg-muted/70 px-3 py-2 rounded-lg border transition-colors"
              >
                <span className="tracking-widest font-bold">{room.roomCode}</span>
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                {codeCopied && (
                  <span className="text-emerald-500 font-sans not-italic ml-1">✓</span>
                )}
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeaveClick}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
            >
              <LogOut className="h-4 w-4" /> Leave
            </Button>
          </div>
        </div>

        {/* Members grid — full width */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">
              {members.length === 0
                ? "Lobby is empty"
                : `${members.length} ${members.length === 1 ? "person" : "people"} here`}
            </p>
            <span className="text-xs text-muted-foreground">Waiting to start…</span>
          </div>

          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Users className="h-12 w-12 opacity-20" />
              <p className="text-sm">No one has joined yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {members.map((m) => (
                <div
                  key={m.uid}
                  className="bg-card rounded-xl border p-4 flex flex-col items-center gap-2.5 text-center hover:shadow-sm transition-all"
                >
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                        {(m.displayName || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-card" />
                  </div>
                  <span className="text-sm font-medium truncate w-full">
                    {m.displayName || "Member"}
                  </span>
                  {m.uid === room.hostUid ? (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      HOST
                    </span>
                  ) : (
                    <span className="text-xs text-emerald-600 font-medium">Ready</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action bar — pinned bottom */}
        <div className="border-t px-6 lg:px-8 py-4 bg-card/60 flex items-center gap-3">
          {!joined ? (
            <Button onClick={handleJoin} disabled={joining} size="lg" className="gap-2">
              {joining ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}{" "}
              Join lobby
            </Button>
          ) : isHost ? (
            <Button onClick={handleStart} size="lg" className="gap-2">
              <Play className="h-4 w-4" /> Start Study Session
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Waiting for host to start…
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── ACTIVE SESSION — 3-panel ──────────────────────────────────────────────
  return (
    <div className="flex flex-col -mx-4 lg:-mx-8 -my-6" style={{ height: "calc(100% + 3rem)" }}>
      {showLeaveSheet && <LeaveTaskSheet onDone={doLeave} onSkip={doLeave} />}
      {leaveGuardDialog}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b bg-card/95 backdrop-blur-sm shrink-0 sm:gap-3 sm:px-5 sm:py-3">
        <h1 className="min-w-0 flex-1 truncate text-sm font-bold sm:max-w-[180px] sm:flex-none sm:text-base">
          {room.roomName || room.name}
        </h1>
        {(room.subjectTag || room.subject_tag) && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
            {room.subjectTag || room.subject_tag}
          </span>
        )}
        {room.roomCode && (
          <button
            onClick={copyCode}
            title="Copy room code"
            className="flex items-center gap-1.5 font-mono text-xs bg-muted hover:bg-muted/70 px-2.5 py-1 rounded-lg transition-colors shrink-0"
          >
            <span className="tracking-widest font-bold">{room.roomCode}</span>
            <Copy className="h-3 w-3 text-muted-foreground" />
            {codeCopied && (
              <span className="text-emerald-500 font-sans not-italic font-semibold">✓</span>
            )}
          </button>
        )}
        <div
          className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${phaseColor} bg-muted`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${phaseDot} ${phase === "focus" ? "animate-pulse" : ""}`}
          />
          {phaseLabel}
        </div>
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveClick}
            className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-3.5 w-3.5" /> Leave
          </Button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Left: Voice panel — owns volumes state; volume snapshots re-render only this */}
        <VoicePanel
          members={members}
          phase={phase}
          voiceLocked={voiceLocked}
          isMuted={isMuted}
          toggleMute={toggleMute}
          onVolumeRef={onVolumeRef}
          isHost={isHost}
          currentUid={currentUser?.uid}
          onKick={handleKick}
        />

        {/* Center: Timer */}
        <div className="flex min-h-[360px] flex-1 flex-col items-center justify-center gap-5 bg-background px-3 py-6 sm:gap-6 lg:min-h-0 lg:px-0 lg:py-0">
          {/* SVG ring + timer — owns the 1s countdown; ticks re-render only the ring */}
          <TimerRing room={room} phase={phase} />

          {/* Round counter — simple text */}
          <p className="text-sm text-muted-foreground font-medium">Round {roundNum}</p>

          {/* Controls */}
          {isHost && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <button
                onClick={handleSkip}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted sm:px-5"
              >
                <SkipForward className="h-4 w-4" />
                {phase === "focus" ? "Start break" : "Start focus"}
              </button>
              <button
                onClick={handleEnd}
                className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted sm:px-5"
              >
                <Square className="h-4 w-4" /> End session
              </button>
            </div>
          )}
          {!isHost && <p className="text-xs text-muted-foreground">Host controls the session</p>}
        </div>

        {/* Right: Chat */}
        <div className="flex max-h-80 w-full shrink-0 flex-col border-t bg-card lg:max-h-none lg:w-72 lg:border-l lg:border-t-0">
          <div className="px-4 py-2.5 border-b flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Chat</span>
            {chatLocked && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                <Lock className="h-3 w-3" /> LOCKED
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {messages.map((msg) => {
              const isFile = msg.text?.startsWith("[FILE]");
              const time = msg.sentAt?.toDate
                ? new Date(msg.sentAt.toDate()).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";
              return (
                <div key={msg.id}>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                  </div>
                  {isFile ? (
                    (() => {
                      // Message format: [FILE]<name>|<url>|<type> — strip the
                      // 6-char "[FILE]" prefix before splitting so the segments
                      // line up as [name, url, type] (the prefix is fused to the
                      // filename in the first segment otherwise).
                      const [name, url, type] = msg.text.slice(6).split("|");
                      return type === "image" ? (
                        <a href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={name}
                            className="mt-1 rounded-lg max-w-full max-h-40 object-cover border"
                          />
                        </a>
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-primary underline mt-0.5"
                        >
                          📎 {name}
                        </a>
                      );
                    })()
                  ) : (
                    <p className="text-sm break-words leading-snug">{msg.text}</p>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-3 py-2.5 border-t">
            {chatLocked ? (
              <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" /> Chat locked during focus
              </div>
            ) : (
              <div className="flex gap-1.5 items-center">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Message…"
                  className="h-8 text-sm flex-1"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Upload file"
                >
                  {uploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={handleSend}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function initialsOf(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function statusBadge(status) {
  if (status === "studying")
    return { label: "Studying", dot: "bg-emerald-500", text: "text-emerald-600" };
  if (status === "on_break")
    return { label: "On Break", dot: "bg-orange-400", text: "text-orange-600" };
  return { label: "Idle", dot: "bg-gray-400", text: "text-muted-foreground" };
}

function ActivityHeatmap({ activity }) {
  // Accept both backend shapes:
  // - stats.activity: { "2026-06-01": 120 }
  // - profile/activity: [{ date: "2026-06-01", focus_minutes: 120 }]
  const source = Array.isArray(activity?.activity) ? activity.activity : activity;
  const map = {};
  if (Array.isArray(source)) {
    source.forEach((item) => {
      const date = item?.date;
      if (!date) return;
      map[date] = Number(item.focus_minutes ?? item.focusMinutes ?? item.minutes ?? item.mins ?? 0);
    });
  } else if (source && typeof source === "object") {
    Object.entries(source).forEach(([date, value]) => {
      map[date] = Number(
        typeof value === "object"
          ? (value.focus_minutes ?? value.focusMinutes ?? value.minutes ?? value.mins ?? 0)
          : value,
      );
    });
  }
  const keyOf = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const levelOf = (mins) => (!mins ? 0 : mins < 30 ? 1 : mins < 60 ? 2 : mins < 120 ? 3 : 4);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cells = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (83 - i));
    const mins = map[keyOf(d)] || 0;
    return { date: keyOf(d), level: levelOf(mins), mins };
  });
  const totalMinutes = cells.reduce((sum, c) => sum + c.mins, 0);
  const activeDays = cells.filter((c) => c.mins > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {activeDays > 0
            ? `${activeDays} active days · ${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m focused`
            : "No focus activity recorded in the last 12 weeks."}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Less</span>
          {["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"].map(
            (shade) => (
              <span key={shade} className={`h-3 w-3 rounded-sm ${shade}`} />
            ),
          )}
          <span>More</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div
          className="grid w-max gap-1"
          style={{
            gridTemplateColumns: "repeat(12, 16px)",
            gridTemplateRows: "repeat(7, 16px)",
            gridAutoFlow: "column",
          }}
        >
          {cells.map((c, i) => {
            const shade =
              ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"][
                c.level
              ] || "bg-muted";
            return (
              <div
                key={i}
                className={`h-4 w-4 rounded-sm ${shade}`}
                title={`${c.date}: ${c.mins} min focused`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StreakDefinition() {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-orange-500/5 p-4 text-sm text-muted-foreground">
      <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-orange-500/10 grid place-items-center">
        <Flame className="h-4 w-4 text-orange-500" />
      </div>
      <div>
        <div className="font-semibold text-foreground">How streaks are counted</div>
        <p className="mt-1">
          A streak day means you completed a Pomodoro, submitted a daily standup, or marked a sprint
          task as Done. Yesterday still keeps the streak active until today ends.
        </p>
      </div>
    </div>
  );
}

export function ProfilePage({ uid }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const authUser = useAuthStore((s) => s.user);
  const authProfile = useAuthStore((s) => s.profile);
  const { data: myProfile } = useProfile();
  const [achievementDraft, setAchievementDraft] = useState({
    title: "",
    description: "",
    category: "",
    evidence_url: "",
  });
  const [projectDraft, setProjectDraft] = useState({
    title: "",
    description: "",
    category: "",
    project_url: "",
    repository_url: "",
    status: "in_progress",
  });
  const effectiveMyProfile = myProfile || authProfile;
  const authUid = authUser?.uid || "";
  const myUid = String(
    effectiveMyProfile?.uid ||
      effectiveMyProfile?.firebase_uid ||
      authUid ||
      effectiveMyProfile?.id ||
      "",
  );
  const requestedUid = String(uid || "");
  const isSelf = !requestedUid || requestedUid === myUid || (!!authUid && requestedUid === authUid);

  // Self uses /user/profile + /user/profile/stats; others use /social/users/{uid}/profile
  const { data: otherProfile, isLoading: loadingOther } = useQuery({
    queryKey: ["social", "users", String(uid), "profile"],
    queryFn: () => socialApi.discovery.profile(uid),
    enabled: !isSelf && !!uid,
    retry: 1,
  });

  const { data: myStats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: userApi.stats,
    enabled: isSelf,
    retry: false,
  });
  const { data: myActivity } = useQuery({
    queryKey: ["user", "activity"],
    queryFn: userApi.activity,
    enabled: isSelf,
    retry: false,
  });

  const { data: friendsList = [] } = useQuery({
    queryKey: ["social", "friends"],
    queryFn: socialApi.friends.list,
    retry: 1,
  });

  const profile = isSelf ? effectiveMyProfile : otherProfile;
  const stats = isSelf ? myStats : otherProfile?.stats;
  // Activity lives inside the stats payload for both self and other users.
  const activity = isSelf
    ? (myActivity?.activity ?? myStats?.activity)
    : otherProfile?.stats?.activity;
  const profileUid = String(profile?.uid || profile?.firebase_uid || uid || "");

  const { data: achievements = [] } = useQuery({
    queryKey: ["social", "achievements", profileUid || "me"],
    queryFn: () =>
      isSelf ? socialApi.achievements.list() : socialApi.achievements.forUser(profileUid),
    enabled: isSelf || !!profileUid,
    retry: 1,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["social", "projects", profileUid || "me"],
    queryFn: () => (isSelf ? socialApi.projects.list() : socialApi.projects.forUser(profileUid)),
    enabled: isSelf || !!profileUid,
    retry: 1,
  });

  const name = profile?.name || profile?.display_name || "User";
  const avatar = profile?.avatar_url || profile?.avatar || "";
  const university = profile?.university || "";
  const bio = profile?.bio || "";
  const gradYear = profile?.graduation_year;
  const status = profile?.study_status || "idle";
  const badge = statusBadge(status);
  const focusHours = Math.round(Number(stats?.total_focus_minutes ?? 0) / 60);
  const currentStreak = stats?.current_streak ?? stats?.streak ?? 0;
  const longestStreak = stats?.longest_streak ?? stats?.max_streak ?? 0;

  // Connection state for non-self
  const friends = Array.isArray(friendsList) ? friendsList : friendsList?.data || [];
  const friendIds = new Set(friends.map((f) => String(f.uid || f.firebase_uid || f.id)));
  const isFriend = !isSelf && friendIds.has(String(uid));
  const isPending = !isSelf && otherProfile?.has_sent_request === true;

  const { mutate: sendReq, isPending: sending } = useMutation({
    mutationFn: () => socialApi.friends.send(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "users", String(uid), "profile"] });
      toast.success("Connection request sent");
    },
    onError: (error) => toast.error(error?.message || "Could not send request"),
  });

  const { mutate: createAchievement, isPending: creatingAchievement } = useMutation({
    mutationFn: (body) => socialApi.achievements.create(body),
    onSuccess: () => {
      setAchievementDraft({ title: "", description: "", category: "", evidence_url: "" });
      qc.invalidateQueries({ queryKey: ["social", "achievements", profileUid || "me"] });
      qc.invalidateQueries({ queryKey: ["social", "feed"] });
      toast.success("Achievement added");
    },
    onError: (error) => toast.error(error?.message || "Could not add achievement"),
  });

  const { mutate: createProject, isPending: creatingProject } = useMutation({
    mutationFn: (body) => socialApi.projects.create(body),
    onSuccess: () => {
      setProjectDraft({
        title: "",
        description: "",
        category: "",
        project_url: "",
        repository_url: "",
        status: "in_progress",
      });
      qc.invalidateQueries({ queryKey: ["social", "projects", profileUid || "me"] });
      qc.invalidateQueries({ queryKey: ["social", "feed"] });
      toast.success("Project added");
    },
    onError: (error) => toast.error(error?.message || "Could not add project"),
  });

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function submitAchievement(e) {
    e.preventDefault();
    const title = achievementDraft.title.trim();
    if (!title) return;
    createAchievement({
      title,
      description: achievementDraft.description.trim() || undefined,
      category: achievementDraft.category.trim() || undefined,
      evidence_url: normalizeUrl(achievementDraft.evidence_url),
      visibility: "public",
      share_to_feed: true,
    });
  }

  function submitProject(e) {
    e.preventDefault();
    const title = projectDraft.title.trim();
    if (!title) return;
    createProject({
      title,
      description: projectDraft.description.trim() || undefined,
      category: projectDraft.category.trim() || undefined,
      project_url: normalizeUrl(projectDraft.project_url),
      repository_url: normalizeUrl(projectDraft.repository_url),
      status: projectDraft.status,
      visibility: "public",
      share_to_feed: true,
    });
  }

  const { mutate: removeFriend, isPending: removing } = useMutation({
    mutationFn: () => socialApi.friends.remove(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "friends"] });
      toast.success("Removed connection");
    },
  });

  if ((isSelf && !profile) || (!isSelf && loadingOther)) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-4 px-1 sm:px-0">
        <div className="h-9 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="h-28 sm:h-32 bg-muted animate-pulse" />
          <div className="p-4 sm:p-6 space-y-3">
            <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
            <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            <div className="h-4 w-56 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!isSelf && !otherProfile) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/social" })}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          Profile not found or private.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 px-1 pb-8 sm:px-0">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/social" })}>
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to social
      </Button>

      {/* Header */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-primary to-primary/60 sm:h-32">
          {profile?.banner_url && (
            <img
              src={profile.banner_url}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
        <div className="px-4 pb-5 -mt-10 sm:px-6 sm:pb-6 sm:-mt-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <Avatar className="h-20 w-20 border-4 border-card sm:h-24 sm:w-24">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-lg sm:text-xl">{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-2 sm:pb-1">
              {isSelf ? (
                <Button size="sm" onClick={() => navigate({ to: "/profile/edit" })}>
                  <PencilIcon className="h-3.5 w-3.5 mr-1.5" /> Edit profile
                </Button>
              ) : isFriend ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={removing}
                  onClick={() => removeFriend()}
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1.5" /> Connected
                </Button>
              ) : isPending ? (
                <Button size="sm" variant="outline" disabled>
                  <UserX className="h-3.5 w-3.5 mr-1.5" /> Pending
                </Button>
              ) : (
                <Button size="sm" disabled={sending} onClick={() => sendReq()}>
                  <UserPlusIcon className="h-3.5 w-3.5 mr-1.5" /> Connect
                </Button>
              )}
            </div>
          </div>
          <div className="mt-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">{name}</h2>
              <span className={`inline-flex items-center gap-1 text-xs ${badge.text}`}>
                <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            {(university || gradYear) && (
              <div className="text-sm text-muted-foreground mt-0.5">
                {university}
                {university && gradYear && " · "}
                {gradYear && `Class of ${gradYear}`}
              </div>
            )}
            {bio && <p className="mt-2 break-words text-sm">{bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">
            {stats?.sessions_count ?? stats?.total_sessions ?? 0}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Sessions</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{focusHours}h</div>
          <div className="text-xs text-muted-foreground mt-1">Focus hours</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{currentStreak}</div>
          <div className="text-xs text-muted-foreground mt-1">Day streak</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{profile?.friends_count ?? friends.length}</div>
          <div className="text-xs text-muted-foreground mt-1">Connections</div>
        </div>
      </div>

      {/* Streak cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-orange-500/10 grid place-items-center">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Current streak</div>
            <div className="text-lg font-bold">{currentStreak} days</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 grid place-items-center">
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Longest streak</div>
            <div className="text-lg font-bold">{longestStreak} days</div>
          </div>
        </div>
      </div>

      <StreakDefinition />

      {/* Achievements */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-sm">Achievements</h3>
          <span className="text-xs text-muted-foreground">{achievements.length}</span>
        </div>

        {isSelf && (
          <form onSubmit={submitAchievement} className="mb-4 grid gap-2">
            <Input
              value={achievementDraft.title}
              onChange={(e) => setAchievementDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Achievement title"
            />
            <div className="grid sm:grid-cols-2 gap-2">
              <Input
                value={achievementDraft.category}
                onChange={(e) => setAchievementDraft((d) => ({ ...d, category: e.target.value }))}
                placeholder="Category or subject"
              />
              <Input
                value={achievementDraft.evidence_url}
                onChange={(e) =>
                  setAchievementDraft((d) => ({ ...d, evidence_url: e.target.value }))
                }
                placeholder="Evidence link"
              />
            </div>
            <Textarea
              value={achievementDraft.description}
              onChange={(e) => setAchievementDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="What did you achieve?"
              rows={3}
            />
            <Button
              type="submit"
              size="sm"
              className="w-fit"
              disabled={!achievementDraft.title.trim() || creatingAchievement}
            >
              {creatingAchievement ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add achievement
            </Button>
          </form>
        )}

        {achievements.length === 0 ? (
          <div className="text-sm text-muted-foreground">No achievements shared yet.</div>
        ) : (
          <div className="grid gap-2">
            {achievements.map((a) => (
              <div key={a.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{a.title}</div>
                    {a.category && (
                      <div className="text-xs text-muted-foreground mt-0.5">{a.category}</div>
                    )}
                  </div>
                  {a.evidence_url && (
                    <a
                      href={a.evidence_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Evidence
                    </a>
                  )}
                </div>
                {a.description && (
                  <p className="text-sm mt-2 text-muted-foreground">{a.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Projects */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-sm">Projects</h3>
          <span className="text-xs text-muted-foreground">{projects.length}</span>
        </div>

        {isSelf && (
          <form onSubmit={submitProject} className="mb-4 grid gap-2">
            <Input
              value={projectDraft.title}
              onChange={(e) => setProjectDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="Project title"
            />
            <div className="grid sm:grid-cols-3 gap-2">
              <Input
                value={projectDraft.category}
                onChange={(e) => setProjectDraft((d) => ({ ...d, category: e.target.value }))}
                placeholder="Category"
              />
              <Input
                value={projectDraft.project_url}
                onChange={(e) => setProjectDraft((d) => ({ ...d, project_url: e.target.value }))}
                placeholder="Project link"
              />
              <Input
                value={projectDraft.repository_url}
                onChange={(e) => setProjectDraft((d) => ({ ...d, repository_url: e.target.value }))}
                placeholder="Repository link"
              />
            </div>
            <Select
              value={projectDraft.status}
              onValueChange={(status) => setProjectDraft((d) => ({ ...d, status }))}
            >
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={projectDraft.description}
              onChange={(e) => setProjectDraft((d) => ({ ...d, description: e.target.value }))}
              placeholder="What are you building?"
              rows={3}
            />
            <Button
              type="submit"
              size="sm"
              className="w-fit"
              disabled={!projectDraft.title.trim() || creatingProject}
            >
              {creatingProject ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Add project
            </Button>
          </form>
        )}

        {projects.length === 0 ? (
          <div className="text-sm text-muted-foreground">No projects shared yet.</div>
        ) : (
          <div className="grid gap-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{project.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {project.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5">
                          {project.category}
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5">
                        {project.status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {project.project_url && (
                      <a
                        href={project.project_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Live
                      </a>
                    )}
                    {project.repository_url && (
                      <a
                        href={project.repository_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        Code
                      </a>
                    )}
                  </div>
                </div>
                {project.description && (
                  <p className="text-sm mt-2 text-muted-foreground">{project.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity heatmap */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Activity — last 12 weeks</h3>
        <ActivityHeatmap activity={activity} />
      </div>
    </div>
  );
}

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Header title="Analytics" subtitle="Streaks, XP, and study heatmap." />
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-2">XP this week</h3>
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={weeklyXP}>
                <XAxis dataKey="day" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="xp" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="text-xs text-muted-foreground">Current streak</div>
          <div className="text-3xl font-bold mt-1">{me.streak} days 🔥</div>
          <div className="mt-4 text-xs text-muted-foreground">Total focus this month</div>
          <div className="text-2xl font-semibold">42h 15m</div>
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <h3 className="font-semibold text-sm mb-3">Session heatmap</h3>
        <Heatmap />
      </div>
    </div>
  );
}

function Heatmap() {
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(20, 1fr)" }}>
      {heatmap.map((c, i) => {
        const shade =
          ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"][c.v] ||
          "bg-muted";
        return <div key={i} className={`aspect-square rounded-sm ${shade}`} />;
      })}
    </div>
  );
}

export function NotificationsPage() {
  const qc = useQueryClient();

  const { data: requests = [], isLoading: loadingReq } = useQuery({
    queryKey: ["social", "friends", "requests"],
    queryFn: socialApi.friends.requests,
    retry: 1,
  });

  const { data: activityRaw, isLoading: loadingActivity } = useQuery({
    queryKey: ["study", "notifications"],
    queryFn: () => studyApi.notifications.list(),
    retry: 1,
  });

  const { mutate: accept } = useMutation({
    mutationFn: (uid) => socialApi.friends.accept(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "friends"] });
      toast.success("Connection accepted");
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: (uid) => socialApi.friends.reject(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "friends", "requests"] }),
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: studyApi.notifications.readAll,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study", "notifications"] });
      qc.invalidateQueries({ queryKey: ["study", "notifications", "unread"] });
    },
  });

  // Auto-mark all read when the page mounts (same as LinkedIn / Flutter tab tap).
  useEffect(() => {
    markAllRead();
  }, []);

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => studyApi.notifications.read(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["study", "notifications"] });
      qc.invalidateQueries({ queryKey: ["study", "notifications", "unread"] });
    },
  });

  const reqList = Array.isArray(requests) ? requests : requests?.data || [];
  const activityList = Array.isArray(activityRaw) ? activityRaw : activityRaw?.data || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header title="Notifications" />

      {/* Friend requests section */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Connection requests
        </div>
        <div className="rounded-xl border bg-card">
          {loadingReq ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : reqList.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No pending requests.</div>
          ) : (
            <div className="divide-y">
              {reqList.map((req) => {
                const user = req.sender || req.user || req;
                const name = user.name || user.display_name || "User";
                const avatar = user.avatar_url || user.avatar || "";
                const uid = String(
                  user.uid ||
                    user.firebase_uid ||
                    req.uid ||
                    req.firebase_uid ||
                    user.id ||
                    req.sender_id ||
                    "",
                );
                const university = user.university || "";
                return (
                  <div key={uid} className="p-4 flex items-center gap-3">
                    {uid ? (
                      <Link to="/profile/$uid" params={{ uid }}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={avatar} />
                          <AvatarFallback>{initialsOf(name)}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={avatar} />
                        <AvatarFallback>{initialsOf(name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="flex-1 min-w-0">
                      {uid ? (
                        <Link
                          to="/profile/$uid"
                          params={{ uid }}
                          className="text-sm font-medium hover:underline"
                        >
                          {name}
                        </Link>
                      ) : (
                        <div className="text-sm font-medium">{name}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        wants to connect{university && ` · ${university}`}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => accept(uid)}>
                      <Check className="h-3.5 w-3.5 mr-1" /> Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => reject(uid)}>
                      <X className="h-3.5 w-3.5 mr-1" /> Decline
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Activity section */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Activity
        </div>
        <div className="rounded-xl border bg-card divide-y">
          {loadingActivity ? (
            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
          ) : activityList.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No activity yet.</div>
          ) : (
            activityList.map((n) => {
              const isUnread = n.read === false || n.is_read === false || n.read_at == null;
              const title = n.title || n.message || n.type || "Notification";
              const body = n.body || n.description || n.content || "";
              const time = n.created_at
                ? new Date(n.created_at).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : n.time || "";
              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${isUnread ? "bg-primary/[0.03]" : ""}`}
                  onClick={() => isUnread && markRead(n.id)}
                >
                  <div
                    className={`h-9 w-9 rounded-lg grid place-items-center ${isUnread ? "bg-primary/10" : "bg-muted"}`}
                  >
                    <BellRing className={`h-4 w-4 ${isUnread ? "text-primary" : ""}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>
                      {title}
                    </div>
                    {body ? (
                      <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
                    ) : null}
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0">{time}</div>
                  {isUnread && <div className="h-2 w-2 rounded-full bg-primary mt-1 shrink-0" />}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Header title="Settings" subtitle="Profile, privacy, and notifications." />
      <Section title="Profile">
        <Field label="Name" value={me.name} />
        <Field label="Email" value={me.email} />
        <Field label="Status" value="Available" />
      </Section>
      <Section title="Privacy">
        <Toggle label="Public profile" defaultOn />
        <Toggle label="Show online status" defaultOn />
        <Toggle label="Allow study session invites" defaultOn />
      </Section>
      <Section title="Notifications">
        <Toggle label="Push notifications" defaultOn />
        <Toggle label="Daily standup reminder" defaultOn />
        <Toggle label="Sprint deadline alerts" defaultOn />
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="px-4 py-3 border-b text-sm font-semibold">{title}</div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  );
}
function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">{label}</div>
      <input defaultValue={value} className="h-9 px-3 rounded-md border bg-background text-sm" />
    </div>
  );
}
function Toggle({ label, defaultOn }) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultOn}
        className="h-5 w-9 appearance-none rounded-full bg-muted checked:bg-primary relative cursor-pointer transition-colors before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
      />
    </label>
  );
}

export function DomainDetailPage({ id }) {
  const d = domains.find((x) => x.id === id) || domains[0];
  const domainTasks = tasks.filter((t) => t.domain_id === d.id);
  return (
    <div className="space-y-6">
      <Header
        title={d.domain_name}
        subtitle={`${d.area_type} · ${d.priority} priority · ${d.difficulty}`}
      >
        <Button>
          <Plus className="h-4 w-4 mr-1.5" /> Add task
        </Button>
      </Header>
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Weekly target" value={`${d.weekly_target_hours}h`} />
        <Stat label="Tasks" value={domainTasks.length} />
        <Stat label="Preferred days" value={d.preferred_days.length} />
      </div>
      <div className="rounded-xl border bg-card divide-y">
        {domainTasks.map((t) => (
          <div key={t.id} className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium">{t.title}</div>
              <div className="text-xs text-muted-foreground">
                {t.priority} · due {t.deadline}
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted">{t.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const asArray = (payload) => (Array.isArray(payload) ? payload : payload?.data || []);

function fmtDeadline(raw) {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const PRIORITY_COLOR = {
  Critical: "bg-rose-500",
  Highest: "bg-rose-500",
  High: "bg-rose-400",
  Medium: "bg-amber-400",
  Low: "bg-sky-400",
  Lowest: "bg-sky-300",
};
const STATUS_STYLE = {
  Done: { pill: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  "In Progress": { pill: "bg-primary/10 text-primary", dot: "bg-primary" },
  "To Do": { pill: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" },
};
function normStatus(s = "") {
  const v = String(s).toLowerCase().replace(/[-_ ]/g, "");
  if (v === "done" || v === "completed") return "Done";
  if (v === "inprogress" || v === "doing") return "In Progress";
  return "To Do";
}

export function TaskDetailPage({ id }) {
  const navigate = useNavigate();
  const { data: task, isLoading, error } = useTask(id);
  const { data: commentsPayload = [] } = useTaskComments(id);
  const comments = asArray(commentsPayload);
  const m = useStudyMutations();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const lastSavedProgress = useRef(null);
  const [localStatus, setLocalStatus] = useState(null);
  const [optimisticSubtasks, setOptimisticSubtasks] = useState({});
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");

  const subtasks = task?.subtasks || task?.sub_tasks || [];

  useEffect(() => {
    if (Object.keys(optimisticSubtasks).length === 0) return;
    setOptimisticSubtasks((prev) => {
      const next = { ...prev };
      let changed = false;
      subtasks.forEach((s) => {
        const serverDone = (s.status || "Pending") === "Completed";
        if (s.id in next && next[s.id] === serverDone) {
          delete next[s.id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [subtasks]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading task…
      </div>
    );
  }
  if (error || !task) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive">
        {error?.message || "Task not found."}
      </div>
    );
  }

  const serverProgress = task.progress_percentage ?? 0;
  const progressValue = progress ?? serverProgress;
  const isProgressDirty = progress !== null && progress !== lastSavedProgress.current;
  const domainName =
    (typeof task.domain === "string"
      ? task.domain
      : task.domain?.domain_name || task.domain?.domainName) || "—";
  const displayStatus = normStatus(localStatus ?? task.status);
  const estHours = task.expected_hours != null ? `${parseFloat(task.expected_hours)}h` : null;
  const doneSubtasks = subtasks.filter((s) => {
    const serverDone = (s.status || "Pending") === "Completed";
    return s.id in optimisticSubtasks ? optimisticSubtasks[s.id] : serverDone;
  }).length;
  const ss = STATUS_STYLE[displayStatus] || STATUS_STYLE["To Do"];

  // progress ring SVG
  const R = 28;
  const C = 2 * Math.PI * R;
  const dash = (progressValue / 100) * C;

  return (
    <div className="space-y-0">
      {/* Back */}
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Hero header */}
      <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-primary/10 via-background to-[color:var(--ai)]/10 border p-6">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.08] to-[color:var(--ai)]/[0.05]" />
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Progress ring */}
          <div className="shrink-0 relative h-16 w-16 grid place-items-center">
            <svg className="-rotate-90" width="64" height="64">
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                className="text-muted/40"
              />
              <circle
                cx="32"
                cy="32"
                r={R}
                fill="none"
                stroke="url(#pg)"
                strokeWidth="5"
                strokeDasharray={`${dash} ${C - dash}`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
              <defs>
                <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-ai)" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute text-xs font-bold">{progressValue}%</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ss.pill}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${ss.dot}`} />
                {displayStatus}
              </span>
              {task.priority && (
                <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${PRIORITY_COLOR[task.priority] || "bg-muted-foreground"}`}
                  />
                  {task.priority}
                </span>
              )}
              {task.points != null && (
                <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-xs font-medium">
                  {task.points} pts
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold tracking-tight truncate">{task.title}</h1>
            <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {task.difficulty && <span>{task.difficulty} difficulty</span>}
              {estHours && <span>· {estHours} estimated</span>}
              {task.deadline && <span>· Due {fmtDeadline(task.deadline)}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          {task.description && (
            <section className="rounded-2xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                Description
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {task.description}
              </p>
            </section>
          )}

          {/* Progress */}
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                Progress
              </h2>
              <span className="text-sm font-bold text-primary">{progressValue}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[color:var(--ai)] transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              />
            </div>
            <Slider
              min={0}
              max={100}
              step={5}
              value={[progressValue]}
              onValueChange={([v]) => setProgress(v)}
              className="mb-4"
            />
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                disabled={m.updateTaskProgress.isPending || !isProgressDirty}
                onClick={() => {
                  lastSavedProgress.current = progressValue;
                  m.updateTaskProgress.mutate({ id, progress: progressValue });
                }}
              >
                {m.updateTaskProgress.isPending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                Save progress
              </Button>
              {estHours && (
                <span className="text-xs text-muted-foreground">{estHours} estimate</span>
              )}
            </div>
          </section>

          {/* Subtasks */}
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <span className="h-5 w-1 rounded-full bg-primary" />
                Subtasks
              </h2>
              {subtasks.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {doneSubtasks}/{subtasks.length} done
                </span>
              )}
            </div>
            {subtasks.length > 0 && (
              <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.round((doneSubtasks / subtasks.length) * 100)}%` }}
                />
              </div>
            )}
            <ul className="space-y-1">
              {subtasks.map((s) => {
                const serverDone = (s.status || "Pending") === "Completed";
                const done = s.id in optimisticSubtasks ? optimisticSubtasks[s.id] : serverDone;
                return (
                  <li
                    key={s.id}
                    className="flex items-center gap-3 group rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <button
                      className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${done ? "bg-emerald-500 border-emerald-500 text-white" : "border-border hover:border-primary"}`}
                      onClick={() => {
                        setOptimisticSubtasks((prev) => ({ ...prev, [s.id]: !done }));
                        m.toggleSubtask.mutate(
                          { taskId: id, subtaskId: s.id },
                          {
                            onError: () =>
                              setOptimisticSubtasks((prev) => ({ ...prev, [s.id]: done })),
                          },
                        );
                      }}
                    >
                      {done && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : ""}`}
                    >
                      {s.title}
                    </span>
                    <button
                      onClick={() => m.removeSubtask.mutate({ taskId: id, subtaskId: s.id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
              {subtasks.length === 0 && (
                <li className="text-sm text-muted-foreground py-2 px-3">No subtasks yet.</li>
              )}
            </ul>
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subtaskDraft.trim()) {
                    e.preventDefault();
                    m.addSubtask.mutate(
                      { taskId: id, body: { title: subtaskDraft.trim() } },
                      { onSuccess: () => setSubtaskDraft("") },
                    );
                  }
                }}
                placeholder="Add a subtask…"
                className="h-9"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9 shrink-0"
                disabled={!subtaskDraft.trim() || m.addSubtask.isPending}
                onClick={() =>
                  m.addSubtask.mutate(
                    { taskId: id, body: { title: subtaskDraft.trim() } },
                    { onSuccess: () => setSubtaskDraft("") },
                  )
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Comments */}
          <section className="rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
              <span className="h-5 w-1 rounded-full bg-primary" />
              Comments
              {comments.length > 0 && (
                <span className="ml-auto text-xs text-muted-foreground font-normal">
                  {comments.length}
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {comments.map((c) => {
                const author = c.user || {};
                const name = author.name || author.display_name || c.user_name || "User";
                const avatar = author.avatar_url || author.avatar || "";
                const ts = c.created_at || c.createdAt || "";
                return (
                  <div key={c.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-2.5">
                        <div className="text-xs font-semibold text-foreground mb-1">{name}</div>
                        <div className="text-sm text-foreground/90">{c.content}</div>
                      </div>
                      {ts && (
                        <div className="text-[11px] text-muted-foreground mt-1 pl-1">
                          {fmtDeadline(ts)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No comments yet. Start the conversation.
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
                className="resize-none rounded-xl flex-1"
              />
              <Button
                size="icon"
                className="h-full w-10 shrink-0 rounded-xl self-end"
                disabled={!commentDraft.trim() || m.addComment.isPending}
                onClick={() =>
                  m.addComment.mutate(
                    { taskId: id, content: commentDraft.trim() },
                    { onSuccess: () => setCommentDraft("") },
                  )
                }
              >
                {m.addComment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </section>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Status picker */}
          <div className="rounded-2xl border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">
              Status
            </div>
            <Select
              value={displayStatus}
              onValueChange={(value) => {
                setLocalStatus(value);
                m.updateTaskStatus.mutate(
                  { id, status: value },
                  {
                    onSuccess: () => setLocalStatus(null),
                    onError: () => {
                      setLocalStatus(null);
                      toast.error("Failed to update status");
                    },
                  },
                );
              }}
            >
              <SelectTrigger className="h-9 rounded-xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${(STATUS_STYLE[displayStatus] || STATUS_STYLE["To Do"]).dot}`}
                  />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meta cards */}
          <div className="rounded-2xl border bg-card divide-y overflow-hidden">
            {[
              {
                label: "Priority",
                value: task.priority || "Medium",
                dot: PRIORITY_COLOR[task.priority],
              },
              { label: "Difficulty", value: task.difficulty || "Medium", dot: null },
              { label: "Domain", value: domainName, dot: null },
              ...(estHours ? [{ label: "Estimated", value: estHours, dot: null }] : []),
              ...(task.points != null
                ? [{ label: "Points", value: `${task.points} pts`, dot: null }]
                : []),
            ].map(({ label, value, dot }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <CreateTaskModal open={editOpen} onOpenChange={setEditOpen} task={task} />
      </Suspense>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              "{task.title}" will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                m.deleteTask.mutate(
                  { id },
                  {
                    onSuccess: () =>
                      window.history.length > 1 ? window.history.back() : navigate({ to: "/" }),
                  },
                );
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-0.5">{value}</div>
    </div>
  );
}

// ─── Edit Profile Page ────────────────────────────────────────────────────────

export function EditProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: profile } = useProfile();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [university, setUniversity] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const fileInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name || profile.display_name || "");
    setBio(profile.bio || "");
    setUniversity(profile.university || "");
    setGradYear(profile.graduation_year ? String(profile.graduation_year) : "");
    setIsPublic(profile.profile_visibility ?? profile.profileVisibility ?? true);
    setAvatarUrl(profile.avatar_url || profile.avatar || "");
    setBannerUrl(profile.banner_url || "");
  }, [profile]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: async () => {
      await userApi.updateProfile({
        name: name.trim(),
        bio: bio.trim() || null,
        university: university.trim() || null,
        graduation_year: gradYear ? parseInt(gradYear, 10) : null,
        avatar_url: avatarUrl || null,
        banner_url: bannerUrl || null,
      });
      await userApi.updatePrivacy({ profile_visibility: isPublic });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.user.profile });
      toast.success("Profile updated");
      navigate({
        to: "/profile/$uid",
        params: { uid: String(profile?.uid || profile?.firebase_uid || profile?.id || "") },
      });
    },
    // Surface the real server error (status + message) instead of a generic
    // toast — a 500 here is almost always a missing column/migration in the
    // backend, and seeing the actual message stops the guesswork.
    onError: (e) => {
      console.error("Profile save failed:", e?.status, e?.message, e?.data);
      toast.error(e?.message ? `Could not save profile: ${e.message}` : "Could not save profile");
    },
  });

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadUserAvatar(file);
      setAvatarUrl(url);
    } catch {
      toast.error("Avatar upload failed");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleBannerChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const url = await uploadUserBanner(file);
      setBannerUrl(url);
    } catch {
      toast.error("Cover photo upload failed");
    } finally {
      setBannerUploading(false);
    }
  }

  const displayName = name || "Me";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            window.history.length > 1 ? window.history.back() : navigate({ to: "/" })
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Edit profile</h1>
        <Button size="sm" disabled={saving || !name.trim()} onClick={() => save()}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
          Save
        </Button>
      </div>

      {/* Banner + Avatar */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Banner */}
        <div className="relative h-32 bg-gradient-to-br from-primary to-primary/60 group">
          {bannerUrl && (
            <img
              src={bannerUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <button
            className="absolute inset-0 w-full h-full flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors"
            onClick={() => bannerInputRef.current?.click()}
            disabled={bannerUploading}
          >
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-white text-xs font-semibold bg-black/40 rounded-full px-3 py-1.5">
              {bannerUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
              {bannerUploading ? "Uploading…" : "Change cover photo"}
            </span>
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
        </div>
        {/* Avatar overlapping banner */}
        <div className="px-6 pb-5 -mt-10 flex flex-col items-start gap-2">
          <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-card">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <button
              className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
            >
              {avatarUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Pencil className="h-3 w-3" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-xs text-muted-foreground">Click the pencil to change your photo</p>
        </div>
      </div>

      {/* Personal info */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Personal info
        </p>
        <FormField label="Display name" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
          />
        </FormField>
        <FormField label="Bio">
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short description about yourself"
            rows={3}
          />
        </FormField>
        <FormField label="University / Institution">
          <Input
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="e.g. MIT, Stanford…"
          />
        </FormField>
        <FormField label="Graduation year">
          <Input
            value={gradYear}
            onChange={(e) => setGradYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="e.g. 2026"
            inputMode="numeric"
          />
        </FormField>
      </div>

      {/* Privacy */}
      <div className="rounded-xl border bg-card p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Privacy
        </p>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Public profile</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Allow other students to view your profile and study stats
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>
      </div>
    </div>
  );
}

function FormField({ label, required, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
