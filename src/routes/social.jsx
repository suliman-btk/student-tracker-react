import { createFileRoute } from "@tanstack/react-router";
import { SocialPage } from "@/components/pages/SocialPage";
export const Route = createFileRoute("/social")({ component: SocialPage });
