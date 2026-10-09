// AI Orchestrator - Main server-side AI execution engine
// Coordinates tool execution, conversation flow, and state management
// Supports Mode A (Q&A), Mode B (web research), Mode C (PC action)

import type { AIProvider, AIMessage, AIExecutionContext, AIRiskLevel } from "./ai.types";
import { AI_TOOLS } from "./ai.tools";
import { FILELINK_AI_SYSTEM_PROMPT } from "./ai-prompts";
import { callAnthropic } from "./providers/anthropic.server";
import { callOpenAI } from "./providers/openai.server";
import { redactSecrets, confirmationNeeded, APPROVAL_PREFIX } from "./ai-security";
import type { AIChoiceOption, AIUiPayload } from "./ai.ui";
import { buildDeviceContext, clearTaskCache } from "./ai-cache";

/** Get AI provider configuration from environment */
function getAIConfig() {
  const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || "anthropic";

  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    const authToken = process.env.ANTHROPIC_AUTH_TOKEN;

    if (!apiKey && !authToken) {
      throw new Error(
        "Missing API key for anthropic. Set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN (for Omniroute).",
      );
    }
    return { provider, apiKey };
  } else {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing API key for openai. Set OPENAI_API_KEY.");
    }
    return { provider, apiKey };
  }
}

/** Execute a single AI inference with optional tool calling support */
export async function runAIInference(
  messages: AIMessage[],
  availableTools = AI_TOOLS,
  systemPrompt = FILELINK_AI_SYSTEM_PROMPT,
): Promise<{
  role: "assistant";
  content: string;
  toolCalls?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
}> {
  const { provider, apiKey } = getAIConfig();

  console.log("[AI Orchestrator] Running inference:", {
    provider,
    model: process.env.ANTHROPIC_MODEL || process.env.AI_MODEL || "claude-sonnet-5-5",
    messagesCount: messages.length,
    toolsCount: availableTools.length,
  });

  try {
    if (provider === "anthropic") {
      const result = await callAnthropic(
        { apiKey },
        messages,
        availableTools,
        systemPrompt,
      );

      console.log("[AI Orchestrator] Anthropic response:", {
        contentBlocks: result.content?.length,
        stopReason: result.stop_reason,
      });

      const content = result.content
        .filter((c: { type: string }) => c.type === "text")
        .map((c: { text: string }) => c.text)
        .join("\n");

      // Capture tool_use_id so we can correlate results properly
      const toolCalls = result.content
        .filter((c: { type: string }) => c.type === "tool_use")
        .map((c: { id: string; name: string; input: Record<string, unknown> }) => ({
          id: c.id,
          name: c.name,
          input: c.input,
        }));

      return {
        role: "assistant",
        content: redactSecrets(content),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      };
    } else {
      const result = await callOpenAI({ apiKey }, messages, availableTools, systemPrompt);
      const message = result.choices[0]?.message;
      if (!message) throw new Error("No response from OpenAI");

      const toolCalls = message.tool_calls?.map(
        (tc: { id: string; function: { name: string; arguments: string } }) => ({
          id: tc.id,
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments) as Record<string, unknown>,
        }),
      );

      return {
        role: "assistant",
        content: redactSecrets(message.content || ""),
        toolCalls,
      };
    }
  } catch (error) {
    throw new Error(
      `AI inference failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Turn a stored UI card into one line of text the model can read, so that
 * on the next turn it knows what the person was shown / what they picked from. */
function describeUiForModel(ui: AIUiPayload[] | undefined): string {
  if (!ui?.length) return "";
  const lines: string[] = [];
  for (const p of ui) {
    if (p.kind === "choices") {
      lines.push(
        `[Options shown to the user for "${p.question}": ` +
          p.options
            .map((o, i) => `${i + 1}) ${o.label}${o.description ? ` (${o.description})` : ""} -> ${o.value}`)
            .join("; ") +
          "]",
      );
    } else if (p.kind === "confirm") {
      const d = p.details ? " " + Object.entries(p.details).map(([k, v]) => `${k}: ${v}`).join("; ") : "";
      lines.push(`[Awaiting the user's approval: ${p.question}${d}]`);
    }
  }
  return lines.join("\n");
}

/** What the model sees: message text plus a note about any question cards. */
function toModelMessages(messages: AIMessage[]): AIMessage[] {
  return messages.map((m) => {
    if (m.role !== "assistant" || !m.ui?.length) return m;
    const note = describeUiForModel(m.ui);
    if (!note) return m;
    return { ...m, content: m.content ? `${m.content}\n${note}` : note };
  });
}

