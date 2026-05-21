import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const SprintBoardPage = lazy(() => import("@/components/pages/SprintBoardPage"));
export const Route = createFileRoute("/sprints/$id")({
  component: function SprintRoute() { const { id } = Route.useParams(); return <SprintBoardPage sprintId={id} />; },
});
