import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AIDrawer from "./AIDrawer";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 px-4 lg:px-8 py-6 max-w-[1280px] w-full mx-auto">
          {children}
        </main>
      </div>
      <AIDrawer />
    </div>
  );
}
