import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Clock, Loader2, Monitor, X, Zap } from "lucide-react";
import "./PowerModal.css";
import type { PowerSchedule, Session } from "@/lib/linkClient";

export type PowerActionSpec = {
  key: "shutdown" | "restart";
  label: string;
  icon: React.ElementType;
};

type Stage = "options" | "schedule" | "warning" | "countdown" | "progress";

type DeviceResult = { name: string; state: "waiting" | "running" | "ok" | "error"; note?: string };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatLeft(totalSecs: number) {
  const s = Math.max(0, totalSecs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0 ? `${h}h ${pad(m)}m ${pad(sec)}s` : `${pad(m)}m ${pad(sec)}s`;
}

/** iOS-style scrolling wheel, matching the reference picker UI. */
function Wheel({
  items,
  selectedIndex,
  onChange,
}: {
  items: string[];
  selectedIndex: number;
  onChange: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settle = useRef<number | null>(null);
  const synced = useRef(false);
  const ROW = 56;

  useEffect(() => {
    if (synced.current || !ref.current) return;
    synced.current = true;
    ref.current.scrollTop = selectedIndex * ROW;
  }, [selectedIndex]);

  function scrollToIndex(i: number, smooth = true) {
    ref.current?.scrollTo({ top: i * ROW, behavior: smooth ? "smooth" : "auto" });
  }

  return (
    <div
      ref={ref}
      className="pm-wheel-column no-scrollbar"
      onScroll={(e) => {
        const el = e.currentTarget;
        if (settle.current) window.clearTimeout(settle.current);
        settle.current = window.setTimeout(() => {
          const i = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ROW)));
          onChange(i);
        }, 90);
      }}
    >
      {items.map((it, i) => (
        <div
          key={it}
          onClick={() => scrollToIndex(i)}
          className={`pm-wheel-item ${i === selectedIndex ? "pm-selected" : ""}`}
        >
          {it}
        </div>
      ))}
    </div>
  );
}

