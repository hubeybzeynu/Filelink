// AI tool definitions that wrap existing FileLink RPC operations
// These tools are exposed to the AI model for structured actions

import type { AIToolDefinition } from "./ai.types";

export const AI_TOOLS: AIToolDefinition[] = [
  {
    name: "get_devices",
    description:
      "List all devices in the room with their online/offline status, platform, and capabilities",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_device_info",
    description:
      "Get detailed system information from a specific device (OS, CPU, RAM, disk, network)",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
      },
      required: ["device"],
    },
  },
  {
    name: "list_files",
    description: "List files and directories on a device at a specific path",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
        path: {
          type: "string",
          description: "Directory path to list",
        },
      },
      required: ["device", "path"],
    },
  },
  {
    name: "search_files",
    description: "Search for files by name pattern on a device",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
        path: {
          type: "string",
          description: "Starting directory path",
        },
        pattern: {
          type: "string",
          description: "File name pattern to search for",
        },
      },
      required: ["device", "path", "pattern"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file on a device. Automatically redacts secrets.",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
        path: {
          type: "string",
          description: "Full file path to read",
        },
        maxBytes: {
          type: "number",
          description: "Maximum bytes to read (default: 50000)",
        },
      },
      required: ["device", "path"],
    },
  },
  {
    name: "write_file",
    description: "Write or create a file on a device. Requires confirmation for overwrites.",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
        path: {
          type: "string",
          description: "Full file path to write",
        },
        content: {
          type: "string",
          description: "File content to write",
        },
        reason: {
          type: "string",
          description: "Why this file is being written",
        },
      },
      required: ["device", "path", "content", "reason"],
    },
  },
  {
    name: "create_directory",
    description: "Create a directory on a device (like mkdir -p)",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
        path: {
          type: "string",
          description: "Directory path to create",
        },
      },
      required: ["device", "path"],
    },
  },
  {
    name: "run_command",
    description:
      "Execute a shell command on a device. Streams live output. Requires admin tier for admin commands.",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
        command: {
          type: "string",
          description: "Command to execute",
        },
        workingDirectory: {
          type: "string",
          description: "Working directory for the command",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 120000)",
        },
        reason: {
          type: "string",
          description: "Why this command is being run",
        },
        riskLevel: {
          type: "string",
          enum: ["safe", "low", "medium", "high", "critical"],
          description: "Risk level of this command",
        },
      },
      required: ["device", "command", "reason", "riskLevel"],
    },
  },
  {
    name: "get_processes",
    description: "Get list of running processes on a device with CPU/memory usage",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
      },
      required: ["device"],
    },
  },
  {
    name: "take_screenshot",
    description: "Capture a screenshot from a device",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
      },
      required: ["device"],
    },
  },
  {
    name: "get_disk_usage",
    description: "Get disk/drive usage information from a device",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Device name or ID",
        },
      },
      required: ["device"],
    },
  },
  {
    name: "transfer_file",
    description: "Transfer a file from one device to another through FileLink",
    input_schema: {
      type: "object",
      properties: {
        fromDevice: {
          type: "string",
          description: "Source device name or ID",
        },
        toDevice: {
          type: "string",
          description: "Target device name or ID",
        },
        sourcePath: {
          type: "string",
          description: "Source file path",
        },
        destinationPath: {
          type: "string",
          description: "Destination directory path",
        },
      },
      required: ["fromDevice", "toDevice", "sourcePath", "destinationPath"],
    },
  },
  {
    name: "create_artifact",
    description: "Create an artifact (PowerPoint, Word, PDF, etc.) in the cloud workspace",
    input_schema: {
      type: "object",
      properties: {
        filename: {
          type: "string",
          description: "Artifact filename with extension",
        },
        type: {
          type: "string",
          enum: ["powerpoint", "word", "pdf", "excel", "text", "html", "image", "zip"],
          description: "Type of artifact to create",
        },
        content: {
          type: "string",
          description: "Content specification or instructions for the artifact",
        },
        targetDevice: {
          type: "string",
          description: "Device to send the artifact to (optional)",
        },
        destination: {
          type: "string",
          description: "Destination path on the target device (optional)",
        },
      },
      required: ["filename", "type", "content"],
    },
  },
  {
    name: "request_confirmation",
    description: "Ask the user for confirmation before proceeding with a risky action",
    input_schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Clear question to ask the user",
        },
        riskLevel: {
          type: "string",
          enum: ["safe", "low", "medium", "high", "critical"],
          description: "Risk level of the action",
        },
        details: {
          type: "object",
          description: "Additional details about the action (device, file, command, etc.)",
        },
      },
      required: ["question", "riskLevel"],
    },
  },
  {
    name: "queue_offline_task",
    description: "Queue a task to run when an offline device comes online",
    input_schema: {
      type: "object",
      properties: {
        device: {
          type: "string",
          description: "Offline device name or ID",
        },
        action: {
          type: "string",
          description: "Description of the action to perform",
        },
        requiresConfirmation: {
          type: "boolean",
          description: "Whether to ask for confirmation when the device comes online",
        },
      },
      required: ["device", "action"],
    },
  },
];
