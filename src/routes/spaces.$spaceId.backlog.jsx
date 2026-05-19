import { createFileRoute } from "@tanstack/react-router";
import WorkspacePage from "@/components/pages/WorkspacePage";

export const Route = createFileRoute("/spaces/$spaceId/backlog")({
  component: BacklogRoute,
});

function BacklogRoute() {
  const { spaceId } = Route.useParams();
  return <WorkspacePage tab="backlog" spaceId={spaceId} />;
}
