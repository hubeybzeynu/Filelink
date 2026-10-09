// OpenAI GPT provider implementation for FileLink AI

import type { AIToolDefinition, AIMessage } from "../ai.types";
import { FILELINK_AI_SYSTEM_PROMPT } from "../ai-prompts";

export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}

export async function callOpenAI(
  config: OpenAIConfig,
  messages: AIMessage[],
  tools: AIToolDefinition[],
  systemPrompt = FILELINK_AI_SYSTEM_PROMPT,
) {
  const model = config.model || process.env.AI_MODEL || process.env.OPENAI_MODEL || "gpt-4o";

  const formattedMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: m.role === "tool" ? ("assistant" as const) : m.role,
      content: m.content,
      ...(m.tool_call ? { tool_calls: [m.tool_call] } : {}),
    })),
  ];

  const formattedTools = tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));

  const payload: Record<string, unknown> = {
    model,
    max_tokens: config.maxTokens || 4096,
    messages: formattedMessages,
  };

  if (formattedTools.length > 0) {
    payload.tools = formattedTools;
    payload.tool_choice = "auto";
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
  }

  return await res.json();
}
