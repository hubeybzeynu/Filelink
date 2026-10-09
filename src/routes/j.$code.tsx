import { createFileRoute, redirect } from "@tanstack/react-router";

// Share links look like /j/ABC123 — hand the code to the connect screen.
export const Route = createFileRoute("/j/$code")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/", search: { code: params.code.toUpperCase() } as never });
  },
});
