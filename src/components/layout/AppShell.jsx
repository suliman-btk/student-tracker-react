import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIDrawer from "./AIDrawer";
import WelcomeModal from "@/components/study/WelcomeModal";

export default function AppShell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full px-2 py-3 sm:px-4 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
      <AIDrawer />
      <WelcomeModal />
    </div>
  );
}
