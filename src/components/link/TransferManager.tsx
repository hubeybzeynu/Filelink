import { useSyncExternalStore, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronUp, X } from "lucide-react";
import {
  getJobs,
  humanSize,
  humanSpeed,
  subscribeJobs,
} from "@/lib/linkClient";

function useJobs() {
  return useSyncExternalStore(subscribeJobs, getJobs, getJobs);
}

/**
 * Docked, always-visible transfer manager. It appears by itself as soon as
 * anything starts moving and can be collapsed to a single summary bar.
 */
export function TransferManager({
  hidden,
  setHidden,
  collapsed,
  setCollapsed,
}: {
  hidden: boolean;
  setHidden: (v: boolean) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}) {
  const jobs = useJobs();

  const active = jobs.filter((j) => j.status === "active");
  if (!jobs.length || hidden) return null;

  const totalLoaded = active.reduce((n, j) => n + j.loaded, 0);
  const totalSize = active.reduce((n, j) => n + (j.total || 0), 0);
  const overall = totalSize ? Math.min(100, (totalLoaded / totalSize) * 100) : active.length ? 8 : 100;
  const speed = active.reduce((n, j) => n + j.bps, 0);

  // The most recent batch (a single multi-file upload/send) — used to show
  // real "X of Y files" instead of counting how many happen to be active
  // right now (uploads run one at a time, so that was always just "1").
  const latestBatchId = jobs.find((j) => j.batchId)?.batchId;
  const batchJobs = latestBatchId ? jobs.filter((j) => j.batchId === latestBatchId) : [];
  const batchTotal = batchJobs[0]?.batchTotal ?? 0;
  const batchDone = batchJobs.filter((j) => j.status === "done" || j.status === "error").length;
  const inBatchProgress = batchTotal > 0 && batchDone < batchTotal;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] flex justify-center p-3 sm:justify-end sm:p-4">
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-[22px] border border-border bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            {active.some((j) => j.kind === "receive") ? (
              <ArrowDownToLine className="size-4" />
            ) : (
              <ArrowUpFromLine className="size-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-bold text-foreground">
              {inBatchProgress
                ? `${Math.min(batchDone + 1, batchTotal)} of ${batchTotal} files`
                : active.length
                  ? `${active.length} transfer${active.length !== 1 ? "s" : ""} in progress`
                  : "All transfers finished"}
            </div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              {active.length ? `${Math.round(overall)}% · ${humanSpeed(speed)}` : `${jobs.length} in history`}
            </div>
          </div>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ios-btn grid size-8 place-items-center rounded-full bg-border/50 text-muted-foreground"
            aria-label={collapsed ? "Expand transfers" : "Collapse transfers"}
          >
            {collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          <button
            onClick={() => setHidden(true)}
            className="ios-btn grid size-8 place-items-center rounded-full bg-border/50 text-muted-foreground"
            aria-label="Dismiss transfers"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="h-1 bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${overall}%` }}
          />
        </div>

        {!collapsed && (
          <TransferJobList jobs={jobs} />
        )}
      </div>
    </div>
  );
}

function TransferJobList({ jobs }: { jobs: ReturnType<typeof getJobs> }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? jobs.slice(0, 40) : jobs.slice(0, 6);
  const remaining = jobs.length - visible.length;

  return (
    <ul className="max-h-64 divide-y divide-border/60 overflow-y-auto">
      {visible.map((j) => {
        const p = j.total
          ? Math.min(100, (j.loaded / j.total) * 100)
          : j.status === "done"
            ? 100
            : 8;
        return (
          <li key={j.id} className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{j.name}</span>
              <span
                className={`shrink-0 font-mono text-[10px] ${
                  j.status === "error"
                    ? "text-destructive"
                    : j.status === "done"
                      ? "text-primary"
                      : "text-muted-foreground"
                }`}
              >
                {j.status === "error" ? "failed" : `${Math.round(p)}%`}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-border">
              <div
                className={`h-full rounded-full transition-all ${
                  j.status === "error" ? "bg-destructive" : "bg-primary"
                }`}
                style={{ width: `${p}%` }}
              />
            </div>
            <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
              {humanSize(j.loaded)}
              {j.total ? ` / ${humanSize(j.total)}` : ""} ·{" "}
              {j.status === "active" ? humanSpeed(j.bps) : j.status === "done" ? "finished" : j.note}
              {j.note && j.status === "active" ? ` · ${j.note}` : ""}
            </p>
          </li>
        );
      })}
      {remaining > 0 && (
        <li className="px-4 py-2">
          <button
            onClick={() => setExpanded(true)}
            className="w-full rounded-lg py-1.5 text-center font-mono text-[11px] text-primary hover:bg-cardhover"
          >
            Show {remaining} more
          </button>
        </li>
      )}
    </ul>
  );
}
