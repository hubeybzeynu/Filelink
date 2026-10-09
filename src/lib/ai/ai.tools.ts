// AI tool definitions that wrap FileLink RPC + web research operations
// Based on the full tool registry from the FILELINK MASTER UPGRADE NOTE

import type { AIToolDefinition } from "./ai.types";

export const AI_TOOLS: AIToolDefinition[] = [
  // ── Web research (Mode B) ────────────────────────────────────────────────
  {
    name: "web_search",
    description:
      "Search the web for information. Returns a list of results with title, URL, snippet, and date. Use this when the user asks you to look something up or find recent information.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The search query" },
        numResults: {
          type: "number",
          description: "Number of results to return (default: 8, max: 20)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_url",
    description:
      "Fetch and read the content of a web page URL. Use after web_search when the user selects a result to analyze.",
    input_schema: {
      type: "object",
      properties: {
        url: { type: "string", description: "The URL to fetch" },
        maxChars: {
          type: "number",
          description:
            "Maximum characters to return (default: 8000). Larger pages are truncated.",
        },
      },
      required: ["url"],
    },
  },

  // ── Device list ──────────────────────────────────────────────────────────
  {
    name: "get_devices",
    description:
      "List all devices in the room with their online/offline status, platform, and capabilities",
    input_schema: { type: "object", properties: {}, required: [] },
  },

  // ── System information ───────────────────────────────────────────────────
  {
    name: "get_device_info",
    description:
      "Get detailed system information from a specific device (OS, CPU, RAM, disk, network, uptime). Call at most ONCE per conversation — skip if already in context.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
      },
      required: ["device"],
    },
  },
  {
    name: "get_processes",
    description:
      "Get list of running processes on a device with CPU/memory usage",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
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
        device: { type: "string", description: "Device name or ID" },
      },
      required: ["device"],
    },
  },

  // ── Files ────────────────────────────────────────────────────────────────
  {
    name: "list_files",
    description: "List files and directories on a device at a specific path",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        path: { type: "string", description: "Directory path to list" },
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
        device: { type: "string", description: "Device name or ID" },
        path: { type: "string", description: "Starting directory path" },
        pattern: {
          type: "string",
          description: "File name pattern to search for",
        },
      },
      required: ["device", "path", "pattern"],
    },
  },
  {
    name: "read_text",
    description:
      "Read a file as UTF-8 text from a device. Use to inspect source code, configs, logs, etc. Returns text content directly. Secrets are automatically redacted.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        path: { type: "string", description: "File path to read" },
        maxBytes: {
          type: "number",
          description: "Maximum bytes to read (default: 100000)",
        },
      },
      required: ["device", "path"],
    },
  },
  {
    name: "write_text",
    description:
      "Write UTF-8 text content to a file on a device. Creates or overwrites the file.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        path: {
          type: "string",
          description: "File path relative to device root",
        },
        content: { type: "string", description: "UTF-8 text content to write" },
        reason: { type: "string", description: "Why this file is being written" },
      },
      required: ["device", "path", "content", "reason"],
    },
  },
  {
    name: "edit_file",
    description:
      "Find and replace a specific piece of text in a file on a device. Precise surgical edits.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        path: { type: "string", description: "File path to edit" },
        old_text: {
          type: "string",
          description: "Exact text to find and replace",
        },
        new_text: { type: "string", description: "Text to replace it with" },
      },
      required: ["device", "path", "old_text", "new_text"],
    },
  },
  {
    name: "create_file",
    description:
      "Create a new file with text content on a device. Creates parent directories automatically.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        path: { type: "string", description: "File path to create" },
        content: {
          type: "string",
          description: "UTF-8 text content for the new file",
        },
      },
      required: ["device", "path", "content"],
    },
  },
  {
    name: "create_directory",
    description: "Create a directory on a device (like mkdir -p)",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        path: { type: "string", description: "Directory path to create" },
      },
      required: ["device", "path"],
    },
  },

  // ── Commands / Terminal ──────────────────────────────────────────────────
  {
    name: "run_command",
    description:
      "Execute a shell command on a device. Streams live output. Requires admin tier for admin commands.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        command: { type: "string", description: "Command to execute" },
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
    name: "terminal_create",
    description:
      "Create a named background terminal session on a device (PowerShell, CMD, etc.)",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        shell: {
          type: "string",
          enum: ["powershell", "cmd", "bash"],
          description: "Shell type (default: powershell on Windows)",
        },
        name: {
          type: "string",
          description: "Human-readable terminal name",
        },
      },
      required: ["device"],
    },
  },
  {
    name: "terminal_write",
    description: "Send input to an existing terminal session",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        terminalId: { type: "string", description: "Terminal session ID" },
        input: { type: "string", description: "Input text to send" },
      },
      required: ["device", "terminalId", "input"],
    },
  },
  {
    name: "terminal_read",
    description: "Read pending output from a terminal session",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        terminalId: { type: "string", description: "Terminal session ID" },
      },
      required: ["device", "terminalId"],
    },
  },

  // ── Display / Camera ─────────────────────────────────────────────────────
  {
    name: "take_screenshot",
    description:
      "Capture a screenshot from a device's screen. Returns base64 JPEG.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        monitor: {
          type: "number",
          description: "Monitor index (0 = primary, default: 0)",
        },
      },
      required: ["device"],
    },
  },

  // ── Clipboard ────────────────────────────────────────────────────────────
  {
    name: "clipboard_read",
    description: "Read the current clipboard content from a device",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
      },
      required: ["device"],
    },
  },
  {
    name: "clipboard_write",
    description: "Write text to the clipboard on a device",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        text: { type: "string", description: "Text to write to clipboard" },
        reason: { type: "string", description: "Why the clipboard is being set" },
      },
      required: ["device", "text", "reason"],
    },
  },

  // ── Input (mouse / keyboard) ─────────────────────────────────────────────
  {
    name: "input_mouse",
    description:
      "Move the mouse cursor or click on a device. All coordinates are in virtual desktop pixels.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        action: {
          type: "string",
          enum: ["move", "click", "double_click", "right_click", "scroll"],
          description: "Mouse action to perform",
        },
        x: { type: "number", description: "X coordinate" },
        y: { type: "number", description: "Y coordinate" },
        button: {
          type: "string",
          enum: ["left", "right", "middle"],
          description: "Mouse button (default: left)",
        },
        amount: {
          type: "number",
          description: "Scroll amount (positive = down, negative = up)",
        },
      },
      required: ["device", "action", "x", "y"],
    },
  },
  {
    name: "input_keyboard",
    description:
      "Type text or send key combinations on a device. Use for keyboard shortcuts or text input.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        action: {
          type: "string",
          enum: ["type", "shortcut", "keydown", "keyup"],
          description:
            "Keyboard action: 'type' sends text, 'shortcut' sends key combination like 'ctrl+c'",
        },
        text: {
          type: "string",
          description: "Text to type or key combination (e.g. 'ctrl+c', 'win+d')",
        },
      },
      required: ["device", "action", "text"],
    },
  },

  // ── Power ────────────────────────────────────────────────────────────────
  {
    name: "power_action",
    description:
      "Perform a power management action on a device (shutdown, restart, sleep, lock, logout). Always requires confirmation.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        action: {
          type: "string",
          enum: [
            "shutdown",
            "restart",
            "sleep",
            "lock",
            "logout",
            "cancelShutdown",
          ],
          description: "Power action to perform",
        },
        delaySeconds: {
          type: "number",
          description: "Delay before action in seconds (default: 0)",
        },
      },
      required: ["device", "action"],
    },
  },

  // ── Notify ───────────────────────────────────────────────────────────────
  {
    name: "show_alert",
    description:
      "Pop up a message box on a device's screen (a notification). kind picks the icon: info, warning or error. Does not wait for an answer.",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Device name or ID" },
        title: { type: "string", description: "Box title" },
        content: { type: "string", description: "Message text" },
        kind: { type: "string", enum: ["info", "warning", "error"], description: "Icon (default info)" },
      },
      required: ["device", "content"],
    },
  },

  // ── File transfer ────────────────────────────────────────────────────────
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
        toDevice: { type: "string", description: "Target device name or ID" },
        sourcePath: { type: "string", description: "Source file path" },
        destinationPath: {
          type: "string",
          description: "Destination directory path",
        },
      },
      required: ["fromDevice", "toDevice", "sourcePath", "destinationPath"],
    },
  },

  // ── Asking the user ──────────────────────────────────────────────────────
  {
    name: "ask_user",
    description:
      "Ask the user to choose between options and WAIT for their answer. Use it whenever a request is ambiguous instead of guessing — e.g. several files match the name they gave, several devices could be meant, or they didn't say which folder. Each option's `value` is sent back to you verbatim when picked, so put the exact thing you need there (a full file path, a device name). When names collide, put the full path in `description` so the user can tell them apart. Do not call any other tool in the same turn.",
    input_schema: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Short question shown above the options, e.g. 'Which report.docx do you mean?'",
        },
        options: {
          type: "array",
          description: "2 to 12 options to choose from",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Main text, e.g. the file name" },
              description: {
                type: "string",
                description: "Second line, e.g. the full path or device name",
              },
              value: {
                type: "string",
                description: "Exact text returned to you when picked (defaults to label)",
              },
              kind: {
                type: "string",
                enum: ["file", "folder", "device", "generic"],
                description: "Icon to show",
              },
            },
            required: ["label"],
          },
        },
        multi: {
          type: "boolean",
          description: "Allow picking several options (default false)",
        },
        allowOther: {
          type: "boolean",
          description: "Also show a free-text box for an answer that isn't listed",
        },
      },
      required: ["question", "options"],
    },
  },

  // ── Confirmation / approval ──────────────────────────────────────────────
  {
    name: "request_confirmation",
    description:
      "Ask the user to approve a risky or irreversible action and WAIT for Approve/Cancel. Call this before power actions, deleting files, killing processes, or system-level changes. Describe exactly what will happen in `question` and put device/path/command in `details`. Do not call any other tool in the same turn; the user's answer arrives as their next message.",
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
          description:
            "Additional details about the action (device, file, command, etc.)",
        },
      },
      required: ["question", "riskLevel"],
    },
  },

  // ── Offline task queuing ─────────────────────────────────────────────────
  {
    name: "queue_offline_task",
    description: "Queue a task to run when an offline device comes online",
    input_schema: {
      type: "object",
      properties: {
        device: { type: "string", description: "Offline device name or ID" },
        action: {
          type: "string",
          description: "Description of the action to perform",
        },
        requiresConfirmation: {
          type: "boolean",
          description:
            "Whether to ask for confirmation when the device comes online",
        },
      },
      required: ["device", "action"],
    },
  },
];
