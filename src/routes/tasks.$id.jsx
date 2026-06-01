import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const TaskDetailPage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.TaskDetailPage })));
export const Route = createFileRoute("/tasks/$id")({
  component: function TaskRoute() { const { id } = Route.useParams(); return <TaskDetailPage id={id} />; },
});
