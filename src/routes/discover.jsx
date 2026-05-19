import { createFileRoute } from "@tanstack/react-router";
import { DiscoverPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/discover")({ component: DiscoverPage });
