import { createFileRoute } from "@tanstack/react-router";
import SpacesPage from "@/components/pages/SpacesPage";
export const Route = createFileRoute("/spaces")({ component: SpacesPage });
