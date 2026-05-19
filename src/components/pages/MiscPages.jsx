import { rooms, feedPosts, friends, platforms, notifications, weeklyXP, heatmap, me, tasks, domains, spaces, calendarEvents } from "@/lib/mock";
import { Button } from "@/components/ui/button";
import { Header } from "./SpacesPage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, Heart, MessageCircle, UserPlus, Search, BellRing, Check } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Link } from "@tanstack/react-router";
import { usePlatformUsage } from "@/lib/query-hooks";

export function RoomsPage() {
  return (
    <div className="space-y-6">
      <Header title="Group Study Rooms" subtitle="Co-work with friends in live Pomodoro sessions.">
        <Button><Plus className="h-4 w-4 mr-1.5" /> New room</Button>
      </Header>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((r) => (
          <Link key={r.id} to="/rooms/$id" params={{ id: r.id }} className="rounded-xl border bg-card p-5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{r.name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-md ${r.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-muted"}`}>{r.status}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{r.focus_duration}m focus · {r.break_duration}m break</div>
            <div className="mt-4 flex items-center gap-1.5 text-sm"><Users className="h-3.5 w-3.5" /> {r.participants} studying</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function RoomDetailPage({ id }) {
  const r = rooms.find((x) => x.id === id) || rooms[0];
  return (
    <div className="space-y-6">
      <Header title={r.name} subtitle={`${r.focus_duration}m focus · ${r.break_duration}m break`}>
        <Button variant="outline">Leave room</Button>
      </Header>
      <div className="rounded-2xl border bg-card p-8 text-center">
        <div className="text-7xl font-bold tabular-nums">23:42</div>
        <div className="text-sm text-muted-foreground mt-2">Focus round 2 of 4</div>
      </div>
      <div className="grid sm:grid-cols-4 gap-3">
        {friends.concat(friends).slice(0, 4).map((f, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 text-center">
            <Avatar className="h-14 w-14 mx-auto"><AvatarImage src={f.avatar} /><AvatarFallback>U</AvatarFallback></Avatar>
            <div className="mt-2 text-sm font-medium">{f.name}</div>
            <div className="text-xs text-emerald-600">Focusing</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FeedPage() {
  return (
    <div className="space-y-6">
      <Header title="Feed" subtitle="What your study circle is up to.">
        <Button><Plus className="h-4 w-4 mr-1.5" /> New post</Button>
      </Header>
      <div className="max-w-2xl space-y-4">
        <div className="rounded-xl border bg-card p-4">
          <textarea placeholder="Share a note, win, or question…" className="w-full bg-transparent text-sm resize-none focus:outline-none" rows={2} />
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-muted-foreground">Visible to friends</div>
            <Button size="sm">Post</Button>
          </div>
        </div>
        {feedPosts.map((p) => (
          <article key={p.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-9 w-9"><AvatarImage src={p.author.avatar} /><AvatarFallback>U</AvatarFallback></Avatar>
              <div>
                <div className="text-sm font-medium">{p.author.name}</div>
                <div className="text-xs text-muted-foreground">{p.time} ago{p.subject_tag && ` · #${p.subject_tag}`}</div>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{p.content}</p>
            {p.attachment_type && (
              <div className="mt-3 rounded-lg border bg-muted/40 p-3 text-sm">📎 Attached {p.attachment_type}</div>
            )}
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <button className="inline-flex items-center gap-1 hover:text-foreground"><Heart className="h-4 w-4" /> {p.likes}</button>
              <button className="inline-flex items-center gap-1 hover:text-foreground"><MessageCircle className="h-4 w-4" /> {p.comments}</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function DiscoverPage() {
  const people = [
    { uid: "u_010", name: "Hassan A.", school: "Cairo Uni · CS", avatar: "https://i.pravatar.cc/64?img=33" },
    { uid: "u_011", name: "Mira N.", school: "AUC · Math", avatar: "https://i.pravatar.cc/64?img=44" },
    { uid: "u_012", name: "Tariq R.", school: "GUC · Engineering", avatar: "https://i.pravatar.cc/64?img=51" },
  ];
  return (
    <div className="space-y-6">
      <Header title="Discover" subtitle="Find study partners and mentors." />
      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input className="w-full h-10 pl-8 pr-3 rounded-lg border bg-card" placeholder="Search by name or school…" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {people.map((p) => (
          <div key={p.uid} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <Avatar className="h-12 w-12"><AvatarImage src={p.avatar} /><AvatarFallback>U</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.school}</div>
            </div>
            <Button size="sm" variant="outline"><UserPlus className="h-3.5 w-3.5 mr-1" /> Add</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfilePage({ uid }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-primary to-[color:var(--ai)]" />
        <div className="p-6 flex items-end gap-4 -mt-12">
          <Avatar className="h-24 w-24 border-4 border-card"><AvatarImage src={me.avatar} /><AvatarFallback>AY</AvatarFallback></Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{me.name}</h2>
            <div className="text-sm text-muted-foreground">@{uid} · Level {me.level} · {me.xp.toLocaleString()} XP</div>
          </div>
          <Button>Follow</Button>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="font-semibold text-sm mb-2">Weekly XP</h3>
          <div className="h-32"><ResponsiveContainer><BarChart data={weeklyXP}><XAxis dataKey="day" fontSize={11} /><Bar dataKey="xp" fill="var(--primary)" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
        </div>
        <div className="rounded-xl border bg-card p-4 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-3">Activity</h3>
          <Heatmap />
        </div>
      </div>
    </div>
  );
}

export function FriendsPage() {
  return (
    <div className="space-y-6">
      <Header title="Friends" subtitle="Your circle, requests, and who's online." />
      <div className="grid lg:grid-cols-3 gap-4">
        {friends.map((f) => (
          <div key={f.uid} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11"><AvatarImage src={f.avatar} /><AvatarFallback>U</AvatarFallback></Avatar>
              {f.online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-card" />}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{f.name}</div>
              <div className="text-xs text-muted-foreground">{f.status}</div>
            </div>
            <Button size="sm" variant="ghost">Message</Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformsPage() {
  const { data: usage = [], isLoading, error } = usePlatformUsage();
  const rows = usage.length
    ? usage.map((item) => ({
        name: item.platform || item.name,
        icon: item.icon || "•",
        daily_minutes: Math.round((item.duration_seconds || item.daily_seconds || 0) / 60) || item.daily_minutes || 0,
        limit: item.daily_limit_minutes || item.limit || 60,
      }))
    : platforms;
  return (
    <div className="space-y-6">
      <Header title="Social Usage Tracker" subtitle="Built-in RAQIP tracker for study-day platform usage." />
      {isLoading && <p className="text-sm text-muted-foreground">Loading usage from Laravel...</p>}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <div className="grid sm:grid-cols-2 gap-3 max-w-3xl">
        {rows.map((p) => {
          const over = p.daily_minutes > p.limit;
          return (
            <div key={p.name} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{p.icon}</span>
                  <span className="font-medium">{p.name}</span>
                </div>
                <span className={`text-xs ${over ? "text-red-600" : "text-muted-foreground"}`}>
                  {p.daily_minutes}m / {p.limit}m
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${over ? "bg-red-500" : "bg-primary"}`} style={{ width: `${Math.min(100, (p.daily_minutes/p.limit)*100)}%` }} />
              </div>
            </div>
          );
        })}
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
  return (
    <div className="space-y-6">
      <Header title="Notifications">
        <Button variant="outline"><Check className="h-4 w-4 mr-1.5" /> Mark all read</Button>
      </Header>
      <div className="rounded-xl border bg-card divide-y">
        {notifications.map((n) => (
          <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.read ? "bg-primary/[0.03]" : ""}`}>
            <div className="h-9 w-9 rounded-lg bg-muted grid place-items-center"><BellRing className="h-4 w-4" /></div>
            <div className="flex-1">
              <div className="text-sm font-medium">{n.title}</div>
              <div className="text-xs text-muted-foreground">{n.body}</div>
            </div>
            <div className="text-xs text-muted-foreground">{n.time}</div>
          </div>
        ))}
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

export function TaskDetailPage({ id }) {
  const t = tasks.find((x) => x.id === id) || tasks[0];
  return (
    <div className="space-y-6">
      <Header title={t.title} subtitle={`${t.priority} · ${t.difficulty} · ${t.points} pts · due ${t.deadline}`}>
        <Button variant="outline">Edit</Button>
        <Button>Mark done</Button>
      </Header>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-2">Progress</h3>
            <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${t.progress_percentage}%` }} /></div>
            <div className="text-xs text-muted-foreground mt-2">{t.progress_percentage}% complete · {t.expected_hours}h estimate</div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Subtasks</h3>
            <ul className="space-y-2">
              {["Read 2 papers", "Draft section 2", "Cite sources"].map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={i===0} /> <span className={i===0?"line-through text-muted-foreground":""}>{s}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Comments</h3>
            <div className="space-y-3">
              <div className="text-sm"><strong>Sara:</strong> I have a reference for section 2 — sending now.</div>
              <textarea placeholder="Write a comment…" className="w-full rounded-md border bg-background p-2 text-sm" rows={2} />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <Stat label="Status" value={t.status} />
          <Stat label="Priority" value={t.priority} />
          <Stat label="Difficulty" value={t.difficulty} />
          <Stat label="Domain" value={domains.find(d => d.id === t.domain_id)?.domain_name || "—"} />
        </div>
      </div>
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
