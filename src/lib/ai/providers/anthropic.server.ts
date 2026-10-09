// Anthropic Claude provider implementation for FileLink AI
// Uses latest Claude model with proper tool_use_id tracking

import type { AIToolDefinition, AIMessage } from "../ai.types";
import { FILELINK_AI_SYSTEM_PROMPT } from "../ai-prompts";

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

// Map internal message history to Anthropic's required format.
// Anthropic requires:
//   - tool results to carry the matching tool_use_id from the assistant turn
//   - alternating user/assistant roles (merge consecutive same-role messages)
function formatMessagesForAnthropic(messages: AIMessage[]) {
  const formatted: Array<{
    role: "user" | "assistant";
    content: string | Array<Record<string, unknown>>;
  }> = [];

  // Build a map from tool_name (which we store as the call id) to tool_use_id
  // We carry the id through by storing it in tool_call.id when we push the message.
  const toolUseIdMap = new Map<string, string>();

  for (const m of messages) {
    if (m.role === "assistant") {
      // Assistant may have mixed text + tool_use blocks stored in tool_call
      const toolCall = m.tool_call as {
        id?: string;
        name?: string;
        input?: Record<string, unknown>;
      } | null;

      if (toolCall?.id && toolCall.name) {
        // Track mapping so the matching tool result can reference the right id
        toolUseIdMap.set(m.id, toolCall.id);
        const blocks: Array<Record<string, unknown>> = [];
        if (m.content) blocks.push({ type: "text", text: m.content });
        blocks.push({
          type: "tool_use",
          id: toolCall.id,
          name: toolCall.name,
          input: toolCall.input ?? {},
        });
        formatted.push({ role: "assistant", content: blocks });
      } else {
        formatted.push({ role: "assistant", content: m.content || "" });
      }
    } else if (m.role === "tool") {
      // m.tool_name holds the message id of the assistant turn that called this tool
      const toolUseId =
        (m.tool_call as { id?: string } | null)?.id ||
        m.tool_name ||
        "tool_call";
      formatted.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseId,
            content: m.content,
          },
        ],
      });
    } else {
      // user
      formatted.push({ role: "user", content: m.content });
    }
  }

  // Merge consecutive same-role turns (Anthropic requires strictly alternating)
  const merged: typeof formatted = [];
  for (const msg of formatted) {
    const prev = merged[merged.length - 1];
    if (prev && prev.role === msg.role) {
      // Merge content arrays / strings
      if (typeof prev.content === "string" && typeof msg.content === "string") {
        prev.content = prev.content + "\n" + msg.content;
      } else {
        const prevArr = Array.isArray(prev.content)
          ? prev.content
          : [{ type: "text", text: prev.content as string }];
        const msgArr = Array.isArray(msg.content)
          ? msg.content
          : [{ type: "text", text: msg.content as string }];
        prev.content = [...prevArr, ...msgArr];
      }
    } else {
      merged.push({ ...msg });
    }
  }

  return merged;
}

export async function callAnthropic(
  config: AnthropicConfig,
  messages: AIMessage[],
  tools: AIToolDefinition[],
  systemPrompt = FILELINK_AI_SYSTEM_PROMPT,
) {
  // Prefer latest Claude 5 model; fall back to env/config overrides
  const model =
    config.model ||
    process.env.AI_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    "claude-sonnet-5-5";

  const formattedMessages = formatMessagesForAnthropic(messages);

  const formattedTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  const payload: Record<string, unknown> = {
    model,
    max_tokens: config.maxTokens || 8192,
    system: systemPrompt,
    messages: formattedMessages,
  };

  if (formattedTools.length > 0) {
    payload.tools = formattedTools;
  }

  // Support Omniroute local proxy or direct Anthropic API
  const baseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const authToken = process.env.ANTHROPIC_AUTH_TOKEN;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  } else {
    headers["x-api-key"] = config.apiKey;
  }

  const fullUrl = `${baseUrl}/v1/messages`;
  console.log("[Anthropic] Making request to:", fullUrl, "model:", model);

  const res = await fetch(fullUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`);
  }

  return await res.json();
}
