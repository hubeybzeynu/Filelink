import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Cpu, Download, HardDrive, Loader2, Monitor, Plus, RefreshCw, Server } from "lucide-react";
import { BackgroundAgentDownload } from "@/components/link/BackgroundAgentDownload";
import { humanSize, remoteSysInfo, getInstallStatus, type DeviceInfo, type InstallStatus, type Session } from "@/lib/linkClient";
import { downloadAgentInstaller } from "@/lib/agentScript";

type SysInfo = {
  hostname?: string;
  os?: string;
  osVersion?: string;
  cpu?: string;
  ramTotal?: number;
  ramUsed?: number;
  uptime?: string;
  drives?: { letter: string; free: number; total: number }[];
  network?: { name: string; ip: string; mac: string }[];
};

function osBadge(os?: string) {
  if (!os) return "Windows";
  const lower = os.toLowerCase();
  if (lower.includes("windows 11")) return "Windows 11";
  if (lower.includes("windows 10")) return "Windows 10";
  if (lower.includes("windows server 2025")) return "Server 2025";
  if (lower.includes("windows server 2022")) return "Server 2022";
  if (lower.includes("windows server 2019")) return "Server 2019";
  if (lower.includes("windows server 2016")) return "Server 2016";
  if (lower.includes("windows 8.1")) return "Windows 8.1";
  if (lower.includes("windows 8")) return "Windows 8";
  if (lower.includes("windows 7")) return "Windows 7";
  if (lower.includes("server")) return "Windows Server";
  return os.replace("Microsoft ", "");
}

