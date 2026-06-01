import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const WorkspacePage = lazy(() => import("@/components/pages/WorkspacePage"));
export const Route = createFileRoute("/spaces/$spaceId/backlog")({
  component: function BacklogRoute() { const { spaceId } = Route.useParams(); return <WorkspacePage tab="backlog" spaceId={spaceId} />; },
});
