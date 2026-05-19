import { createFileRoute } from "@tanstack/react-router";
import WorkspacePage from "@/components/pages/WorkspacePage";

export const Route = createFileRoute("/spaces/$spaceId/board")({
  component: BoardRoute,
});

function BoardRoute() {
  const { spaceId } = Route.useParams();
  return <WorkspacePage tab="board" spaceId={spaceId} />;
}
