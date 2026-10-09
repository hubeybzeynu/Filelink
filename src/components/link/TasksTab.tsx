import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Monitor,
  Search,
  Skull,
  X,
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
import {
  CATEGORY_LABELS,
  classifyProcesses,
  type ProcessCategory,
  type ProcessGroup,
  type RawProcess,
} from "@/lib/processGroups";

type Process = RawProcess & {
  disk: number;
  network: number;
  gpu: number;
};

type Row = {
  key: string;
  depth: 0 | 1 | 2;
  name: string;
  sub?: string;
  icon?: string;
  pids: string[];
  cpu: number;
  ram: number;
  disk: number;
  network: number;
  gpu: number;
  status?: string;
  /** Has rows underneath that can be expanded. */
  expandable: boolean;
  /** Section header row. */
  header?: ProcessCategory;
  count?: number;
};

function ProcessIcon({ icon }: { icon?: string }) {
  if (icon) {
    return (
      <img
        src={icon}
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

const sum = (ps: RawProcess[], k: "disk" | "network" | "gpu") =>
  ps.reduce((a, p) => a + (p[k] ?? 0), 0);

function procRow(p: RawProcess, depth: 1 | 2, label?: string): Row {
  return {
    key: `p:${p.pid}`,
    depth,
    name: label ?? p.name,
    sub: `${p.role ? `${p.role} · ` : ""}PID ${p.pid}`,
    icon: p.icon,
    pids: [p.pid],
    cpu: p.cpu ?? 0,
    ram: p.ram ?? 0,
    disk: p.disk ?? 0,
    network: p.network ?? 0,
    gpu: p.gpu ?? 0,
    status: p.status,
    expandable: false,
  };
}

export function TasksTab({ session, devices }: { session: Session; devices: DeviceInfo[] }) {
  const [target, setTarget] = useState<string>("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [pendingKill, setPendingKill] = useState<{ pids: string[]; name: string } | null>(null);
  const [filter, setFilter] = useState<"all" | ProcessCategory>("all");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
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
  function holdHandlers(pids: string[]) {
    const start = () => {
      held.current = false;
      holdTimer.current = window.setTimeout(() => {
        held.current = true;
        setSelectMode(true);
        setPicked((p) => new Set([...p, ...pids]));
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
        if (selectMode) togglePick(pids);
      },
    };
  }

  function togglePick(pids: string[]) {
    setPicked((p) => {
      const next = new Set(p);
      const allOn = pids.every((x) => next.has(x));
      for (const x of pids) {
        if (allOn) next.delete(x);
        else next.add(x);
      }
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
    try {
      await doKillMany(pids);
    } catch {
      /* the refresh below shows what is still running */
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

  async function kill(pids: string[], name: string) {
    if (!isUnlocked()) {
      setPendingKill({ pids, name });
      setLockReason("Enter the passcode to end a process on a remote PC.");
      return;
    }
    if (dontAskEndSession) {
      await doKillMany(pids);
      return;
    }
    setPendingKill({ pids, name });
  }

  async function doKillMany(pids: string[]) {
    if (!target || pids.length === 0) return;
    const { callId } = await remoteExecStart(
      session,
      target,
      pids.map((pid) => `taskkill /pid ${pid} /f`).join(" & "),
    );
    for (let i = 0; i < 40; i++) {
      const st = await remoteExecStatus(session, callId);
      if (st.status === "done" || st.status === "error") break;
      await new Promise((r) => setTimeout(r, 300));
    }
    await load();
  }

  async function doKill(pid: string) {
    await doKillMany([pid]);
  }

  const rows = useMemo<Row[]>(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? processes.filter(
          (p) => p.name.toLowerCase().includes(q) || (p.windowTitle ?? "").toLowerCase().includes(q),
        )
      : processes;
    const c = classifyProcesses(list);
    const out: Row[] = [];

    const groupRows = (g: ProcessGroup): Row[] => {
      const res: Row[] = [
        {
          key: `g:${g.key}`,
          depth: 0,
          name: g.label,
          sub: g.windowTitle,
          icon: g.icon,
          pids: g.processes.map((p) => p.pid),
          cpu: g.cpu,
          ram: g.ram,
          disk: g.disk,
          network: g.network,
          gpu: g.gpu,
          status: g.processes[0]?.status,
          expandable: g.count > 1,
          count: g.count,
        },
      ];
      if (g.count > 1 && expanded.has(`g:${g.key}`)) {
        for (const p of g.processes) res.push(procRow(p, 1));
      }
      return res;
    };

    const sections: ProcessCategory[] = ["apps", "browsers", "windows", "background"];
    for (const cat of sections) {
      if (filter !== "all" && filter !== cat) continue;
      const count = c[cat].length;
      if (count === 0) continue;
      out.push({
        key: `h:${cat}`,
        depth: 0,
        name: CATEGORY_LABELS[cat],
        pids: [],
        cpu: 0,
        ram: 0,
        disk: 0,
        network: 0,
        gpu: 0,
        expandable: false,
        header: cat,
        count,
      });
      if (collapsedSections.has(cat)) continue;

      if (cat === "browsers") {
        for (const b of c.browsers) {
          const bKey = `b:${b.key}`;
          const allPids = b.profiles.flatMap((pr) => pr.processes.map((p) => p.pid));
          out.push({
            key: bKey,
            depth: 0,
            name: b.label,
            sub: `${b.profiles.length} profile${b.profiles.length === 1 ? "" : "s"}`,
            icon: b.icon,
            pids: allPids,
            cpu: b.cpu,
            ram: b.ram,
            disk: sum(b.profiles.flatMap((pr) => pr.processes), "disk"),
            network: sum(b.profiles.flatMap((pr) => pr.processes), "network"),
            gpu: sum(b.profiles.flatMap((pr) => pr.processes), "gpu"),
            expandable: true,
            count: b.count,
          });
          if (!expanded.has(bKey)) continue;
          for (const pr of b.profiles) {
            const pKey = `bp:${pr.key}`;
            out.push({
              key: pKey,
              depth: 1,
              name: `Profile: ${pr.name}`,
              sub: pr.windowTitle,
              icon: undefined,
              pids: pr.processes.map((p) => p.pid),
              cpu: pr.cpu,
              ram: pr.ram,
              disk: sum(pr.processes, "disk"),
              network: sum(pr.processes, "network"),
              gpu: sum(pr.processes, "gpu"),
              expandable: true,
              count: pr.count,
            });
            if (!expanded.has(pKey)) continue;
            for (const p of pr.processes) out.push(procRow(p, 2, b.label));
          }
        }
      } else {
        for (const g of c[cat]) out.push(...groupRows(g));
      }
    }
    return out;
  }, [processes, filter, search, expanded, collapsedSections]);

  const allPickable = useMemo(
    () => Array.from(new Set(rows.filter((r) => !r.header).flatMap((r) => r.pids))),
    [rows],
  );

  function toggleSection(cat: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

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
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
        {(["all", "apps", "browsers", "windows", "background"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`ios-btn rounded-xl px-4 py-2 text-xs font-semibold capitalize ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : CATEGORY_LABELS[f]}
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
            onClick={() => setPicked(new Set(allPickable))}
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
              {rows.map((r) => {
                if (r.header) {
                  const closed = collapsedSections.has(r.header);
                  return (
                    <tr
                      key={r.key}
                      onClick={() => toggleSection(r.header!)}
                      className="cursor-pointer bg-cardhover/60 hover:bg-cardhover"
                    >
                      <td colSpan={8} className="px-4 py-2">
                        <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {closed ? (
                            <ChevronRight className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                          {r.name}
                          <span className="font-normal">({r.count})</span>
                        </span>
                      </td>
                    </tr>
                  );
                }
                const open = expanded.has(r.key);
                const on = r.pids.length > 0 && r.pids.every((x) => picked.has(x));
                const pad = r.depth === 0 ? "" : r.depth === 1 ? "pl-8" : "pl-14";
                return (
                  <tr
                    key={r.key}
                    {...holdHandlers(r.pids)}
                    className={`select-none hover:bg-cardhover/50 ${r.depth ? "bg-cardhover/30" : ""} ${
                      on ? "bg-primary/10" : ""
                    }`}
                  >
                    <td className={`px-4 py-2.5 ${pad}`}>
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
                        {r.expandable ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(r.key);
                            }}
                            className="grid size-5 place-items-center rounded-md text-muted-foreground hover:text-foreground"
                          >
                            {open ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>
                        ) : (
                          <span className="size-5" />
                        )}
                        <ProcessIcon icon={r.icon} />
                        <div className="min-w-0">
                          <p className={`truncate ${r.depth === 2 ? "text-muted-foreground" : "text-foreground"}`}>
                            {r.name}
                            {r.expandable && r.count ? (
                              <span className="ml-1.5 text-[10px] text-muted-foreground">({r.count})</span>
                            ) : null}
                          </p>
                          {r.sub && (
                            <p className="truncate text-[10px] text-muted-foreground">{r.sub}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.status || "Running"}</td>
                    <td className="px-4 py-2.5">{r.cpu.toFixed(1)}%</td>
                    <td className="px-4 py-2.5">{humanSize(r.ram)}</td>
                    <td className="px-4 py-2.5">{r.disk > 0 ? `${r.disk.toFixed(1)} MB/s` : "—"}</td>
                    <td className="px-4 py-2.5">
                      {r.network > 0 ? `${r.network.toFixed(1)} Mbps` : "—"}
                    </td>
                    <td className="px-4 py-2.5">{r.gpu > 0 ? `${r.gpu.toFixed(1)}%` : "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        disabled={selectMode}
                        onClick={(e) => {
                          e.stopPropagation();
                          void kill(r.pids, r.name);
                        }}
                        className="ios-btn inline-flex items-center gap-1 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 px-3 py-1.5 text-white shadow-md shadow-sky-500/25 hover:brightness-110 disabled:opacity-40"
                      >
                        <Skull className="size-3" /> End Task
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && !loading && (
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
              <span className="font-semibold text-foreground">{target}</span>. Unsaved work in those
              apps will be lost.
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
            void doKillMany(pendingKill.pids);
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
              Are you sure to end{" "}
              <span className="font-semibold text-foreground">{pendingKill.name}</span> on{" "}
              <span className="text-primary">{target}</span>?
            </p>
            <label className="mb-5 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-cardhover/60 p-3">
              <span
                className={`grid size-5 place-items-center rounded-md border transition-colors ${
                  dontAskEnd
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background"
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
              <span className="text-xs font-medium text-foreground">
                Don't ask me again for this session
              </span>
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
                  void doKillMany(p.pids);
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
