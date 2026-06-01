import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const BacklogPage = lazy(() => import("@/components/pages/BacklogPage"));
export const Route = createFileRoute("/backlog")({ component: BacklogPage });
