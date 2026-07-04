import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Search,
  UserPlus,
  Check,
  X,
  Timer,
  Globe,
  Lock,
  Send,
  Image as ImageIcon,
  FileText,
  Link as LinkIcon,
  MoreHorizontal,
  Trash2,
  Loader2,
  Paperclip,
  ShieldOff,
  Settings,
  Clock,
  Users,
  Award,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { socialApi, focusApi, userApi } from "@/lib/api";
import { useProfile, usePomodoroSessions, qk } from "@/lib/query-hooks";
import { uploadPostAttachment, watchRoom } from "@/lib/realtime";

const SUBJECT_TAGS = ["Math", "CS", "Science", "Engineering", "Languages", "Other"];

function initials(name = "") {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function statusColor(s) {
  if (s === "studying") return "bg-emerald-500";
  if (s === "on_break") return "bg-orange-400";
  return "bg-gray-400";
}

// ─── Left: Profile Card ───────────────────────────────────────────────────────

function ProfileCard() {
  const { data: profile } = useProfile();
  const { data: stats } = useQuery({
    queryKey: ["user", "stats"],
    queryFn: () => userApi.stats(),
    retry: false,
  });

  const name = profile?.name || profile?.display_name || "You";
  const university = profile?.university || "";
  const bio = profile?.bio || "";
  const avatar = profile?.avatar_url || profile?.avatar || "";
  const uid = profile?.uid || profile?.firebase_uid || profile?.id;
  const currentStreak = stats?.current_streak ?? stats?.streak;
  const totalFocusMinutes = Number(stats?.total_focus_minutes ?? 0);
  const totalFocusHours = totalFocusMinutes / 60;
  const profileComplete = profile?.profile_completed !== false;
  const missingFields = profile?.missing_profile_fields || [];

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="h-16 bg-gradient-to-br from-primary/70 to-primary" />
      <div className="px-4 pb-4 -mt-8">
        {uid ? (
          <Link to="/profile/$uid" params={{ uid: String(uid) }}>
            <Avatar className="h-16 w-16 border-4 border-card cursor-pointer">
              <AvatarImage src={avatar} />
              <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-16 w-16 border-4 border-card">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-lg">{initials(name)}</AvatarFallback>
          </Avatar>
        )}
        <div className="mt-2">
          <div className="font-semibold text-sm">{name}</div>
          {university && <div className="text-xs text-muted-foreground">{university}</div>}
          {bio && <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{bio}</div>}
        </div>
        {!profileComplete && (
          <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-orange-900 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-100">
            <div className="text-xs font-semibold">Complete your student profile</div>
            <div className="mt-1 text-[11px] leading-4">
              Add {missingFields.join(", ") || "your academic details"} so classmates know who they are connecting with.
            </div>
            <Button asChild size="sm" variant="outline" className="mt-2 h-7 text-xs bg-background">
              <Link to="/profile/edit">Edit profile</Link>
            </Button>
          </div>
        )}
        {stats && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {currentStreak != null && (
              <div className="rounded-lg bg-muted/60 p-2 text-center">
                <div className="text-base font-bold">{currentStreak}</div>
                <div className="text-[10px] text-muted-foreground">Day streak</div>
              </div>
            )}
            {stats.total_focus_minutes != null && (
              <div className="rounded-lg bg-muted/60 p-2 text-center">
                <div className="text-base font-bold">{Math.round(totalFocusHours)}h</div>
                <div className="text-[10px] text-muted-foreground">Total focus</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StudentNetworkSummary() {
  const { data: friends = [] } = useQuery({
    queryKey: ["social", "friends"],
    queryFn: socialApi.friends.list,
    retry: 1,
  });
  const { data: achievements = [] } = useQuery({
    queryKey: ["social", "achievements", "me"],
    queryFn: socialApi.achievements.list,
    retry: 1,
  });

  const connections = Array.isArray(friends) ? friends : friends?.data || [];
  const achievementList = Array.isArray(achievements) ? achievements : achievements?.data || [];

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Network
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="text-[11px]">Connections</span>
          </div>
          <div className="mt-1 text-xl font-bold">{connections.length}</div>
        </div>
        <div className="rounded-lg bg-muted/60 p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Award className="h-3.5 w-3.5" />
            <span className="text-[11px]">Achievements</span>
          </div>
          <div className="mt-1 text-xl font-bold">{achievementList.length}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Left: Today Focus Widget ─────────────────────────────────────────────────

function TodayFocusWidget() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const { data } = usePomodoroSessions({ date: today });
  const sessions = data?.sessions || data || [];
  const totalMin = Array.isArray(sessions)
    ? sessions.reduce((a, s) => a + (s.focus_minutes ?? s.duration_minutes ?? 0), 0)
    : 0;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Today's Focus</span>
      </div>
      <div className="text-2xl font-bold">{totalMin}m</div>
      <div className="text-xs text-muted-foreground mb-3">focused today</div>
      <Button size="sm" className="w-full" onClick={() => navigate({ to: "/focus" })}>
        Start Focus
      </Button>
    </div>
  );
}

// ─── Center top: Studying Now Bar ────────────────────────────────────────────

function StudyingNowBar() {
  const { data: online = [] } = useQuery({
    queryKey: ["social", "friends", "online"],
    queryFn: socialApi.friends.online,
    retry: 1,
    refetchInterval: 60000,
  });

  const list = Array.isArray(online) ? online : online?.data || [];
  if (list.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-3 overflow-x-auto">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        Studying Now
      </div>
      <div className="flex gap-3">
        {list.map((f) => {
          const name = f.name || f.display_name || "User";
          const avatar = f.avatar_url || f.avatar || "";
          const uid = String(f.uid || f.firebase_uid || f.id);
          const status = f.study_status || "studying";
          return (
            <Link
              key={uid}
              to="/profile/$uid"
              params={{ uid }}
              className="flex flex-col items-center gap-1 min-w-[60px] hover:opacity-80 transition-opacity"
            >
              <div className="relative">
                <Avatar className="h-12 w-12 ring-2 ring-emerald-500/60">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                </Avatar>
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusColor(status)} border-2 border-card`} />
              </div>
              <span className="text-[10px] truncate max-w-[60px]">{name.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Center: Tag Filter Chips ────────────────────────────────────────────────

function TagFilterChips({ value, onChange }) {
  const opts = ["All", ...SUBJECT_TAGS];
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {opts.map((tag) => {
        const selected = value === tag || (tag === "All" && !value);
        return (
          <button
            key={tag}
            onClick={() => onChange(tag === "All" ? "" : tag)}
            className={`shrink-0 h-7 px-3 rounded-full text-xs font-medium transition-colors ${
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-muted/60 text-muted-foreground hover:bg-muted"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

// ─── Center: Create Post (LinkedIn-style) ────────────────────────────────────

function CreatePostBox() {
  const { data: profile } = useProfile();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("friends");
  const [subjectTag, setSubjectTag] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const fileImgRef = useRef(null);
  const filePdfRef = useRef(null);
  const textareaRef = useRef(null);
  const qc = useQueryClient();

  const name = profile?.name || profile?.display_name || "You";
  const avatar = profile?.avatar_url || profile?.avatar || "";

  const { mutate, isPending } = useMutation({
    mutationFn: (body) => socialApi.posts.create(body),
    onSuccess: () => {
      setContent("");
      setSubjectTag("");
      setAttachment(null);
      setLink("");
      setLinkOpen(false);
      setExpanded(false);
      qc.invalidateQueries({ queryKey: ["social", "feed"] });
      toast.success("Post shared!");
    },
    onError: () => toast.error("Failed to post"),
  });

  async function handleFile(e, type) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadPostAttachment(file);
      setAttachment(result);
      setExpanded(true);
    } catch {
      toast.error("Upload failed — check storage permissions");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function submit() {
    const trimmed = content.trim();
    if (!trimmed && !attachment) return;
    const body = { content: trimmed, visibility };
    if (subjectTag) body.subject_tag = subjectTag;
    if (attachment) {
      body.attachment_url = attachment.url;
      body.attachment_type = attachment.type;
      body.attachment_name = attachment.name;
    }
    if (link.trim()) body.link = link.trim();
    mutate(body);
  }

  function openExpanded() {
    setExpanded(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  if (!expanded) {
    return (
      <div className="rounded-xl border bg-card p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatar} />
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <button
            onClick={openExpanded}
            className="flex-1 rounded-full border bg-muted/40 hover:bg-muted px-4 py-2.5 text-sm text-muted-foreground text-left transition-colors"
          >
            Start a post…
          </button>
        </div>
        <div className="flex items-center gap-1 mt-3 pt-2 border-t">
          <input ref={fileImgRef} type="file" accept="image/*" onChange={(e) => handleFile(e, "image")} className="hidden" />
          <input ref={filePdfRef} type="file" accept="application/pdf" onChange={(e) => handleFile(e, "pdf")} className="hidden" />
          <button
            disabled={uploading}
            onClick={() => fileImgRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground text-xs font-medium transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4 text-blue-500" />}
            Photo
          </button>
          <button
            disabled={uploading}
            onClick={() => filePdfRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground text-xs font-medium transition-colors"
          >
            <FileText className="h-4 w-4 text-orange-500" />
            Document
          </button>
          <button
            onClick={() => { openExpanded(); setLinkOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-muted text-muted-foreground text-xs font-medium transition-colors"
          >
            <LinkIcon className="h-4 w-4 text-green-500" />
            Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatar} />
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-semibold">{name}</div>
            <button
              onClick={() => setVisibility((v) => (v === "friends" ? "public" : "friends"))}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5 mt-0.5 transition-colors"
            >
              {visibility === "friends" ? (
                <><Lock className="h-2.5 w-2.5" /> Friends</>
              ) : (
                <><Globe className="h-2.5 w-2.5" /> Public</>
              )}
            </button>
          </div>
        </div>
        <button
          onClick={() => setExpanded(false)}
          className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-2">
        <Textarea
          ref={textareaRef}
          placeholder="What do you want to talk about?"
          className="resize-none text-sm min-h-[120px] border-0 p-0 focus-visible:ring-0 bg-transparent text-base"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        {/* Image preview — full width like LinkedIn */}
        {attachment && attachment.type === "image" && (
          <div className="mt-3 relative rounded-lg overflow-hidden border">
            <img src={attachment.url} alt={attachment.name} className="w-full max-h-80 object-cover" />
            <button
              onClick={() => setAttachment(null)}
              className="absolute top-2 right-2 h-7 w-7 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Doc/PDF preview */}
        {attachment && attachment.type !== "image" && (
          <div className="mt-3 rounded-lg border bg-muted/40 p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded bg-orange-100 dark:bg-orange-900/30 grid place-items-center shrink-0">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{attachment.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{attachment.type}</div>
            </div>
            <button onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-destructive shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Link input */}
        {linkOpen && (
          <div className="mt-3 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="h-8 text-sm"
            />
            <button onClick={() => { setLinkOpen(false); setLink(""); }} className="text-muted-foreground hover:text-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Subject tag chips */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-muted-foreground shrink-0 self-center">Tag:</span>
          {SUBJECT_TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setSubjectTag(subjectTag === t ? "" : t)}
              className={`shrink-0 h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors ${
                subjectTag === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              #{t}
            </button>
          ))}
        </div>
      </div>

      {/* Footer toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="flex items-center gap-1">
          <input ref={fileImgRef} type="file" accept="image/*" onChange={(e) => handleFile(e, "image")} className="hidden" />
          <input ref={filePdfRef} type="file" accept="application/pdf" onChange={(e) => handleFile(e, "pdf")} className="hidden" />
          <button
            disabled={uploading}
            onClick={() => fileImgRef.current?.click()}
            title="Add photo"
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4 text-blue-500" />}
          </button>
          <button
            disabled={uploading}
            onClick={() => filePdfRef.current?.click()}
            title="Add document"
            className="h-8 w-8 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
          >
            <FileText className="h-4 w-4 text-orange-500" />
          </button>
          <button
            onClick={() => setLinkOpen((v) => !v)}
            title="Add link"
            className={`h-8 w-8 grid place-items-center rounded-md hover:bg-muted ${linkOpen ? "text-green-600" : "text-muted-foreground"}`}
          >
            <LinkIcon className="h-4 w-4 text-green-500" />
          </button>
        </div>
        <Button
          disabled={(!content.trim() && !attachment) || isPending || uploading}
          onClick={submit}
          className="rounded-full px-5"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
          Post
        </Button>
      </div>
    </div>
  );
}

function AchievementShareBox() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ title: "", description: "", category: "", evidence_url: "" });

  const { mutate, isPending } = useMutation({
    mutationFn: (body) => socialApi.achievements.create(body),
    onSuccess: () => {
      setDraft({ title: "", description: "", category: "", evidence_url: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["social", "achievements"] });
      qc.invalidateQueries({ queryKey: ["social", "feed"] });
      toast.success("Achievement shared");
    },
    onError: (error) => toast.error(error?.message || "Could not share achievement"),
  });

  function normalizeUrl(value) {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  function submit(e) {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return;
    mutate({
      title,
      description: draft.description.trim() || undefined,
      category: draft.category.trim() || undefined,
      evidence_url: normalizeUrl(draft.evidence_url),
      visibility: "public",
      share_to_feed: true,
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border bg-card p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 grid place-items-center">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold">Share an achievement</div>
            <div className="text-xs text-muted-foreground">
              Projects, certificates, milestones, competition wins, or study goals.
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-amber-600" />
          <div className="text-sm font-semibold">New achievement</div>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Input
        value={draft.title}
        onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
        placeholder="Achievement title"
      />
      <div className="grid sm:grid-cols-2 gap-2">
        <Input
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          placeholder="Category or subject"
        />
        <Input
          value={draft.evidence_url}
          onChange={(e) => setDraft((d) => ({ ...d, evidence_url: e.target.value }))}
          placeholder="Evidence link"
        />
      </div>
      <Textarea
        value={draft.description}
        onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
        placeholder="What happened, and why does it matter?"
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!draft.title.trim() || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Share
        </Button>
      </div>
    </form>
  );
}

// ─── Center: Comments Section ────────────────────────────────────────────────

function CommentsSection({ postId }) {
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["social", "posts", postId, "comments"],
    queryFn: () => socialApi.posts.comments(postId),
    retry: 1,
  });

  const { mutate: addComment, isPending } = useMutation({
    mutationFn: (content) => socialApi.posts.addComment(postId, content),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["social", "posts", postId, "comments"] });
      qc.invalidateQueries({ queryKey: ["social", "feed"] });
    },
  });

  const list = Array.isArray(comments) ? comments : comments?.data || [];

  return (
    <div className="mt-3 pt-3 border-t space-y-2.5">
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading…</div>
      ) : list.length === 0 ? (
        <div className="text-xs text-muted-foreground">No comments yet.</div>
      ) : (
        list.map((c) => {
          const author = c.author || c.user || {};
          const name = author.name || author.display_name || "User";
          const avatar = author.avatar_url || author.avatar || "";
          const uid = String(author.uid || author.firebase_uid || author.id || "");
          return (
            <div key={c.id} className="flex items-start gap-2">
              {uid ? (
                <Link to="/profile/$uid" params={{ uid }}>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="h-7 w-7">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-[10px]">{initials(name)}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0 rounded-lg bg-muted/40 px-3 py-1.5">
                <div className="text-xs font-medium">{name}</div>
                <div className="text-sm">{c.content}</div>
              </div>
            </div>
          );
        })
      )}
      <div className="flex items-center gap-2 pt-1">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && text.trim() && addComment(text)}
          placeholder="Write a comment…"
          className="h-8 text-sm"
        />
        <Button size="sm" disabled={!text.trim() || isPending} onClick={() => addComment(text)}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Center: Post Card ────────────────────────────────────────────────────────

// ─── LiveSessionCard ──────────────────────────────────────────────────────────

function LiveSessionCard({ post }) {
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!post.room_id) { setLoaded(true); return; }
    setLoaded(false);
    return watchRoom(
      post.room_id,
      (data) => { setRoom(data); setLoaded(true); },
      () => { setRoom(null); setLoaded(true); },
    );
  }, [post.room_id]);

  // A session is over when its room doc is gone (deleted) or explicitly marked
  // ended. endRoom() sets isEnded:true and phase:"idle" — there is no
  // "completed" phase, which is why the old check never detected ended rooms.
  const isEnded = loaded && (room === null || room.isEnded === true);

  const phaseLabel = room?.phase === "focus"
    ? { label: "Focusing 🔴", cls: "text-red-600 bg-red-50" }
    : room?.phase === "breakTime"
    ? { label: "On Break 🟢", cls: "text-emerald-700 bg-emerald-50" }
    : { label: "Waiting ⚪", cls: "text-muted-foreground bg-muted" };

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${isEnded ? "opacity-60" : "bg-card"}`}>
      <div className="flex items-center gap-2">
        <span className="text-base">📚</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{post.author_name} started a study session</p>
          {post.subject_tag && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{post.subject_tag}</span>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">{post.content}</p>

      {!loaded ? (
        <div className="rounded-lg bg-muted px-3 py-2 flex items-center justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : isEnded ? (
        <div className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground text-center">Session ended</div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border px-3 py-2.5">
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${phaseLabel.cls}`}>{phaseLabel.label}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {Math.max(0, room?.memberCount ?? 0)}
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs px-3" onClick={() => navigate({ to: "/rooms/$id", params: { id: post.room_id } })}>
            Join Session
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── PostCard ─────────────────────────────────────────────────────────────────

function PostCard({ post, currentUserId }) {
  const qc = useQueryClient();
  const [myReaction, setMyReaction] = useState(post.my_reaction_type ?? (post.liked_by_me || post.is_liked_by_me ? "like" : null));
  const [counts, setCounts] = useState({
    like: post.likes_count ?? post.likes ?? 0,
    motivated: post.motivated_count ?? 0,
    keep_going: post.keep_going_count ?? 0,
  });
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { mutate: react } = useMutation({
    mutationFn: (type) => {
      if (myReaction === type) return socialApi.posts.unlike(post.id);
      return socialApi.posts.like(post.id, type);
    },
    onMutate: (type) => {
      const prev = myReaction;
      setCounts((c) => {
        const next = { ...c };
        if (prev) next[prev] = Math.max(0, next[prev] - 1);
        if (prev !== type) next[type] = (next[type] ?? 0) + 1;
        return next;
      });
      setMyReaction(prev === type ? null : type);
      return { prev };
    },
    onError: (_e, _type, ctx) => {
      setMyReaction(ctx.prev);
      setCounts({ like: post.likes_count ?? 0, motivated: post.motivated_count ?? 0, keep_going: post.keep_going_count ?? 0 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "feed"] }),
  });

  const { mutate: deletePost } = useMutation({
    mutationFn: () => socialApi.posts.remove(post.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "feed"] });
      toast.success("Post deleted");
    },
    onError: () => toast.error("Failed to delete"),
  });

  const author = post.author || post.user || {};
  if (import.meta.env.DEV && (author.name === undefined && author.display_name === undefined)) {
    console.log("[PostCard] unknown author shape:", JSON.stringify(post).slice(0, 400));
  }
  const name =
    author.name || author.display_name || author.full_name || author.username ||
    post.author_name || post.user_name ||
    (author.email ? author.email.split("@")[0] : null) ||
    "Unknown";
  const avatar =
    author.avatar_url || author.avatar || author.profile_photo_url ||
    author.photo_url || author.picture || post.author_avatar || "";
  const authorUid = String(author.uid || author.firebase_uid || post.author_id || author.id || post.user_id || "");
  const isMine = currentUserId && (authorUid === String(currentUserId));

  return (
    <article className="rounded-xl border bg-card p-4">
      <div className="flex items-start gap-2.5">
        {authorUid ? (
          <Link to="/profile/$uid" params={{ uid: authorUid }}>
            <Avatar className="h-9 w-9 cursor-pointer hover:opacity-80">
              <AvatarImage src={avatar} />
              <AvatarFallback>{initials(name)}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatar} />
            <AvatarFallback>{initials(name)}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          {authorUid ? (
            <Link to="/profile/$uid" params={{ uid: authorUid }} className="text-sm font-medium hover:underline">
              {name}
            </Link>
          ) : (
            <div className="text-sm font-medium">{name}</div>
          )}
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
            {(post.author_streak ?? 0) >= 2 && (
              <span className="inline-flex items-center gap-0.5 text-orange-500 font-semibold">
                🔥 Day {post.author_streak}
              </span>
            )}
            <span>{timeAgo(post.created_at)}</span>
            <span>·</span>
            {post.visibility === "public" ? (
              <Globe className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            {post.subject_tag && (
              <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                #{post.subject_tag}
              </span>
            )}
          </div>
        </div>
        {isMine && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="h-7 w-7 grid place-items-center rounded-md hover:bg-muted text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 rounded-md border bg-card shadow-md py-1 min-w-[120px]">
                <button
                  onClick={() => { setMenuOpen(false); deletePost(); }}
                  className="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-muted flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {post.attachment_url && (post.attachment_type === "image" || (!post.attachment_type && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(post.attachment_url))) && (
        <a href={post.attachment_url} target="_blank" rel="noopener noreferrer" className="mt-3 block rounded-lg overflow-hidden border">
          <img src={post.attachment_url} alt={post.attachment_name || ""} className="w-full max-h-96 object-cover" />
        </a>
      )}
      {post.attachment_url && post.attachment_type && post.attachment_type !== "image" && (
        <a
          href={post.attachment_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm hover:bg-muted"
        >
          <Paperclip className="h-4 w-4" />
          <span className="truncate">{post.attachment_name || `View ${post.attachment_type}`}</span>
        </a>
      )}
      {post.link && (
        <a
          href={post.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-sm text-primary hover:bg-muted"
        >
          <LinkIcon className="h-4 w-4" />
          <span className="truncate">{post.link}</span>
        </a>
      )}

      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
        <button
          className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${myReaction === "like" ? "text-red-500" : ""}`}
          onClick={() => react("like")}
        >
          <Heart className={`h-4 w-4 ${myReaction === "like" ? "fill-current" : ""}`} />
          {counts.like > 0 && <span>{counts.like}</span>}
        </button>
        <button
          className={`inline-flex items-center gap-1 transition-colors hover:text-orange-500 ${myReaction === "motivated" ? "text-orange-500 font-medium" : ""}`}
          onClick={() => react("motivated")}
          title="Motivated me"
        >
          <span className="text-base leading-none">🔥</span>
          {counts.motivated > 0 && <span>{counts.motivated}</span>}
        </button>
        <button
          className={`inline-flex items-center gap-1 transition-colors hover:text-blue-500 ${myReaction === "keep_going" ? "text-blue-500 font-medium" : ""}`}
          onClick={() => react("keep_going")}
          title="Keep going"
        >
          <span className="text-base leading-none">💪</span>
          {counts.keep_going > 0 && <span>{counts.keep_going}</span>}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1 hover:text-foreground"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments_count ?? post.comments ?? 0}
        </button>
      </div>

      {showComments && <CommentsSection postId={post.id} />}
    </article>
  );
}

// ─── Center: Feed List ────────────────────────────────────────────────────────

function FeedList({ tag }) {
  const { data: profile } = useProfile();
  const currentUserId = profile?.uid || profile?.firebase_uid || profile?.id;

  const { data: feed = [], isLoading, error } = useQuery({
    queryKey: qk.social.feed({ tag }),
    queryFn: () => socialApi.feed(tag ? { tag } : undefined),
    retry: 1,
  });

  const posts = Array.isArray(feed) ? feed : feed?.data || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 animate-pulse">
            <div className="flex gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-full bg-muted" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-32 rounded bg-muted" />
                <div className="h-2.5 w-20 rounded bg-muted" />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        Could not load feed. Check your connection.
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
        {tag ? `No posts tagged #${tag} yet.` : "No posts yet. Be the first to share something!"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        post.type === "live_session"
          ? <LiveSessionCard key={post.id} post={post} />
          : <PostCard key={post.id} post={post} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

// ─── Right / Network: Connection Requests ─────────────────────────────────────

function FriendRequestsCard() {
  const qc = useQueryClient();
  const { data: requests = [] } = useQuery({
    queryKey: ["social", "friends", "requests"],
    queryFn: socialApi.friends.requests,
    retry: 1,
  });

  const { mutate: accept } = useMutation({
    mutationFn: (uid) => socialApi.friends.accept(uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["social", "friends"] });
      qc.invalidateQueries({ queryKey: ["social", "friends", "requests"] });
      toast.success("Connection accepted");
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: (uid) => socialApi.friends.reject(uid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["social", "friends", "requests"] }),
  });

  const list = Array.isArray(requests) ? requests : requests?.data || [];
  if (list.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Connection Requests
      </div>
      <div className="space-y-2.5">
        {list.map((req) => {
          const user = req.sender || req.user || req;
          const name = user.name || user.display_name || "User";
          const avatar = user.avatar_url || user.avatar || "";
          const uid = String(user.uid || user.firebase_uid || req.uid || req.firebase_uid || user.id || req.sender_id || "");
          return (
            <div key={uid} className="flex items-center gap-2">
              {uid ? (
                <Link to="/profile/$uid" params={{ uid }}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatar} />
                    <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1 min-w-0">
                {uid ? (
                  <Link to="/profile/$uid" params={{ uid }} className="text-sm font-medium truncate hover:underline">
                    {name}
                  </Link>
                ) : (
                  <div className="text-sm font-medium truncate">{name}</div>
                )}
              </div>
              <button onClick={() => accept(uid)} className="text-emerald-600 hover:text-emerald-700">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => reject(uid)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Right: Discover / Search ─────────────────────────────────────────────────

// Hoisted out of DiscoverCard: a component type defined inside another
// component's body gets a new identity every render, so React unmounts and
// remounts every row's DOM on each keystroke.
function DiscoverUserRow({ u, sentUids, sendRequest }) {
  const name = u.name || u.display_name || "User";
  const avatar = u.avatar_url || u.avatar || "";
  const university = u.university || "";
  const uid = String(u.uid || u.firebase_uid || u.id || "");
  const connectionState = sentUids.has(uid) ? "pending_sent" : (u.connection_state || "");
  const sent = connectionState === "pending_sent" || u.has_sent_request;
  const connected = connectionState === "connected" || u.is_friend;
  const pendingReceived = connectionState === "pending_received";
  return (
    <div className="flex items-center gap-3 min-w-0">
      {uid ? (
        <Link to="/profile/$uid" params={{ uid }}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={avatar} />
            <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
          </Avatar>
        </Link>
      ) : (
        <Avatar className="h-9 w-9">
          <AvatarImage src={avatar} />
          <AvatarFallback className="text-xs">{initials(name)}</AvatarFallback>
        </Avatar>
      )}
      <div className="flex-1 min-w-0">
        {uid ? (
          <Link to="/profile/$uid" params={{ uid }} className="text-sm font-medium truncate hover:underline block">
            {name}
          </Link>
        ) : (
          <div className="text-sm font-medium truncate">{name}</div>
        )}
        <div className="text-[11px] text-muted-foreground truncate">
          {university || "Student profile"}
          {u.graduation_year ? ` · Class of ${u.graduation_year}` : ""}
        </div>
      </div>
      {sent ? (
        <span className="text-[11px] text-muted-foreground">Pending</span>
      ) : connected ? (
        <span className="text-[11px] text-muted-foreground">Connected</span>
      ) : pendingReceived ? (
        <span className="text-[11px] text-muted-foreground">Requested</span>
      ) : (
        <button onClick={() => sendRequest(uid)} className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-primary hover:bg-primary/10 hover:text-primary/80" title="Add connection">
          <UserPlus className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function DiscoverCard({ className = "", limit = 5, wide = false }) {
  const [q, setQ] = useState("");
  // Query on the settled value so typing "hello" sends one request, not five;
  // keepPreviousData keeps the old results on screen between terms.
  const dq = useDebouncedValue(q, 300);
  const qc = useQueryClient();

  const { data: suggestions = [], isLoading: loadingSuggestions } = useQuery({
    queryKey: ["social", "suggestions"],
    queryFn: socialApi.discovery.suggestions,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["social", "discover", dq],
    queryFn: () => socialApi.discovery.search(dq),
    enabled: dq.trim().length >= 2,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const [sentUids, setSentUids] = useState(new Set());

  const { mutate: sendRequest } = useMutation({
    mutationFn: (uid) => socialApi.friends.send(uid),
    onSuccess: (_, uid) => {
      setSentUids((prev) => new Set(prev).add(uid));
      toast.success("Connection request sent!");
      qc.invalidateQueries({ queryKey: ["social", "suggestions"] });
    },
    onError: () => toast.error("Could not send request"),
  });

  // Keyed on the debounced value so the card doesn't flash "No users found"
  // in the window between typing and the search actually firing.
  const isSearching = dq.trim().length >= 2;
  const list = isSearching
    ? (Array.isArray(results) ? results : results?.data || [])
    : (Array.isArray(suggestions) ? suggestions : suggestions?.data || []);

  return (
    <div className={`rounded-xl border bg-card p-4 ${className}`}>
      <div className={`mb-4 flex flex-col gap-3 ${wide ? "sm:flex-row sm:items-center sm:justify-between" : ""}`}>
        <div>
          <div className="text-sm font-semibold">
            {isSearching ? "Search results" : "People you may know"}
          </div>
          <div className="text-xs text-muted-foreground">
            Search classmates and send connection requests.
          </div>
        </div>
        <div className={`relative ${wide ? "sm:w-72" : ""}`}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-9 text-sm"
            placeholder="Search by name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {!wide && (
        <div className="relative mb-3 sm:hidden">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="pl-8 h-8 text-sm"
          placeholder="Search by name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      )}
      {(isFetching || (!isSearching && loadingSuggestions)) && (
        <div className="text-xs text-muted-foreground">Loading…</div>
      )}
      {!isFetching && isSearching && list.length === 0 && (
        <div className="text-xs text-muted-foreground">No users found.</div>
      )}
      {!loadingSuggestions && !isSearching && list.length === 0 && (
        <div className="text-xs text-muted-foreground">No suggestions yet — connect with more people first.</div>
      )}
      {list.length > 0 && (
        <div className={wide ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
          {list.slice(0, limit).map((u) => (
            <DiscoverUserRow key={String(u.uid || u.firebase_uid || u.id || u.name)} u={u} sentUids={sentUids} sendRequest={sendRequest} />
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementsPanel() {
  const { data: achievements = [], isLoading } = useQuery({
    queryKey: ["social", "achievements", "me"],
    queryFn: socialApi.achievements.list,
    retry: 1,
  });
  const list = Array.isArray(achievements) ? achievements : achievements?.data || [];

  return (
    <div className="space-y-3">
      <AchievementShareBox />
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-sm font-semibold">Your achievement portfolio</div>
            <div className="text-xs text-muted-foreground">A lightweight record you can show to classmates and collaborators.</div>
          </div>
          <Award className="h-5 w-5 text-amber-600" />
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading achievements…</div>
        ) : list.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No achievements yet. Share your first project, certificate, milestone, or competition result.
          </div>
        ) : (
          <div className="grid gap-3">
            {list.map((achievement) => (
              <div key={achievement.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{achievement.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                      {achievement.category && (
                        <span className="rounded-full bg-muted px-2 py-0.5">{achievement.category}</span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5">{achievement.visibility}</span>
                    </div>
                  </div>
                  {achievement.evidence_url && (
                    <a href={achievement.evidence_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                      Evidence
                    </a>
                  )}
                </div>
                {achievement.description && (
                  <p className="mt-2 text-sm text-muted-foreground">{achievement.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NetworkPanel() {
  return (
    <div className="grid gap-3">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 grid place-items-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold">University student network</div>
            <div className="text-xs text-muted-foreground">
              Find classmates, connect with study partners, and discover students with shared academic interests.
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <DiscoverCard className="xl:order-1" limit={12} wide />
        <div className="xl:order-2">
          <FriendRequestsCard />
        </div>
      </div>
      <div className="rounded-xl border bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Find</div>
            <p className="mt-1 text-sm text-muted-foreground">Search by name and discover classmates already using RAQIP.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connect</div>
            <p className="mt-1 text-sm text-muted-foreground">Send requests to students you know or want to study with.</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Collaborate</div>
            <p className="mt-1 text-sm text-muted-foreground">Use rooms, posts, and achievements to keep study work visible.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Social Usage Timer Guard ─────────────────────────────────────────────────

const STORAGE_KEY = "social_usage_v1";

function getTodayKey(resetHour = 0) {
  // Day boundary shifts at resetHour (e.g. resetHour=3 → day rolls at 03:00)
  const now = new Date();
  const adjusted = new Date(now.getTime() - resetHour * 3600 * 1000);
  return adjusted.toISOString().split("T")[0];
}

function loadUsedSeconds(resetHour = 0) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const { date, usedSeconds } = JSON.parse(raw);
    if (date === getTodayKey(resetHour)) return usedSeconds ?? 0;
    // Different day → stale, clear it
    localStorage.removeItem(STORAGE_KEY);
    return 0;
  } catch {
    return 0;
  }
}

function saveUsedSeconds(seconds, resetHour = 0) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(resetHour), usedSeconds: seconds }));
  } catch {}
}

function fmtTime(secs) {
  const s = Math.max(0, secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sc = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sc).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(sc).padStart(2, "0")}`;
}

function SocialUsageGuard({ children }) {
  const navigate = useNavigate();

  const { data: daySettings } = useQuery({
    queryKey: ["social", "day-settings"],
    queryFn: socialApi.platforms.daySettings,
    retry: false,
  });

  // The day-settings endpoint only returns day_reset_hour. The daily limit lives
  // per-platform on the usage endpoint; since it's applied globally, any platform
  // carries the same value — read the first one (mirrors the Flutter app).
  const { data: usages = [] } = useQuery({
    queryKey: qk.social.platforms({}),
    queryFn: () => socialApi.platforms.usage({}),
    retry: false,
  });

  const resetHour = daySettings?.day_reset_hour ?? daySettings?.dayResetHour ?? 0;
  const limitMinutes = usages[0]?.daily_limit_minutes ?? usages[0]?.dailyLimitMinutes ?? 0;
  const limitSecs = limitMinutes * 60;

  const usedSecsRef = useRef(loadUsedSeconds(resetHour));
  const [remaining, setRemaining] = useState(() => {
    if (limitSecs <= 0) return Infinity;
    return Math.max(0, limitSecs - usedSecsRef.current);
  });
  const [blocked, setBlocked] = useState(() => limitSecs > 0 && usedSecsRef.current >= limitSecs);

  // Recalculate when settings load
  useEffect(() => {
    if (limitSecs <= 0) return;
    const used = loadUsedSeconds(resetHour);
    usedSecsRef.current = used;
    const r = Math.max(0, limitSecs - used);
    setRemaining(r);
    if (r === 0) setBlocked(true);
  }, [limitSecs, resetHour]);

  // Tick
  useEffect(() => {
    if (limitSecs <= 0 || blocked) return;
    const id = setInterval(() => {
      usedSecsRef.current += 1;
      // Persist every 5th tick instead of every second; the cleanup flush
      // below bounds any loss to <5s on abrupt exit.
      if (usedSecsRef.current % 5 === 0) saveUsedSeconds(usedSecsRef.current, resetHour);
      setRemaining((r) => {
        const next = r - 1;
        if (next <= 0) { setBlocked(true); return 0; }
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(id);
      saveUsedSeconds(usedSecsRef.current, resetHour);
    };
  }, [limitSecs, resetHour, blocked]);

  if (blocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center px-4">
        <div className="rounded-full bg-destructive/10 p-6">
          <ShieldOff className="h-12 w-12 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Daily limit reached</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            You've used your {limitMinutes}-minute daily social media allowance.
            It resets at {resetHour === 0 ? "midnight" : `${resetHour}:00`} — or adjust in Settings.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate({ to: "/" })}>
            Go home
          </Button>
          <Button onClick={() => navigate({ to: "/settings" })}>
            <Settings className="h-4 w-4 mr-1.5" />
            Change limit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {limitSecs > 0 && (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-1 ${
          remaining < 300
            ? "bg-destructive/10 text-destructive"
            : remaining < 600
            ? "bg-orange-500/10 text-orange-600"
            : "bg-muted/60 text-muted-foreground"
        }`}>
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>
            {remaining < 60
              ? "Less than a minute of social time left"
              : `Social time remaining: ${fmtTime(remaining)}`}
          </span>
          {remaining < 300 && (
            <button
              onClick={() => navigate({ to: "/settings" })}
              className="ml-auto underline underline-offset-2 hover:no-underline"
            >
              Adjust
            </button>
          )}
        </div>
      )}
      {children}
    </>
  );
}

// ─── Main SocialPage ──────────────────────────────────────────────────────────

export function SocialPage() {
  const [tag, setTag] = useState("");
  const [view, setView] = useState("feed");

  const views = [
    { id: "feed", label: "Feed", icon: Globe },
    { id: "network", label: "Network", icon: Users },
    { id: "achievements", label: "Achievements", icon: Award },
  ];

  return (
    <SocialUsageGuard>
      <div className="flex gap-4 h-full min-h-0">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col w-64 shrink-0 gap-3 overflow-y-auto">
          <ProfileCard />
          <StudentNetworkSummary />
          <TodayFocusWidget />
        </div>

        {/* Center feed */}
        <div className="flex-1 min-w-0 overflow-y-auto space-y-3">
          <div className="rounded-xl border bg-card p-2">
            <div className="grid grid-cols-3 gap-1">
              {views.map((item) => {
                const Icon = item.icon;
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {view === "feed" && (
            <>
              <StudyingNowBar />
              <CreatePostBox />
              <AchievementShareBox />
              <TagFilterChips value={tag} onChange={setTag} />
              <FeedList tag={tag} />
            </>
          )}

          {view === "network" && <NetworkPanel />}
          {view === "achievements" && <AchievementsPanel />}
        </div>

        {/* Right panel */}
        {view !== "network" && (
          <div className="hidden xl:flex flex-col w-72 shrink-0 gap-3 overflow-y-auto">
            <FriendRequestsCard />
            <DiscoverCard />
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-amber-600" />
                Social is for academic progress
              </div>
              <div className="mt-2 text-xs text-muted-foreground leading-5">
                Share achievements, live study sessions, useful resources, and project updates so your network has context beyond casual posts.
              </div>
            </div>
          </div>
        )}
      </div>
    </SocialUsageGuard>
  );
}
