import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const EditProfilePage = lazy(() => import("@/components/pages/MiscPages").then((m) => ({ default: m.EditProfilePage })));
export const Route = createFileRoute("/profile/edit")({ component: EditProfilePage });
