import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useNavigate, useRouter, HeadContent, Scripts, useRouterState, } from "@tanstack/react-router";
import { useEffect, Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { startAuthListener, useAuthStore } from "@/store/auth-store";
import BrandLoader from "@/components/ui/brand-loader";
import appCss from "../styles.css?url";
function PageLoader() {
    return <BrandLoader />;
}
function NotFoundComponent() {
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
      </div>
    </div>);
}
const CHUNK_ERROR_RELOAD_KEY = "raqip-chunk-reload-at";
function isChunkLoadError(error) {
    return /Failed to fetch dynamically imported module|Importing a module script failed|Failed to import/i.test(error?.message || "");
}
function ErrorComponent({ error, reset }) {
    const router = useRouter();
    useEffect(() => {
        if (!isChunkLoadError(error)) return;
        // New deploy replaced the hashed chunk files this tab still references —
        // retrying the import can never succeed, only a fresh document load can.
        // Guard with a timestamp so a genuinely broken build doesn't reload-loop forever.
        const lastReload = Number(sessionStorage.getItem(CHUNK_ERROR_RELOAD_KEY) || 0);
        if (Date.now() - lastReload > 10000) {
            sessionStorage.setItem(CHUNK_ERROR_RELOAD_KEY, String(Date.now()));
            window.location.reload();
        }
    }, [error]);
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { if (isChunkLoadError(error)) { window.location.reload(); } else { router.invalidate(); reset(); } }} className="mt-4 inline-flex h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm items-center">
          Try again
        </button>
      </div>
    </div>);
}
export const Route = createRootRouteWithContext()({
    head: () => ({
        meta: [
            { charSet: "utf-8" },
            { name: "viewport", content: "width=device-width, initial-scale=1" },
            { title: "RAQIP — Smart Study Companion" },
            { name: "description", content: "Academic productivity for university students: tasks, sprints, focus, and Azzam your AI Scrum Coach." },
        ],
        links: [
            { rel: "stylesheet", href: appCss },
            { rel: "icon", type: "image/png", href: "/logo-icon.png" },
            { rel: "apple-touch-icon", href: "/logo-icon.png" },
        ],
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
});
function RootShell({ children }) {
    return (<html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>);
}
function RootComponent() {
    const { queryClient } = Route.useRouteContext();
    const path = useRouterState({ select: (s) => s.location.pathname });
    const isAuthPage = path === "/login" || path === "/register";
    const navigate = useNavigate();
    const { user, loading, initialized } = useAuthStore();
    // Logged-out visitors can see the public landing page at "/" or "/landing" (no app shell).
    const isLandingPath = path === "/" || path === "/landing";
    const isPublicLanding = isLandingPath && !user;
    const isPublic = isAuthPage || isPublicLanding;
    useEffect(() => {
        startAuthListener();
    }, []);
    useEffect(() => {
        if (!initialized || loading) return;
        if (!user && !isAuthPage && !isLandingPath) navigate({ to: "/login" });
        if (user && isAuthPage) navigate({ to: "/" });
    }, [initialized, loading, user, isAuthPage, isLandingPath, navigate]);
    if (!initialized || loading) {
        return (<QueryClientProvider client={queryClient}>
        <BrandLoader fullscreen label="Loading RAQIP…" />
      </QueryClientProvider>);
    }
    return (<QueryClientProvider client={queryClient}>
      {isPublic
        ? <Suspense fallback={<PageLoader />}><Outlet /></Suspense>
        : <AppShell><Suspense fallback={<PageLoader />}><Outlet /></Suspense></AppShell>}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>);
}
