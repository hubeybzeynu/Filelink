// Server endpoint for AI operations
// /api/ai handles chat with tool execution

import { json } from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { executeAITask } from "@/lib/ai/ai.orchestrator";
import { executeAITool } from "@/lib/ai/ai.server";
import { handleAction } from "@/lib/link.server";

export const Route = createFileRoute("/api/ai")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            taskId?: string;
            message?: string;
            session?: { deviceId: string; deviceToken: string };
            conversationHistory?: unknown[];
            selectedDevices?: string[];
          };
          const { action, taskId, message, session, conversationHistory, selectedDevices } = body;

          if (!session?.deviceId || !session?.deviceToken) {
            return json({ error: "Unauthorized" }, { status: 401 });
          }

          // Validate device session
          const heartbeat = (await handleAction("heartbeat", {
            deviceId: session.deviceId,
            deviceToken: session.deviceToken,
          })) as { room: { id: string }; me: { id: string } };

          const roomId = heartbeat.room.id;
          const deviceId = heartbeat.me.id;

          switch (action) {
            case "chat": {
              if (!message) {
                return json({ error: "Missing message" }, { status: 400 });
              }

              console.log("[AI API] Received chat request:", {
                message: message.substring(0, 80),
                deviceId,
                roomId,
                historyLength: conversationHistory?.length ?? 0,
                selectedDevices: selectedDevices ?? [],
              });

              const executionSteps: Array<{
                tool: string;
                status: "running" | "completed" | "failed";
                output?: string;
                error?: string;
                chunks?: string[];
              }> = [];

              const messages = await executeAITask(
                {
                  taskId: taskId || crypto.randomUUID(),
                  roomId,
                  deviceId,
                  conversationHistory: (conversationHistory as Parameters<typeof executeAITask>[0]["conversationHistory"]) ?? [],
                },
                message,
                // onToolCall receives (name, id, input) from the orchestrator
                async (toolName, _toolId, toolInput) => {
                  const stepIndex = executionSteps.length;
                  executionSteps.push({ tool: toolName, status: "running", chunks: [] });

                  try {
                    const result = await executeAITool(
                      toolName,
                      toolInput,
                      {
                        roomId,
                        deviceId,
                        deviceToken: session.deviceToken,
                        taskId: taskId || undefined,
                      },
                      {
                        onChunk: (chunk) => {
                          executionSteps[stepIndex].chunks ??= [];
                          executionSteps[stepIndex].chunks!.push(chunk);
                        },
                        onProgress: (status) => {
                          console.log(`[${toolName}] ${status}`);
                        },
                      },
                    );

                    executionSteps[stepIndex].status = "completed";
                    executionSteps[stepIndex].output = result;
                    return result;
                  } catch (error) {
                    executionSteps[stepIndex].status = "failed";
                    executionSteps[stepIndex].error =
                      error instanceof Error ? error.message : String(error);
                    return `Error: ${executionSteps[stepIndex].error}`;
                  }
                },
              );

              return json({ messages, executionSteps });
            }

            case "status":
              return json({ status: "idle" });

            default:
              return json({ error: `Unknown action: ${action}` }, { status: 400 });
          }
        } catch (error) {
          console.error("[AI API Error]", error);
          return json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 },
          );
        }
      },
    },
  },
});
