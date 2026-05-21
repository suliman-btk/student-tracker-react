import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const WorkspacePage = lazy(() => import("@/components/pages/WorkspacePage"));
export const Route = createFileRoute("/spaces/$spaceId/board")({
  component: function BoardRoute() { const { spaceId } = Route.useParams(); return <WorkspacePage tab="board" spaceId={spaceId} />; },
});
