import { createFileRoute } from "@tanstack/react-router";
import { PlatformsPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/social/platforms")({ component: PlatformsPage });
