import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const DomainsPage = lazy(() => import("@/components/pages/DomainsPage"));
export const Route = createFileRoute("/domains")({ component: DomainsPage });
