import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const RoomsPage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.RoomsPage })));
export const Route = createFileRoute("/rooms")({ component: RoomsPage });
