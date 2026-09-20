// Streaming AI endpoint for real-time responses and command execution
// Returns Server-Sent Events (SSE) for live updates

import { createFileRoute } from "@tanstack/react-router";
import { executeAITask } from "@/lib/ai/ai.orchestrator";
import { executeAITool } from "@/lib/ai/ai.server";
import { handleAction } from "@/lib/link.server";

export const Route = createFileRoute("/api/ai-stream")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        const { message, session, conversationHistory, selectedDevices } = body;

        if (!session || !session.deviceId || !session.deviceToken) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Validate device session
        try {
          const heartbeat = (await handleAction("heartbeat", {
            deviceId: session.deviceId,
            deviceToken: session.deviceToken,
          })) as { room: { id: string }; me: { id: string } };

          const roomId = heartbeat.room.id;
          const deviceId = heartbeat.me.id;

          // Create SSE stream
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              const send = (event: string, data: unknown) => {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
              };

              try {
                send("thinking", { message: "Understanding your request..." });

                // Execute AI task with streaming tool callbacks
                const messages = await executeAITask(
                  {
                    taskId: crypto.randomUUID(),
                    roomId,
                    deviceId,
                    conversationHistory: conversationHistory || [],
                  },
                  message,
                  async (toolName, input) => {
                    // Send tool execution start
                    send("tool_start", {
                      tool: toolName,
                      input,
                      timestamp: new Date().toISOString(),
                    });

                    try {
                      // Execute tool
                      const result = await executeAITool(toolName, input, {
                        roomId,
                        deviceId,
                        deviceToken: session.deviceToken,
                      });

                      // Send tool result
                      send("tool_result", {
                        tool: toolName,
                        result,
                        timestamp: new Date().toISOString(),
                      });

                      return result;
                    } catch (error) {
                      // Send tool error
                      const errorMsg = error instanceof Error ? error.message : String(error);
                      send("tool_error", {
                        tool: toolName,
                        error: errorMsg,
                        timestamp: new Date().toISOString(),
                      });

                      return `Error: ${errorMsg}`;
                    }
                  }
                );

                // Send final messages
                send("complete", { messages });
                controller.close();
              } catch (error) {
                send("error", {
                  message: error instanceof Error ? error.message : "Unknown error",
                });
                controller.close();
              }
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Internal Server Error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
