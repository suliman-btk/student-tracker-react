import { createFileRoute } from "@tanstack/react-router";
import SprintBoardPage from "@/components/pages/SprintBoardPage";
export const Route = createFileRoute("/sprints/$id")({
    component: () => { const { id } = Route.useParams(); return <SprintBoardPage sprintId={id}/>; },
});
