import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Monitor,
  Search,
  Skull,
} from "lucide-react";
import { PasswordDialog } from "@/components/link/PasswordDialog";
import { DevicePickerDialog } from "@/components/link/DevicePicker";
import {
  humanSize,
  remoteExecStart,
  remoteExecStatus,
  remoteTasklist,
  type DeviceInfo,
  type Session,
} from "@/lib/linkClient";
import { isUnlocked } from "@/lib/lock";

type RawProcess = {
  pid: string;
  name: string;
  ram: number;
  cpu: number;
  disk?: number;
  network?: number;
  gpu?: number;
  status?: string;
  icon?: string;
};

type Process = RawProcess & {
  disk: number;
  network: number;
  gpu: number;
  children?: Process[];
};



const SYSTEM_NAMES = [
  "system idle process",
  "system",
  "registry",
  "smss.exe",
  "csrss.exe",
  "wininit.exe",
  "services.exe",
  "lsass.exe",
  "svchost.exe",
  "fontdrvhost.exe",
  "wudfhost.exe",
];

function isBackground(p: Process) {
  const lower = p.name.toLowerCase();
  return SYSTEM_NAMES.some((s) => lower.includes(s)) || (p.cpu < 0.5 && p.ram < 10 * 1024 * 1024);
}

function isApp(p: Process) {
  return !isBackground(p);
}

