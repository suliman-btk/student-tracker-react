import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const WorkspaceRedirect = lazy(() => import("@/components/pages/WorkspaceRedirect"));
export const Route = createFileRoute("/sprints")({ component: WorkspaceRedirect });