export function PcInfoTab({ session, devices }: { session: Session; devices: DeviceInfo[] }) {
  const [target, setTarget] = useState<string>("");
  const [info, setInfo] = useState<SysInfo>({});
  const [loading, setLoading] = useState(false);
  const [installedTargets, setInstalledTargets] = useState<string[]>([]);


  const onlineTargets = devices.filter((d) => d.online);
  const selected = devices.find((d) => d.name === target);

  async function load() {
    if (!target) return;
    setLoading(true);
    try {
      const r = await remoteSysInfo(session, target);
      setInfo(r);
    } catch {
      setInfo({});
    }
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [target]);

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
        >
          <option value="">Select a device</option>
          {onlineTargets.map((d) => (
            <option key={d.id} value={d.name}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => void load()}
          disabled={!target || loading}
          className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
        <BackgroundAgentDownload
          session={session}
          origin={typeof window !== "undefined" ? window.location.origin : ""}
          defaultName={target || undefined}
        />
      </div>

      {!target && (
        <div className="grid flex-1 place-items-center rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          <div>
            <Monitor className="mx-auto size-8 opacity-50" />
            <p className="mt-2 text-sm">Choose an online device to view system information.</p>
          </div>
        </div>
      )}

      {target && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary">
              {osBadge(info.os ?? selected?.osInfo ?? undefined)}
            </span>
            {selected?.agent && (
              <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-medium text-warning">
                Background agent
              </span>
            )}
          </div>

          {!selected?.agent && !installedTargets.includes(target) && (
            <AgentCompatibility
              session={session}
              target={target}
              info={info}
              selected={selected}
              onInstalled={() => setInstalledTargets((prev) => [...prev, target])}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard icon={Monitor} label="Hostname" value={info.hostname ?? "—"} />
            <InfoCard icon={Server} label="OS" value={osBadge(info.os ?? selected?.osInfo ?? undefined)} />
            <InfoCard icon={Cpu} label="CPU" value={info.cpu ?? "—"} />
            <InfoCard
              icon={HardDrive}
              label="RAM"
              value={
                info.ramTotal
                  ? `${humanSize(info.ramUsed || 0)} / ${humanSize(info.ramTotal)}`
                  : "—"
              }
            />
            <InfoCard icon={RefreshCw} label="Uptime" value={info.uptime ?? "—"} />
          </div>

          {info.drives && info.drives.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display text-sm font-semibold text-foreground">Storage drives</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {info.drives.map((d) => {
                  const used = d.total - d.free;
                  const pct = d.total ? Math.round((used / d.total) * 100) : 0;
                  return (
                    <div key={d.letter} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-foreground">{d.letter}</span>
                        <span className="text-[11px] text-muted-foreground">{pct}% used</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                        {humanSize(used)} used · {humanSize(d.free)} free
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {info.network && info.network.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="font-display text-sm font-semibold text-foreground">Network adapters</h3>
              <div className="mt-3 space-y-2">
                {info.network.map((n, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 rounded-lg border border-border p-3 font-mono text-xs sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-foreground">{n.name}</span>
                    <span className="text-muted-foreground">
                      {n.ip} · {n.mac}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-2 font-mono text-sm text-foreground">{value}</p>
    </div>
  );
}

type InstallStage = null | "warn" | "requesting" | "accepted" | "adding" | "verifying" | "denied" | "added";

function AgentCompatibility({
  session,
  target,
  info,
  selected,
  onInstalled,
}: {
  session: Session;
  target: string;
  info: SysInfo;
  selected?: DeviceInfo;
  onInstalled: () => void;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const badge = osBadge(info.os ?? selected?.osInfo ?? undefined);
  const [stage, setStage] = useState<InstallStage>(null);
  const [elevate, setElevate] = useState(true);
  const [install, setInstall] = useState<InstallStatus>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [tick, setTick] = useState(0);

  const waiting = stage === "requesting" || stage === "accepted" || stage === "adding" || stage === "verifying";

  // Poll the real progress the installer script itself reports as it runs.
  useEffect(() => {
    if (!waiting) return;
    let cancelled = false;
    async function poll() {
      try {
        const { install: row } = await getInstallStatus(session, target);
        if (!cancelled) setInstall(row);
      } catch {
        /* transient — next tick retries */
      }
    }
    void poll();
    const id = window.setInterval(poll, 1500);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [waiting, session, target]);

  useEffect(() => {
    if (stage !== "requesting") return;
    setStartedAt(Date.now());
    setInstall(null);
  }, [stage]);

  // Advances requesting -> accepted -> adding -> verifying -> added as real
  // signals arrive. Both variants are background-agent installs now — the
  // only difference is elevate=true also waits for a real UAC "approved"
  // signal before the rest proceeds.
  useEffect(() => {
    if (!waiting) return;

    const connected = !!selected?.agent;
    if (connected) {
      setStage("added");
      return;
    }

    if (stage === "requesting") {
      const readyToAdvance = elevate ? install?.stage === "approved" || install?.stage === "installing" : install?.stage === "installing";
      if (readyToAdvance) {
        setStage("accepted");
        const t = window.setTimeout(() => setStage((s) => (s === "accepted" ? "adding" : s)), 900);
        return () => window.clearTimeout(t);
      }
    }
    if ((stage === "accepted" || stage === "adding") && install?.stage === "starting") {
      setStage("verifying");
      return;
    }

    if (stage === "requesting") {
      const elapsed = Date.now() - startedAt;
      // A UAC decision is instant, so give that case a shorter window —
      // otherwise (no prompt at all) give it a little longer to actually
      // start running.
      const timeout = elevate ? 25_000 : 15_000;
      if (elapsed > timeout) setStage("denied"); // nothing ever reported in — file wasn't run
    }
    if (stage === "verifying") {
      const elapsed = Date.now() - startedAt;
      if (elapsed > 120_000) setStage("denied"); // ran, but never finished connecting
    }
  }, [waiting, stage, selected?.agent, install, startedAt, elevate, tick]);

  // Re-checks the timeouts above on a clock, since "nothing happened yet"
  // wouldn't otherwise re-trigger the effect above.
  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2000);
    return () => window.clearInterval(id);
  }, [waiting]);

  const [checkStarted, setCheckStarted] = useState(false);
  const [resolvedCount, setResolvedCount] = useState(0);

  const checks = useMemo(() => {
    const os = (info.os ?? selected?.osInfo ?? "").toLowerCase();
    const isWin1011 = os.includes("windows 10") || os.includes("windows 11");
    const isSupportedWindows = isWin1011 || os.includes("server");
    return [
      {
        label: "Windows 10 / 11 compatible",
        pass: isSupportedWindows,
        note: isSupportedWindows ? badge : "Requires Windows 10, 11 or Server",
      },
      {
        label: "Startup folder writable",
        pass: true,
        note: "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup",
      },
      {
        label: "PowerShell available",
        pass: /win|server/.test(os) || !os,
        note: "PowerShell 5.1+ ships with Windows",
      },
      {
        label: "Roaming AppData available",
        pass: true,
        note: "%APPDATA%\\FileLinkAgent",
      },
    ];
  }, [info.os, selected?.osInfo, badge]);

  // Runs the checks one at a time with a brief "analyzing" state each,
  // instead of dumping all four pass/fail results on screen at once.
  useEffect(() => {
    if (!checkStarted || resolvedCount >= checks.length) return;
    const t = window.setTimeout(() => setResolvedCount((n) => n + 1), 750);
    return () => window.clearTimeout(t);
  }, [checkStarted, resolvedCount, checks.length]);

  // Re-run automatically if the target device changes.
  useEffect(() => {
    setCheckStarted(false);
    setResolvedCount(0);
  }, [target]);

  const ready = checkStarted && resolvedCount >= checks.length && checks.every((c) => c.pass);

  function download() {
    downloadAgentInstaller({
      origin,
      roomCode: session.roomCode,
      deviceName: target || session.deviceName || "My PC",
      elevate,
    });
  }


  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground md:text-base">Agent compatibility</h3>
          <p className="text-xs text-muted-foreground">
            Automatic feature analysis for installing the FileLink background agent on this PC.
          </p>
        </div>
        {checkStarted && resolvedCount >= checks.length && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              ready ? "bg-primary/15 text-primary" : "bg-destructive/15 text-destructive"
            }`}
          >
            {ready ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
            {ready ? "Ready for agent" : "Not compatible"}
          </span>
        )}
      </div>

      {!checkStarted && (
        <button
          onClick={() => {
            setCheckStarted(true);
            setResolvedCount(0);
          }}
          className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary"
        >
          <RefreshCw className="size-4" /> Check for agent
        </button>
      )}

      {checkStarted && (
        <>
          <ul className="grid gap-2 sm:grid-cols-2">
            {checks.map((c, i) => {
              const state = i < resolvedCount ? (c.pass ? "pass" : "fail") : i === resolvedCount ? "checking" : "pending";
              return (
                <li
                  key={c.label}
                  className={`flex items-start gap-2 rounded-xl border p-3 transition-colors ${
                    state === "pending" ? "border-border/40 bg-cardhover/20 opacity-50" : "border-border/60 bg-cardhover/40"
                  }`}
                >
                  {state === "pass" && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />}
                  {state === "fail" && <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />}
                  {state === "checking" && <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />}
                  {state === "pending" && <span className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/30" />}
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground">{c.label}</div>
                    <div className="truncate font-mono text-[11px] text-muted-foreground">
                      {state === "checking" ? "analyzing…" : state === "pending" ? "waiting…" : c.note}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {resolvedCount >= checks.length && !ready && (
            <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              This PC does not meet agent requirements. The FileLink agent supports Windows 10/11 with PowerShell.
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setStage("warn")}
          disabled={!ready}
          className="ios-btn flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25 disabled:opacity-40"
        >
          <Plus className="size-4" /> Add Agent
        </button>
        <button
          onClick={download}
          disabled={!ready}
          className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
        >
          <Download className="size-4" /> Download Agent
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        "Add Agent" installs the background agent on <span className="font-semibold">{target}</span> — it requires
        administrator permission on that PC. "Download Agent" saves the same installer as a .cmd file.
      </p>

      {stage && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="animate-ios-rise w-full max-w-sm rounded-3xl border border-border bg-card p-5 text-center shadow-ios">
            {stage === "warn" && (
              <>
                <AlertTriangle className="mx-auto size-9 text-warning" />
                <h4 className="mt-3 text-base font-bold text-foreground">Add {target}</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Choose how <span className="font-semibold text-foreground">{target}</span> connects.
                </p>

                <div className="mt-4 flex rounded-xl border border-border bg-cardhover/60 p-1">
                  <button
                    onClick={() => setElevate(true)}
                    className={`ios-btn flex-1 rounded-lg py-2 text-xs font-semibold ${
                      elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    With admin
                  </button>
                  <button
                    onClick={() => setElevate(false)}
                    className={`ios-btn flex-1 rounded-lg py-2 text-xs font-semibold ${
                      !elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Without admin
                  </button>
                </div>

                <ul className="mt-3 space-y-1.5 rounded-xl border border-border/60 bg-cardhover/40 p-3 text-left text-[11px] leading-relaxed text-muted-foreground">
                  {elevate ? (
                    <>
                      <li>• Shows a real Windows administrator approval prompt before installing</li>
                      <li>• Once approved: installs quietly and starts automatically with Windows</li>
                      <li>• Full remote control: files, power actions, screen, everything</li>
                    </>
                  ) : (
                    <>
                      <li>• Installs the exact same background agent — no prompt at all</li>
                      <li>• Starts automatically with Windows, stays connected permanently</li>
                      <li>• Full remote control: files, power actions, screen, everything</li>
                    </>
                  )}
                  <li>• Nothing runs until you download the file below and open it on {target}</li>
                </ul>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setStage(null)}
                    className="ios-btn flex-1 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      download();
                      setStage("requesting");
                    }}
                    className="ios-btn flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25"
                  >
                    Run
                  </button>
                </div>
              </>
            )}

            {(stage === "requesting" || stage === "accepted" || stage === "adding" || stage === "verifying") && (
              <>
                <RefreshCw className="mx-auto size-9 animate-spin text-primary" />
                <h4 className="mt-3 text-base font-bold text-foreground">
                  {stage === "requesting"
                    ? `Requesting install on ${target}`
                    : stage === "accepted"
                      ? "Accepted"
                      : stage === "adding"
                        ? "Adding agent"
                        : "Verifying connection"}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {stage === "requesting"
                    ? `Waiting for ${target} to open the downloaded file.`
                    : stage === "accepted"
                      ? "The file is running on that PC."
                      : stage === "adding"
                        ? "Downloading and installing the agent files."
                        : "Almost there — waiting for it to come online."}
                </p>

                <div className="mt-4 flex flex-col gap-2 text-left">
                  {(
                    elevate
                      ? [
                          { key: "requesting", label: "Administrator approved" },
                          { key: "accepted", label: "Accepted" },
                          { key: "adding", label: "Adding agent" },
                          { key: "verifying", label: "Verifying connection" },
                        ]
                      : [
                          { key: "requesting", label: "Requested" },
                          { key: "accepted", label: "Accepted" },
                          { key: "adding", label: "Adding agent" },
                          { key: "verifying", label: "Verifying connection" },
                        ]
                  ).map((s, i) => {
                    const order = ["requesting", "accepted", "adding", "verifying"] as const;
                    const currentIndex = order.indexOf(stage as (typeof order)[number]);
                    const reached = i <= currentIndex;
                    const isCurrent = i === currentIndex;
                    return (
                      <div key={s.key} className="flex items-center gap-2.5">
                        <span
                          className={`grid size-5 shrink-0 place-items-center rounded-full ${
                            reached ? "bg-primary text-primary-foreground" : "bg-cardhover text-muted-foreground"
                          }`}
                        >
                          {reached && !isCurrent ? (
                            <Check className="size-3" />
                          ) : isCurrent ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <span className="size-1.5 rounded-full bg-current" />
                          )}
                        </span>
                        <span className={`text-xs ${reached ? "text-foreground" : "text-muted-foreground"}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => setStage(null)}
                  className="ios-btn mt-4 w-full rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-muted-foreground"
                >
                  Stop waiting
                </button>
              </>
            )}

            {stage === "denied" && (
              <>
                <AlertTriangle className="mx-auto size-9 text-destructive" />
                <h4 className="mt-3 text-base font-bold text-foreground">
                  {install ? "Didn't finish" : "Denied"}
                </h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {install
                    ? `The installer started on ${target} but never finished connecting. Check that PC's screen for an error.`
                    : `${target} never opened the downloaded file — nothing ran, so nothing was added. Download it again and open it on that PC to try again.`}
                </p>
                <button
                  onClick={() => setStage(null)}
                  className="ios-btn mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground"
                >
                  Got it
                </button>
              </>
            )}

            {stage === "added" && (
              <>
                <CheckCircle2 className="mx-auto size-9 text-accent" />
                <h4 className="mt-3 text-base font-bold text-foreground">Agent successfully connected</h4>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {target} now runs the FileLink background agent and reconnects automatically with Windows.
                </p>
                <button
                  onClick={() => {
                    setStage(null);
                    onInstalled();
                  }}
                  className="ios-btn mt-4 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25"
                >
                  Got it
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
