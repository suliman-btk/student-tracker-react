import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const SettingsPage = lazy(() => import("@/components/pages/SettingsPage"));
export const Route = createFileRoute("/settings")({ component: SettingsPage });
