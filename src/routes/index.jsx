import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const DashboardPage = lazy(() => import("@/components/pages/DashboardPage"));
export const Route = createFileRoute("/")({ component: DashboardPage });
