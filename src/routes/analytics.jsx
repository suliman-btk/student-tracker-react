import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const AnalyticsPage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.AnalyticsPage })));
export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });
