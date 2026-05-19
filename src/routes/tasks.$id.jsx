import { createFileRoute } from "@tanstack/react-router";
import { TaskDetailPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/tasks/$id")({
    component: () => { const { id } = Route.useParams(); return <TaskDetailPage id={id}/>; },
});
