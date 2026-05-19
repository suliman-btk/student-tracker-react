import { createFileRoute } from "@tanstack/react-router";
import WorkspacePage from "@/components/pages/WorkspacePage";

export const Route = createFileRoute("/spaces/$spaceId/summary")({
  component: SummaryRoute,
});

function SummaryRoute() {
  const { spaceId } = Route.useParams();
  return <WorkspacePage tab="summary" spaceId={spaceId} />;
}
