import { useState } from "react";
import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { Menu, Plus } from "lucide-react";
import CreateTaskModal from "@/components/study/CreateTaskModal";

export default function Topbar({ onMobileMenu }) {
  const { user, profile, logout } = useAuthStore();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";
  const email = profile?.email || user?.email || "";
  const avatar = profile?.avatar_url || user?.photoURL;

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur flex items-center px-4 lg:px-6 gap-2">
      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden shrink-0"
        onClick={onMobileMenu}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* RAQIP wordmark — mobile only (desktop has it in sidebar) */}
      <span className="lg:hidden font-semibold tracking-tight text-sm">RAQIP</span>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={() => setTaskModalOpen(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
        <CreateTaskModal open={taskModalOpen} onOpenChange={setTaskModalOpen} />
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
