// Streaming AI endpoint — Server-Sent Events for real-time AI responses.
//
// POST /api/ai-stream  { message, deviceId, deviceToken, selectedDevices, conversationHistory }
//   The browser uses POST: the device token and the whole chat history must
//   not travel in a URL (URLs get logged, and long histories overflow them).
// GET  /api/ai-stream?...  — legacy form with the same fields as query
//   parameters, kept so old clients keep working.
//
// Events: thinking, tool_start, tool_chunk, tool_progress, tool_ui (rich
// result card), tool_result, tool_error, complete, error.

import { createFileRoute } from "@tanstack/react-router";
import type { AIMessage } from "@/lib/ai/ai.types";
import { isQuestionPayload, type AIUiPayload } from "@/lib/ai/ai.ui";
import { executeAITask } from "@/lib/ai/ai.orchestrator";
import { executeAITool } from "@/lib/ai/ai.server";
import { handleAction } from "@/lib/link.server";

type StreamParams = {
  message: string | null;
  deviceId: string | null;
  deviceToken: string | null;
  selectedDevices: string[];
  conversationHistory: unknown;
};

const MAX_HISTORY_MESSAGES = 40;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * The browser sends back the chat it is showing. Treat it as untrusted:
 * keep only plain user/assistant text, drop anything that could confuse the
 * model's tool protocol (tool results, fabricated tool_use), and keep only
 * the question cards (so the model knows what the person was asked).
 */
function sanitizeHistory(raw: unknown): AIMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: AIMessage[] = [];
  for (const item of raw.slice(-MAX_HISTORY_MESSAGES)) {
    if (!item || typeof item !== "object") continue;
    const m = item as Partial<AIMessage>;
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string") continue;
    const ui = Array.isArray(m.ui)
      ? (m.ui as AIUiPayload[]).filter((p) => p && typeof p === "object" && isQuestionPayload(p))
      : undefined;
    out.push({
      id: typeof m.id === "string" ? m.id : crypto.randomUUID(),
      task_id: "",
      role: m.role,
      content: m.content.slice(0, 20_000),
      tool_name: null,
      tool_call: null,
      created_at: typeof m.created_at === "string" ? m.created_at : new Date().toISOString(),
      ...(ui && ui.length ? { ui } : {}),
    });
  }
  return out;
}

