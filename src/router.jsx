import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen.js";
export const getRouter = () => {
    // staleTime 60s + no focus refetch: mutations already invalidate their
    // queries aggressively (invalidation refetches regardless of staleTime),
    // rooms are Firestore-realtime, and notifications poll every 60s — so the
    // only thing the zero-staleTime defaults added was a full workspace
    // refetch storm on every alt-tab/navigation return.
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60_000,
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    });
    const router = createRouter({
        routeTree,
        context: { queryClient },
        scrollRestoration: true,
        defaultPreloadStaleTime: 0,
    });
    return router;
};
