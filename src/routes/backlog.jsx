import { createFileRoute } from "@tanstack/react-router";
import BacklogPage from "@/components/pages/BacklogPage";
export const Route = createFileRoute("/backlog")({ component: BacklogPage });
