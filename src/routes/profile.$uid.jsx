import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/profile/$uid")({
    component: () => { const { uid } = Route.useParams(); return <ProfilePage uid={uid}/>; },
});
