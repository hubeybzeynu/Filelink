// Server endpoint for AI operations
// /api/ai handles chat, task planning, tool execution, and confirmations

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
          const { action, taskId, message, session } = body;

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

              // Run AI conversation with tool calling
              const messages = await executeAITask(
                {
                  taskId: taskId || crypto.randomUUID(),
                  roomId,
                  deviceId,
                  conversationHistory: body.conversationHistory || [],
                },
                message,
                async (toolName, input) => {
                  return await executeAITool(toolName, input, {
                    roomId,
                    deviceId,
                    deviceToken: session.deviceToken,
                  });
                },
              );

              return json({ messages });
            }

            case "status": {
              // Task status check
              return json({ status: "idle" });
            }

            default:
              return json({ error: `Unknown action: ${action}` }, { status: 400 });
          }
        } catch (error) {
          return json(
            {
              error: error instanceof Error ? error.message : "Internal Server Error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
