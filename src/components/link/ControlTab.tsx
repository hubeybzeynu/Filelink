import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clipboard as ClipboardIcon,
  FileClock,
  Globe,
  Link as LinkIcon,
  Lock,
  LogOut,
  MessageSquareWarning,
  MousePointer2,
  MonitorPlay,
  Moon,
  Power,
  RefreshCw,
  RotateCw,
  Trash2,
  X,
} from "lucide-react";
import {
  sendControl,
  schedulePower,
  listSchedules,
  cancelSchedule,
  type DeviceInfo,
  type Session,
  type PowerSchedule,
} from "@/lib/linkClient";
import { DevicePickerButton, DevicePickerDialog } from "@/components/link/DevicePicker";
import { ClipboardPanel } from "@/components/link/ClipboardPanel";
import { DisplayHub } from "@/components/link/DisplayHub";
import { AuditTrail } from "@/components/link/AuditTrail";
import { PowerModal, type PowerActionSpec } from "@/components/link/control/PowerModal";
import { OpenFileLinkTab } from "@/components/link/OpenFileLinkTab";
import { AlertTab } from "@/components/link/AlertTab";
import { CursorTab } from "@/components/link/CursorTab";
import { addAudit } from "@/lib/audit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Shutdown/Restart open the schedule/confirm modal (they support "now" or a
// specific time). Sleep/Log Out/Lock run the instant they're clicked — no
// modal, no warning, no schedule option.
const POWER_MODAL_ACTIONS = [
  { key: "shutdown", label: "Shutdown", icon: Power, tone: "warning" },
  { key: "restart", label: "Restart", icon: RotateCw, tone: "primary" },
] as const;

const POWER_INSTANT_ACTIONS = [
  { key: "sleep", label: "Sleep", icon: Moon, tone: "accent" },
  { key: "logout", label: "Log Out", icon: LogOut, tone: "warning" },
  { key: "lock", label: "Lock", icon: Lock, tone: "muted" },
] as const;

const POWER_ACTIONS = [...POWER_MODAL_ACTIONS, ...POWER_INSTANT_ACTIONS];

const AGENT_ACTIONS = [
  { key: "restartAgent", label: "Restart Agent", icon: RefreshCw, danger: false },
  { key: "removeAgent", label: "Stop Agent", icon: Trash2, danger: true },
] as const;

const TABS = ["Power", "Agent", "Copy/Paste", "Open/Link", "Alert", "Cursor", "Display", "Audit"] as const;
type ControlTabKey = (typeof TABS)[number];

const TAB_META: Record<ControlTabKey, { label: string; description: string; Icon: React.ElementType }> = {
  Power: { label: "Power", description: "Shutdown, restart, sleep & schedule", Icon: Power },
  Agent: { label: "Agent", description: "Restart, uninstall & DNS settings", Icon: RefreshCw },
  "Copy/Paste": { label: "Copy / Paste", description: "Send clipboard to the target PC", Icon: ClipboardIcon },
  "Open/Link": { label: "Open File / Link", description: "Open a URL, run a path, send & open a file", Icon: LinkIcon },
  Alert: { label: "Alert", description: "Pop up a message or a yes/no question", Icon: MessageSquareWarning },
  Cursor: { label: "Cursor", description: "Move the mouse and click on the target PC", Icon: MousePointer2 },
  Display: { label: "Display", description: "Screen capture & camera", Icon: MonitorPlay },
  Audit: { label: "Audit", description: "History of remote actions", Icon: FileClock },
};

