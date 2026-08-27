import { useEffect, useState } from "react";
import { HardDrive, Power, Monitor, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  api,
  downloadTransfer,
  humanSize,
  roomUsage,
  type DeviceInfo,
  type FileRow,
  type Session,
} from "@/lib/linkClient";

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    received: "bg-primary/15 text-primary",
    shared: "bg-accent/15 text-accent",
    pending: "bg-warning/15 text-warning",
  };
  const label =
    status === "pending" ? "waiting — device offline" : status === "shared" ? "in room" : status;
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${map[status] ?? "bg-muted text-muted-foreground"}`}
    >
      {label}
    </span>
  );
}

export function SidePanel({
  session,
  devices,
  sent,
  received,
  onRefresh,
  onOpenDevice,
}: {
  session: Session;
  devices: DeviceInfo[];
  sent: FileRow[];
  received: FileRow[];
  onRefresh: () => void;
  onOpenDevice: (name: string) => void;
}) {
  const [picked, setPicked] = useState<string[]>([]);
  const [usage, setUsage] = useState<{ used: number; quota: number; files: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(onRefresh, 8000);
    return () => clearInterval(t);
  }, [onRefresh]);

  useEffect(() => {
    roomUsage(session).then(setUsage).catch(() => setUsage(null));
  }, [session, sent.length, received.length]);

  async function powerOff() {
    setNote(`ending session on ${picked.length} device(s)…`);
    for (const name of picked) {
      try {
        await api("rpc", { target: name, method: "exit", params: {} }, session);
      } catch {
        /* an agent that already quit simply never answers */
      }
    }
    setPicked([]);
    setNote(null);
    onRefresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Room storage
          </h2>
          <HardDrive className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <Progress value={usage ? Math.min(100, (usage.used / usage.quota) * 100) : 0} className="h-2" />
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          {usage
            ? `${humanSize(usage.used)} used · ${humanSize(usage.quota - usage.used)} free of ${humanSize(usage.quota)} · ${usage.files} files`
            : "reading…"}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Devices
          </h2>
          {picked.length > 0 && (
            <button
              onClick={powerOff}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-destructive/50 px-2.5 text-xs text-destructive transition-colors hover:bg-destructive/10"
            >
              <Power className="size-3.5" /> End session ({picked.length})
            </button>
          )}
        </div>
        <ul className="space-y-1">
          {devices.map((d) => {
            const me = d.id === session.deviceId;
            return (
              <li key={d.id} className="flex items-center gap-2 rounded-md px-1 py-1.5">
                <input
                  type="checkbox"
                  disabled={me}
                  checked={picked.includes(d.name)}
                  onChange={() =>
                    setPicked((p) =>
                      p.includes(d.name) ? p.filter((n) => n !== d.name) : [...p, d.name],
                    )
                  }
                  className="size-4 shrink-0 accent-[var(--primary)] disabled:opacity-30"
                  aria-label={`Select ${d.name}`}
                />
                <button
                  onClick={() => !me && onOpenDevice(d.name)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Monitor
                    className={`size-4 shrink-0 ${d.online ? "text-primary" : "text-muted-foreground/50"}`}
                  />
                  <span
                    className={`truncate text-sm ${me ? "font-medium text-foreground" : "text-foreground/85"}`}
                  >
                    {d.name}
                    {me ? " (this one)" : ""}
                  </span>
                </button>
                <span
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    d.online ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {!d.online && <WifiOff className="size-3" />}
                  {d.online ? "online" : "offline (cached)"}
                </span>
              </li>
            );
          })}
          {!devices.length && <li className="text-sm text-muted-foreground">No devices yet</li>}
        </ul>
        {note && <p className="mt-2 font-mono text-[11px] text-muted-foreground">{note}</p>}
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Sent
        </h2>
        <ul className="space-y-2.5">
          {sent.slice(0, 6).map((t) => (
            <li key={t.id} className="text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="truncate text-foreground/90">{t.file_name}</span>
                <StatusChip status={t.status} />
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {humanSize(t.size_bytes)} → {t.to_name ?? "everyone"} · {t.folder_path}
              </p>
            </li>
          ))}
          {!sent.length && <li className="text-sm text-muted-foreground">Nothing sent yet</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Received
        </h2>
        <ul className="space-y-2.5">
          {received.slice(0, 6).map((t) => (
            <li key={t.id} className="text-sm">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="truncate text-foreground/90">{t.file_name}</span>
                <button
                  onClick={() => downloadTransfer(session, t.id)}
                  className="h-8 shrink-0 rounded border border-border px-2 font-mono text-[11px] text-foreground/80 transition-colors hover:border-primary hover:text-primary"
                >
                  save
                </button>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                {humanSize(t.size_bytes)} from {t.from_name} · {t.status}
              </p>
            </li>
          ))}
          {!received.length && <li className="text-sm text-muted-foreground">Nothing received yet</li>}
        </ul>
      </section>
    </div>
  );
}
