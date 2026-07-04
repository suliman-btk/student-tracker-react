import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertCircle,
  Bell,
  Boxes,
  CalendarDays,
  FolderTree,
  Globe,
  LayoutDashboard,
  Loader2,
  Settings,
  Timer,
  Users,
  X,
} from "lucide-react";
import { useSpaces } from "@/lib/query-hooks";
import { useUI } from "@/store/ui";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const groups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Work",
    items: [
      { to: "/domains", label: "Domains & Tasks", icon: FolderTree },
      { to: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Focus & Social",
    items: [
      { to: "/focus", label: "Focus", icon: Timer },
      { to: "/rooms", label: "Group Rooms", icon: Users },
      { to: "/social", label: "Social", icon: Globe },
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

function SidebarContent({ onNavigate }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { activeSpaceId, setActiveSpace } = useUI();
  const { data: spacesPayload = [], isLoading: loadingSpaces, error: spacesError } = useSpaces();
  const spaces = Array.isArray(spacesPayload) ? spacesPayload : spacesPayload?.data || [];

  const renderGroup = (g) => (
    <div key={g.label} className="mt-4">
      <div className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
        {g.label}
      </div>
      <ul className="space-y-0.5">
        {g.items.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? path === to : path === to || path.startsWith(to + "/");
          return (
            <li key={to}>
              <Link
                to={to}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "hover:bg-sidebar-accent/60 text-sidebar-foreground/80",
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
  );

  const overviewGroup = groups.find((g) => g.label === "Overview");
  const otherGroups = groups.filter((g) => g.label !== "Overview");

  return (
    <>
      <div className="px-5 py-5 shrink-0">
        <Link to="/landing" onClick={onNavigate} aria-label="Go to RAQIP landing page">
          <img
            src="/logo.png"
            alt="RAQIP — Smart Study Companion"
            className="h-12 w-auto object-contain"
          />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-6">
        {overviewGroup && renderGroup(overviewGroup)}
        <div className="mt-4">
          <div className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground/80 mb-1.5">
            Spaces
          </div>
          <div className="space-y-0.5">
            <Link
              to="/spaces"
              onClick={onNavigate}
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
                  const active =
                    path.startsWith(`/spaces/${space.id}`) ||
                    String(activeSpaceId) === String(space.id);
                  const color = space.color_hex || space.color || "var(--primary)";
                  return (
                    <li key={space.id}>
                      <Link
                        to="/spaces/$spaceId/summary"
                        params={{ spaceId: String(space.id) }}
                        onClick={() => {
                          setActiveSpace(space.id);
                          onNavigate?.();
                        }}
                        className={cn(
                          "flex min-w-0 items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                          active
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                        )}
                      >
                        <span
                          className="h-5 w-5 shrink-0 rounded-md grid place-items-center text-[11px] font-bold text-white"
                          style={{ background: color }}
                        >
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
        {otherGroups.map(renderGroup)}
      </nav>
    </>
  );
}

export default function Sidebar({ mobileOpen, onMobileClose }) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={(open) => !open && onMobileClose?.()}>
        <SheetContent
          side="left"
          className="w-64 p-0 bg-sidebar text-sidebar-foreground flex flex-col [&>button]:hidden"
        >
          <button
            onClick={onMobileClose}
            className="absolute right-3 top-3 z-10 rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
          <SidebarContent onNavigate={onMobileClose} />
        </SheetContent>
      </Sheet>
    </>
  );
}
