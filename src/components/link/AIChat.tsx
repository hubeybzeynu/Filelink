// AI Chat — streams from POST /api/ai-stream, shows rich result cards (file
// list, tasks table, screenshot, choices, approval) and saves chats so they
// appear under "Recent" in the sidebar / phone drawer.

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2, AlertCircle, Square } from "lucide-react";
import { chatGet, chatSave, type Session, type DeviceInfo } from "@/lib/linkClient";
import type { AIMessage, AITaskStep } from "@/lib/ai/ai.types";
import { isQuestionPayload, type AIUiPayload } from "@/lib/ai/ai.ui";
import { aiChatStore, useAIChatStore } from "@/lib/aiChatStore";
import { AIExecutionCard } from "./AIExecutionCard";
import { AIRichResult } from "./AIRichResult";

interface AIChatProps {
  session: Session;
  devices: DeviceInfo[];
  selectedDevices: string[];
}

type Activity = "idle" | "thinking" | "executing" | "streaming";

const SUGGESTIONS = [
  "Show running tasks on my PC",
  "Take a screenshot of my device",
  "List the files in my Downloads folder",
  "Find a file called report and show where it is",
];

function makeMsg(role: AIMessage["role"], content: string, ui?: AIUiPayload[]): AIMessage {
  return {
    id: crypto.randomUUID(),
    task_id: "",
    role,
    content,
    tool_name: null,
    tool_call: null,
    created_at: new Date().toISOString(),
    ...(ui && ui.length ? { ui } : {}),
  };
}

/** Reads an SSE response body and calls onEvent for each complete event. */
async function readSSE(
  res: Response,
  onEvent: (event: string, data: unknown) => void,
  signal: AbortSignal,
) {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response stream");
  const decoder = new TextDecoder();
  let buf = "";
  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buf.indexOf("\n\n")) !== -1) {
      const block = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      let event = "message";
      const dataLines: string[] = [];
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
      }
      if (!dataLines.length) continue; // keep-alive comment
      try {
        onEvent(event, JSON.parse(dataLines.join("\n")));
      } catch {
        /* ignore a malformed frame */
      }
    }
  }
}

