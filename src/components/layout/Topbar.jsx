import { useAuthStore } from "@/store/auth-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Link } from "@tanstack/react-router";

export default function Topbar() {
  const { user, profile, logout } = useAuthStore();
  const displayName = profile?.name || user?.displayName || user?.email?.split("@")[0] || "Student";
  const email = profile?.email || user?.email || "";
  const avatar = profile?.avatar_url || user?.photoURL;

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-background/80 backdrop-blur flex items-center px-4 lg:px-6">
      <div className="ml-auto flex items-center">
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
