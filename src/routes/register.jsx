import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
const AuthPage = lazy(() => import("@/components/pages/AuthPage"));
export const Route = createFileRoute("/register")({ component: () => <AuthPage mode="register" /> });