function normaliseRisk(v: unknown): AIRiskLevel {
  const r = String(v ?? "medium");
  return (["safe", "low", "medium", "high", "critical"] as const).includes(r as AIRiskLevel)
    ? (r as AIRiskLevel)
    : "medium";
}

/** Build a validated choices card from the model's ask_user input. */
function buildChoices(input: Record<string, unknown>): AIUiPayload | null {
  const raw = Array.isArray(input.options) ? (input.options as Array<Record<string, unknown>>) : [];
  const options: AIChoiceOption[] = raw
    .filter((o) => o && typeof o.label === "string" && String(o.label).trim())
    .slice(0, 12)
    .map((o, i) => {
      const label = String(o.label).trim();
      const kind = String(o.kind ?? "generic");
      return {
        id: `opt-${i}`,
        label,
        description: o.description ? String(o.description) : undefined,
        value: o.value ? String(o.value) : label,
        kind: (["file", "folder", "device", "generic"].includes(kind) ? kind : "generic") as AIChoiceOption["kind"],
      };
    });
  if (options.length === 0) return null;
  return {
    kind: "choices",
    question: String(input.question ?? "Which one?"),
    options,
    multi: Boolean(input.multi),
    allowOther: Boolean(input.allowOther),
  };
}

/**
 * Main AI conversation loop with tool execution.
 * Called by the API route; coordinates the full AI conversation flow.
 *
 * Rules enforced here:
 * - max 10 tool calls per task
 * - no duplicate tool calls (same name + same input, across all iterations)
 * - ONE tool call per model turn (keeps tool_use / tool_result pairs valid)
 * - ask_user / request_confirmation END the turn with a card; the person's
 *   answer arrives as their next message
 * - risky tool calls (deletes, process kills, power, high-risk commands) are
 *   never executed until the person has pressed Approve — enforced here,
 *   not just requested in the prompt
 */
