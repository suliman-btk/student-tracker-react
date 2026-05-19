import { createFileRoute } from "@tanstack/react-router";
import { FeedPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/feed")({ component: FeedPage });
