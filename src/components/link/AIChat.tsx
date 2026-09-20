// AI Chat Component - Main conversational interface for FileLink AI
// Handles message sending, streaming, live execution cards, and conversation history

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";
import type { Session, DeviceInfo } from "@/lib/linkClient";
import type { AIMessage, AITaskStep } from "@/lib/ai/ai.types";
import { AIExecutionCard } from "./AIExecutionCard";

interface AIChatProps {
  session: Session;
  devices: DeviceInfo[];
  selectedDevices: string[];
}

export function AIChat({ session, devices, selectedDevices }: AIChatProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<AITaskStep[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, executionSteps]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    if (selectedDevices.length === 0) {
      alert("Please select at least one target device.");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          message: userMessage,
          session: {
            deviceId: session.deviceId,
            deviceToken: session.deviceToken,
          },
          conversationHistory: messages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "AI request failed");
      }

      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("AI Error:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Control, inspect, and manage your connected PCs.
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="size-12 mb-4 text-primary/40" />
            <h3 className="text-base font-semibold text-foreground mb-1">What can I help with?</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Ask me to inspect your PCs, diagnose errors, fix builds, create files, or manage your
              devices.
            </p>

            <div className="mt-6 grid gap-2 w-full max-w-md">
              {[
                "Check why my build is failing",
                "Find the largest files",
                "Create a presentation about this project",
                "Install missing dependencies",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  className="ios-btn rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs text-left hover:bg-cardhover transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.role === "tool") return null; // Tool results are internal

          return (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs ${
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

        {/* Execution Steps */}
        {executionSteps.length > 0 && (
          <div className="space-y-2">
            {executionSteps.map((step) => (
              <AIExecutionCard key={step.id} step={step} />
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-border bg-card/80 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                </div>
                <span>Thinking...</span>
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
            placeholder="Ask FileLink AI to inspect or manage your PCs..."
            disabled={loading}
            rows={1}
            className="ios-btn flex-1 resize-none rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs outline-none focus:border-primary disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="ios-btn grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
