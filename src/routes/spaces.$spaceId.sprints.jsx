import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const WorkspacePage = lazy(() => import("@/components/pages/WorkspacePage"));
export const Route = createFileRoute("/spaces/$spaceId/sprints")({
  component: function SprintsRoute() { const { spaceId } = Route.useParams(); return <WorkspacePage tab="sprints" spaceId={spaceId} />; },
});