export function AIChat({ session, selectedDevices }: AIChatProps) {
  const store = useAIChatStore();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [activity, setActivity] = useState<Activity>("idle");
  const [thinkingText, setThinkingText] = useState("");
  const [steps, setSteps] = useState<AITaskStep[]>([]);
  const [liveUi, setLiveUi] = useState<AIUiPayload[]>([]);
  const [streaming, setStreaming] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<AIMessage[]>([]);
  const chatIdRef = useRef<string | null>(null);
  messagesRef.current = messages;

  const busy = activity !== "idle";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, steps, liveUi, streaming, thinkingText]);

  // Load the recent-chat list once.
  useEffect(() => {
    void aiChatStore.refresh(session);
  }, [session]);

  // Open a different chat / start a new one when the store says so.
  useEffect(() => {
    if (store.chatId === chatIdRef.current) return;
    abortRef.current?.abort();
    chatIdRef.current = store.chatId;
    setSteps([]);
    setLiveUi([]);
    setStreaming("");
    setActivity("idle");
    setThinkingText("");
    setError("");
    if (!store.chatId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    chatGet(session, store.chatId)
      .then((c) => !cancelled && setMessages(c.messages))
      .catch(() => !cancelled && setError("Couldn't open that chat."));
    return () => {
      cancelled = true;
    };
  }, [store.chatId, session]);

  const nonceRef = useRef(store.resetNonce);
  useEffect(() => {
    if (nonceRef.current === store.resetNonce) return; // initial mount
    nonceRef.current = store.resetNonce;
    abortRef.current?.abort();
    setMessages([]);
    setSteps([]);
    setLiveUi([]);
    setStreaming("");
    setActivity("idle");
    setError("");
    chatIdRef.current = null;
  }, [store.resetNonce]);

  const persist = useCallback(
    async (all: AIMessage[]) => {
      const firstUser = all.find((m) => m.role === "user")?.content ?? "New chat";
      const title = firstUser.replace(/\s+/g, " ").slice(0, 80);
      try {
        const id = await chatSave(session, chatIdRef.current, title, all);
        if (id !== chatIdRef.current) {
          chatIdRef.current = id;
          aiChatStore.adopt(id);
        }
        void aiChatStore.refresh(session);
      } catch {
        /* saving is best-effort */
      }
    },
    [session],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || activity !== "idle") return;
      setInput("");
      setSteps([]);
      setLiveUi([]);
      setStreaming("");
      setError("");

      const history = messagesRef.current;
      const userMsg = makeMsg("user", message);
      const withUser = [...history, userMsg];
      setMessages(withUser);
      setActivity("thinking");
      setThinkingText("Understanding your request…");

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      let currentStep: string | null = null;
      let finished = false;

      const patchStep = (id: string | null, patch: (s: AITaskStep) => AITaskStep) => {
        if (!id) return;
        setSteps((prev) => prev.map((s) => (s.id === id ? patch(s) : s)));
      };

      try {
        const res = await fetch("/api/ai-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: ctrl.signal,
          body: JSON.stringify({
            message,
            deviceId: session.deviceId,
            deviceToken: session.deviceToken,
            selectedDevices,
            conversationHistory: history,
          }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        await readSSE(
          res,
          (event, raw) => {
            const d = raw as Record<string, any>;
            switch (event) {
              case "thinking":
                setActivity("thinking");
                setThinkingText(d.message || "Thinking…");
                break;
              case "tool_start": {
                const id = crypto.randomUUID();
                currentStep = id;
                setActivity("executing");
                setThinkingText(`Running ${d.tool}…`);
                setSteps((prev) => [
                  ...prev,
                  {
                    id,
                    task_id: "",
                    device_id: null,
                    device_name: d.input?.device ? String(d.input.device) : null,
                    type: "command",
                    title: d.tool,
                    status: "running",
                    command: JSON.stringify(d.input, null, 2),
                    working_directory: null,
                    input: d.input,
                    output: "",
                    error: null,
                    diff: null,
                    risk_level: "medium",
                    started_at: d.timestamp,
                    completed_at: null,
                  },
                ]);
                break;
              }
              case "tool_chunk":
                patchStep(currentStep, (s) => ({ ...s, output: (s.output || "") + d.chunk }));
                break;
              case "tool_progress":
                setThinkingText(d.status);
                break;
              case "tool_ui":
                setLiveUi((prev) => [...prev, d.ui as AIUiPayload]);
                break;
              case "tool_result":
                patchStep(currentStep, (s) => ({
                  ...s,
                  status: "success",
                  output: s.output || d.result,
                  completed_at: d.timestamp,
                }));
                currentStep = null;
                break;
              case "tool_error":
                patchStep(currentStep, (s) => ({
                  ...s,
                  status: "error",
                  error: d.error,
                  completed_at: d.timestamp,
                }));
                currentStep = null;
                break;
              case "complete": {
                finished = true;
                const known = new Set(withUser.map((m) => m.id));
                const fresh = ((d.messages as AIMessage[]) ?? []).filter(
                  (m) => m.role === "assistant" && !known.has(m.id),
                );
                const last = fresh[fresh.length - 1];
                const finalMsgs = [...withUser, ...fresh];
                // Cards from this turn now live on the message itself.
                const finish = () => {
                  setMessages(finalMsgs);
                  setStreaming("");
                  setLiveUi([]);
                  setSteps([]);
                  setActivity("idle");
                  setThinkingText("");
                  void persist(finalMsgs);
                };
                if (last?.content) {
                  setActivity("streaming");
                  setThinkingText("");
                  const parts = last.content.split(/(\s+)/);
                  let acc = "";
                  let i = 0;
                  const tick = () => {
                    if (ctrl.signal.aborted) return finish();
                    // ~12 words per frame keeps long answers snappy.
                    for (let n = 0; n < 6 && i < parts.length; n++, i++) acc += parts[i];
                    setStreaming(acc);
                    if (i < parts.length) setTimeout(tick, 18);
                    else finish();
                  };
                  tick();
                } else {
                  finish();
                }
                break;
              }
              case "error":
                finished = true;
                throw new Error(d.message || "An error occurred");
            }
          },
          ctrl.signal,
        );
        if (!finished && !ctrl.signal.aborted) throw new Error("Connection lost before the answer finished.");
      } catch (e) {
        if ((e as Error)?.name === "AbortError" || ctrl.signal.aborted) {
          setActivity("idle");
          setThinkingText("");
          return;
        }
        const msg = e instanceof Error ? e.message : "Something went wrong";
        setActivity("idle");
        setThinkingText("");
        setLiveUi([]);
        setMessages((prev) => [...prev, makeMsg("assistant", `❌ ${msg}`)]);
      }
    },
    [activity, persist, selectedDevices, session],
  );

  const stop = () => {
    abortRef.current?.abort();
    setActivity("idle");
    setThinkingText("");
    setStreaming("");
  };

  const lastIdx = messages.length - 1;

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        {messages.length === 0 && !busy && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Sparkles className="mb-4 size-12 text-primary/40" />
            <h3 className="mb-1 text-base font-semibold">How can I help?</h3>
            <p className="mb-5 max-w-sm text-xs text-muted-foreground">
              I can answer questions, search the web and work on your connected devices. If I’m not
              sure which file or device you mean, I’ll ask.
            </p>
            <div className="grid w-full max-w-md gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="ios-btn rounded-xl border border-border bg-card/60 px-4 py-2.5 text-left text-xs transition-all hover:border-primary/50 hover:bg-card/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {messages.map((msg, i) => {
          if (msg.role === "tool") return null;
          const isUser = msg.role === "user";
          const cards = msg.ui ?? [];
          // Only the latest assistant message's question can still be answered.
          const answerable = i === lastIdx && !busy;
          return (
            <div key={msg.id} className={`flex flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
              {msg.content && (
                <div
                  className={
                    isUser
                      ? "max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground"
                      : "max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm"
                  }
                >
                  {msg.content}
                </div>
              )}
              {cards.map((c, ci) => (
                <div key={ci} className="w-full max-w-xl">
                  <AIRichResult
                    payload={c}
                    interactive={answerable && isQuestionPayload(c)}
                    onAnswer={(t) => void send(t)}
                  />
                </div>
              ))}
            </div>
          );
        })}

        {/* Live tool steps for the turn in progress */}
        {steps.map((s) => (
          <AIExecutionCard key={s.id} step={s} />
        ))}
        {liveUi.map((c, ci) => (
          <div key={`live-${ci}`} className="w-full max-w-xl">
            <AIRichResult payload={c} interactive={false} onAnswer={() => {}} />
          </div>
        ))}

        {busy && thinkingText && (
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            <span>{thinkingText}</span>
          </div>
        )}

        {streaming && (
          <div className="flex justify-start">
            <div className="max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm">
              {streaming}
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="border-t border-border bg-background p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Message FileLink AI…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
            rows={1}
            disabled={busy}
          />
          <button
            onClick={() => (busy ? stop() : void send(input))}
            disabled={!busy && !input.trim()}
            aria-label={busy ? "Stop" : "Send"}
            className="ios-btn flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            {busy ? <Square className="size-4" /> : <Send className="size-4" />}
            <span className="hidden sm:inline">{busy ? "Stop" : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
