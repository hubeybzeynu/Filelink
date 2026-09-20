// Anthropic Claude provider implementation for FileLink AI

import type { AIToolDefinition, AIMessage } from "../ai.types";
import { FILELINK_AI_SYSTEM_PROMPT } from "../ai-prompts";

export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export async function callAnthropic(
  config: AnthropicConfig,
  messages: AIMessage[],
  tools: AIToolDefinition[],
  systemPrompt = FILELINK_AI_SYSTEM_PROMPT,
) {
  const model =
    config.model ||
    process.env.AI_MODEL ||
    process.env.ANTHROPIC_MODEL ||
    "claude-3-7-sonnet-20250219";

  const formattedMessages = messages.map((m) => {
    if (m.role === "tool") {
      return {
        role: "user" as const,
        content: [
          {
            type: "tool_result" as const,
            tool_use_id: m.tool_name || "tool_call",
            content: m.content,
          },
        ],
      };
    }
    return {
      role: m.role,
      content: m.content,
    };
  });

  const formattedTools = tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema,
  }));

  const payload: Record<string, unknown> = {
    model,
    max_tokens: config.maxTokens || 4096,
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

  // Use ANTHROPIC_AUTH_TOKEN for Omniroute, or x-api-key for direct API
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  } else {
    headers["x-api-key"] = config.apiKey;
  }

  const res = await fetch(`${baseUrl}/v1/messages`, {
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
