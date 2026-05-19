import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  Bell,
  Boxes,
  CalendarDays,
  Compass,
  FolderTree,
  LayoutDashboard,
  Loader2,
  Rss,
  Settings,
  ShieldAlert,
  Sparkles,
  Timer,
  UserCircle,
  Users,
} from "lucide-react";
import { useSpaces } from "@/lib/query-hooks";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Work",
    items: [
      { to: "/domains", label: "Domains", icon: FolderTree },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Focus & Social",
    items: [
      { to: "/focus", label: "Focus", icon: Timer },
      { to: "/rooms", label: "Group Rooms", icon: Users },
      { to: "/feed", label: "Feed", icon: Rss },
      { to: "/discover", label: "Discover", icon: Compass },
      { to: "/friends", label: "Friends", icon: UserCircle },
      { to: "/social/platforms", label: "Social Usage", icon: ShieldAlert },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/notifications", label: "Notifications", icon: Bell },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data: spacesPayload = [], isLoading: loadingSpaces, error: spacesError } = useSpaces();
  const spaces = Array.isArray(spacesPayload) ? spacesPayload : spacesPayload?.data || [];

  return (
    <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-5 flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">R</div>
        <div>
          <div className="font-semibold tracking-tight">RAQIP</div>
          <div className="text-[11px] text-muted-foreground -mt-0.5">Smart Study Companion</div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6">
        <div className="mt-4">
          <div className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">Spaces</div>
          <div className="space-y-0.5">
            <Link
              to="/spaces"
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                path === "/spaces"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80",
              )}
            >
              <Boxes className="h-4 w-4" />
              <span>Study Spaces</span>
            </Link>
            <div className="pl-3 pt-1">
              {loadingSpaces && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading spaces
                </div>
              )}
              {spacesError && (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Spaces unavailable
                </div>
              )}
              {!loadingSpaces && !spacesError && spaces.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No spaces yet</div>
              )}
              <ul className="space-y-0.5 border-l border-sidebar-border pl-2">
                {spaces.map((space) => {
                  const active = path.startsWith(`/spaces/${space.id}`);
                  const color = space.color_hex || space.color || "var(--primary)";
                  return (
                    <li key={space.id}>
                      <Link
                        to="/spaces/$spaceId/summary"
                        params={{ spaceId: String(space.id) }}
                        className={cn(
                          "flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <span className="h-5 w-5 shrink-0 rounded-md grid place-items-center text-[11px] font-bold text-white" style={{ background: color }}>
                          {(space.name || "S")[0]}
                        </span>
                        <span className="truncate">{space.name || `Space ${space.id}`}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
        {groups.map((g) => (
          <div key={g.label} className="mt-4">
            <div className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">{g.label}</div>
            <ul className="space-y-0.5">
              {g.items.map(({ to, label, icon: Icon, exact }) => {
                const active = exact ? path === to : path === to || path.startsWith(to + "/");
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="m-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-[color:var(--ai)]" />
          AI Scrum Coach
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Active across Dashboard, Spaces, Domains & Focus.
        </p>
      </div>
    </aside>
  );
}
