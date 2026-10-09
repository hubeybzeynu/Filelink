// Recent AI chats list — used by the desktop sidebar and the phone drawer.

import { MessageSquare, Plus, Trash2 } from "lucide-react";
import type { Session } from "@/lib/linkClient";
import { aiChatStore, useAIChatStore } from "@/lib/aiChatStore";

export function RecentChats({
  session,
  onPicked,
  limit = 20,
}: {
  session: Session;
  /** Called after a chat is opened / created (e.g. to close the drawer). */
  onPicked?: () => void;
  limit?: number;
}) {
  const { recent, chatId, loading } = useAIChatStore();

  return (
    <div className="space-y-1">
      <button
        onClick={() => {
          aiChatStore.newChat();
          onPicked?.();
        }}
        className="ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-foreground hover:bg-cardhover"
      >
        <span className="grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
          <Plus className="size-3.5" />
        </span>
        New chat
      </button>

      <p className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Recents
      </p>
      {recent.length === 0 && (
        <p className="px-4 py-2 text-xs text-muted-foreground">
          {loading ? "Loading…" : "No chats yet — your conversations will show up here."}
        </p>
      )}
      {recent.slice(0, limit).map((c) => (
        <div
          key={c.id}
          className={`group flex items-center rounded-xl ${
            chatId === c.id ? "bg-cardhover" : "hover:bg-cardhover/70"
          }`}
        >
          <button
            onClick={() => {
              aiChatStore.openChat(c.id);
              onPicked?.();
            }}
            className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2 text-left"
          >
            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm">{c.title || "Untitled chat"}</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm("Delete this chat?")) void aiChatStore.remove(session, c.id);
            }}
            aria-label="Delete chat"
            className="mr-2 grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground opacity-100 hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
