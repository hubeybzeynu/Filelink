import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/public/link")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const action = String(body.action ?? "");
        if (!action) return json({ error: "Missing action" }, 400);

        const { handleAction, ApiError } = await import("@/lib/link.server");
        try {
          const result = await handleAction(action, body);
          return json({ ok: true, ...(result as object) });
        } catch (err) {
          if (err instanceof ApiError) return json({ error: err.message }, err.status);
          console.error("[link api]", err);
          return json({ error: "Something went wrong" }, 500);
        }
      },
    },
  },
});
