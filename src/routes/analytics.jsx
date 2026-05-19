import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });
