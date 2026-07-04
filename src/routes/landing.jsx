import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";

const LandingPage = lazy(() => import("@/components/pages/LandingPage"));

export const Route = createFileRoute("/landing")({ component: LandingPage });
