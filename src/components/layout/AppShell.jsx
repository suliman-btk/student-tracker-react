import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIDrawer from "./AIDrawer";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto w-full px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>
      <AIDrawer />
    </div>
  );
}