export async function executeAITask(
  context: AIExecutionContext,
  userMessage: string,
  onToolCall?: (
    toolName: string,
    toolId: string,
    input: Record<string, unknown>,
  ) => Promise<string>,
  deviceContext?: string,
): Promise<AIMessage[]> {
  const messages: AIMessage[] = [
    ...context.conversationHistory,
    {
      id: crypto.randomUUID(),
      task_id: context.taskId,
      role: "user",
      content: userMessage,
      tool_name: null,
      tool_call: null,
      created_at: new Date().toISOString(),
    },
  ];

  const devicesInConversation = extractDevicesFromHistory(messages);
  const cachedDeviceContext = buildDeviceContext(context.taskId, devicesInConversation);
  const systemPrompt =
    FILELINK_AI_SYSTEM_PROMPT + (deviceContext || "") + cachedDeviceContext;

  // The Approve button sends a message starting with APPROVAL_PREFIX. That
  // unlocks exactly ONE gated action in this turn.
  let approvalAvailable = userMessage.startsWith(APPROVAL_PREFIX);

  const executedToolSigs = new Set<string>();
  let toolExecutionCount = 0;
  const MAX_TOOL_CALLS = 10;
  const MAX_ITERATIONS = 12; // generous upper limit, tool cap is the real guard

  const endTurnWithCard = (assistantMsg: AIMessage, card: AIUiPayload, fallbackText: string) => {
    assistantMsg.tool_call = null; // no dangling tool_use in the stored history
    assistantMsg.content = assistantMsg.content || fallbackText;
    assistantMsg.ui = [...(assistantMsg.ui ?? []), card];
  };

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // ── Ask AI for next action ────────────────────────────────────────────
    const response = await runAIInference(toModelMessages(messages), AI_TOOLS, systemPrompt);

    // Record the assistant's text turn
    const assistantMsg: AIMessage = {
      id: crypto.randomUUID(),
      task_id: context.taskId,
      role: "assistant",
      content: response.content,
      tool_name: null,
      tool_call: null,
      created_at: new Date().toISOString(),
    };
    messages.push(assistantMsg);

    // No tool calls → conversation complete
    if (!response.toolCalls || response.toolCalls.length === 0) {
      console.log("[AI Orchestrator] No tool calls, conversation complete");
      clearTaskCache(context.taskId);
      break;
    }

    console.log(
      `[AI Orchestrator] Iteration ${iteration + 1}: ${response.toolCalls.length} tool call(s):`,
      response.toolCalls.map((tc) => tc.name),
    );

    // ── Deduplicate across all iterations ────────────────────────────────
    const uniqueToolCalls = response.toolCalls.filter((tc) => {
      const sig = JSON.stringify({ name: tc.name, input: tc.input });
      if (executedToolSigs.has(sig)) {
        console.log(`[AI Orchestrator] Skipping duplicate: ${tc.name}`);
        return false;
      }
      executedToolSigs.add(sig);
      return true;
    });

    if (uniqueToolCalls.length === 0) {
      console.log("[AI Orchestrator] All tool calls were duplicates, stopping");
      break;
    }

    // ── Hard cap on total tool calls ──────────────────────────────────────
    if (toolExecutionCount >= MAX_TOOL_CALLS) {
      console.log("[AI Orchestrator] Tool call limit reached, stopping");
      messages.push({
        id: crypto.randomUUID(),
        task_id: context.taskId,
        role: "assistant",
        content:
          "I've reached the maximum number of actions for this task. Please start a new message if more work is needed.",
        tool_name: null,
        tool_call: null,
        created_at: new Date().toISOString(),
      });
      break;
    }

    // One tool call per turn — the model asks again after it sees the result.
    const toolCall = uniqueToolCalls[0];

    // ── Questions: end the turn and show a card ───────────────────────────
    if (toolCall.name === "ask_user") {
      const card = buildChoices(toolCall.input);
      if (card) {
        endTurnWithCard(assistantMsg, card, "");
        clearTaskCache(context.taskId);
        break;
      }
      // Malformed options — tell the model so it can retry properly.
      messages.pop();
      messages.push({ ...assistantMsg, tool_call: { id: toolCall.id, name: toolCall.name, input: toolCall.input } });
      messages.push({
        id: crypto.randomUUID(),
        task_id: context.taskId,
        role: "tool",
        content: "Error: ask_user needs a question and at least one option with a label.",
        tool_name: toolCall.name,
        tool_call: { id: toolCall.id },
        created_at: new Date().toISOString(),
      });
      continue;
    }

    if (toolCall.name === "request_confirmation") {
      const details: Record<string, string> = {};
      const rawDetails = toolCall.input.details;
      if (rawDetails && typeof rawDetails === "object") {
        for (const [k, v] of Object.entries(rawDetails as Record<string, unknown>)) {
          details[k] = typeof v === "string" ? v : JSON.stringify(v);
        }
      }
      endTurnWithCard(
        assistantMsg,
        {
          kind: "confirm",
          question: String(toolCall.input.question ?? "Do you want to proceed?"),
          risk: normaliseRisk(toolCall.input.riskLevel),
          details: Object.keys(details).length ? details : undefined,
        },
        "",
      );
      clearTaskCache(context.taskId);
      break;
    }

    // ── Approval gate (enforced in code) ──────────────────────────────────
    const gate = confirmationNeeded(toolCall.name, toolCall.input);
    if (gate) {
      if (approvalAvailable) {
        approvalAvailable = false; // one approval = one action
      } else {
        endTurnWithCard(
          assistantMsg,
          { kind: "confirm", question: gate.reason, risk: gate.risk, details: gate.details },
          "This needs your approval before I run it.",
        );
        clearTaskCache(context.taskId);
        break;
      }
    }

    // ── Execute the tool call ─────────────────────────────────────────────
    if (!onToolCall) {
      throw new Error("Tool call handler not provided");
    }

    // Record tool call in assistant's message for Anthropic tool_use_id tracking
    assistantMsg.tool_call = {
      id: toolCall.id,
      name: toolCall.name,
      input: toolCall.input,
    };

    let result: string;
    try {
      result = await onToolCall(toolCall.name, toolCall.id, toolCall.input);
      toolExecutionCount++;
      console.log(
        `[AI Orchestrator] Tool ${toolCall.name} completed (${toolExecutionCount}/${MAX_TOOL_CALLS})`,
      );
    } catch (error) {
      result = `Error: ${error instanceof Error ? error.message : String(error)}`;
      console.log(`[AI Orchestrator] Tool ${toolCall.name} failed:`, error);
    }

    // Add tool result — carry the tool_use_id so Anthropic can match it
    messages.push({
      id: crypto.randomUUID(),
      task_id: context.taskId,
      role: "tool",
      content: result,
      tool_name: toolCall.name,
      tool_call: { id: toolCall.id },
      created_at: new Date().toISOString(),
    });

    // Continue loop so AI can respond with text after seeing tool results
  }

  return messages;
}

/** Extract device names/IDs referenced in previous tool calls */
function extractDevicesFromHistory(messages: AIMessage[]): string[] {
  const devices = new Set<string>();
  for (const msg of messages) {
    if (msg.tool_call && typeof msg.tool_call === "object") {
      const tc = msg.tool_call as { input?: { device?: string } };
      if (tc.input?.device) devices.add(tc.input.device);
    }
  }
  return Array.from(devices);
}