function ProcessIcon({ proc }: { proc: Process }) {
  if (proc.icon) {
    return (
      <img
        src={proc.icon}
        alt=""
        className="size-6 rounded-md object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }
  return (
    <div className="grid size-6 place-items-center rounded-md border border-border bg-cardhover">
      <Monitor className="size-3.5 text-muted-foreground" />
    </div>
  );
}

export function TasksTab({ session, devices }: { session: Session; devices: DeviceInfo[] }) {
  const [target, setTarget] = useState<string>("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [pendingKill, setPendingKill] = useState<{ pid: string; name: string } | null>(null);
  const [filter, setFilter] = useState<"all" | "apps" | "background">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [dontAskEnd, setDontAskEnd] = useState(false);
  const [dontAskEndSession, setDontAskEndSession] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);

  const onlineTargets = devices.filter((d) => d.online && d.name !== session.deviceName);
  const selected = devices.find((d) => d.name === target);

  /** Press-and-hold (~450ms) on any row turns on multi-select, iOS style. */
  function holdHandlers(pid: string) {
    const start = () => {
      held.current = false;
      holdTimer.current = window.setTimeout(() => {
        held.current = true;
        setSelectMode(true);
        setPicked((p) => new Set(p).add(pid));
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
      }, 450);
    };
    const cancel = () => {
      if (holdTimer.current) window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    };
    return {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
      onClick: () => {
        if (held.current) {
          held.current = false;
          return;
        }
        if (selectMode) togglePick(pid);
      },
    };
  }

  function togglePick(pid: string) {
    setPicked((p) => {
      const next = new Set(p);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setPicked(new Set());
  }

  async function killPicked() {
    const pids = Array.from(picked);
    setBulkConfirm(false);
    setBulkProgress({ done: 0, total: pids.length });
    for (let i = 0; i < pids.length; i++) {
      try {
        await doKill(pids[i]);
      } catch {
        /* keep going through the rest of the selection */
      }
      setBulkProgress({ done: i + 1, total: pids.length });
    }
    setBulkProgress(null);
    exitSelectMode();
  }


  const load = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    try {
      const r = await remoteTasklist(session, target);
      setProcesses(
        (r.processes ?? []).map((p) => ({
          ...p,
          disk: p.disk ?? 0,
          network: p.network ?? 0,
          gpu: p.gpu ?? 0,
        })),
      );
    } catch (e) {
      setProcesses([]);
    }
    setLoading(false);
  }, [session, target]);


  useEffect(() => {
    void load();
  }, [load]);

  async function kill(pid: string, name: string) {
    if (!isUnlocked()) {
      setPendingKill({ pid, name });
      setLockReason("Enter the passcode to end a process on a remote PC.");
      return;
    }
    if (dontAskEndSession) {
      await doKill(pid);
      return;
    }
    setPendingKill({ pid, name });
  }

  async function doKill(pid: string) {
    if (!target) return;
    const { callId } = await remoteExecStart(session, target, `taskkill /pid ${pid} /f`);
    for (let i = 0; i < 30; i++) {
      const s = await remoteExecStatus(session, callId);
      if (s.status === "done" || s.status === "error") break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await load();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, { parent: Process; children: Process[] }>();
    for (const p of processes) {
      const root = p.name.toLowerCase();
      const existing = map.get(root);
      if (existing) {
        existing.children.push(p);
      } else {
        map.set(root, { parent: p, children: [] });
      }
    }
    return Array.from(map.values())
      .map((g) => {
        const total = g.children.reduce(
          (acc, c) => ({
            ram: acc.ram + c.ram,
            cpu: acc.cpu + c.cpu,
            disk: acc.disk + c.disk,
            network: acc.network + c.network,
            gpu: acc.gpu + c.gpu,
          }),
          { ram: g.parent.ram, cpu: g.parent.cpu, disk: g.parent.disk, network: g.parent.network, gpu: g.parent.gpu },
        );
        return {
          ...g.parent,
          ...total,
          children: g.children,
        };
      })
      .filter((g) => {
        if (filter === "apps") return isApp(g);
        if (filter === "background") return isBackground(g);
        return true;
      })
      .filter((g) => !search.trim() || g.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [processes, filter, search]);

  function toggleExpand(name: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Target selection */}
      <div className="rounded-[20px] border border-border bg-card p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Target PC Processes</h3>
            <p className="text-xs text-muted-foreground">
              Select a host to view, search, and manage its running tasks.
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            disabled={onlineTargets.length === 0}
            className="ios-btn flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:brightness-110 disabled:opacity-40"
          >
            <Monitor className="size-4" /> Select Device
          </button>
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search processes by name..."
              className="w-full rounded-xl border border-border bg-cardhover py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={() => void load()}
            disabled={!target || loading}
            className="ios-btn flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-sm font-semibold text-foreground hover:text-primary disabled:opacity-40 sm:w-auto"
          >
            <Activity className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {selected && (
          <div className="mt-3 flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                selected.agent ? "bg-warning/15 text-warning" : "bg-primary/15 text-primary"
              }`}
            >
              {selected.agent ? "Background mode" : "In use"}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {processes.length} process{processes.length !== 1 ? "es" : ""}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(["all", "apps", "background"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`ios-btn rounded-xl px-4 py-2 text-xs font-semibold capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* hold-to-multiselect bar */}
      {target && !selectMode && (
        <p className="font-mono text-[11px] text-muted-foreground">
          Tip: press and hold a row to select several processes at once.
        </p>
      )}
      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 p-3">
          <span className="min-w-0 flex-1 font-mono text-xs text-foreground">
            {bulkProgress
              ? `Ending ${bulkProgress.done} of ${bulkProgress.total}…`
              : `${picked.size} process${picked.size !== 1 ? "es" : ""} selected`}
          </span>
          <button
            onClick={() => setPicked(new Set(grouped.map((g) => g.pid)))}
            className="ios-btn rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-foreground"
          >
            Select all
          </button>
          <button
            disabled={!picked.size || !!bulkProgress}
            onClick={() => setBulkConfirm(true)}
            className="ios-btn flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-1.5 text-[11px] font-bold text-destructive-foreground disabled:opacity-40"
          >
            <Skull className="size-3.5" /> End selected
          </button>
          <button
            onClick={exitSelectMode}
            className="ios-btn grid size-7 place-items-center rounded-full bg-border/60 text-muted-foreground"
            aria-label="Exit selection"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}



      {!target && (
        <div className="grid flex-1 place-items-center rounded-[20px] border border-border bg-card p-6 text-center text-muted-foreground">
          <div>
            <Activity className="mx-auto size-8 opacity-50" />
            <p className="mt-2 text-sm">Choose an online device to view its processes.</p>
          </div>
        </div>
      )}

      {target && (
        <div className="min-h-0 flex-1 overflow-auto rounded-[20px] border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-card text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Process</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">CPU</th>
                <th className="px-4 py-3">Memory</th>
                <th className="px-4 py-3">Disk</th>
                <th className="px-4 py-3">Network</th>
                <th className="px-4 py-3">GPU</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono text-xs">
              {grouped.map((g) => {
                const open = expanded.has(g.name);
                const hasChildren = (g.children?.length ?? 0) > 0;
                const on = picked.has(g.pid);
                return (
                  <>
                    <tr
                      key={g.name}
                      {...holdHandlers(g.pid)}
                      className={`select-none hover:bg-cardhover/50 ${on ? "bg-primary/10" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {selectMode && (
                            <span
                              className={`grid size-5 shrink-0 place-items-center rounded-md border text-[10px] ${
                                on
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                          )}
                          {hasChildren ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(g.name);
                              }}
                              className="grid size-5 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                            >
                              {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            </button>
                          ) : (
                            <span className="size-5" />
                          )}
                          <ProcessIcon proc={g} />
                          <span className="truncate text-foreground">
                            {g.name}
                            {hasChildren && (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">({g.children!.length})</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{g.status || "Running"}</td>
                      <td className="px-4 py-3">{g.cpu.toFixed(1)}%</td>
                      <td className="px-4 py-3">{humanSize(g.ram)}</td>
                      <td className="px-4 py-3">{g.disk > 0 ? `${g.disk.toFixed(1)} MB/s` : "—"}</td>
                      <td className="px-4 py-3">{g.network > 0 ? `${g.network.toFixed(1)} Mbps` : "—"}</td>
                      <td className="px-4 py-3">{g.gpu > 0 ? `${g.gpu.toFixed(1)}%` : "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          disabled={selectMode}
                          onClick={(e) => {
                            e.stopPropagation();
                            void kill(g.pid, g.name);
                          }}
                          className="ios-btn inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-3 py-1.5 text-white shadow-md shadow-sky-500/25 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-sky-500/40 disabled:opacity-40"
                        >
                          <Skull className="size-3" /> End Task
                        </button>
                      </td>
                    </tr>
                    {open &&
                      g.children?.map((c) => {
                        const childOn = picked.has(c.pid);
                        return (
                          <tr
                            key={`${g.name}-${c.pid}`}
                            {...holdHandlers(c.pid)}
                            className={`select-none bg-cardhover/30 ${childOn ? "bg-primary/10" : ""}`}
                          >
                            <td className="px-4 py-2 pl-11">
                              <div className="flex items-center gap-2">
                                {selectMode && (
                                  <span
                                    className={`grid size-5 shrink-0 place-items-center rounded-md border text-[10px] ${
                                      childOn
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-border text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                )}
                                <ProcessIcon proc={c} />
                                <span className="text-muted-foreground">
                                  {c.name} <span className="text-[10px]">PID {c.pid}</span>
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-muted-foreground">{c.status || "Running"}</td>
                            <td className="px-4 py-2">{c.cpu.toFixed(1)}%</td>
                            <td className="px-4 py-2">{humanSize(c.ram)}</td>
                            <td className="px-4 py-2">{c.disk > 0 ? `${c.disk.toFixed(1)} MB/s` : "—"}</td>
                            <td className="px-4 py-2">{c.network > 0 ? `${c.network.toFixed(1)} Mbps` : "—"}</td>
                            <td className="px-4 py-2">{c.gpu > 0 ? `${c.gpu.toFixed(1)}%` : "—"}</td>
                            <td className="px-4 py-2 text-right">
                              <button
                                disabled={selectMode}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void kill(c.pid, c.name);
                                }}
                                className="ios-btn inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-2.5 py-1 text-[10px] text-white shadow-md shadow-sky-500/25 transition-all hover:brightness-110 disabled:opacity-40"
                              >
                                <Skull className="size-3" /> End
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </>
                );

              })}
              {grouped.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No processes found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {bulkConfirm && (
        <div className="fixed inset-0 z-[115] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <h3 className="text-base font-bold">End {picked.size} processes?</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              These processes will be force-killed on{" "}
              <span className="font-semibold text-foreground">{target}</span>. Unsaved work in those apps
              will be lost.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setBulkConfirm(false)}
                className="ios-btn flex-1 rounded-2xl border border-border py-2.5 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => void killPicked()}
                className="ios-btn flex-1 rounded-2xl bg-destructive py-2.5 text-sm font-bold text-destructive-foreground"
              >
                End tasks
              </button>
            </div>
          </div>
        </div>
      )}

      <PasswordDialog

        open={!!lockReason}
        onOpenChange={(v) => {
          if (!v) {
            setLockReason(null);
            setPendingKill(null);
          }
        }}
        reason={lockReason ?? ""}
        onUnlocked={() => {
          setLockReason(null);
          if (pendingKill) {
            void doKill(pendingKill.pid);
            setPendingKill(null);
          }
        }}
      />

      {/* Add More modal */}
      <DevicePickerDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        devices={devices}
        selected={target}
        onSelect={(name) => setTarget(name)}
        onlineOnly
        excludeName={session.deviceName}
      />

      {/* Kill confirmation modal */}
      {pendingKill && !lockReason && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/80 p-4 backdrop-blur-md">
          <div className="animate-ios-rise w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              <h3 className="text-base font-bold">End Task?</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Are you sure to end <span className="font-semibold text-foreground">{pendingKill.name}</span> on{" "}
              <span className="text-primary">{target}</span>?
            </p>
            <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-cardhover/60 p-3">
              <span
                className={`grid size-5 place-items-center rounded-md border transition-colors ${
                  dontAskEnd ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                }`}
              >
                {dontAskEnd && (
                  <svg viewBox="0 0 20 20" className="size-3.5" fill="currentColor" aria-hidden>
                    <path d="M7.5 13.5 4 10l1.4-1.4 2.1 2.1 5.1-5.1L14 7z" />
                  </svg>
                )}
              </span>
              <input
                type="checkbox"
                className="sr-only"
                checked={dontAskEnd}
                onChange={(e) => setDontAskEnd(e.target.checked)}
              />
              <span className="text-xs font-medium text-foreground">Don't ask me again for this session</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setPendingKill(null);
                  setDontAskEnd(false);
                }}
                className="ios-btn flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const p = pendingKill;
                  if (dontAskEnd) setDontAskEndSession(true);
                  setPendingKill(null);
                  setDontAskEnd(false);
                  void doKill(p.pid);
                }}
                className="ios-btn flex-1 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-all hover:brightness-110"
              >
                End Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
