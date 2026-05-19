import { createFileRoute } from "@tanstack/react-router";
import WorkspacePage from "@/components/pages/WorkspacePage";

export const Route = createFileRoute("/spaces/$spaceId/members")({
  component: MembersRoute,
});

function MembersRoute() {
  const { spaceId } = Route.useParams();
  return <WorkspacePage tab="members" spaceId={spaceId} />;
}
