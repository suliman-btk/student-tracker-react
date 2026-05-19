import { createFileRoute } from "@tanstack/react-router";
import DomainTasksPage from "@/components/pages/DomainTasksPage";

export const Route = createFileRoute("/domains/$id")({
  component: DomainRoute,
});

function DomainRoute() {
  const { id } = Route.useParams();
  return <DomainTasksPage id={id} />;
}
