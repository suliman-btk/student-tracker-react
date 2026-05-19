import { QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useNavigate, useRouter, HeadContent, Scripts, useRouterState, } from "@tanstack/react-router";
import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { startAuthListener, useAuthStore } from "@/store/auth-store";
import appCss from "../styles.css?url";
function NotFoundComponent() {
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
      </div>
    </div>);
}
function ErrorComponent({ error, reset }) {
    const router = useRouter();
    return (<div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 inline-flex h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm items-center">
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
            { name: "description", content: "Academic productivity for university students: tasks, sprints, focus, and an embedded AI Scrum Coach." },
        ],
        links: [{ rel: "stylesheet", href: appCss }],
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
    useEffect(() => {
        startAuthListener();
    }, []);
    useEffect(() => {
        if (!initialized || loading) return;
        if (!user && !isAuthPage) navigate({ to: "/login" });
        if (user && isAuthPage) navigate({ to: "/" });
    }, [initialized, loading, user, isAuthPage, navigate]);
    if (!initialized || loading) {
        return (<QueryClientProvider client={queryClient}>
        <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">Loading RAQIP...</div>
      </QueryClientProvider>);
    }
    return (<QueryClientProvider client={queryClient}>
      {isAuthPage ? <Outlet /> : <AppShell><Outlet /></AppShell>}
    </QueryClientProvider>);
}
