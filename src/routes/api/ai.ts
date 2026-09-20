// Server endpoint for AI operations with REAL-TIME streaming
// /api/ai handles chat with live command execution feedback

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
          const body = await request.json();
          const { action, taskId, message, session, conversationHistory } = body;

          if (!session || !session.deviceId || !session.deviceToken) {
            return json({ error: "Unauthorized" }, { status: 401 });
          }

          // Validate device session via heartbeat
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

              // Track execution progress for real-time feedback
              const executionSteps: Array<{
                tool: string;
                status: "running" | "completed" | "failed";
                output?: string;
                error?: string;
                chunks?: string[];
              }> = [];

              // Run AI conversation with REAL-TIME tool execution callbacks
              const messages = await executeAITask(
                {
                  taskId: taskId || crypto.randomUUID(),
                  roomId,
                  deviceId,
                  conversationHistory: conversationHistory || [],
                },
                message,
                async (toolName, input) => {
                  // Add execution step
                  const stepIndex = executionSteps.length;
                  executionSteps.push({
                    tool: toolName,
                    status: "running",
                    chunks: [],
                  });

                  try {
                    // Execute tool with streaming callbacks
                    const result = await executeAITool(
                      toolName,
                      input,
                      {
                        roomId,
                        deviceId,
                        deviceToken: session.deviceToken,
                      },
                      {
                        // Real-time chunk callback
                        onChunk: (chunk: string) => {
                          if (!executionSteps[stepIndex].chunks) {
                            executionSteps[stepIndex].chunks = [];
                          }
                          executionSteps[stepIndex].chunks!.push(chunk);
                        },
                        // Progress callback
                        onProgress: (status: string) => {
                          console.log(`[${toolName}] ${status}`);
                        },
                      }
                    );

                    // Mark as completed
                    executionSteps[stepIndex].status = "completed";
                    executionSteps[stepIndex].output = result;

                    return result;
                  } catch (error) {
                    // Mark as failed
                    executionSteps[stepIndex].status = "failed";
                    executionSteps[stepIndex].error =
                      error instanceof Error ? error.message : String(error);

                    return `Error: ${executionSteps[stepIndex].error}`;
                  }
                }
              );

              return json({
                messages,
                executionSteps, // Include execution details
              });
            }

            case "status": {
              // Task status check
              return json({ status: "idle" });
            }

            default:
              return json({ error: `Unknown action: ${action}` }, { status: 400 });
          }
        } catch (error) {
          console.error("[AI API Error]", error);
          return json(
            {
              error: error instanceof Error ? error.message : "Internal Server Error",
            },
            { status: 500 }
          );
        }
      },
    },
  },
});
