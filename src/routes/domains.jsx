import { createFileRoute } from "@tanstack/react-router";
import DomainsPage from "@/components/pages/DomainsPage";
export const Route = createFileRoute("/domains")({ component: DomainsPage });