export function PowerModal({
  open,
  action,
  devices,
  existingSchedules,
  onClose,
  onExecuteNow,
  onSchedule,
  onCancelSchedule,
}: {
  open: boolean;
  action: PowerActionSpec | null;
  devices: string[];
  /** Any already-pending cloud schedules that match this action + these devices. */
  existingSchedules: PowerSchedule[];
  onClose: () => void;
  /** Runs the action right now (no grace period) on one device. */
  onExecuteNow: (device: string) => Promise<void>;
  /** Persists a schedule (DB + OS timer on every device) for the given ISO time. */
  onSchedule: (fireAtIso: string) => Promise<void>;
  /** Cancels every pending schedule currently shown in the countdown stage. */
  onCancelSchedule: () => Promise<void>;
}) {
  const [stage, setStage] = useState<Stage>("options");
  const [time, setTime] = useState({ hours: 12, minutes: 0, ampm: "AM" as "AM" | "PM" });
  const [fireAt, setFireAt] = useState<number>(0);
  const [now, setNow] = useState(() => Date.now());
  const [results, setResults] = useState<DeviceResult[]>([]);
  const [pendingMode, setPendingMode] = useState<"now" | "schedule">("now");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !action) return;

    if (existingSchedules.length > 0) {
      const earliest = existingSchedules.reduce((a, b) =>
        new Date(a.fire_at).getTime() < new Date(b.fire_at).getTime() ? a : b,
      );
      setFireAt(new Date(earliest.fire_at).getTime());
      setNow(Date.now());
      setStage("countdown");
      return;
    }

    const d = new Date();
    let h = d.getHours() % 12;
    if (h === 0) h = 12;
    setTime({ hours: h, minutes: d.getMinutes(), ampm: d.getHours() >= 12 ? "PM" : "AM" });
    setStage("options");
    setFireAt(0);
    setResults([]);
  }, [open, action?.key, existingSchedules.length]);

  useEffect(() => {
    if (stage !== "countdown") return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [stage]);

  const secondsLeft = useMemo(
    () => (fireAt ? Math.max(0, Math.ceil((fireAt - now) / 1000)) : 0),
    [fireAt, now],
  );

  const targetDate = useMemo(() => {
    const d = new Date();
    let h = time.hours % 12;
    if (time.ampm === "PM") h += 12;
    const out = new Date(d);
    out.setHours(h, time.minutes, 0, 0);
    if (out.getTime() <= d.getTime()) out.setDate(out.getDate() + 1);
    return out;
  }, [time]);

  const pickerTimeLeftLabel = useMemo(() => {
    const secs = Math.max(0, Math.floor((targetDate.getTime() - Date.now()) / 1000));
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  }, [targetDate, now]);

  if (!open || !action) return null;

  const Icon = action.icon;
  const verb = action.key === "shutdown" ? "Shutting down" : "Restarting";
  const critical = secondsLeft <= 10 && secondsLeft > 0;
  const doneCount = results.filter((r) => r.state === "ok" || r.state === "error").length;
  const allDone = results.length > 0 && doneCount === results.length;

  async function confirmNow() {
    setBusy(true);
    setResults(devices.map((name) => ({ name, state: "waiting" })));
    setStage("progress");
    for (const name of devices) {
      setResults((r) => r.map((x) => (x.name === name ? { ...x, state: "running" } : x)));
      try {
        await onExecuteNow(name);
        setResults((r) => r.map((x) => (x.name === name ? { ...x, state: "ok" } : x)));
      } catch (e) {
        setResults((r) => r.map((x) => (x.name === name ? { ...x, state: "error", note: (e as Error).message } : x)));
      }
    }
    setBusy(false);
  }

  async function confirmSchedule() {
    setBusy(true);
    try {
      await onSchedule(targetDate.toISOString());
      setFireAt(targetDate.getTime());
      setNow(Date.now());
      setStage("countdown");
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelSchedule() {
    setBusy(true);
    try {
      await onCancelSchedule();
    } finally {
      setBusy(false);
      onClose();
    }
  }

  return (
    <div className="pm-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="pm-card flex w-full max-w-md flex-col gap-5 rounded-[28px] border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {stage !== "options" && stage !== "progress" && stage !== "countdown" && (
              <button
                onClick={() => setStage(stage === "warning" && pendingMode === "schedule" ? "schedule" : "options")}
                className="ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-foreground">{action.label}</h3>
              <p className="truncate text-xs text-muted-foreground">
                {devices.length} device{devices.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ios-btn grid size-8 shrink-0 place-items-center rounded-full bg-cardhover text-muted-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {stage === "options" && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setPendingMode("now");
                setStage("warning");
              }}
              className="ios-card-hover ios-btn flex w-full items-center justify-between rounded-2xl border border-border bg-cardhover p-4 text-left hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-warning/15 text-warning">
                  <Zap className="size-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-foreground">Execute immediately</span>
                  <span className="text-xs text-muted-foreground">Runs right away, no delay</span>
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-primary" />
            </button>

            <button
              onClick={() => {
                setPendingMode("schedule");
                setStage("schedule");
              }}
              className="ios-card-hover ios-btn flex w-full items-center justify-between rounded-2xl border border-border bg-cardhover p-4 text-left hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Clock className="size-5" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-foreground">Schedule timer</span>
                  <span className="text-xs text-muted-foreground">Set a specific time for execution</span>
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-primary" />
            </button>
          </div>
        )}

        {stage === "schedule" && (
          <div className="pm-fade-in flex flex-col gap-5">
            <div className="pm-picker-container">
              <div className="pm-picker-selection-bar" />
              <Wheel
                items={Array.from({ length: 12 }, (_, i) => pad(i + 1))}
                selectedIndex={time.hours - 1}
                onChange={(i) => setTime((t) => ({ ...t, hours: i + 1 }))}
              />
              <Wheel
                items={Array.from({ length: 60 }, (_, i) => pad(i))}
                selectedIndex={time.minutes}
                onChange={(i) => setTime((t) => ({ ...t, minutes: i }))}
              />
              <Wheel
                items={["AM", "PM"]}
                selectedIndex={time.ampm === "AM" ? 0 : 1}
                onChange={(i) => setTime((t) => ({ ...t, ampm: i === 0 ? "AM" : "PM" }))}
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <div className="flex flex-col">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Time left</span>
                <span className="font-mono text-sm font-bold text-primary">{pickerTimeLeftLabel}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStage("options")}
                  className="ios-btn rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStage("warning")}
                  className="ios-btn rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-lg shadow-primary/30"
                >
                  Apply schedule
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "warning" && (
          <div className="pm-fade-in flex flex-col gap-5">
            <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
              <AlertTriangle className="size-[18px] shrink-0 text-warning" />
              <p className="text-xs font-medium leading-relaxed text-warning">
                <strong>Warning:</strong> {action.label} will be sent to {devices.length} device
                {devices.length !== 1 ? "s" : ""}
                {pendingMode === "schedule" ? ` at ${targetDate.toLocaleTimeString()}` : " immediately"}. Any unsaved
                work on those PCs may be lost, and background transfers will stop.
              </p>
            </div>

            <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
              {devices.map((d) => (
                <div key={d} className="flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2">
                  <Monitor className="size-4 shrink-0 text-primary" />
                  <span className="truncate text-xs text-foreground">{d}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="ios-btn flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={() => void (pendingMode === "now" ? confirmNow() : confirmSchedule())}
                className="ios-btn flex-1 rounded-xl bg-warning py-3 text-sm font-bold text-background shadow-lg shadow-warning/30 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Confirm & execute"}
              </button>
            </div>
          </div>
        )}

        {stage === "countdown" && (
          <div className="pm-fade-in flex flex-col items-center gap-4 py-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{action.label} in</p>
            {secondsLeft > 0 ? (
              <div
                className={`font-mono text-5xl font-bold tabular-nums transition-colors duration-300 ${
                  critical ? "animate-pulse text-destructive" : "text-foreground"
                }`}
              >
                {formatLeft(secondsLeft)}
              </div>
            ) : (
              <div className="font-mono text-2xl font-bold text-warning">{verb} now…</div>
            )}
            <p className="text-center text-xs text-muted-foreground">
              Scheduled for {new Date(fireAt).toLocaleTimeString()} — this runs on the PC itself, so it keeps
              going even if you close this tab.
            </p>
            {secondsLeft > 0 && (
              <button
                disabled={busy}
                onClick={() => void handleCancelSchedule()}
                className="ios-btn w-full rounded-xl border border-warning/40 bg-warning/15 py-3 text-sm font-bold text-warning disabled:opacity-50"
              >
                {busy ? "Cancelling…" : `Cancel ${action.label.toLowerCase()}`}
              </button>
            )}
          </div>
        )}

        {stage === "progress" && (
          <div className="pm-fade-in flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">
                {allDone ? "Finished" : `${verb}…`}
              </span>
              <span className="font-mono text-xs text-primary">
                {doneCount} of {results.length}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${results.length ? (doneCount / results.length) * 100 : 0}%` }}
              />
            </div>
            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
              {results.map((r) => (
                <div key={r.name} className="flex items-center gap-3 rounded-xl border border-border/60 bg-cardhover/60 px-3 py-2.5">
                  <span className="grid size-6 shrink-0 place-items-center">
                    {r.state === "running" && <Loader2 className="size-4 animate-spin text-primary" />}
                    {r.state === "ok" && <Check className="size-4 text-primary" />}
                    {r.state === "error" && <AlertTriangle className="size-4 text-destructive" />}
                    {r.state === "waiting" && <span className="size-2 rounded-full bg-muted-foreground/40" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-foreground">
                      {verb} {r.name}
                    </div>
                    {r.note && <div className="truncate text-[11px] text-destructive">{r.note}</div>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-center font-mono text-[11px] text-muted-foreground">
              {doneCount} of {results.length}
            </p>
            {allDone && (
              <button
                onClick={onClose}
                className="ios-btn w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
