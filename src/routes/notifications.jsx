import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/notifications")({ component: NotificationsPage });
