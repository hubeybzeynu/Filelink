// Single source of truth for what each plan tier is allowed to do.
// This mirrors the plan matrix shown in PricingDialog.tsx exactly — if you
// change one, change the other, or the dashboard will advertise features
// the server actually refuses (or vice versa).
//
// IMPORTANT: this file only answers "is X allowed for tier Y". It does NOT
// by itself stop anyone from being on tier Y for free — `setTier` in
// link.server.ts has no payment processor wired in yet, so right now
// anyone can self-assign any tier via the API. The checks here close the
// "modified/cracked client" hole (a client can't ask the server for
// something its account's tier doesn't allow, no matter what it sends) —
// they do NOT close the "anyone can just call setTier(extended)" hole.
// That needs a real payment gate (Stripe/etc.) in front of `setTier`
// before these limits mean anything commercially.

export type Tier = "free" | "pro" | "extended";

export const TIER_LIMITS: Record<
  Tier,
  {
    maxRooms: number;
    maxDevicesPerRoom: number;
    maxStorageBytesPerRoom: number;
    maxFileBytes: number;
    auditRetentionDays: number | null; // null = unlimited
  }
> = {
  free: {
    maxRooms: 3,
    maxDevicesPerRoom: 30,
    maxStorageBytesPerRoom: 1 * 1024 ** 3,
    maxFileBytes: 500 * 1024 ** 2,
    auditRetentionDays: 0, // audit trail isn't included at all on Free
  },
  pro: {
    maxRooms: 30,
    maxDevicesPerRoom: 100,
    maxStorageBytesPerRoom: 50 * 1024 ** 3,
    maxFileBytes: 5 * 1024 ** 3,
    auditRetentionDays: 7,
  },
  extended: {
    maxRooms: Infinity,
    maxDevicesPerRoom: Infinity,
    maxStorageBytesPerRoom: 500 * 1024 ** 3,
    maxFileBytes: 20 * 1024 ** 3,
    auditRetentionDays: null,
  },
};

/** Control Center commands (the `control` rpc method's `params.command`) that
 * are blocked entirely below a tier. Free only gets Agent connect +
 * clipboard; power/alert/DNS/cursor are not in that list at all. */
const FREE_BLOCKED_CONTROL_COMMANDS = new Set([
  "shutdown",
  "restart",
  "sleep",
  "logout",
  "lock",
  "screenLock",
  "cancelShutdown",
  "alert",
  "flushDns",
  "getDns",
  "setDns",
  "resetDns",
  "stopAgent",
  "removeAgent",
  "restartAgent",
]);

/** Cursor/screen remote-control and raw keyboard injection — "UI
 * automation" — is Extended-only. */
const EXTENDED_ONLY_CONTROL_COMMANDS = new Set([
  "cursorInfo",
  "cursorMove",
  "cursorClick",
  "cursorScroll",
  "keyboardType",
  "keyboardShortcut",
]);

/** Scheduling a power action (vs running it now) is Extended-only. */
export function canSchedulePower(tier: Tier): boolean {
  return tier === "extended";
}

export function controlCommandAllowed(tier: Tier, command: string): { allowed: boolean; reason?: string } {
  if (tier === "free" && FREE_BLOCKED_CONTROL_COMMANDS.has(command)) {
    return { allowed: false, reason: "Upgrade to Pro to use power actions and alerts" };
  }
  if (tier !== "extended" && EXTENDED_ONLY_CONTROL_COMMANDS.has(command)) {
    return { allowed: false, reason: "Upgrade to Extended for cursor & screen control" };
  }
  return { allowed: true };
}

/** Display Hub (screenshot / camera). Free: not included. Pro: live preview
 * only. Extended: preview + recording + saving the capture to cloud storage. */
export type DisplayHubCapability = "none" | "preview" | "recording";
export function displayHubCapability(tier: Tier): DisplayHubCapability {
  if (tier === "free") return "none";
  if (tier === "pro") return "preview";
  return "recording";
}

/** Terminal access. Free: cmd.exe only, no admin. Pro: cmd.exe, admin mode
 * allowed. Extended: admin mode + choice of shell. */
export type Shell = "cmd" | "powershell" | "node" | "python";
export function allowedShells(tier: Tier): Shell[] {
  return tier === "extended" ? ["cmd", "powershell", "node", "python"] : ["cmd"];
}
export function adminTerminalAllowed(tier: Tier): boolean {
  return tier !== "free";
}

/** Task Manager: Free can only look; ending a task needs Pro+. */
export function canEndTask(tier: Tier): boolean {
  return tier !== "free";
}

/** Device Browsing: Free is view-only; Pro+ can copy/send/bundle; Extended
 * additionally allows destructive ops (delete/cut/rename). */
export function canEditFiles(tier: Tier): boolean {
  return tier !== "free";
}
export function canDeleteOrRenameFiles(tier: Tier): boolean {
  return tier === "extended";
}
