import { useSyncExternalStore, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  clearFinishedJobs,
  downloadTransfer,
  getJobs,
  humanSize,
  humanSpeed,
  subscribeJobs,
  type FileRow,
  type Session,
} from "@/lib/linkClient";

function pct(status: string) {
  if (status === "received") return 100;
  if (status === "shared") return 100;
  if (status === "pending") return 70;
  if (status === "uploading") return 25;
  return 10;
}

function label(status: string, kind: "sent" | "received") {
  if (status === "uploading") return kind === "sent" ? "uploading…" : "sender is uploading…";
  if (status === "pending")
    return kind === "sent" ? "sending — waiting for that PC" : "receiving…";
  if (status === "received") return "delivered";
  if (status === "shared") return "in the room";
  return status;
}

function useJobs() {
  return useSyncExternalStore(subscribeJobs, getJobs, getJobs);
}

/** Same content as TransfersDialog, without the modal wrapper — used to
 * render Transfers as a normal section (like File Explorer, Tasks, PC
 * Setup, Control Center) instead of a floating box. */
export function TransfersPanel({
  session,
  sent,
  received,
  defaultView = "received",
}: {
  session: Session;
  sent: FileRow[];
  received: FileRow[];
  defaultView?: "sent" | "received";
}) {
  const [view, setView] = useState<"sent" | "received">(defaultView);
  const rows = view === "sent" ? sent : received;
  const jobs = useJobs().filter((j) => j.kind === (view === "sent" ? "send" : "receive"));
  const live = jobs.filter((j) => j.status === "active");
  const queued = rows.filter((r) => r.status === "pending" || r.status === "uploading");
  const done = rows.filter((r) => r.status !== "pending" && r.status !== "uploading");
  const totalCount = rows.length;
  const doneCount = done.length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold leading-tight text-foreground md:text-2xl">Transfers</h2>
          <span className="font-mono text-xs uppercase tracking-widest text-primary">
            {live.length
              ? `${live.length} moving right now`
              : queued.length
                ? `${queued.length} in the queue`
                : "Nothing in the queue — everything is through"}
          </span>
        </div>
        {totalCount > 1 && (
          <span className="shrink-0 rounded-full border border-border bg-cardhover px-3 py-1.5 font-mono text-xs font-semibold text-foreground">
            {Math.min(doneCount + 1, totalCount)} of {totalCount}
          </span>
        )}
      </div>

      <div className="flex w-fit rounded-xl border border-border bg-card p-1">
        <button
          onClick={() => setView("received")}
          className={`ios-btn rounded-lg px-4 py-2 text-xs font-semibold ${
            view === "received" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Received
        </button>
        <button
          onClick={() => setView("sent")}
          className={`ios-btn rounded-lg px-4 py-2 text-xs font-semibold ${
            view === "sent" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Sent
        </button>
      </div>

      <div className="rounded-[20px] border border-border bg-card p-6">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Right now</h3>
          {jobs.some((j) => j.status !== "active") && (
            <button
              onClick={clearFinishedJobs}
              className="font-mono text-[11px] text-muted-foreground hover:text-primary"
            >
              clear finished
            </button>
          )}
        </div>
        {!jobs.length && <p className="text-sm text-muted-foreground">Nothing moving</p>}
        <ul className="space-y-3">
          {jobs.slice(0, 12).map((j) => {
            const p = j.total ? Math.min(100, (j.loaded / j.total) * 100) : j.status === "done" ? 100 : 8;
            return (
              <li key={j.id} className="rounded-md border border-border p-3">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <span className="truncate text-sm text-foreground">{j.name}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{Math.round(p)}%</span>
                </div>
                <Progress value={p} className="mt-2 h-1.5" />
                <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                  {humanSize(j.loaded)}
                  {j.total ? ` / ${humanSize(j.total)}` : ""} ·{" "}
                  {j.status === "active" ? humanSpeed(j.bps) : j.status === "done" ? "finished" : j.note}
                  {j.note && j.status !== "error" ? ` · ${j.note}` : ""}
                </p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-[20px] border border-border bg-card p-6">
        {[
          { head: "In the queue", list: queued },
          { head: "Completed", list: done },
        ].map(({ head, list }, i) => (
          <div key={head} className={i > 0 ? "mt-6" : ""}>
            <TransferSection head={head} list={list} kind={view} session={session} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TransfersDialog({
  open,
  onOpenChange,
  kind,
  rows,
  session,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: "sent" | "received";
  rows: FileRow[];
  session: Session;
}) {
  const jobs = useJobs().filter((j) => j.kind === (kind === "sent" ? "send" : "receive"));
  const live = jobs.filter((j) => j.status === "active");
  const queued = rows.filter((r) => r.status === "pending" || r.status === "uploading");
  const done = rows.filter((r) => r.status !== "pending" && r.status !== "uploading");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{kind === "sent" ? "Sending" : "Receiving"}</DialogTitle>
          <DialogDescription>
            {live.length
              ? `${live.length} moving right now`
              : queued.length
                ? `${queued.length} in the queue`
                : "Nothing in the queue — everything is through"}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Right now
              </h3>
              {jobs.some((j) => j.status !== "active") && (
                <button
                  onClick={clearFinishedJobs}
                  className="font-mono text-[11px] text-muted-foreground hover:text-primary"
                >
                  clear finished
                </button>
              )}
            </div>
            {!jobs.length && <p className="text-sm text-muted-foreground">Nothing moving</p>}
            <ul className="space-y-3">
              {jobs.slice(0, 12).map((j) => {
                const p = j.total ? Math.min(100, (j.loaded / j.total) * 100) : j.status === "done" ? 100 : 8;
                return (
                  <li key={j.id} className="rounded-md border border-border p-3">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                      <span className="truncate text-sm text-foreground">{j.name}</span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                        {Math.round(p)}%
                      </span>
                    </div>
                    <Progress value={p} className="mt-2 h-1.5" />
                    <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
                      {humanSize(j.loaded)}
                      {j.total ? ` / ${humanSize(j.total)}` : ""} ·{" "}
                      {j.status === "active"
                        ? humanSpeed(j.bps)
                        : j.status === "done"
                          ? "finished"
                          : j.note}
                      {j.note && j.status !== "error" ? ` · ${j.note}` : ""}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          {[
            { head: "In the queue", list: queued },
            { head: "Completed", list: done },
          ].map(({ head, list }) => (
            <TransferSection key={head} head={head} list={list} kind={kind} session={session} />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TransferSection({
  head,
  list,
  kind,
  session,
}: {
  head: string;
  list: FileRow[];
  kind: "sent" | "received";
  session: Session;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? list.slice(0, 60) : list.slice(0, 6);
  const remaining = list.length - visible.length;

  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{head}</h3>
      {!list.length && <p className="text-sm text-muted-foreground">Nothing here</p>}
      <ul className="space-y-3">
        {visible.map((t) => (
          <li key={t.id} className="rounded-md border border-border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span className="truncate text-sm text-foreground">{t.file_name}</span>
              {kind === "received" && (
                <button
                  onClick={() => downloadTransfer(session, t.id)}
                  className="shrink-0 rounded border border-border px-2 py-1 font-mono text-[11px] text-foreground/80 hover:border-primary hover:text-primary"
                >
                  save
                </button>
              )}
            </div>
            <Progress value={pct(t.status)} className="mt-2 h-1.5" />
            <p className="mt-1.5 font-mono text-[11px] text-muted-foreground">
              {humanSize(t.size_bytes)} ·{" "}
              {kind === "sent" ? `to ${t.to_name ?? "everyone"}` : `from ${t.from_name}`} ·{" "}
              {label(t.status, kind)}
            </p>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 w-full rounded-lg py-1.5 text-center font-mono text-[11px] text-primary hover:bg-cardhover"
        >
          Show {remaining} more
        </button>
      )}
    </section>
  );
}
