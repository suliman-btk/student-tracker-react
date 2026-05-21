import { Search, Bell, Sparkles, ChevronDown } from "lucide-react";
import { useUI } from "@/store/ui";
import { useAuthStore } from "@/store/auth-store";
import { useNotifications, useSpaces } from "@/lib/query-hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";

export default function Topbar() {
  const { activeSpaceId, setActiveSpace, toggleAI } = useUI();
  const { user, profile, logout } = useAuthStore();
  const { data: spaces = [] } = useSpaces();
  const { data: notificationsPayload } = useNotifications();
  const active = spaces.find((s) => String(s.id) === String(activeSpaceId)) || spaces[0];
  const notifications = notificationsPayload?.data || notificationsPayload?.notifications || [];
  const unread = notificationsPayload?.unread_count ?? notifications.filter((n) => !n.read_at && !n.read).length;
  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";
  const email = profile?.email || user?.email || "";
  const avatar = profile?.avatar_url || user?.photoURL;

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur flex items-center gap-3 px-4 lg:px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 h-9 px-2.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: active?.color_hex || active?.color || "var(--primary)" }} />
            <span className="font-medium text-sm">{active?.name || "No space"}</span>
            <ChevronDown className="h-3.5 w-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Switch space</DropdownMenuLabel>
          {spaces.map((s) => (
            <DropdownMenuItem key={s.id} onClick={() => setActiveSpace(s.id)} className="gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color_hex || s.color || "var(--primary)" }} />
              <span className="flex-1">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.template}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="hidden md:flex flex-1 max-w-md ml-2">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search tasks, sprints, notes…"
            className="w-full h-9 pl-8 pr-3 rounded-lg bg-muted/60 border border-transparent text-sm focus:outline-none focus:border-ring"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          onClick={() => toggleAI("global")}
          variant="ghost"
          className="gap-1.5 h-9 px-3 text-[color:var(--ai)] hover:bg-[color:var(--ai-soft)]"
        >
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Ask Coach</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center">
              {unread}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 px-1.5 gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={avatar} />
                <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{displayName}</div>
              <div className="text-xs text-muted-foreground font-normal">{email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
