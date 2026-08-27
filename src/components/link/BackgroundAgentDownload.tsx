import { useState } from "react";
import { Download, Monitor } from "lucide-react";
import type { Session } from "@/lib/linkClient";
import { buildAgentInstaller, downloadAgentInstaller } from "@/lib/agentScript";

export function BackgroundAgentDownload({
  session,
  origin,
  defaultName,
}: {
  session: Session;
  origin: string;
  defaultName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName || session.deviceName || "Office PC");
  const [copied, setCopied] = useState(false);
  const [elevate, setElevate] = useState(true);

  const resolvedOrigin = origin || (typeof window !== "undefined" ? window.location.origin : "");
  const deviceName = name.trim() || "My PC";

  function run(action: "download" | "copy") {
    if (action === "download") {
      downloadAgentInstaller({ origin: resolvedOrigin, roomCode: session.roomCode, deviceName, elevate });
      setOpen(false);
      return;
    }
    void navigator.clipboard
      ?.writeText(buildAgentInstaller({ origin: resolvedOrigin, roomCode: session.roomCode, deviceName, elevate }))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="ios-btn flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
      >
        <Download className="size-4" /> Agent
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-ios-rise absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-border bg-card p-4 shadow-ios">
            <div className="flex items-center gap-2 text-foreground">
              <Monitor className="size-4 text-primary" />
              <span className="text-sm font-bold">Name this PC</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              The installer registers the agent under this name so you can tell your devices apart in the room.
            </p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Office PC"
              className="mt-3 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />

            <div className="mt-3 flex rounded-xl border border-border bg-cardhover/60 p-1">
              <button
                onClick={() => setElevate(true)}
                className={`ios-btn flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
                  elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                With admin
              </button>
              <button
                onClick={() => setElevate(false)}
                className={`ios-btn flex-1 rounded-lg py-1.5 text-[11px] font-semibold ${
                  !elevate ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Without admin
              </button>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
              {elevate
                ? "Shows a real Windows admin approval prompt before installing — the background agent, running with Windows, full remote control."
                : "Installs the same permanent background agent, immediately, with no prompt at all."}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => run("download")}
                className="ios-btn flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-xs font-semibold text-primary-foreground shadow-md shadow-primary/25"
              >
                <Download className="size-4" /> Download .cmd
              </button>
              <button
                onClick={() => run("copy")}
                className="ios-btn rounded-xl border border-border bg-cardhover px-3 py-2.5 text-xs font-semibold text-foreground hover:text-primary"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 font-mono text-[10px] text-muted-foreground">
              {resolvedOrigin}/j/{session.roomCode} · "{deviceName}"
            </p>
          </div>
        </>
      )}
    </div>
  );
}
