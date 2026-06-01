import { lazy } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useAuthStore } from "@/store/auth-store";
const DashboardPage = lazy(() => import("@/components/pages/DashboardPage"));
const LandingPage = lazy(() => import("@/components/pages/LandingPage"));

function IndexRoute() {
  const { user } = useAuthStore();
  return user ? <DashboardPage /> : <LandingPage />;
}

export const Route = createFileRoute("/")({ component: IndexRoute });
