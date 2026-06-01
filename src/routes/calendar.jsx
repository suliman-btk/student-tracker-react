import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const CalendarPage = lazy(() => import("@/components/pages/CalendarPage"));
export const Route = createFileRoute("/calendar")({ component: CalendarPage });
