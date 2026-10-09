import { useEffect, useMemo, useState } from "react";
import { Download, FileJson, Lock, ScrollText, Trash2 } from "lucide-react";
import {
  clearAudit,
  download,
  exportCsv,
  getAudit,
  subscribeAudit,
  type AuditEvent,
} from "@/lib/audit";
import { getServerAudit, type Session } from "@/lib/linkClient";

const FILTERS = ["All Events", "Clipboard", "Command", "Power", "File/Link", "Display"] as const;

const statusTone: Record<string, string> = {
  SUCCESS: "bg-accent/15 text-accent",
  INFO: "bg-primary/15 text-primary",
  WARN: "bg-warning/15 text-warning",
  ERROR: "bg-destructive/15 text-destructive",
};

export function AuditTrail({ session }: { session: Session }) {
  // `events` merges two sources: the original browser-local log
  // (src/lib/audit.ts — only ever visible on the one tab that created it)
  // and the real server-persisted log (visible from any device in the
  // room, tier-gated to match the pricing page). Local events are tagged
  // so they render identically but aren't mistaken for the shared record.
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All Events");
  const [query, setQuery] = useState("");
  const [upsell, setUpsell] = useState<string | null>(null);

  useEffect(() => {
    const applyLocal = () =>
      setEvents((prev) => [...getAudit(), ...prev.filter((e) => e.id.startsWith("server:"))].sort((a, b) => b.ts - a.ts));
    applyLocal();
    return subscribeAudit(applyLocal);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const { events: serverEvents, upsell: serverUpsell } = await getServerAudit(session);
        if (cancelled) return;
        setUpsell(serverUpsell ?? null);
        const mapped: AuditEvent[] = serverEvents.map((e) => ({
          id: `server:${e.id}`,
          ts: new Date(e.created_at).getTime(),
          device: e.device_name,
          category: e.category as AuditEvent["category"],
          details: e.details,
          status: e.status as AuditEvent["status"],
        }));
        // Local events use plain ids, server events are prefixed
        // `server:` above, so this merge can never collide/duplicate.
        setEvents((local) =>
          [...local.filter((e) => !e.id.startsWith("server:")), ...mapped].sort((a, b) => b.ts - a.ts),
        );
      } catch {
        /* offline / not authenticated yet — local events still show */
      }
    }
    void poll();
    const id = window.setInterval(poll, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [session.deviceId]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) =>
        (filter === "All Events" || e.category === filter) &&
        (!q ||
          e.details.toLowerCase().includes(q) ||
          e.device.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)),
    );
  }, [events, filter, query]);

  return (
    <div className="rounded-[20px] border border-border bg-card p-5 md:p-7">
      {upsell && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <Lock className="size-3.5 shrink-0" />
          {upsell} — showing this browser's local history only, which won't be visible on your other devices.
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <ScrollText className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              System Activity &amp; Audit Trail
            </h3>
            <p className="text-xs text-muted-foreground">
              {events.length} immutable events recorded.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => download("audit_trail.csv", "text/csv", exportCsv(shown))}
            className="ios-btn flex items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-foreground hover:text-primary"
          >
            <Download className="size-4" /> CSV
          </button>
          <button
            onClick={() =>
              download("audit_trail.json", "application/json", JSON.stringify(shown, null, 2))
            }
            className="ios-btn flex items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-foreground hover:text-primary"
          >
            <FileJson className="size-4" /> JSON
          </button>
          <button
            onClick={() => clearAudit()}
            title="Clears this browser's local history only — shared history on the server is kept"
            className="ios-btn flex items-center gap-1.5 rounded-xl border border-border bg-cardhover px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events, devices, details…"
        className="mb-3 w-full rounded-xl border border-border bg-cardhover px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`ios-btn shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-cardhover text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "Clipboard"
              ? "Clipboard Ops"
              : f === "Command"
                ? "Commands"
                : f === "Power"
                  ? "Power Events"
                  : f}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No matching events yet.</p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/60">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-cardhover text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-semibold">Time</th>
                <th className="px-3 py-2 font-semibold">Device</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Details</th>
                <th className="px-3 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e.id} className="border-t border-border/40">
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-muted-foreground">
                    {new Date(e.ts).toLocaleTimeString()}
                  </td>
                  <td className="px-3 py-2 text-foreground">{e.device}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                    {e.category}
                  </td>
                  <td className="px-3 py-2 text-foreground">{e.details}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusTone[e.status]}`}
                    >
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
