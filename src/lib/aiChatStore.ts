// Tiny shared store for "which AI chat is open" + "recent chats".
// The AI tab, the desktop sidebar and the phone drawer all read from it, so
// picking a recent chat in the drawer opens it in the AI tab.

import { useSyncExternalStore } from "react";
import { chatDelete, chatList, type ChatSummary, type Session } from "./linkClient";

type State = {
  /** Open chat id; null = a fresh, unsaved chat. */
  chatId: string | null;
  /** Bumped every time "New chat" is pressed so AIChat resets even if chatId was already null. */
  resetNonce: number;
  recent: ChatSummary[];
  loading: boolean;
};

let state: State = { chatId: null, resetNonce: 0, recent: [], loading: false };
const listeners = new Set<() => void>();

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useAIChatStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export const aiChatStore = {
  get: () => state,
  openChat: (chatId: string) => set({ chatId }),
  /** Used by AIChat after the first save gives a new chat its id (no reload). */
  adopt: (chatId: string) => set({ chatId }),
  newChat: () => set({ chatId: null, resetNonce: state.resetNonce + 1 }),
  async refresh(session: Session) {
    set({ loading: true });
    try {
      set({ recent: await chatList(session), loading: false });
    } catch {
      set({ loading: false });
    }
  },
  async remove(session: Session, chatId: string) {
    await chatDelete(session, chatId);
    if (state.chatId === chatId) set({ chatId: null, resetNonce: state.resetNonce + 1 });
    await aiChatStore.refresh(session);
  },
};
