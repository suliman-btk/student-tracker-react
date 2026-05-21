import { friends, notifications, weeklyXP, heatmap, me, tasks, domains, spaces, calendarEvents } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Header } from "./SpacesPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, MessageCircle, BellRing, Check, Mic, MicOff, LogOut, Send, Lock, Globe, Hash, Copy, Play, Pause, SkipForward, Square, ChevronRight } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { ArrowLeft, Loader2, Pencil, Trash2, X } from "lucide-react";
import { useTask, useTaskComments, useStudyMutations, useActiveSprint, useProfile } from "@/lib/query-hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialApi, userApi } from "@/lib/api";
import { Pencil as PencilIcon, Flame, Trophy, UserPlus as UserPlusIcon, UserCheck, UserX } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { focusApi, studyApi } from "@/lib/api";
import { createFirestoreRoom, joinRoomByCode, watchPublicRooms, watchRoom, watchRoomMembers, watchRoomMessages, joinRoom, leaveRoom, sendRoomMessage, uploadRoomFile, updateAgoraUid, updateRoomPhase, updateMutedState, endRoom, incrementRound } from "@/lib/realtime";
import { createAgoraRoomClient } from "@/lib/agora";
import { auth } from "@/lib/firebase";

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
  const [form, setForm] = useState({ name: "", focus_duration: 25, break_duration: 5, is_private: false, allowVoiceDuringFocus: true, allowChatDuringFocus: true });

  useEffect(() => watchPublicRooms(setRooms, console.error), []);

  const handleJoinByCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) { setCodeError("Code must be 6 characters"); return; }
    setCodeLoading(true); setCodeError("");
    try {
      let firestoreId = null;
      try {
        const room = await focusApi.rooms.findByCode(code);
        firestoreId = room?.firestore_room_id;
      } catch {}
      if (!firestoreId) firestoreId = await joinRoomByCode(code);
      if (!firestoreId) { setCodeError("Room not found"); return; }
      navigate({ to: "/rooms/$id", params: { id: firestoreId } });
    } catch { setCodeError("Room not found"); }
    finally { setCodeLoading(false); }
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const user = auth.currentUser;
      const roomCode = generateRoomCode();
      const firestoreId = await createFirestoreRoom({
        name: form.name, focusDuration: form.focus_duration, breakDuration: form.break_duration,
        hostUid: user?.uid, hostName: user?.displayName || user?.email?.split("@")[0] || "Host",
        roomCode, isPrivate: form.is_private, allowVoiceDuringFocus: form.allowVoiceDuringFocus, allowChatDuringFocus: form.allowChatDuringFocus,
      });
      try { await focusApi.rooms.create({ name: form.name, focus_duration: form.focus_duration, break_duration: form.break_duration, firestore_room_id: firestoreId, is_private: form.is_private, allow_voice_during_focus: form.allowVoiceDuringFocus, allow_chat_during_focus: form.allowChatDuringFocus }); } catch {}
      setShowCreate(false);
      navigate({ to: "/rooms/$id", params: { id: firestoreId } });
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const phaseLabel = (r) => {
    if (r.phase === "focus") return { label: "FOCUSING", cls: "bg-red-100 text-red-700" };
    if (r.phase === "breakTime") return { label: "ON BREAK", cls: "bg-emerald-100 text-emerald-700" };
    return { label: "WAITING", cls: "bg-muted text-muted-foreground" };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h1 className="text-xl font-bold">Group Study Rooms</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Co-work with friends in live Pomodoro sessions</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> New room</Button>
      </div>

      {/* Join by code */}
      <div className="px-6 py-3 border-b bg-muted/30">
        <div className="flex gap-2 max-w-sm">
          <div className="flex-1">
            <Input
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6)); setCodeError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoinByCode()}
              placeholder="Enter 6-char room code…"
              className="font-mono tracking-widest h-9 text-sm"
              maxLength={6}
            />
            {codeError && <p className="text-xs text-red-500 mt-1">{codeError}</p>}
          </div>
          <Button size="sm" onClick={handleJoinByCode} disabled={codeLoading || codeInput.length !== 6} className="h-9 gap-1">
            {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />} Join
          </Button>
        </div>
      </div>

      {/* Room list — Discord channel style */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {rooms.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">No public rooms yet. Create one!</div>
        )}
        {rooms.map((r) => {
          const { label, cls } = phaseLabel(r);
          return (
            <Link key={r.id} to="/rooms/$id" params={{ id: r.id }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group">
              <div className="text-muted-foreground group-hover:text-foreground transition-colors">
                {r.isPrivate ? <Lock className="h-4 w-4" /> : <Hash className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{r.roomName || r.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cls} shrink-0`}>{label}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {r.hostName} · {r.focusDuration || 25}m/{r.breakDuration || 5}m
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Users className="h-3.5 w-3.5" /> {r.memberCount || 0}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create study room</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <Label>Room name</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Late Night Algo Crunch" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Focus: {form.focus_duration}m</Label>
                <Slider min={5} max={90} step={5} value={[form.focus_duration]} onValueChange={([v]) => setForm((f) => ({ ...f, focus_duration: v }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Break: {form.break_duration}m</Label>
                <Slider min={1} max={30} step={1} value={[form.break_duration]} onValueChange={([v]) => setForm((f) => ({ ...f, break_duration: v }))} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Private room</Label>
                  <p className="text-xs text-muted-foreground">Require approval to join</p>
                </div>
                <Switch checked={form.is_private} onCheckedChange={(v) => setForm((f) => ({ ...f, is_private: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Voice during focus</Label>
                  <p className="text-xs text-muted-foreground">Allow mic use in focus phase</p>
                </div>
                <Switch checked={form.allowVoiceDuringFocus} onCheckedChange={(v) => setForm((f) => ({ ...f, allowVoiceDuringFocus: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Chat during focus</Label>
                  <p className="text-xs text-muted-foreground">Allow messages in focus phase</p>
                </div>
                <Switch checked={form.allowChatDuringFocus} onCheckedChange={(v) => setForm((f) => ({ ...f, allowChatDuringFocus: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !form.name.trim()}>
              {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />} Create & Enter
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
    if (!room?.isRunning || !room?.phaseEndsAt) { setSecs(room?.remainingSeconds || 0); return; }
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
  return `${mm}:${ss}`;
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
      tasks.forEach((t) => { init[t.id] = t.progress_percentage ?? 0; });
      setProgress(init);
    }
  }, [isLoading, tasks.length]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all(
        tasks
          .filter((t) => progress[t.id] !== (t.progress_percentage ?? 0))
          .map((t) => studyApi.tasks.updateProgress(t.id, progress[t.id]))
      );
    } catch {}
    finally { setSaving(false); onDone(); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">How did it go?</h2>
          <p className="text-sm text-muted-foreground mt-1">Update your sprint task progress before leaving.</p>
        </div>
        <div className="p-6 space-y-5 max-h-[26rem] overflow-y-auto">
          {isLoading && Array.from({ length: 4 }).map((_, i) => <TaskSkeleton key={i} />)}
          {!isLoading && tasks.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No tasks in active sprint.</p>
          )}
          {!isLoading && tasks.map((t) => (
            <div key={t.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{t.title}</span>
                <span className="text-xs font-semibold text-primary shrink-0 ml-2 tabular-nums">{progress[t.id] ?? 0}%</span>
              </div>
              <Slider min={0} max={100} step={5} value={[progress[t.id] ?? 0]}
                onValueChange={([v]) => setProgress((p) => ({ ...p, [t.id]: v }))} />
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex gap-3 justify-end">
          <Button variant="ghost" onClick={onSkip}>Skip</Button>
          <Button onClick={handleSave} disabled={saving || isLoading} className="bg-primary hover:bg-primary/90">
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

  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volumes, setVolumes] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [showLeaveSheet, setShowLeaveSheet] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const agoraRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const autoJoinedRef = useRef(false);

  const timer = useCountdown(room);

  const isHost = room && currentUser && room.hostUid === currentUser.uid;
  const phase = room?.phase || "idle";
  const allowVoice = room?.allowVoiceDuringFocus !== false;
  const allowChat = room?.allowChatDuringFocus !== false;
  const voiceLocked = !allowVoice && phase === "focus";
  const chatLocked = !allowChat && phase === "focus";

  useEffect(() => {
    const u1 = watchRoom(id, setRoom, console.error);
    const u2 = watchRoomMembers(id, setMembers, console.error);
    const u3 = watchRoomMessages(id, (msgs) => setMessages([...msgs].reverse()), console.error);
    return () => { u1(); u2(); u3(); };
  }, [id]);

  // Auto-join: host auto-joins, others need explicit join
  useEffect(() => {
    if (!room || !currentUser || autoJoinedRef.current) return;
    const alreadyIn = members.some((m) => m.uid === currentUser.uid);
    if (alreadyIn) { setJoined(true); return; }
    if (room.hostUid === currentUser.uid) {
      autoJoinedRef.current = true;
      joinRoom(id).then(() => initAgora().then(() => setJoined(true))).catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.hostUid, currentUser?.uid]);

  useEffect(() => {
    if (currentUser && members.some((m) => m.uid === currentUser.uid) && !joined) setJoined(true);
  }, [members, currentUser, joined]);

  useEffect(() => {
    if (voiceLocked && agoraRef.current) { agoraRef.current.mute(true); setIsMuted(true); }
  }, [voiceLocked]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stop mic immediately on unmount (covers sidebar nav, back button, tab close)
  useEffect(() => {
    const stopOnUnload = () => { if (agoraRef.current) agoraRef.current.leave().catch(() => {}); };
    window.addEventListener("beforeunload", stopOnUnload);
    return () => {
      window.removeEventListener("beforeunload", stopOnUnload);
      if (agoraRef.current) {
        agoraRef.current.leave().catch(() => {});
        agoraRef.current = null;
      }
      // Also leave Firestore room membership silently
      leaveRoom(id).catch(() => {});
    };
  }, [id]);

  const initAgora = async () => {
    const client = await createAgoraRoomClient({
      roomId: id, uid: null,
      onVolume: (vols) => { const m = {}; vols.forEach(({ uid, volume }) => { m[uid] = volume; }); setVolumes(m); },
      onUserJoined: () => {}, onUserLeft: () => {},
    });
    agoraRef.current = client;
    try { await updateAgoraUid(id, client.uid); } catch {}
  };

  const handleJoin = async () => {
    if (joined || joining) return;
    setJoining(true);
    try {
      await joinRoom(id);
      await initAgora();
      setJoined(true);
    } catch (e) { console.error(e); }
    finally { setJoining(false); }
  };

  const doLeave = async () => {
    if (agoraRef.current) { await agoraRef.current.leave().catch(() => {}); agoraRef.current = null; }
    await leaveRoom(id).catch(() => {});
    navigate({ to: "/rooms" });
  };

  const handleLeaveClick = () => {
    if (phase !== "idle") setShowLeaveSheet(true);
    else doLeave();
  };

  const toggleMute = useCallback(async () => {
    if (!agoraRef.current || voiceLocked) return;
    const next = !isMuted;
    agoraRef.current.mute(next);
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
    try { await uploadRoomFile(id, file); }
    catch (err) { console.error(err); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  };

  const copyCode = () => {
    if (room?.roomCode) { navigator.clipboard.writeText(room.roomCode); setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
  };

  const handleStart = async () => { if (!isHost) return; await updateRoomPhase(id, "focus", room.focusDuration || 25); };
  const handleSkip = async () => {
    if (!isHost) return;
    if (phase === "focus") { await incrementRound(id); await updateRoomPhase(id, "breakTime", room.breakDuration || 5); }
    else await updateRoomPhase(id, "focus", room.focusDuration || 25);
  };
  const handleEnd = async () => { if (!isHost) return; await endRoom(id); };

  if (!room) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  const phaseColor = phase === "focus" ? "text-red-500" : phase === "breakTime" ? "text-emerald-600" : "text-muted-foreground";
  const phaseDot = phase === "focus" ? "bg-red-500" : phase === "breakTime" ? "bg-emerald-500" : "bg-muted-foreground";
  const phaseLabel = phase === "focus" ? "FOCUSING" : phase === "breakTime" ? "ON BREAK" : "WAITING TO START";
  const roundNum = (room.roundsCompleted || 0) + (phase === "focus" ? 1 : 0);

  // ── LOBBY ─────────────────────────────────────────────────────────────────
  if (phase === "idle") {
    return (
      <div className="flex flex-col h-full">
        {showLeaveSheet && <LeaveTaskSheet onDone={doLeave} onSkip={doLeave} />}

        <div className="flex items-center gap-3 px-6 py-4 border-b">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold truncate">{room.roomName || room.name}</h1>
              {room.isPrivate && <Lock className="h-4 w-4 text-muted-foreground shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{room.focusDuration || 25}m focus · {room.breakDuration || 5}m break · Lobby</p>
          </div>
          {room.roomCode && (
            <button onClick={copyCode} className="flex items-center gap-1.5 font-mono text-sm bg-muted hover:bg-muted/70 px-3 py-1.5 rounded-lg transition-colors">
              <span className="tracking-widest font-semibold">{room.roomCode}</span>
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              {codeCopied && <span className="text-xs text-primary font-normal">Copied!</span>}
            </button>
          )}
          <Button variant="ghost" size="sm" onClick={handleLeaveClick} className="text-muted-foreground hover:text-destructive gap-1.5 shrink-0">
            <LogOut className="h-4 w-4" /> Leave
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Room info chips */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
              <Play className="h-3 w-3" /> {room.focusDuration || 25}m focus
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground">
              {room.breakDuration || 5}m break
            </span>
            {room.isPrivate && <span className="inline-flex items-center gap-1.5 text-xs bg-muted px-3 py-1 rounded-full text-muted-foreground"><Lock className="h-3 w-3" /> Private</span>}
            {!room.allowVoiceDuringFocus && <span className="inline-flex items-center gap-1.5 text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full"><MicOff className="h-3 w-3" /> No voice in focus</span>}
          </div>

          {/* Members */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Members · {members.length}</p>
            {members.length === 0 && joining && (
              <div className="flex gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-xl p-4 w-36 flex flex-col items-center gap-2 animate-pulse">
                    <div className="h-12 w-12 rounded-full bg-muted" />
                    <div className="h-3 w-20 rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {members.map((m) => (
                <div key={m.uid} className="border rounded-xl bg-card p-4 flex flex-col items-center gap-2 text-center hover:shadow-sm transition-shadow">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{(m.displayName || "?")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-card" />
                  </div>
                  <span className="text-sm font-medium truncate w-full">{m.displayName || "Member"}</span>
                  {m.uid === room.hostUid
                    ? <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">HOST</span>
                    : <span className="text-xs text-muted-foreground">In lobby</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between bg-card">
          {!joined ? (
            <Button onClick={handleJoin} disabled={joining} className="gap-2">
              {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Join lobby
            </Button>
          ) : isHost ? (
            <Button onClick={handleStart} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
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
    <div className="flex flex-col h-full">
      {showLeaveSheet && <LeaveTaskSheet onDone={doLeave} onSkip={doLeave} />}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />

      {/* Top bar — matches app header style */}
      <div className="flex items-center gap-3 px-5 py-3 border-b bg-card shrink-0">
        <h1 className="font-semibold text-base">{room.roomName || room.name}</h1>
        {room.roomCode && (
          <button onClick={copyCode} title="Copy room code"
            className="flex items-center gap-1 font-mono text-xs bg-muted hover:bg-muted/70 px-2.5 py-1 rounded-md transition-colors">
            <span className="tracking-widest">{room.roomCode}</span>
            <Copy className="h-3 w-3 text-muted-foreground" />
            {codeCopied && <span className="text-emerald-600 font-sans">✓</span>}
          </button>
        )}
        <div className={`flex items-center gap-1.5 text-xs font-semibold ${phaseColor}`}>
          <span className={`h-2 w-2 rounded-full ${phaseDot} ${phase === "focus" ? "animate-pulse" : ""}`} />
          {phaseLabel}
        </div>
        <span className="text-xs text-muted-foreground">· Round {roundNum}</span>
        <div className="ml-auto">
          <Button variant="destructive" size="sm" onClick={handleLeaveClick} className="gap-1.5 h-8 text-xs">
            <LogOut className="h-3.5 w-3.5" /> Leave
          </Button>
        </div>
      </div>

      {/* 3-panel body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Voice panel */}
        <div className="w-56 shrink-0 border-r flex flex-col bg-background">
          <div className="px-4 py-2.5 border-b">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Voice · {members.length}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {members.map((m) => {
              const vol = volumes[m.agoraUid] || 0;
              const speaking = vol > 5;
              return (
                <div key={m.uid}
                  className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${speaking ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                  {/* Avatar with speaking animation */}
                  <div className="relative shrink-0">
                    {speaking && (
                      <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    )}
                    <Avatar className={`h-8 w-8 relative ${speaking ? "ring-2 ring-primary ring-offset-1" : ""}`}>
                      <AvatarFallback className={`text-xs font-semibold ${speaking ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {(m.displayName || "?")[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {m.isMuted && (
                      <span className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5">
                        <MicOff className="h-2 w-2 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{m.displayName || "Member"}</p>
                    <p className={`text-[10px] ${speaking ? "text-primary font-medium" : voiceLocked ? "text-red-500" : "text-muted-foreground"}`}>
                      {voiceLocked ? "Blocked" : speaking ? "Speaking" : m.isMuted ? "Muted" : "Listening"}
                    </p>
                  </div>
                  {/* Speaking wave bars */}
                  {speaking && (
                    <div className="flex items-end gap-px shrink-0" style={{ height: 16 }}>
                      {[0.4, 1, 0.6, 0.9, 0.5].map((h, i) => (
                        <span key={i} className="w-0.5 bg-primary rounded-full animate-bounce"
                          style={{ height: `${h * 14}px`, animationDelay: `${i * 80}ms`, animationDuration: "600ms" }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Mic control */}
          <div className="p-3 border-t">
            <button
              onClick={toggleMute}
              disabled={voiceLocked}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all border
                ${voiceLocked ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border-border"
                : isMuted ? "bg-muted hover:bg-muted/70 text-foreground border-border"
                : "bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"}`}>
              {voiceLocked ? <MicOff className="h-4 w-4" /> : isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {voiceLocked ? "Voice blocked" : isMuted ? "Unmute" : "Mute"}
            </button>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4 bg-background">
          <div className={`text-[7rem] font-bold tabular-nums tracking-tight leading-none ${phaseColor}`}>
            {timer}
          </div>
          <div className={`flex items-center gap-2 text-sm font-medium ${phaseColor}`}>
            <span className={`h-2 w-2 rounded-full ${phaseDot} ${phase === "focus" ? "animate-pulse" : ""}`} />
            {phaseLabel} · Round {roundNum}
          </div>
          {isHost && (
            <div className="flex items-center gap-3 mt-6">
              <button onClick={handleSkip}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-sm font-medium transition-colors">
                <SkipForward className="h-4 w-4" />
                {phase === "focus" ? "Start break" : "Start focus"}
              </button>
              <button onClick={handleEnd}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-medium transition-colors">
                <Square className="h-4 w-4" /> End session
              </button>
            </div>
          )}
          {!isHost && (
            <p className="text-xs text-muted-foreground mt-2">Host controls the session</p>
          )}
        </div>

        {/* Right: Chat */}
        <div className="w-72 shrink-0 border-l flex flex-col bg-card">
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
                ? new Date(msg.sentAt.toDate()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
              return (
                <div key={msg.id}>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold">{msg.senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                  </div>
                  {isFile ? (() => {
                    const [, name, url, type] = msg.text.split("|");
                    return type === "image"
                      ? <a href={url} target="_blank" rel="noreferrer"><img src={url} alt={name} className="mt-1 rounded-lg max-w-full max-h-40 object-cover border" /></a>
                      : <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs text-primary underline mt-0.5">📎 {name}</a>;
                  })() : <p className="text-sm break-words leading-snug">{msg.text}</p>}
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
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Upload file">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                </button>
                <button onClick={handleSend}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
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
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function statusBadge(status) {
  if (status === "studying") return { label: "Studying", dot: "bg-emerald-500", text: "text-emerald-600" };
  if (status === "on_break") return { label: "On Break", dot: "bg-orange-400", text: "text-orange-600" };
  return { label: "Idle", dot: "bg-gray-400", text: "text-muted-foreground" };
}

function ActivityHeatmap({ activity }) {
  // activity: array of { date: 'YYYY-MM-DD', level: 0-4 } for last 12 weeks
  const cells = activity && activity.length > 0
    ? activity
    : Array.from({ length: 84 }, () => ({ level: 0 }));
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(12, 1fr)", gridAutoFlow: "column", gridTemplateRows: "repeat(7, 1fr)" }}>
      {cells.slice(0, 84).map((c, i) => {
        const shade = ["bg-muted", "bg-primary/20", "bg-primary/40", "bg-primary/70", "bg-primary"][c.level || 0] || "bg-muted";
        return <div key={i} className={`aspect-square rounded-sm ${shade}`} title={c.date} />;
      })}
    </div>
  );
}

export function ProfilePage({ uid }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: myProfile } = useProfile();
  const myUid = String(myProfile?.id || myProfile?.uid || "");
  const isSelf = !uid || String(uid) === myUid;

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

  const { data: friendsList = [] } = useQuery({
    queryKey: ["social", "friends"],
    queryFn: socialApi.friends.list,
    retry: 1,
  });

  const profile = isSelf ? myProfile : otherProfile;
  const stats = isSelf ? myStats : otherProfile?.stats;
  const activity = isSelf ? myStats?.activity : otherProfile?.activity;

  const name = profile?.name || profile?.display_name || "User";
  const avatar = profile?.avatar_url || profile?.avatar || "";
  const university = profile?.university || "";
  const bio = profile?.bio || "";
  const gradYear = profile?.graduation_year;
  const status = profile?.study_status || "idle";
  const badge = statusBadge(status);

  // Connection state for non-self
  const friends = Array.isArray(friendsList) ? friendsList : friendsList?.data || [];
  const friendIds = new Set(friends.map((f) => String(f.id || f.uid)));
  const isFriend = !isSelf && friendIds.has(String(uid));
  const isPending = !isSelf && (otherProfile?.friend_status === "pending");

  const { mutate: sendReq, isPending: sending } = useMutation({
    mutationFn: () => socialApi.friends.send(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "users", String(uid), "profile"] });
      toast.success("Connection request sent");
    },
    onError: () => toast.error("Could not send request"),
  });

  const { mutate: removeFriend, isPending: removing } = useMutation({
    mutationFn: () => socialApi.friends.remove(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "friends"] });
      toast.success("Removed connection");
    },
  });

  if (!isSelf && loadingOther) {
    return <div className="text-sm text-muted-foreground">Loading profile…</div>;
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
    <div className="max-w-4xl mx-auto space-y-4">
      {!isSelf && (
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/social" })}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
      )}

      {/* Header */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary to-[color:var(--ai,theme(colors.primary))]" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between gap-4">
            <Avatar className="h-24 w-24 border-4 border-card">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-xl">{initialsOf(name)}</AvatarFallback>
            </Avatar>
            <div className="flex gap-2 pb-1">
              {isSelf ? (
                <Button size="sm" onClick={() => navigate({ to: "/settings" })}>
                  <PencilIcon className="h-3.5 w-3.5 mr-1.5" /> Edit profile
                </Button>
              ) : isFriend ? (
                <Button size="sm" variant="outline" disabled={removing} onClick={() => removeFriend()}>
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
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">{name}</h2>
              <span className={`inline-flex items-center gap-1 text-xs ${badge.text}`}>
                <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
                {badge.label}
              </span>
            </div>
            {(university || gradYear) && (
              <div className="text-sm text-muted-foreground mt-0.5">
                {university}{university && gradYear && " · "}{gradYear && `Class of ${gradYear}`}
              </div>
            )}
            {bio && <p className="text-sm mt-2">{bio}</p>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{stats?.sessions_count ?? stats?.total_sessions ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">Sessions</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{Math.round(stats?.total_focus_hours ?? 0)}h</div>
          <div className="text-xs text-muted-foreground mt-1">Focus hours</div>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="text-2xl font-bold">{stats?.streak ?? stats?.current_streak ?? 0}</div>
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
            <div className="text-lg font-bold">{stats?.streak ?? stats?.current_streak ?? 0} days</div>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-amber-500/10 grid place-items-center">
            <Trophy className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Longest streak</div>
            <div className="text-lg font-bold">{stats?.longest_streak ?? stats?.max_streak ?? 0} days</div>
          </div>
        </div>
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
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }} />
                <Bar dataKey="xp" fill="var(--primary)" radius={[4,4,0,0]} />
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
        const shade = ["bg-muted","bg-primary/20","bg-primary/40","bg-primary/70","bg-primary"][c.v] || "bg-muted";
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "notifications"] }),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => studyApi.notifications.read(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["study", "notifications"] }),
  });

  const reqList = Array.isArray(requests) ? requests : requests?.data || [];
  const activityList = Array.isArray(activityRaw) ? activityRaw : activityRaw?.data || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Header title="Notifications">
        <Button variant="outline" onClick={() => markAllRead()}><Check className="h-4 w-4 mr-1.5" /> Mark all read</Button>
      </Header>

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
                const uid = String(user.id || req.sender_id || "");
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
                        <Link to="/profile/$uid" params={{ uid }} className="text-sm font-medium hover:underline">{name}</Link>
                      ) : (
                        <div className="text-sm font-medium">{name}</div>
                      )}
                      <div className="text-xs text-muted-foreground">wants to connect{university && ` · ${university}`}</div>
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
                ? new Date(n.created_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                : n.time || "";
              return (
                <div
                  key={n.id}
                  className={`p-4 flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors ${isUnread ? "bg-primary/[0.03]" : ""}`}
                  onClick={() => isUnread && markRead(n.id)}
                >
                  <div className={`h-9 w-9 rounded-lg grid place-items-center ${isUnread ? "bg-primary/10" : "bg-muted"}`}>
                    <BellRing className={`h-4 w-4 ${isUnread ? "text-primary" : ""}`} />
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm ${isUnread ? "font-semibold" : "font-medium"}`}>{title}</div>
                    {body ? <div className="text-xs text-muted-foreground mt-0.5">{body}</div> : null}
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
      <input type="checkbox" defaultChecked={defaultOn} className="h-5 w-9 appearance-none rounded-full bg-muted checked:bg-primary relative cursor-pointer transition-colors before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4" />
    </label>
  );
}

export function SpaceMembersPage({ id }) {
  const space = spaces.find((s) => s.id === id) || spaces[0];
  const members = friends.map((f, i) => ({ ...f, role: i === 0 ? "Owner" : "Member" }));
  return (
    <div className="space-y-6">
      <Header title={`${space.name} — Members`} subtitle="Manage roles and invites.">
        <Button><Plus className="h-4 w-4 mr-1.5" /> Invite</Button>
      </Header>
      <div className="rounded-xl border bg-card divide-y">
        {members.map((m) => (
          <div key={m.uid} className="p-3 flex items-center gap-3">
            <Avatar className="h-9 w-9"><AvatarImage src={m.avatar} /><AvatarFallback>U</AvatarFallback></Avatar>
            <div className="flex-1"><div className="text-sm font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.status}</div></div>
            <span className="text-xs px-2 py-0.5 rounded-md bg-muted">{m.role}</span>
            <Button size="sm" variant="ghost">Manage</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DomainDetailPage({ id }) {
  const d = domains.find((x) => x.id === id) || domains[0];
  const domainTasks = tasks.filter((t) => t.domain_id === d.id);
  return (
    <div className="space-y-6">
      <Header title={d.domain_name} subtitle={`${d.area_type} · ${d.priority} priority · ${d.difficulty}`}>
        <Button><Plus className="h-4 w-4 mr-1.5" /> Add task</Button>
      </Header>
      <div className="grid sm:grid-cols-3 gap-3">
        <Stat label="Weekly target" value={`${d.weekly_target_hours}h`} />
        <Stat label="Tasks" value={domainTasks.length} />
        <Stat label="Preferred days" value={d.preferred_days.length} />
      </div>
      <div className="rounded-xl border bg-card divide-y">
        {domainTasks.map((t) => (
          <div key={t.id} className="p-3 flex items-center gap-3">
            <div className="flex-1"><div className="text-sm font-medium">{t.title}</div><div className="text-xs text-muted-foreground">{t.priority} · due {t.deadline}</div></div>
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

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading task...
      </div>
    );
  }
  if (error || !task) {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error?.message || "Task not found."}</div>;
  }

  const subtasks = task.subtasks || task.sub_tasks || [];
  const serverProgress = task.progress_percentage ?? 0;
  const progressValue = progress ?? serverProgress;
  const isProgressDirty = progress !== null && progress !== lastSavedProgress.current;
  const domainName = task.domain?.domain_name || task.domain?.domainName || "—";
  const displayStatus = localStatus ?? task.status ?? "To Do";
  const estHours = task.expected_hours != null ? `${parseFloat(task.expected_hours)}h` : null;

  // Clear optimistic subtask entries once server data reflects the expected value
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

  return (
    <div className="space-y-6">
      <button
        onClick={() => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" }))}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>
      <Header title={task.title} subtitle={[task.priority, task.difficulty, task.points != null ? `${task.points} pts` : null, `due ${fmtDeadline(task.deadline)}`].filter(Boolean).join(" · ")}>
        <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil className="h-4 w-4 mr-1.5" /> Edit</Button>
        <Button variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4 mr-1.5" /> Delete</Button>
      </Header>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          {task.description && (
            <div className="rounded-xl border bg-card p-4">
              <h3 className="font-semibold text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{task.description}</p>
            </div>
          )}

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Progress — {progressValue}%</h3>
            <Slider min={0} max={100} step={5} value={[progressValue]} onValueChange={([v]) => setProgress(v)} />
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                disabled={m.updateTaskProgress.isPending || !isProgressDirty}
                onClick={() => {
                  lastSavedProgress.current = progressValue;
                  m.updateTaskProgress.mutate({ id, progress: progressValue });
                }}
              >
                {m.updateTaskProgress.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Save progress
              </Button>
              {estHours && <span className="text-xs text-muted-foreground">{estHours} estimate</span>}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Subtasks</h3>
            <ul className="space-y-1.5">
              {subtasks.map((s) => {
                const serverDone = (s.status || "Pending") === "Completed";
                const done = s.id in optimisticSubtasks ? optimisticSubtasks[s.id] : serverDone;
                return (
                  <li key={s.id} className="flex items-center gap-2.5 group rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={done}
                      className="h-4 w-4 rounded accent-primary cursor-pointer"
                      onChange={() => {
                        setOptimisticSubtasks((prev) => ({ ...prev, [s.id]: !done }));
                        m.toggleSubtask.mutate(
                          { taskId: id, subtaskId: s.id },
                          { onError: () => setOptimisticSubtasks((prev) => ({ ...prev, [s.id]: done })) }
                        );
                      }}
                    />
                    <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : ""}`}>{s.title}</span>
                    <button
                      onClick={() => m.removeSubtask.mutate({ taskId: id, subtaskId: s.id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
              {subtasks.length === 0 && <li className="text-sm text-muted-foreground py-1">No subtasks yet.</li>}
            </ul>
            <div className="mt-3 flex items-center gap-2">
              <Input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && subtaskDraft.trim()) {
                    e.preventDefault();
                    m.addSubtask.mutate({ taskId: id, body: { title: subtaskDraft.trim() } }, { onSuccess: () => setSubtaskDraft("") });
                  }
                }}
                placeholder="Add a subtask"
              />
              <Button
                size="icon"
                variant="outline"
                disabled={!subtaskDraft.trim() || m.addSubtask.isPending}
                onClick={() => m.addSubtask.mutate({ taskId: id, body: { title: subtaskDraft.trim() } }, { onSuccess: () => setSubtaskDraft("") })}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Comments</h3>
            <div className="space-y-3">
              {comments.map((c) => {
                const author = c.user || {};
                const name = author.name || author.display_name || c.user_name || "User";
                const avatar = author.avatar_url || author.avatar || "";
                const createdAt = c.created_at || c.createdAt || "";
                return (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                      <AvatarImage src={avatar} />
                      <AvatarFallback className="text-xs">{name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="rounded-xl bg-muted/50 px-3 py-2">
                        <div className="text-xs font-semibold mb-0.5">{name}</div>
                        <div className="text-sm">{c.content}</div>
                      </div>
                      {createdAt && (
                        <div className="text-[11px] text-muted-foreground mt-1 pl-1">{fmtDeadline(createdAt)}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
              <Textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder="Write a comment…"
                rows={2}
              />
              <Button
                size="sm"
                disabled={!commentDraft.trim() || m.addComment.isPending}
                onClick={() => m.addComment.mutate({ taskId: id, content: commentDraft.trim() }, { onSuccess: () => setCommentDraft("") })}
              >
                {m.addComment.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Comment
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1.5">Status</div>
            <Select
              value={displayStatus}
              onValueChange={(value) => {
                setLocalStatus(value);
                m.updateTaskStatus.mutate({ id, status: value }, {
                  onSuccess: () => setLocalStatus(null),
                  onError: () => { setLocalStatus(null); toast.error("Failed to update status"); },
                });
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Stat label="Priority" value={task.priority || "Medium"} />
          <Stat label="Difficulty" value={task.difficulty || "Medium"} />
          <Stat label="Domain" value={domainName} />
        </div>
      </div>

      <Suspense fallback={null}><CreateTaskModal open={editOpen} onOpenChange={setEditOpen} task={task} /></Suspense>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>{task.title} will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                m.deleteTask.mutate({ id }, { onSuccess: () => (window.history.length > 1 ? window.history.back() : navigate({ to: "/" })) });
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
