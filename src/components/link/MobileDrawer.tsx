// Phone navigation drawer, modelled on the Claude mobile app:
//  - hamburger opens a left drawer
//  - inside the AI section: New chat + Recents first, and a "Sections" row
//    with a down-arrow that reveals the other sections
//  - everywhere else: every section is listed
//  - account + plan pinned to the bottom

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Crown,
  LogOut,
  MonitorSmartphone,
  SendHorizontal,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Session, UserSession } from "@/lib/linkClient";
import { RecentChats } from "./RecentChats";

export type DrawerNavItem<K extends string = string> = {
  key: K;
  label: string;
  Icon: LucideIcon;
  badge?: number;
};

export function MobileDrawer<K extends string>({
  open,
  onClose,
  items,
  active,
  onSelect,
  session,
  user,
  onAddDevice,
  onPlan,
  onExit,
}: {
  open: boolean;
  onClose: () => void;
  items: DrawerNavItem<K>[];
  active: K;
  onSelect: (key: K) => void;
  session: Session;
  user: UserSession;
  onAddDevice: () => void;
  onPlan: () => void;
  onExit: () => void;
}) {
  const inAI = active === ("ai" as K);
  const [moreOpen, setMoreOpen] = useState(false);

  // Collapse the section list again whenever the drawer closes.
  useEffect(() => {
    if (!open) setMoreOpen(false);
  }, [open]);

  // Lock page scroll behind the drawer.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const pick = (k: K) => {
    onSelect(k);
    onClose();
  };

  const row = (it: DrawerNavItem<K>) => (
    <button
      key={it.key}
      onClick={() => pick(it.key)}
      className={`ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
        active === it.key
          ? "bg-primary/15 text-primary"
          : "text-foreground hover:bg-cardhover"
      }`}
    >
      <it.Icon className="size-[18px]" />
      {it.label}
      {!!it.badge && (
        <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 font-mono text-[10px] text-primary">
          {it.badge}
        </span>
      )}
    </button>
  );

  const initial = (user.username || "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={`fixed inset-0 z-50 md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Menu"
        className={`absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col border-r border-border bg-card pt-[env(safe-area-inset-top)] shadow-2xl transition-transform duration-250 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex shrink-0 items-center gap-3 px-4 py-3">
          <div className="grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/20 text-primary">
            <SendHorizontal className="size-4" />
          </div>
          <h3 className="flex-1 text-lg font-bold tracking-tight">FileLink</h3>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="ios-btn grid size-9 place-items-center rounded-xl text-muted-foreground hover:bg-cardhover"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="no-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {inAI ? (
            <>
              <RecentChats session={session} onPicked={onClose} />
              <div className="my-2 border-t border-border/60" />
              <button
                onClick={() => setMoreOpen((v) => !v)}
                aria-expanded={moreOpen}
                className="ios-btn flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-cardhover"
              >
                Sections
                <ChevronDown
                  className={`size-4 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>
              {moreOpen && items.map(row)}
            </>
          ) : (
            <>
              {items.map(row)}
              <button
                onClick={() => {
                  onAddDevice();
                  onClose();
                }}
                className="ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-cardhover"
              >
                <MonitorSmartphone className="size-[18px]" /> Add PC Target
              </button>
            </>
          )}
        </nav>

        {/* Account + plan, pinned to the bottom */}
        <div className="shrink-0 space-y-2 border-t border-border/60 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => {
              onPlan();
              onClose();
            }}
            className="ios-btn flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-cardhover"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{user.username}</span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Crown className="size-3 text-primary" /> {user.tierLabel} plan
              </span>
            </span>
          </button>
          <button
            onClick={onExit}
            className="ios-btn flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 py-2 text-xs font-semibold text-destructive"
          >
            <LogOut className="size-4" /> Exit room
          </button>
        </div>
      </aside>
    </div>
  );
}
