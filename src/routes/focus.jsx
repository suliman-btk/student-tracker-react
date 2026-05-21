import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const FocusPage = lazy(() => import("@/components/pages/FocusPage"));
export const Route = createFileRoute("/focus")({ component: FocusPage });
