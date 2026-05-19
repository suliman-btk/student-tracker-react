import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/components/pages/MiscPages";
export const Route = createFileRoute("/settings")({ component: SettingsPage });
