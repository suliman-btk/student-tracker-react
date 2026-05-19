import { createFileRoute } from "@tanstack/react-router";
import { RoomDetailPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/rooms/$id")({
    component: () => { const { id } = Route.useParams(); return <RoomDetailPage id={id}/>; },
});
