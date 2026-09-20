// AI Orchestrator - Main server-side AI execution engine
// Coordinates tool execution, conversation flow, and state management

import type { AIProvider, AIMessage, AIExecutionContext } from "./ai.types";
import { AI_TOOLS } from "./ai.tools";
import { FILELINK_AI_SYSTEM_PROMPT } from "./ai-prompts";
import { callAnthropic } from "./providers/anthropic.server";
import { callOpenAI } from "./providers/openai.server";
import { redactSecrets } from "./ai-security";

/**
 * Get AI provider configuration from environment
 */
function getAIConfig() {
  const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || "anthropic";

  if (provider === "anthropic") {
    // Allow empty ANTHROPIC_API_KEY when using Omniroute (ANTHROPIC_AUTH_TOKEN)
    const apiKey = process.env.ANTHROPIC_API_KEY || "";
    const authToken = process.env.ANTHROPIC_AUTH_TOKEN;

    if (!apiKey && !authToken) {
      throw new Error(
        "Missing API key for anthropic. Set ANTHROPIC_API_KEY or ANTHROPIC_AUTH_TOKEN (for Omniroute) environment variable.",
      );
    }

    return { provider, apiKey };
  } else {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing API key for openai. Set OPENAI_API_KEY environment variable.");
    }

    return { provider, apiKey };
  }
}

/**
 * Execute a single AI inference with tool calling support
 */
export async function runAIInference(
  messages: AIMessage[],
  availableTools = AI_TOOLS,
  systemPrompt = FILELINK_AI_SYSTEM_PROMPT,
): Promise<{
  role: "assistant";
  content: string;
  toolCalls?: Array<{ name: string; input: Record<string, unknown> }>;
}> {
  const { provider, apiKey } = getAIConfig();

  console.log("[AI Orchestrator] Running inference with:", {
    provider,
    model: provider === "anthropic" ? process.env.ANTHROPIC_MODEL : process.env.AI_MODEL,
    baseUrl: process.env.ANTHROPIC_BASE_URL,
    messagesCount: messages.length,
    toolsCount: availableTools.length,
  });

  try {
    if (provider === "anthropic") {
      const result = await callAnthropic({ apiKey }, messages, availableTools, systemPrompt);

      console.log("[AI Orchestrator] Anthropic response:", {
        contentBlocks: result.content?.length,
        stopReason: result.stop_reason,
      });

      // Extract text content and tool calls from Anthropic response
      const content = result.content
        .filter((c: { type: string }) => c.type === "text")
        .map((c: { text: string }) => c.text)
        .join("\n");

      const toolCalls = result.content
        .filter((c: { type: string }) => c.type === "tool_use")
        .map((c: { name: string; input: Record<string, unknown> }) => ({
          name: c.name,
          input: c.input,
        }));

      console.log("[AI Orchestrator] Extracted:", {
        contentLength: content.length,
        toolCallsCount: toolCalls.length,
      });

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
        (tc: { function: { name: string; arguments: string } }) => ({
          name: tc.function.name,
          input: JSON.parse(tc.function.arguments),
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

/**
 * Main AI conversation loop with tool execution
 * This is called by the API route and coordinates the entire AI flow
 */
export async function executeAITask(
  context: AIExecutionContext,
  userMessage: string,
  onToolCall?: (toolName: string, input: Record<string, unknown>) => Promise<string>,
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

  // AI inference loop - up to 10 iterations to handle multi-step tool use
  for (let iteration = 0; iteration < 10; iteration++) {
    const response = await runAIInference(messages);

    // Add assistant message
    messages.push({
      id: crypto.randomUUID(),
      task_id: context.taskId,
      role: "assistant",
      content: response.content,
      tool_name: null,
      tool_call: null,
      created_at: new Date().toISOString(),
    });

    // If no tool calls, conversation is complete
    if (!response.toolCalls || response.toolCalls.length === 0) {
      break;
    }

    // Execute each tool call
    for (const toolCall of response.toolCalls) {
      if (!onToolCall) {
        throw new Error("Tool call handler not provided");
      }

      try {
        const result = await onToolCall(toolCall.name, toolCall.input);

        // Add tool result as a message
        messages.push({
          id: crypto.randomUUID(),
          task_id: context.taskId,
          role: "tool",
          content: result,
          tool_name: toolCall.name,
          tool_call: toolCall as never,
          created_at: new Date().toISOString(),
        });
      } catch (error) {
        // Tool execution failed - report error back to AI
        messages.push({
          id: crypto.randomUUID(),
          task_id: context.taskId,
          role: "tool",
          content: `Error: ${error instanceof Error ? error.message : String(error)}`,
          tool_name: toolCall.name,
          tool_call: toolCall as never,
          created_at: new Date().toISOString(),
        });
      }
    }
  }

  return messages;
}