async function streamResponse(params: StreamParams): Promise<Response> {
  const { message, deviceId: rawDeviceId, deviceToken, selectedDevices } = params;

  if (!rawDeviceId || !deviceToken) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (!message || !message.trim()) {
    return jsonResponse({ error: "Missing message" }, 400);
  }
  const conversationHistory = sanitizeHistory(params.conversationHistory);

  try {
    // Validate device session
    const heartbeat = (await handleAction("heartbeat", {
      deviceId: rawDeviceId,
      deviceToken,
    })) as { room: { id: string }; me: { id: string } };

    const roomId = heartbeat.room.id;
    const authedDeviceId = heartbeat.me.id;

    // Fetch all devices so we can build a device context string
    const devicesResponse = await handleAction("devices", {
      deviceId: rawDeviceId,
      deviceToken,
    });
    const allDevices = (
      devicesResponse as {
        devices: Array<{ id: string; name: string; online: boolean }>;
      }
    ).devices;

    // Filter to the devices the user selected
    const selectedDeviceDetails = selectedDevices
      .map((id) => allDevices.find((d) => d.id === id || d.name === id))
      .filter((d): d is (typeof allDevices)[number] => Boolean(d));

    const deviceContext =
      selectedDeviceDetails.length > 0
        ? `\n\nTARGET DEVICE(S) PRE-SELECTED BY USER:\n${selectedDeviceDetails
            .map((d) => `- ${d.name} (ID: ${d.id}, ${d.online ? "ONLINE" : "OFFLINE"})`)
            .join(
              "\n",
            )}\n\nWhen executing tools that require a "device" parameter, use the device name or ID from this list. Do NOT call get_devices — the user already chose them.`
        : "";

    // ── SSE stream ─────────────────────────────────────────────────────────
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let closed = false;
        const send = (event: string, data: unknown) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          } catch {
            closed = true; // client went away
          }
        };
        // SSE comment lines keep proxies from closing a quiet connection
        // while a slow PC action is running.
        const keepAlive = setInterval(() => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          } catch {
            closed = true;
          }
        }, 15_000);

        try {
          send("thinking", { message: "Understanding your request..." });

          const taskId = crypto.randomUUID();
          // Rich result cards produced by tools this turn (file list, tasks
          // table, screenshot…). They're attached to the final message.
          const turnUi: AIUiPayload[] = [];

          const messages = await executeAITask(
            {
              taskId,
              roomId,
              deviceId: authedDeviceId,
              conversationHistory,
            },
            message,
            // onToolCall: (name, id, input)
            async (toolName, _toolId, toolInput) => {
              send("tool_start", {
                tool: toolName,
                input: toolInput,
                timestamp: new Date().toISOString(),
              });

              try {
                const result = await executeAITool(
                  toolName,
                  toolInput,
                  {
                    roomId,
                    deviceId: authedDeviceId,
                    deviceToken,
                    taskId,
                  },
                  {
                    onChunk: (chunk) => {
                      send("tool_chunk", {
                        tool: toolName,
                        chunk,
                        timestamp: new Date().toISOString(),
                      });
                    },
                    onProgress: (status) => {
                      send("tool_progress", {
                        tool: toolName,
                        status,
                        timestamp: new Date().toISOString(),
                      });
                    },
                    onUi: (payload) => {
                      turnUi.push(payload);
                      send("tool_ui", { tool: toolName, ui: payload });
                    },
                  },
                );

                // Don't echo big results (they're already shown as cards).
                send("tool_result", {
                  tool: toolName,
                  result: result.length > 4000 ? `${result.slice(0, 4000)}…` : result,
                  timestamp: new Date().toISOString(),
                });

                return result;
              } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                send("tool_error", {
                  tool: toolName,
                  error: errorMsg,
                  timestamp: new Date().toISOString(),
                });
                return `Error: ${errorMsg}`;
              }
            },
            deviceContext,
          );

          // Attach this turn's result cards to the final assistant message so
          // they're part of the conversation (and get saved with it).
          if (turnUi.length) {
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].role === "assistant") {
                messages[i].ui = [...turnUi, ...(messages[i].ui ?? [])];
                break;
              }
            }
          }

          send("complete", { messages: messages.filter((m) => m.role !== "tool") });
        } catch (error) {
          send("error", {
            message: error instanceof Error ? error.message : "Unknown error",
          });
        } finally {
          clearInterval(keepAlive);
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      500,
    );
  }
}

export const Route = createFileRoute("/api/ai-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return jsonResponse({ error: "Invalid JSON body" }, 400);
        }
        return streamResponse({
          message: typeof body.message === "string" ? body.message : null,
          deviceId: typeof body.deviceId === "string" ? body.deviceId : null,
          deviceToken: typeof body.deviceToken === "string" ? body.deviceToken : null,
          selectedDevices: Array.isArray(body.selectedDevices)
            ? body.selectedDevices.filter((d): d is string => typeof d === "string")
            : [],
          conversationHistory: body.conversationHistory,
        });
      },

      // Legacy: same fields as query parameters.
      GET: async ({ request }) => {
        const url = new URL(request.url);
        let selectedDevices: string[] = [];
        let conversationHistory: unknown = [];
        try {
          selectedDevices = JSON.parse(url.searchParams.get("selectedDevices") || "[]") as string[];
          conversationHistory = JSON.parse(url.searchParams.get("conversationHistory") || "[]");
        } catch {
          return jsonResponse({ error: "Bad request" }, 400);
        }
        return streamResponse({
          message: url.searchParams.get("message"),
          deviceId: url.searchParams.get("deviceId"),
          deviceToken: url.searchParams.get("deviceToken"),
          selectedDevices: Array.isArray(selectedDevices) ? selectedDevices : [],
          conversationHistory,
        });
      },
    },
  },
});
