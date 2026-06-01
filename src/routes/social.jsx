import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const SocialPage = lazy(() => import("@/components/pages/SocialPage").then((m) => ({ default: m.SocialPage })));
export const Route = createFileRoute("/social")({ component: SocialPage });
