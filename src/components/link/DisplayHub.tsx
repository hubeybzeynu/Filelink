import { useEffect, useRef, useState } from "react";
import { Camera, Download, Monitor, MonitorSmartphone, Save, Trash2, Video } from "lucide-react";
import { remoteCall, type Session } from "@/lib/linkClient";
import { addAudit } from "@/lib/audit";

type Mode = "screenshot" | "record" | "camscreenshot" | "camrecord";

const MODES: { key: Mode; label: string; folder: string; btn: string; icon: typeof Camera }[] = [
  { key: "screenshot", label: "Screen Shot", folder: "screenshoot document", btn: "Capture Screen", icon: Camera },
  { key: "record", label: "Screen Record", folder: "record", btn: "Start Recording", icon: Video },
  { key: "camscreenshot", label: "Camera Shot", folder: "room image", btn: "Capture Camera", icon: Camera },
  { key: "camrecord", label: "Camera Record", folder: "vedio", btn: "Start Cam Rec", icon: Video },
];

export function DisplayHub({
  session,
  target,
  onPick,
}: {
  session: Session;
  target: string;
  onPick?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("screenshot");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  const cfg = MODES.find((m) => m.key === mode)!;

  useEffect(() => () => {
    if (timer.current) window.clearInterval(timer.current);
  }, []);

  async function capture() {
    if (!target) {
      setNote("Pick a target PC first.");
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const r = await remoteCall<{ image?: string; data?: string; error?: string }>(
        session,
        target,
        "screenshot",
      );
      if (r.error) throw new Error(r.error);
      const data = r.image || r.data;
      if (!data) throw new Error("no image returned");
      const src = data.startsWith("data:") ? data : `data:image/jpeg;base64,${data}`;
      setImage(src);
      addAudit("Display", `${cfg.label}: captured frame`, "SUCCESS", target);
    } catch (e) {
      setNote(`Failed: ${(e as Error).message}`);
      addAudit("Display", `${cfg.label} failed: ${(e as Error).message}`, "ERROR", target);
    }
    setBusy(false);
  }

  function toggleRecord() {
    if (!target) {
      setNote("Pick a target PC first.");
      return;
    }
    if (!live) {
      setLive(true);
      addAudit("Display", `${cfg.label}: live capture started`, "INFO", target);
      void capture();
      timer.current = window.setInterval(() => void capture(), 2000);
    } else {
      setLive(false);
      if (timer.current) window.clearInterval(timer.current);
      addAudit("Display", `${cfg.label}: live capture stopped`, "INFO", target);
    }
  }

  function saveToCloud() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `${cfg.folder.replace(/\s+/g, "-")}-${Date.now()}.jpg`;
    a.click();
    addAudit("Display", `Saved capture to folder: ${cfg.folder}`, "SUCCESS", target);
  }

  return (
    <div className="rounded-[20px] border border-border bg-card p-5 md:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/15 text-primary">
            <MonitorSmartphone className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Display &amp; Capture Hub</h3>
            <p className="text-xs text-muted-foreground">
              Screen mirroring, webcam feeds, and archive workflows for {target || "target host"}.
            </p>
          </div>
        </div>
        <button
          onClick={onPick}
          className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2 text-xs font-semibold text-foreground hover:text-primary"
        >
          <Monitor className="size-4 text-primary" />
          {target || "Select Target PC"}
        </button>
      </div>

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <button
              key={m.key}
              onClick={() => {
                setMode(m.key);
                setImage(null);
                if (live) toggleRecord();
              }}
              className={`ios-btn shrink-0 rounded-xl px-4 py-2 text-xs font-semibold ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-cardhover text-muted-foreground hover:text-foreground"
              }`}
            >
              <m.icon className="mr-1.5 inline size-4" />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-black">
        {image ? (
          <img src={image} alt="capture preview" className="max-h-[420px] w-full object-contain" />
        ) : (
          <div className="p-10 text-center text-xs text-muted-foreground">
            <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-border">
              <cfg.icon className="size-5 text-primary" />
            </div>
            {target ? `Ready to route into "${cfg.folder}"` : "Select a device to begin."}
          </div>
        )}
        {live && (
          <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-warning/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-warning">
            <span className="size-1.5 animate-pulse rounded-full bg-warning" /> LIVE STREAMING
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={!target || busy}
          onClick={() => (mode === "record" || mode === "camrecord" ? toggleRecord() : void capture())}
          className="ios-btn flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
        >
          <cfg.icon className="size-4" />
          {mode === "record" || mode === "camrecord"
            ? live ? "Stop Recording" : cfg.btn
            : busy ? "Capturing…" : cfg.btn}
        </button>
        <button
          disabled={!image}
          onClick={saveToCloud}
          className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
        >
          <Save className="size-4" /> Save to {cfg.folder}
        </button>
        <button
          disabled={!image}
          onClick={() => {
            if (!image) return;
            const a = document.createElement("a");
            a.href = image;
            a.download = `capture-${Date.now()}.jpg`;
            a.click();
          }}
          className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground hover:text-primary disabled:opacity-40"
        >
          <Download className="size-4" /> Download
        </button>
        <button
          disabled={!image}
          onClick={() => setImage(null)}
          className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-40"
        >
          <Trash2 className="size-4" /> Clear
        </button>
      </div>
      {note && <p className="mt-4 font-mono text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}
