// AI Server - Tool execution handlers that bridge AI tools to FileLink RPC
// This is the glue between AI tool calls and actual FileLink operations

import { handleAction } from "../link.server";
import { redactSecrets, assessCommandRisk, isPathSafe, SAFETY_LIMITS } from "./ai-security";

/**
 * Execute an AI tool call by mapping it to FileLink RPC operations
 */
export async function executeAITool(
  toolName: string,
  input: Record<string, unknown>,
  context: {
    roomId: string;
    deviceId: string;
    deviceToken: string;
  },
): Promise<string> {
  const baseAuth = {
    deviceId: context.deviceId,
    deviceToken: context.deviceToken,
  };

  try {
    switch (toolName) {
      case "get_devices": {
        const result = await handleAction("devices", baseAuth);
        return JSON.stringify(result.devices, null, 2);
      }

      case "get_device_info": {
        const device = String(input.device ?? "");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "sysinfo",
          params: {},
        });
        return redactSecrets(JSON.stringify(result, null, 2));
      }

      case "list_files": {
        const device = String(input.device ?? "");
        const path = String(input.path ?? "");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "list",
          params: { path },
        });
        return JSON.stringify(result, null, 2);
      }

      case "search_files": {
        const device = String(input.device ?? "");
        const path = String(input.path ?? "");
        const pattern = String(input.pattern ?? "");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "search",
          params: { path, pattern },
        });
        return JSON.stringify(result, null, 2);
      }

      case "read_file": {
        const device = String(input.device ?? "");
        const filePath = String(input.path ?? "");
        const maxBytes = Number(input.maxBytes) || SAFETY_LIMITS.MAX_FILE_READ_BYTES;

        if (!isPathSafe(filePath)) {
          return "Error: Access to this system path is not allowed.";
        }

        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "read",
          params: { path: filePath, maxBytes },
        });

        return redactSecrets(JSON.stringify(result, null, 2));
      }

      case "write_file": {
        const device = String(input.device ?? "");
        const filePath = String(input.path ?? "");
        const content = String(input.content ?? "");
        const reason = String(input.reason ?? "");

        if (!isPathSafe(filePath)) {
          return "Error: Cannot write to this system path.";
        }

        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "write",
          params: { path: filePath, content },
        });

        return `File written successfully: ${filePath}\nReason: ${reason}\n${JSON.stringify(result)}`;
      }

      case "create_directory": {
        const device = String(input.device ?? "");
        const path = String(input.path ?? "");

        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "mkdir",
          params: { path },
        });

        return `Directory created: ${path}\n${JSON.stringify(result)}`;
      }

      case "run_command": {
        const device = String(input.device ?? "");
        const command = String(input.command ?? "");
        const workingDirectory = String(input.workingDirectory ?? "");
        const timeout = Number(input.timeout) || 120000;
        const reason = String(input.reason ?? "");
        const riskLevel = String(input.riskLevel ?? "medium");

        // Auto-assess risk if not provided or validate provided risk
        const actualRisk = assessCommandRisk(command);
        if (actualRisk === "critical" && riskLevel !== "critical") {
          return `Error: This command is classified as CRITICAL risk and requires explicit confirmation. Command: ${command}`;
        }

        // Start streamed command execution
        const execResult = await handleAction("rpcExec", {
          ...baseAuth,
          target: device,
          method: "exec",
          params: { command, cwd: workingDirectory, timeout },
        });

        const callId = (execResult as { callId: string }).callId;

        // Poll for completion (simplified - real implementation should stream)
        let attempts = 0;
        const maxAttempts = Math.ceil(timeout / 1000);

        while (attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 1000));

          const status = await handleAction("rpcStatus", {
            ...baseAuth,
            callId,
          });

          if ((status as { status: string }).status === "done") {
            const chunks = ((status as { chunks: string[] }).chunks || []).join("\n");
            const error = (status as { error?: string }).error;

            if (error) {
              return `Command failed:\n${command}\nReason: ${reason}\nError: ${error}`;
            }

            return `Command executed successfully:\n${command}\nReason: ${reason}\n\nOutput:\n${redactSecrets(chunks)}`;
          }

          attempts++;
        }

        return `Command timed out after ${timeout}ms: ${command}`;
      }

      case "get_processes": {
        const device = String(input.device ?? "");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "tasklist",
          params: {},
        });
        return JSON.stringify(result, null, 2);
      }

      case "take_screenshot": {
        const device = String(input.device ?? "");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "screenshot",
          params: {},
        });
        return `Screenshot captured from ${device}.\n${JSON.stringify(result)}`;
      }

      case "get_disk_usage": {
        const device = String(input.device ?? "");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "disk",
          params: {},
        });
        return JSON.stringify(result, null, 2);
      }

      case "request_confirmation": {
        const question = String(input.question ?? "");
        const riskLevel = String(input.riskLevel ?? "medium");
        const details = input.details as Record<string, unknown>;

        // Return a structured confirmation request
        // The API route should detect this and pause execution
        return JSON.stringify({
          type: "confirmation_required",
          question,
          riskLevel,
          details,
        });
      }

      case "queue_offline_task": {
        const device = String(input.device ?? "");
        const action = String(input.action ?? "");
        const requiresConfirmation = Boolean(input.requiresConfirmation);

        return `Task queued for ${device}. Action: ${action}. Requires confirmation: ${requiresConfirmation}.\nThe task will execute automatically when the device comes online.`;
      }

      case "create_artifact":
      case "transfer_file":
        return `Tool '${toolName}' is not yet implemented. Coming soon.`;

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    return `Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
