import { createFileRoute } from "@tanstack/react-router";
import { FriendsPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/friends")({ component: FriendsPage });
