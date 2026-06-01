import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const NotificationsPage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.NotificationsPage })));
export const Route = createFileRoute("/notifications")({ component: NotificationsPage });
