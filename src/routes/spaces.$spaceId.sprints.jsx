import { createFileRoute } from "@tanstack/react-router";
import WorkspacePage from "@/components/pages/WorkspacePage";

export const Route = createFileRoute("/spaces/$spaceId/sprints")({
  component: SprintsRoute,
});

function SprintsRoute() {
  const { spaceId } = Route.useParams();
  return <WorkspacePage tab="sprints" spaceId={spaceId} />;
}
