import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIDrawer from "./AIDrawer";

export default function AppShell({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto w-full px-4 lg:px-8 py-6">
          {children}
        </main>
      </div>
      <AIDrawer />
    </div>
  );
}
