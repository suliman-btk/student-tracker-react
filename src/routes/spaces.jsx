import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import SpacesPage from "@/components/pages/SpacesPage";

export const Route = createFileRoute("/spaces")({ component: SpacesRoute });

function SpacesRoute() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return path === "/spaces" ? <SpacesPage /> : <Outlet />;
}