const toneRing: Record<string, string> = {
  warning: "hover:border-warning hover:bg-warning/10",
  primary: "hover:border-primary hover:bg-primary/10",
  accent: "hover:border-accent hover:bg-accent/10",
  muted: "hover:border-foreground hover:bg-cardhover",
};
const toneText: Record<string, string> = {
  warning: "text-warning",
  primary: "text-primary",
  accent: "text-accent",
  muted: "text-muted-foreground",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtLeft(secs: number) {
  const s = Math.max(0, secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${pad(m)}m` : `${pad(m)}:${pad(sec)}`;
}

export function ControlTab({ session, devices }: { session: Session; devices: DeviceInfo[] }) {
  const [targets, setTargets] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [tab, setTab] = useState<ControlTabKey | null>(null);
  const [powerAction, setPowerAction] = useState<PowerActionSpec | null>(null);
  const [schedules, setSchedules] = useState<PowerSchedule[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const onlineDevices = useMemo(
    () => devices.filter((d) => d.online && d.name !== session.deviceName),
    [devices, session.deviceName],
  );

  const target = targets[0] ?? "";
  const selected = devices.find((d) => d.name === target);
  const allSelected = onlineDevices.length > 0 && targets.length === onlineDevices.length;

  useEffect(() => {
    if (tab === null && typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches) {
      setTab("Power");
    }
  }, [tab]);

  useEffect(() => {
    setTargets((t) => t.filter((n) => onlineDevices.some((d) => d.name === n)));
  }, [onlineDevices]);

  // Cloud-persisted schedules: fetched on mount and polled, so an active
  // shutdown/restart timer survives a refresh, a closed tab, or being
  // viewed from a different device entirely.
  async function refreshSchedules() {
    try {
      const { schedules: rows } = await listSchedules(session);
      setSchedules(rows);
    } catch {
      /* transient — next poll retries */
    }
  }
  useEffect(() => {
    void refreshSchedules();
    const id = window.setInterval(refreshSchedules, 5000);
    return () => window.clearInterval(id);
  }, []);

  // Live clock driving every countdown shown outside the modal.
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  function toggleTarget(name: string) {
    setTargets((t) => (t.includes(name) ? t.filter((n) => n !== name) : [...t, name]));
  }
  function toggleSelectAll() {
    setTargets(allSelected ? [] : onlineDevices.map((d) => d.name));
  }

  async function execute(command: string, deviceName: string, extra?: Record<string, unknown>) {
    setBusy(command);
    setNote(null);
    const isPower = POWER_ACTIONS.some((a) => a.key === command) || command === "cancelShutdown";
    try {
      await sendControl(session, deviceName || target, command, extra);
      setNote(`${command} sent to ${deviceName || target}`);
      addAudit(isPower ? "Power" : "System", `${command} sent`, "SUCCESS", deviceName || target);
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
      addAudit(isPower ? "Power" : "System", `${command} failed: ${(e as Error).message}`, "ERROR", deviceName || target);
      throw e;
    } finally {
      setBusy(null);
    }
  }

  /** Run one command across every selected device, ignoring individual failures. */
  async function executeAll(command: string, extra?: Record<string, unknown>) {
    for (const name of targets) {
      try {
        await execute(command, name, extra);
      } catch {
        /* already reported + audited */
      }
    }
  }

  // Any pending cloud schedule matching the action currently open in the
  // modal, restricted to the selected devices — used so re-clicking
  // Shutdown/Restart while a schedule already exists jumps straight to the
  // live countdown instead of the options screen.
  const modalExistingSchedules = useMemo(() => {
    if (!powerAction) return [];
    return schedules.filter((s) => s.action === powerAction.key && targets.includes(s.device_name));
  }, [schedules, powerAction, targets]);

  // Schedules whose timer has already elapsed but we haven't confirmed
  // completion for — shown as a "shutting down now" banner even when the
  // Power tab / modal isn't open, so leaving the tab doesn't hide it.
  const firingNow = useMemo(
    () =>
      schedules.filter((s) => {
        const left = new Date(s.fire_at).getTime() - nowTick;
        return left <= 0 && left > -60_000; // show for ~60s past fire time
      }),
    [schedules, nowTick],
  );

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold leading-tight text-foreground md:text-2xl">Control Center</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            Remote Host Management &amp; Power
          </span>
        </div>
      </div>

      {/* Global "in progress" banner — visible on every sub-tab, not just Power */}
      {firingNow.length > 0 && (
        <div className="flex flex-col gap-2 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
          {firingNow.map((s) => (
            <div key={s.id} className="flex items-center gap-2 text-xs font-semibold text-warning">
              <span className="size-2 shrink-0 animate-pulse rounded-full bg-warning" />
              {s.action === "shutdown" ? "Shutting down" : "Restarting"} {s.device_name}…
            </div>
          ))}
        </div>
      )}

      {/* Multi-device target selector */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <DevicePickerButton
            label={
              targets.length === 0
                ? "Select PCs"
                : targets.length === 1
                  ? targets[0]
                  : `${targets.length} PCs selected`
            }
            onClick={() => setPickerOpen(true)}
          />
          <button
            onClick={toggleSelectAll}
            disabled={!onlineDevices.length}
            className={`ios-btn flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold disabled:opacity-40 ${
              allSelected
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-cardhover text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare className="size-3.5" />
            {allSelected ? "Clear all" : "Select all"}
          </button>
          {targets.length === 1 && selected && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                selected.agent ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"
              }`}
            >
              {selected.agent ? "Background agent" : "In use"}
            </span>
          )}
        </div>

        {onlineDevices.length > 0 && (
          <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {onlineDevices.map((d) => {
              const on = targets.includes(d.name);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleTarget(d.name)}
                  className={`ios-btn flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-cardhover text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {on && <Check className="size-3" />}
                  {d.name}
                </button>
              );
            })}
          </div>
        )}

        {targets.length > 1 && (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">
            Power and agent actions run on all {targets.length} selected PCs. Clipboard and display use{" "}
            <span className="text-foreground">{target}</span>.
          </p>
        )}
      </div>

      {/* Desktop: horizontal tab bar */}
      <div className="no-scrollbar hidden items-center gap-2 overflow-x-auto border-b border-border/60 pb-2 md:flex md:gap-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`ios-btn shrink-0 rounded-xl px-5 py-2.5 text-xs font-semibold md:text-sm ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mobile: list rows into sub-sections */}
      {tab === null && (
        <div className="flex flex-col gap-3 md:hidden">
          {TABS.map((t) => {
            const meta = TAB_META[t];
            const Icon = meta.Icon;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="ios-card-hover ios-btn flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left"
              >
                <div className="grid size-11 place-items-center rounded-2xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-foreground">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">{meta.description}</div>
                </div>
                <ChevronRight className="size-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      )}

      {tab !== null && (
        <div className="flex flex-col gap-4 md:gap-6">
          {/* Back button (mobile) */}
          <button
            onClick={() => setTab(null)}
            className="ios-btn flex w-fit items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground md:hidden"
          >
            <ChevronLeft className="size-4" /> Back
          </button>

          {tab === "Power" && (
            <>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                {POWER_ACTIONS.map((a) => {
                  const isModal = POWER_MODAL_ACTIONS.some((m) => m.key === a.key);
                  const activeSchedule = isModal
                    ? schedules.find((s) => s.action === a.key && targets.includes(s.device_name))
                    : undefined;
                  return (
                    <button
                      key={a.key}
                      disabled={!targets.length}
                      onClick={() => {
                        if (isModal) {
                          setPowerAction({ key: a.key as "shutdown" | "restart", label: a.label, icon: a.icon });
                        } else {
                          void executeAll(a.key);
                        }
                      }}
                      className={`ios-card-hover ios-btn relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 disabled:opacity-40 ${toneRing[a.tone]}`}
                    >
                      {activeSchedule && (
                        <span className="absolute right-2 top-2 rounded-full bg-warning/15 px-2 py-0.5 font-mono text-[10px] font-bold text-warning">
                          {fmtLeft(Math.max(0, Math.floor((new Date(activeSchedule.fire_at).getTime() - nowTick) / 1000)))}
                        </span>
                      )}
                      <a.icon className={`size-8 ${toneText[a.tone]}`} />
                      <span className="text-sm font-bold text-foreground md:text-base">{a.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Time left viewer — replaces the old static instructions box */}
              <div className="rounded-[20px] border border-border bg-card p-6">
                <h3 className="text-sm font-semibold text-foreground md:text-base">Time left</h3>
                {schedules.length === 0 ? (
                  <p className="mt-2 font-mono text-xs text-muted-foreground md:text-sm">
                    No shutdown or restart is currently scheduled.
                  </p>
                ) : (
                  <div className="mt-3 flex flex-col gap-2">
                    {schedules.map((s) => {
                      const secsLeft = Math.max(0, Math.floor((new Date(s.fire_at).getTime() - nowTick) / 1000));
                      const spec = POWER_MODAL_ACTIONS.find((m) => m.key === s.action)!;
                      return (
                        <div
                          key={s.id}
                          className="flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2.5"
                        >
                          <button
                            onClick={() => {
                              setTargets([s.device_name]);
                              setPowerAction({ key: spec.key, label: spec.label, icon: spec.icon });
                            }}
                            className="ios-btn flex flex-1 items-center gap-3 text-left"
                          >
                            <spec.icon className={`size-4 shrink-0 ${toneText[spec.tone]}`} />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-semibold text-foreground">
                                {spec.label} — {s.device_name}
                              </div>
                              <div className="font-mono text-[11px] text-muted-foreground">
                                {secsLeft > 0 ? `${fmtLeft(secsLeft)} left` : "Running now"}
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await cancelSchedule(session, s.id);
                                await sendControl(session, s.device_name, "cancelShutdown");
                                addAudit("Power", `${s.action} schedule cancelled`, "SUCCESS", s.device_name);
                              } catch (e) {
                                addAudit("Power", `Cancel failed: ${(e as Error).message}`, "ERROR", s.device_name);
                              } finally {
                                void refreshSchedules();
                              }
                            }}
                            className="ios-btn grid size-7 shrink-0 place-items-center rounded-full bg-cardhover text-muted-foreground hover:text-destructive"
                            aria-label="Cancel schedule"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "Agent" && (
            <AgentPanel
              busy={busy}
              target={target}
              targetCount={targets.length}
              onRun={(cmd, extra) => executeAll(cmd, extra)}
              onConfirmStop={() => setConfirm("removeAgent")}
            />
          )}

          {tab === "Copy/Paste" && <ClipboardPanel session={session} target={target} />}
          {tab === "Open/Link" && <OpenFileLinkTab session={session} target={target} />}
          {tab === "Alert" && <AlertTab session={session} target={target} />}
          {tab === "Cursor" && <CursorTab session={session} target={target} />}
          {tab === "Display" && <DisplayHub session={session} target={target} onPick={() => setPickerOpen(true)} />}
          {tab === "Audit" && <AuditTrail />}

          {note && (
            <p className="rounded-xl border border-border bg-card p-3 font-mono text-xs text-muted-foreground">
              {note}
            </p>
          )}
        </div>
      )}

      <DevicePickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        devices={devices}
        selected={target}
        onSelect={(name) => setTargets(name ? [name] : [])}
        onlineOnly
        excludeName={session.deviceName}
        multiple={tab !== "Display"}
        selectedNames={targets}
        onToggle={(name) => toggleTarget(name)}
        onSelectAll={() => toggleSelectAll()}
      />

      <PowerModal
        open={!!powerAction}
        action={powerAction}
        devices={targets}
        existingSchedules={modalExistingSchedules}
        onClose={() => setPowerAction(null)}
        onExecuteNow={(device) => execute(powerAction!.key, device, { seconds: 0 })}
        onSchedule={async (fireAtIso) => {
          const secs = Math.max(0, Math.round((new Date(fireAtIso).getTime() - Date.now()) / 1000));
          for (const device of targets) {
            await sendControl(session, device, powerAction!.key, { seconds: secs });
            await schedulePower(session, device, powerAction!.key, fireAtIso);
            addAudit("Power", `${powerAction!.key} scheduled at ${new Date(fireAtIso).toLocaleTimeString()}`, "SUCCESS", device);
          }
          await refreshSchedules();
        }}
        onCancelSchedule={async () => {
          for (const s of modalExistingSchedules) {
            try {
              await cancelSchedule(session, s.id);
              await sendControl(session, s.device_name, "cancelShutdown");
              addAudit("Power", `${s.action} schedule cancelled`, "SUCCESS", s.device_name);
            } catch (e) {
              addAudit("Power", `Cancel failed: ${(e as Error).message}`, "ERROR", s.device_name);
            }
          }
          await refreshSchedules();
        }}
      />

      <Dialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" /> Confirm {confirm}
            </DialogTitle>
            <DialogDescription>
              This will terminate the FileLink agent and remove all agent files from{" "}
              <span className="font-medium text-foreground">
                {targets.length > 1 ? `${targets.length} PCs` : target}
              </span>
              . They will no longer be reachable until the agent is re-installed.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirm(null)}
              className="ios-btn flex-1 rounded-xl border border-border py-2 text-sm text-foreground hover:bg-accent/10"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const c = confirm;
                setConfirm(null);
                void executeAll(c!);
              }}
              className="ios-btn flex-1 rounded-xl bg-destructive py-2 text-sm font-medium text-destructive-foreground"
            >
              Confirm
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function AgentPanel({
  target,
  targetCount,
  busy,
  onRun,
  onConfirmStop,
}: {
  target: string;
  targetCount: number;
  busy: string | null;
  onRun: (cmd: string, extra?: Record<string, unknown>) => Promise<void> | void;
  onConfirmStop: () => void;
}) {

  const [dnsInterface, setDnsInterface] = useState("Ethernet");
  const [primaryDns, setPrimaryDns] = useState("1.1.1.1");
  const [secondaryDns, setSecondaryDns] = useState("1.0.0.1");

  return (
    <div className="rounded-[20px] border border-border bg-card p-6 md:p-8">
      <h3 className="text-lg font-bold text-foreground">Agent Control Module</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage the remote agent runtime, cleanup its files, or reconfigure the network DNS.{" "}
        {targetCount > 1
          ? `Every action below applies to all ${targetCount} selected PCs.`
          : target
            ? `Applies to ${target}.`
            : "Select at least one PC first."}
      </p>


      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {AGENT_ACTIONS.map((a) => (
          <button
            key={a.key}
            disabled={!target || busy === a.key}
            onClick={() => {
              if (a.danger) onConfirmStop();
              else void onRun(a.key);
            }}
            className={`ios-card-hover ios-btn flex items-center gap-3 rounded-2xl border border-border p-5 text-left disabled:opacity-40 ${
              a.danger ? "bg-destructive/10 hover:border-destructive/40" : "bg-cardhover"
            }`}
          >
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                a.danger ? "bg-destructive/20 text-destructive" : "bg-primary/15 text-primary"
              }`}
            >
              <a.icon className="size-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-foreground">
                {busy === a.key ? "…" : a.label}
              </span>
              <span className="block text-[11px] text-muted-foreground">
                {a.danger ? "Kill process & remove files" : "Restart filelink.mjs runner"}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-cardhover/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
            <Globe className="size-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">DNS Settings</h4>
            <p className="text-[11px] text-muted-foreground">View or change the DNS servers on the target PC.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input label="Interface" value={dnsInterface} onChange={setDnsInterface} placeholder="Ethernet" />
          <Input label="Primary DNS" value={primaryDns} onChange={setPrimaryDns} placeholder="1.1.1.1" />
          <Input label="Secondary DNS" value={secondaryDns} onChange={setSecondaryDns} placeholder="1.0.0.1" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={!target || busy === "setDns"}
            onClick={() =>
              void onRun("setDns", {
                interface: dnsInterface,
                servers: [primaryDns, secondaryDns].filter(Boolean),
              })
            }
            className="ios-btn rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
          >
            Apply DNS
          </button>
          <button
            disabled={!target || busy === "resetDns"}
            onClick={() => void onRun("resetDns", { interface: dnsInterface })}
            className="ios-btn rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
          >
            Reset to DHCP
          </button>
          <button
            disabled={!target || busy === "flushDns"}
            onClick={() => void onRun("flushDns")}
            className="ios-btn rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
          >
            Flush DNS Cache
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
