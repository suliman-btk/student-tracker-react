import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const DomainTasksPage = lazy(() => import("@/components/pages/DomainTasksPage"));
export const Route = createFileRoute("/domains/$id")({ component: DomainRoute });
function DomainRoute() {
  const { id } = Route.useParams();
  return <DomainTasksPage id={id} />;
}
