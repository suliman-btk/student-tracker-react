import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const WorkspacePage = lazy(() => import("@/components/pages/WorkspacePage"));
export const Route = createFileRoute("/spaces/$spaceId/members")({
  component: function MembersRoute() { const { spaceId } = Route.useParams(); return <WorkspacePage tab="members" spaceId={spaceId} />; },
});
