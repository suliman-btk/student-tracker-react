import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/spaces/$spaceId")({
  loader: ({ params }) => {
    throw redirect({ to: "/spaces/$spaceId/summary", params: { spaceId: params.spaceId } });
  },
});
