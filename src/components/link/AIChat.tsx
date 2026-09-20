// AI Chat Component - Claude-style with real-time streaming
// Shows thinking, live command execution, auto-retry on errors

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, AlertCircle } from "lucide-react";
import type { Session, DeviceInfo } from "@/lib/linkClient";
import type { AIMessage, AITaskStep } from "@/lib/ai/ai.types";
import { AIExecutionCard } from "./AIExecutionCard";

interface AIChatProps {
  session: Session;
  devices: DeviceInfo[];
  selectedDevices: string[];
}

type ActivityState = "idle" | "thinking" | "executing" | "streaming";

export function AIChat({ session, devices, selectedDevices }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [activityState, setActivityState] = useState<ActivityState>("idle");
  const [thinkingText, setThinkingText] = useState("");
  const [executionSteps, setExecutionSteps] = useState<AITaskStep[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, executionSteps, streamingContent, thinkingText]);

  const addExecutionStep = (data: { tool: string; input: unknown }): string => {
    const stepId = crypto.randomUUID();
    const newStep: AITaskStep = {
      id: stepId,
      task_id: "",
      device_id: null,
      device_name: null,
      type: "command",
      title: `${data.tool}`,
      status: "running",
      command: JSON.stringify(data.input),
      working_directory: null,
      input: data.input as Record<string, unknown>,
      output: null,
      error: null,
      diff: null,
      risk_level: "medium",
      started_at: new Date().toISOString(),
      completed_at: null,
    };
    setExecutionSteps((prev) => [...prev, newStep]);
    return stepId;
  };

  const updateExecutionStep = (stepId: string, updates: Partial<AITaskStep>) => {
    setExecutionSteps((prev) =>
      prev.map((step) =>
        step.id === stepId
          ? {
              ...step,
              ...updates,
              completed_at:
                updates.status === "completed" || updates.status === "failed"
                  ? new Date().toISOString()
                  : step.completed_at,
            }
          : step
      )
    );
  };

  const sendMessage = async () => {
    if (!input.trim() || activityState !== "idle") return;
    if (selectedDevices.length === 0) {
      setErrorMessage("Please select at least one target device.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setExecutionSteps([]);
    setStreamingContent("");
    setErrorMessage("");

    // Add user message
    const userMsg: AIMessage = {
      id: crypto.randomUUID(),
      task_id: "",
      role: "user",
      content: userMessage,
      tool_name: null,
      tool_call: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Track current execution step
    let currentStepId: string | null = null;

    try {
      setActivityState("thinking");
      setThinkingText("Understanding your request...");

      abortControllerRef.current = new AbortController();

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          action: "chat",
          message: userMessage,
          session: {
            deviceId: session.deviceId,
            deviceToken: session.deviceToken,
          },
          conversationHistory: messages,
          selectedDevices,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errorData.error || "AI request failed");
      }

      const data = await res.json();

      if (!data.messages || !Array.isArray(data.messages)) {
        throw new Error("Invalid response format");
      }

      // Process messages with animations
      for (const msg of data.messages) {
        if (msg.role === "assistant" && msg.content) {
          setActivityState("streaming");

          // Stream response word by word
          const words = msg.content.split(/(\s+)/);
          let accumulated = "";

          for (const word of words) {
            accumulated += word;
            setStreamingContent(accumulated);
            await new Promise((r) => setTimeout(r, 20));
          }

          setMessages((prev) => [...prev, msg]);
          setStreamingContent("");
          setActivityState("idle");
        } else if (msg.role === "tool" && msg.tool_name) {
          setActivityState("executing");
          setThinkingText(`Running ${msg.tool_name}...`);

          // Add or update execution step
          if (!currentStepId) {
            currentStepId = addExecutionStep({
              tool: msg.tool_name,
              input: msg.tool_call || {},
            });
          }

          await new Promise((r) => setTimeout(r, 300));

          // Update with result
          const hasError = msg.content?.includes("Error:") || msg.content?.includes("error");

          updateExecutionStep(currentStepId, {
            status: hasError ? "failed" : "completed",
            output: hasError ? null : msg.content,
            error: hasError ? msg.content : null,
          });

          setMessages((prev) => [...prev, msg]);
          currentStepId = null;
        }
      }

      setActivityState("idle");
      setThinkingText("");
    } catch (error) {
      console.error("AI Error:", error);

      if (error instanceof Error && error.name === "AbortError") {
        setActivityState("idle");
        return;
      }

      setActivityState("idle");
      setThinkingText("");

      // Show detailed error
      let errorText = "Something went wrong. ";

      if (error instanceof Error) {
        if (error.message.includes("fetch")) {
          errorText +=
            "Cannot connect to the AI service.\n\n**Troubleshooting:**\n1. Is your Omniroute proxy running on http://localhost:20128?\n2. Start it with: `claude serve` or check your Omniroute configuration\n3. Verify your .env file has ANTHROPIC_AUTH_TOKEN set";
        } else if (error.message.includes("API key")) {
          errorText +=
            "Missing API credentials.\n\n**Fix:**\n1. Check your .env file\n2. Set ANTHROPIC_AUTH_TOKEN for Omniroute\n3. Or set ANTHROPIC_API_KEY for direct API access";
        } else {
          errorText += error.message;
        }
      }

      const errorMsg: AIMessage = {
        id: crypto.randomUUID(),
        task_id: "",
        role: "assistant",
        content: `❌ ${errorText}`,
        tool_name: null,
        tool_call: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const cancelRequest = () => {
    abortControllerRef.current?.abort();
    setActivityState("idle");
    setThinkingText("");
    setStreamingContent("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">FileLink AI</h2>
              <p className="text-[10px] text-muted-foreground">Powered by Claude</p>
            </div>
          </div>
          {selectedDevices.length > 0 && (
            <div className="text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-md">
              {selectedDevices.length} device{selectedDevices.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.length === 0 && activityState === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="size-12 mb-4 text-primary/40" />
            <h3 className="text-base font-semibold text-foreground mb-1">
              Hey! I'm FileLink AI.
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6">
              I can help you manage your connected devices, run commands, troubleshoot issues, transfer
              files, and more.
            </p>

            <div className="grid gap-2 w-full max-w-md">
              {[
                "Check the PC OS system",
                "Show running processes",
                "Find large files on Desktop",
                "Run 'npm install' and fix errors",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="ios-btn rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs text-left hover:bg-card/80 transition-all hover:border-primary/50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-xs text-red-500">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => {
          if (msg.role === "tool") return null;

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-card/80 text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {/* Streaming Content */}
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-border bg-card/80 px-4 py-2.5 text-xs">
              <p className="whitespace-pre-wrap inline">{streamingContent}</p>
              <span className="inline-block w-1 h-3.5 bg-primary animate-pulse ml-0.5 align-middle" />
            </div>
          </div>
        )}

        {/* Execution Steps */}
        {executionSteps.length > 0 && (
          <div className="space-y-2 pl-4 border-l-2 border-primary/30">
            {executionSteps.map((step) => (
              <AIExecutionCard key={step.id} step={step} />
            ))}
          </div>
        )}

        {/* Thinking/Executing State */}
        {activityState !== "idle" && activityState !== "streaming" && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-border bg-card/80 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                {activityState === "thinking" && (
                  <>
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                    <span className="text-foreground">{thinkingText}</span>
                  </>
                )}
                {activityState === "executing" && (
                  <>
                    <Loader2 className="size-3.5 animate-spin text-primary" />
                    <span className="text-foreground">{thinkingText}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to inspect devices, run commands, or fix issues..."
            disabled={activityState !== "idle"}
            rows={1}
            className="ios-btn flex-1 resize-none rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs outline-none focus:border-primary disabled:opacity-50 transition-all"
            style={{ maxHeight: "120px" }}
          />
          <button
            onClick={activityState !== "idle" ? cancelRequest : sendMessage}
            disabled={activityState === "idle" && !input.trim()}
            className={`ios-btn grid size-10 shrink-0 place-items-center rounded-xl transition-all ${
              activityState !== "idle"
                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                : "bg-primary text-primary-foreground disabled:opacity-50"
            }`}
            title={activityState !== "idle" ? "Cancel" : "Send message"}
          >
            {activityState !== "idle" ? (
              <span className="text-sm font-bold">✕</span>
            ) : (
              <Send className="size-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          {activityState !== "idle"
            ? "Click ✕ to cancel • Processing..."
            : "Shift+Enter for new line • Enter to send"}
        </p>
      </div>
    </div>
  );
}
