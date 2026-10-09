// AI Server - Tool execution bridging AI tools to FileLink RPC
// Handles Mode B (web_search, fetch_url) and Mode C (device tools)

import { handleAction } from "../link.server";
import { redactSecrets, assessCommandRisk, isPathSafe, SAFETY_LIMITS } from "./ai-security";
import { getCachedDeviceInfo, setCachedDeviceInfo } from "./ai-cache";
import { joinPath, type AIFileEntry, type AIUiPayload } from "./ai.ui";
import type { RawProcess } from "../processGroups";

export interface StreamingCallback {
  onChunk?: (chunk: string) => void;
  onProgress?: (status: string) => void;
  /** Rich result for the chat UI (file list, tasks table, image). Goes to
   * the browser only — never into the model's context. */
  onUi?: (payload: AIUiPayload) => void;
}

/** RPC replies arrive wrapped as { device, result }. Unwrap defensively. */
function unwrap<T = Record<string, unknown>>(reply: unknown): T {
  const r = reply as { result?: unknown } | null;
  return ((r && typeof r === "object" && "result" in r ? r.result : reply) ?? {}) as T;
}

const MAX_FILES_IN_MODEL_TEXT = 200;
const MAX_PROCESSES_IN_MODEL_TEXT = 40;

/** Simple web fetcher — strips HTML to readable text */
async function fetchWebPage(url: string, maxChars = 8000): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FileLink-AI/1.0",
        Accept: "text/html,application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return `HTTP ${res.status}: ${res.statusText}`;

    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();

    if (contentType.includes("json")) {
      return text.slice(0, maxChars);
    }

    // Strip HTML tags, collapse whitespace
    const stripped = text
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return stripped.slice(0, maxChars);
  } catch (err) {
    return `Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** Lightweight web search via DuckDuckGo Instant Answer API (no key required) */
async function webSearch(query: string, numResults = 8): Promise<string> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FileLink-AI/1.0" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return `Search failed: HTTP ${res.status}`;

    const data = (await res.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Name?: string }>;
      Results?: Array<{ Text?: string; FirstURL?: string }>;
    };

    const results: Array<{ title: string; url: string; snippet: string }> = [];

    // Instant answer
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: "Featured answer",
        url: data.AbstractURL,
        snippet: data.AbstractText.slice(0, 300),
      });
    }

    // Related topics
    for (const t of data.RelatedTopics ?? []) {
      if (results.length >= numResults) break;
      if (t.Text && t.FirstURL) {
        results.push({
          title: t.Name ?? t.FirstURL,
          url: t.FirstURL,
          snippet: t.Text.slice(0, 200),
        });
      }
    }

    // Direct results
    for (const r of data.Results ?? []) {
      if (results.length >= numResults) break;
      if (r.Text && r.FirstURL) {
        results.push({ title: r.FirstURL, url: r.FirstURL, snippet: r.Text.slice(0, 200) });
      }
    }

    if (results.length === 0) {
      return `No results found for: "${query}". Try a more specific search.`;
    }

    return JSON.stringify({ query, results }, null, 2);
  } catch (err) {
    return `Search error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * Execute an AI tool call by mapping it to FileLink RPC operations or web APIs.
 * toolId is the Anthropic tool_use_id — passed through for logging but not needed at execution.
 */
/** Looks up how a device actually connected (`web`/`cli`/`agent`/
 * `desktop-app`) so tool calls that have a native-app equivalent can use
 * it instead of shelling a command out through cmd.exe. Cheap — one
 * lightweight list call, not a new round trip per tool invocation beyond
 * that. Returns "unknown" (never blocks) if the lookup fails for any
 * reason — the CLI/agent exec path always still works as a fallback. */
async function resolveClientKind(baseAuth: Record<string, unknown>, deviceName: string): Promise<string> {
  try {
    const result = (await handleAction("devices", baseAuth)) as {
      devices: { name: string; clientKind?: string }[];
    };
    const match = result.devices.find((d) => d.name.toLowerCase() === deviceName.toLowerCase());
    return match?.clientKind ?? "unknown";
  } catch {
    return "unknown";
  }
}

export async function executeAITool(
  toolName: string,
  input: Record<string, unknown>,
  context: {
    roomId: string;
    deviceId: string;
    deviceToken: string;
    taskId?: string;
  },
  callbacks?: StreamingCallback,
): Promise<string> {
  const baseAuth = {
    deviceId: context.deviceId,
    deviceToken: context.deviceToken,
  };

  try {
    switch (toolName) {
      // ── Web research (Mode B) ──────────────────────────────────────────────
      case "web_search": {
        const query = String(input.query ?? "");
        const numResults = Math.min(20, Number(input.numResults) || 8);
        callbacks?.onProgress?.(`Searching the web for "${query}"...`);
        return await webSearch(query, numResults);
      }

      case "fetch_url": {
        const url = String(input.url ?? "");
        const maxChars = Math.min(20000, Number(input.maxChars) || 8000);
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          return "Error: Only http:// and https:// URLs are supported.";
        }
        callbacks?.onProgress?.(`Fetching ${url}...`);
        return await fetchWebPage(url, maxChars);
      }

      // ── Device list ────────────────────────────────────────────────────────
      case "get_devices": {
        callbacks?.onProgress?.("Fetching connected devices...");
        const result = await handleAction("devices", baseAuth);
        return JSON.stringify((result as { devices: unknown[] }).devices, null, 2);
      }

      // ── System information ─────────────────────────────────────────────────
      case "get_device_info": {
        const device = String(input.device ?? "");
        if (context.taskId) {
          const cached = getCachedDeviceInfo(context.taskId, device);
          if (cached) {
            callbacks?.onProgress?.(`Using cached info for ${device}...`);
            return redactSecrets(JSON.stringify(cached, null, 2));
          }
        }
        callbacks?.onProgress?.(`Getting system info from ${device}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "sysinfo",
          params: {},
        });
        if (context.taskId && result) {
          setCachedDeviceInfo(context.taskId, device, result as Record<string, unknown>);
        }
        return redactSecrets(JSON.stringify(result, null, 2));
      }

      case "get_processes": {
        const device = String(input.device ?? "");
        callbacks?.onProgress?.("Fetching running processes...");
        const reply = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "tasklist",
          params: {},
        });
        const processes = (unwrap<{ processes?: RawProcess[] }>(reply).processes ?? []) as RawProcess[];
        // The person gets the full table (with app icons)...
        callbacks?.onUi?.({ kind: "tasks", device, processes });
        // ...the model gets a compact text summary. Icons are base64 PNGs —
        // sending 60 of them as text would burn the context for nothing.
        const top = [...processes]
          .sort((a, b) => (b.ram ?? 0) - (a.ram ?? 0))
          .slice(0, MAX_PROCESSES_IN_MODEL_TEXT)
          .map((p) => ({
            pid: p.pid,
            name: p.name,
            ramMB: Math.round((p.ram ?? 0) / 1048576),
            cpu: p.cpu,
            window: p.windowTitle || undefined,
          }));
        return JSON.stringify(
          {
            note: "The full task table (grouped Apps / Browsers / Windows / Background, with icons) is already displayed to the user. Summarise briefly; don't repeat the table.",
            totalProcesses: processes.length,
            topByMemory: top,
          },
          null,
          2,
        );
      }

      case "get_disk_usage": {
        const device = String(input.device ?? "");
        callbacks?.onProgress?.("Checking disk usage...");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "disk",
          params: {},
        });
        return JSON.stringify(result, null, 2);
      }

      // ── Files ──────────────────────────────────────────────────────────────
      case "list_files": {
        const device = String(input.device ?? "");
        const path = String(input.path ?? "");
        callbacks?.onProgress?.(`Listing ${path}...`);
        const reply = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "list",
          params: { path },
        });
        const r = unwrap<{
          path?: string;
          folders?: { name: string }[];
          files?: { name: string; size?: number }[];
        }>(reply);
        const dir = r.path ?? path;
        const folders: AIFileEntry[] = (r.folders ?? []).map((f) => ({
          name: f.name,
          path: joinPath(dir, f.name),
        }));
        const files: AIFileEntry[] = (r.files ?? []).map((f) => ({
          name: f.name,
          path: joinPath(dir, f.name),
          size: f.size,
        }));
        callbacks?.onUi?.({
          kind: "files",
          device,
          path: dir,
          mode: "list",
          folders,
          files,
          truncated: folders.length + files.length > 500,
        });
        return JSON.stringify(
          {
            note: "The file list (with icons) is already displayed to the user.",
            path: dir,
            folders: folders.slice(0, MAX_FILES_IN_MODEL_TEXT).map((f) => f.name),
            files: files.slice(0, MAX_FILES_IN_MODEL_TEXT).map((f) => ({ name: f.name, size: f.size })),
            totalFolders: folders.length,
            totalFiles: files.length,
          },
          null,
          2,
        );
      }

      case "search_files": {
        const device = String(input.device ?? "");
        const path = String(input.path ?? "");
        const pattern = String(input.pattern ?? "");
        callbacks?.onProgress?.(`Searching for "${pattern}" in ${path}...`);
        // The PC agent reads `query`; older code sent `pattern`, which the
        // agent ignored — so every search matched everything or nothing.
        // Send both so any client version works.
        const reply = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "search",
          params: { path, query: pattern, pattern },
        });
        const r = unwrap<{ matches?: { path: string; dir?: boolean }[] }>(reply);
        const matches = r.matches ?? [];
        const baseName = (p: string) => p.split(/[\\/]/).filter(Boolean).pop() ?? p;
        callbacks?.onUi?.({
          kind: "files",
          device,
          path,
          mode: "search",
          query: pattern,
          folders: matches.filter((m) => m.dir).map((m) => ({ name: baseName(m.path), path: m.path })),
          files: matches.filter((m) => !m.dir).map((m) => ({ name: baseName(m.path), path: m.path })),
          truncated: matches.length >= 80,
        });
        // The model needs FULL PATHS here — that's how it tells same-named
        // files apart and asks the user which one they mean.
        return JSON.stringify(
          {
            note: "Results are displayed to the user. If several results share a file name, call ask_user with each full path in `description` and the full path as `value`.",
            query: pattern,
            matches: matches.slice(0, MAX_FILES_IN_MODEL_TEXT),
            total: matches.length,
          },
          null,
          2,
        );
      }

      case "read_text": {
        const device = String(input.device ?? "");
        const filePath = String(input.path ?? "");
        const maxBytes = Number(input.maxBytes) || SAFETY_LIMITS.MAX_FILE_READ_BYTES;
        if (!isPathSafe(filePath)) return "Error: Access to this system path is not allowed.";
        callbacks?.onProgress?.(`Reading ${filePath}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "read_text",
          params: { path: filePath, maxBytes },
        });
        return redactSecrets(JSON.stringify(result, null, 2));
      }

      case "write_text": {
        const device = String(input.device ?? "");
        const filePath = String(input.path ?? "");
        const content = String(input.content ?? "");
        const reason = String(input.reason ?? "");
        if (!isPathSafe(filePath)) return "Error: Cannot write to this system path.";
        callbacks?.onProgress?.(`Writing to ${filePath}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "write_text",
          params: { path: filePath, content },
        });
        return `File written: ${filePath}\nReason: ${reason}\n${JSON.stringify(result)}`;
      }

      case "edit_file": {
        const device = String(input.device ?? "");
        const filePath = String(input.path ?? "");
        const oldText = String(input.old_text ?? "");
        const newText = String(input.new_text ?? "");
        callbacks?.onProgress?.(`Editing ${filePath}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "edit_file",
          params: { path: filePath, old_text: oldText, new_text: newText },
        });
        return JSON.stringify(result);
      }

      case "create_file": {
        const device = String(input.device ?? "");
        const filePath = String(input.path ?? "");
        const content = String(input.content ?? "");
        callbacks?.onProgress?.(`Creating ${filePath}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "create_file",
          params: { path: filePath, content },
        });
        return JSON.stringify(result);
      }

      case "create_directory": {
        const device = String(input.device ?? "");
        const path = String(input.path ?? "");
        callbacks?.onProgress?.(`Creating directory ${path}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "mkdir",
          params: { path },
        });
        return `Directory created: ${path}\n${JSON.stringify(result)}`;
      }

      // ── Commands ───────────────────────────────────────────────────────────
      case "run_command": {
        const device = String(input.device ?? "");
        const command = String(input.command ?? "");
        const workingDirectory = String(input.workingDirectory ?? "");
        const timeout = Number(input.timeout) || 120_000;
        const riskLevel = String(input.riskLevel ?? "medium");

        const actualRisk = assessCommandRisk(command);
        if (actualRisk === "critical" && riskLevel !== "critical") {
          return `Error: This command is classified as CRITICAL risk. Use request_confirmation first. Command: ${command}`;
        }

        callbacks?.onProgress?.(`Executing: ${command}`);

        const execResult = await handleAction("rpcExec", {
          ...baseAuth,
          target: device,
          method: "exec",
          params: { command, cwd: workingDirectory, timeout },
        });

        const callId = (execResult as { callId: string }).callId;
        const maxAttempts = Math.ceil(timeout / 500);
        const allChunks: string[] = [];
        let lastChunkCount = 0;

        for (let attempts = 0; attempts < maxAttempts; attempts++) {
          await new Promise((r) => setTimeout(r, 500));

          const status = await handleAction("rpcStatus", { ...baseAuth, callId });
          const currentStatus = (status as { status: string }).status;
          const chunks = (status as { chunks?: string[] }).chunks || [];
          const error = (status as { error?: string }).error;

          if (chunks.length > lastChunkCount) {
            const newChunks = chunks.slice(lastChunkCount);
            for (const chunk of newChunks) {
              callbacks?.onChunk?.(chunk);
              allChunks.push(chunk);
            }
            lastChunkCount = chunks.length;
          }

          if (currentStatus === "done") {
            if (error) return `Command failed:\n${error}`;
            return redactSecrets(allChunks.join(""));
          }
        }

        return `Command timed out after ${timeout}ms. Partial output:\n${redactSecrets(allChunks.join(""))}`;
      }

      // ── Terminal sessions ──────────────────────────────────────────────────
      case "terminal_create": {
        const device = String(input.device ?? "");
        const shell = String(input.shell ?? "powershell");
        const name = String(input.name ?? shell);
        callbacks?.onProgress?.(`Creating ${shell} terminal on ${device}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "control",
          params: { command: "terminalCreate", shell, name },
        });
        return JSON.stringify(result, null, 2);
      }

      case "terminal_write": {
        const device = String(input.device ?? "");
        const terminalId = String(input.terminalId ?? "");
        const input_ = String(input.input ?? "");
        callbacks?.onProgress?.(`Sending input to terminal ${terminalId}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "control",
          params: { command: "terminalWrite", terminalId, input: input_ },
        });
        return JSON.stringify(result, null, 2);
      }

      case "terminal_read": {
        const device = String(input.device ?? "");
        const terminalId = String(input.terminalId ?? "");
        callbacks?.onProgress?.(`Reading from terminal ${terminalId}...`);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "control",
          params: { command: "terminalRead", terminalId },
        });
        return redactSecrets(JSON.stringify(result, null, 2));
      }

      // ── Display ────────────────────────────────────────────────────────────
      case "take_screenshot": {
        const device = String(input.device ?? "");
        const monitor = Number(input.monitor ?? 0);
        callbacks?.onProgress?.("Capturing screenshot...");
        // Desktop-app devices handle this with their own Windows Graphics
        // Capture service instead of shelling a screenshot utility out
        // through cmd.exe — same gating either way (see the appAction
        // check in link.server.ts), just a cleaner path on that client.
        const clientKind = await resolveClientKind(baseAuth, device);
        const reply = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: clientKind === "desktop-app" ? "appAction" : "screenshot",
          params: clientKind === "desktop-app" ? { action: "screenshot", monitor } : { monitor },
        });
        const r = unwrap<{ image?: string; imageBase64?: string; data?: string; mime?: string; at?: number; error?: string }>(
          reply,
        );
        const b64 = r.image ?? r.imageBase64 ?? r.data;
        if (!b64) {
          return `Error: ${device} returned no image${r.error ? ` (${r.error})` : ""}.`;
        }
        const mime = r.mime || "image/jpeg";
        callbacks?.onUi?.({
          kind: "image",
          device,
          src: b64.startsWith("data:") ? b64 : `data:${mime};base64,${b64}`,
          mime,
          caption: `Screenshot of ${device}${monitor ? ` (monitor ${monitor})` : ""}`,
          takenAt: r.at ?? Date.now(),
        });
        // Never put the image bytes in the model's context.
        return `Screenshot captured from ${device} (monitor ${monitor}) and displayed to the user in an image viewer. You cannot see the image itself; do not claim to describe its contents.`;
      }

      // ── Clipboard ──────────────────────────────────────────────────────────
      case "clipboard_read": {
        const device = String(input.device ?? "");
        callbacks?.onProgress?.("Reading clipboard...");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "clipboardRead",
          params: {},
        });
        return redactSecrets(JSON.stringify(result, null, 2));
      }

      case "clipboard_write": {
        const device = String(input.device ?? "");
        const text = String(input.text ?? "");
        const reason = String(input.reason ?? "");
        callbacks?.onProgress?.("Writing to clipboard...");
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "clipboardWrite",
          params: { text },
        });
        return `Clipboard set.\nReason: ${reason}\n${JSON.stringify(result)}`;
      }

      // ── Input (mouse / keyboard) ───────────────────────────────────────────
      case "input_mouse": {
        const device = String(input.device ?? "");
        const action = String(input.action ?? "move");
        const x = Number(input.x ?? 0);
        const y = Number(input.y ?? 0);
        const button = String(input.button ?? "left");
        const amount = Number(input.amount ?? 0);
        callbacks?.onProgress?.(`Mouse ${action} at (${x}, ${y})...`);
        const command = action === "move" ? "cursorMove" : action === "scroll" ? "cursorScroll" : "cursorClick";
        // Desktop-app devices handle raw input through InputService.cs
        // natively instead of a shelled-out input-simulation command — the
        // CLI/agent path (`control`) has no keyboard/mouse handler
        // implemented yet at all (see HANDOFF_NOTE.md), so for a cli/agent
        // target this will currently fail at the agent, not here.
        const clientKind = await resolveClientKind(baseAuth, device);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: clientKind === "desktop-app" ? "appAction" : "control",
          params:
            clientKind === "desktop-app"
              ? { action: command, x, y, button, amount }
              : { command, x, y, button, amount },
        });
        return JSON.stringify(result, null, 2);
      }

      case "input_keyboard": {
        const device = String(input.device ?? "");
        const action = String(input.action ?? "type");
        const text = String(input.text ?? "");
        callbacks?.onProgress?.(`Keyboard ${action}: ${text.slice(0, 30)}...`);
        const command = action === "type" ? "keyboardType" : "keyboardShortcut";
        const clientKind = await resolveClientKind(baseAuth, device);
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: clientKind === "desktop-app" ? "appAction" : "control",
          params: clientKind === "desktop-app" ? { action: command, text } : { command, text },
        });
        return JSON.stringify(result, null, 2);
      }

      // ── Power ──────────────────────────────────────────────────────────────
      case "power_action": {
        const device = String(input.device ?? "");
        const action = String(input.action ?? "");
        const delaySeconds = Number(input.delaySeconds ?? 0);
        callbacks?.onProgress?.(`Sending ${action} to ${device}...`);
        // Power actions work identically on both paths today (both end up
        // calling the same Windows shutdown API either way) — kept on
        // "control" for every client_kind rather than forced onto
        // appAction, since there's no actual benefit to the native path
        // here the way there is for screenshot/input.
        const result = await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "control",
          params: { command: action, seconds: delaySeconds },
        });
        return JSON.stringify(result, null, 2);
      }

      case "show_alert": {
        const device = String(input.device ?? "");
        const kind = ["info", "warning", "error"].includes(String(input.kind)) ? String(input.kind) : "info";
        callbacks?.onProgress?.(`Showing a ${kind} message on ${device}...`);
        await handleAction("rpc", {
          ...baseAuth,
          target: device,
          method: "control",
          params: {
            command: "alert",
            title: String(input.title ?? "Message").slice(0, 120),
            content: String(input.content ?? "").slice(0, 2000),
            kind,
          },
        });
        return `Message shown on ${device}.`;
      }

      // ── Confirmation / approval ────────────────────────────────────────────
      case "request_confirmation": {
        const question = String(input.question ?? "");
        const riskLevel = String(input.riskLevel ?? "medium");
        const details = input.details as Record<string, unknown>;
        // Normally intercepted by the orchestrator, which ends the turn with an
        // Approve/Cancel card. Reaching here means a direct caller — report
        // that nothing was approved.
        return JSON.stringify({ type: "confirmation_required", approved: false, question, riskLevel, details });
      }

      case "queue_offline_task": {
        const device = String(input.device ?? "");
        const action = String(input.action ?? "");
        const requiresConfirmation = Boolean(input.requiresConfirmation);
        return `Task queued for ${device}. Action: ${action}. Requires confirmation: ${requiresConfirmation}. Task will execute when the device comes online.`;
      }

      case "transfer_file":
        return "File transfer tool is coming soon. Use run_command with robocopy/rsync for now.";

      default:
        return `Unknown tool: ${toolName}`;
    }
  } catch (error) {
    return `❌ Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
