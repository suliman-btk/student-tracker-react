import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const ProfilePage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.ProfilePage })));
export const Route = createFileRoute("/profile/$uid")({
  component: function ProfileRoute() { const { uid } = Route.useParams(); return <ProfilePage uid={uid} />; },
});
