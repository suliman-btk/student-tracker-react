import { createFileRoute } from "@tanstack/react-router";
import { RoomsPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/rooms")({ component: RoomsPage });
