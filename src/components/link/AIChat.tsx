// AI Chat Component - Claude-style with REAL-TIME SSE streaming
// Live thinking, tool execution, and command output streaming

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
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, executionSteps, streamingContent, thinkingText]);

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

      // Use SSE streaming endpoint for real-time updates
      const params = new URLSearchParams({
        message: userMessage,
        deviceId: session.deviceId,
        deviceToken: session.deviceToken,
        selectedDevices: JSON.stringify(selectedDevices),
        conversationHistory: JSON.stringify(messages),
      });

      const eventSource = new EventSource(`/api/ai-stream?${params}`);
      eventSourceRef.current = eventSource;

      eventSource.addEventListener("thinking", (e) => {
        const data = JSON.parse(e.data);
        setActivityState("thinking");
        setThinkingText(data.message || "Thinking...");
      });

      eventSource.addEventListener("tool_start", (e) => {
        const data = JSON.parse(e.data);
        setActivityState("executing");
        setThinkingText(`Running ${data.tool}...`);

        // Add new execution step
        const stepId = crypto.randomUUID();
        currentStepId = stepId;

        const newStep: AITaskStep = {
          id: stepId,
          task_id: "",
          device_id: null,
          device_name: null,
          type: "command",
          title: data.tool,
          status: "running",
          command: JSON.stringify(data.input, null, 2),
          working_directory: null,
          input: data.input as Record<string, unknown>,
          output: "",
          error: null,
          diff: null,
          risk_level: "medium",
          started_at: data.timestamp,
          completed_at: null,
        };
        setExecutionSteps((prev) => [...prev, newStep]);
      });

      eventSource.addEventListener("tool_chunk", (e) => {
        const data = JSON.parse(e.data);
        // Append chunk to current step's output in real-time
        if (currentStepId) {
          setExecutionSteps((prev) =>
            prev.map((step) =>
              step.id === currentStepId
                ? { ...step, output: (step.output || "") + data.chunk }
                : step,
            ),
          );
        }
      });

      eventSource.addEventListener("tool_progress", (e) => {
        const data = JSON.parse(e.data);
        setThinkingText(data.status);
      });

      eventSource.addEventListener("tool_result", (e) => {
        const data = JSON.parse(e.data);
        // Mark current step as completed
        if (currentStepId) {
          setExecutionSteps((prev) =>
            prev.map((step) =>
              step.id === currentStepId
                ? {
                    ...step,
                    status: "completed",
                    output: step.output || data.result,
                    completed_at: data.timestamp,
                  }
                : step,
            ),
          );
          currentStepId = null;
        }
      });

      eventSource.addEventListener("tool_error", (e) => {
        const data = JSON.parse(e.data);
        // Mark current step as failed
        if (currentStepId) {
          setExecutionSteps((prev) =>
            prev.map((step) =>
              step.id === currentStepId
                ? {
                    ...step,
                    status: "failed",
                    error: data.error,
                    completed_at: data.timestamp,
                  }
                : step,
            ),
          );
          currentStepId = null;
        }
      });

      eventSource.addEventListener("complete", (e) => {
        const data = JSON.parse(e.data);
        eventSource.close();
        eventSourceRef.current = null;

        // Process final messages
        if (data.messages && Array.isArray(data.messages)) {
          for (const msg of data.messages) {
            if (msg.role === "assistant" && msg.content) {
              // Stream response word by word
              setActivityState("streaming");
              const words = msg.content.split(/(\s+)/);
              let accumulated = "";

              const streamWords = async () => {
                for (const word of words) {
                  accumulated += word;
                  setStreamingContent(accumulated);
                  await new Promise((r) => setTimeout(r, 20));
                }

                setMessages((prev) => [...prev, msg]);
                setStreamingContent("");
                setActivityState("idle");
              };

              void streamWords();
            } else if (msg.role === "tool" && msg.tool_name) {
              setMessages((prev) => [...prev, msg]);
            }
          }
        }

        setActivityState("idle");
        setThinkingText("");
      });

      eventSource.addEventListener("error", (e: Event) => {
        const messageEvent = e as MessageEvent;
        let errorData;
        try {
          errorData = JSON.parse(messageEvent.data || "{}");
        } catch {
          errorData = { message: "Connection error" };
        }

        eventSource.close();
        eventSourceRef.current = null;
        setActivityState("idle");
        setThinkingText("");

        const errorMsg: AIMessage = {
          id: crypto.randomUUID(),
          task_id: "",
          role: "assistant",
          content: `❌ ${errorData.message || "An error occurred"}`,
          tool_name: null,
          tool_call: null,
          created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorMsg]);
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          eventSource.close();
          eventSourceRef.current = null;

          if (activityState !== "idle") {
            setActivityState("idle");
            setThinkingText("");

            const errorMsg: AIMessage = {
              id: crypto.randomUUID(),
              task_id: "",
              role: "assistant",
              content:
                "❌ Connection lost. Check that Omniroute is running on http://localhost:20128 and the dev server is active.",
              tool_name: null,
              tool_call: null,
              created_at: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, errorMsg]);
          }
        }
      };
    } catch (error) {
      console.error("AI Error:", error);

      if (error instanceof Error && error.name === "AbortError") {
        setActivityState("idle");
        return;
      }

      setActivityState("idle");
      setThinkingText("");

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
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setActivityState("idle");
    setThinkingText("");
    setStreamingContent("");
  };

  return (
    <div className="flex h-full max-h-full flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">FileLink AI</h2>
              <p className="text-[10px] text-muted-foreground">
                Powered by Claude • Real-time streaming
              </p>
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
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.length === 0 && activityState === "idle" && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="size-12 mb-4 text-primary/40" />
            <h3 className="text-base font-semibold text-foreground mb-1">Hey! I'm FileLink AI.</h3>
            <p className="text-xs text-muted-foreground max-w-sm mb-6">
              I can help you manage your connected devices, run commands, troubleshoot issues,
              transfer files, and more.
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
            ? "Click ✕ to cancel • Live streaming active..."
            : "Shift+Enter for new line • Enter to send"}
        </p>
      </div>
    </div>
  );
}
