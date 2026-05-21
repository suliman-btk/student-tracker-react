import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const RoomDetailPage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.RoomDetailPage })));
export const Route = createFileRoute("/rooms/$id")({
  component: function RoomRoute() { const { id } = Route.useParams(); return <RoomDetailPage id={id} />; },
});
