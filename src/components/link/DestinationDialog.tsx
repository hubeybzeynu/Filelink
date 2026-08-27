import { useCallback, useEffect, useState } from "react";
import { ChevronRight, CornerLeftUp, Folder, HardDrive, Loader2, Monitor } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, remoteCall, resolvePath, type DeviceInfo, type Session } from "@/lib/linkClient";

export type Destination = { device: string; path: string };

/**
 * Browse the room or any online PC and pick a destination folder.
 * Used for Copy / Move ("Paste here") and for Send to device.
 */
export function DestinationDialog({
  open,
  onOpenChange,
  session,
  devices,
  title,
  description,
  confirmLabel,
  allowDevicePick,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  session: Session;
  devices: DeviceInfo[];
  title: string;
  description?: string;
  confirmLabel: string;
  allowDevicePick: boolean;
  onConfirm: (dest: Destination) => void;
}) {
  const [device, setDevice] = useState("");
  const [path, setPath] = useState("/");
  const [extra, setExtra] = useState("");

  const [folders, setFolders] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const offline = !!device && !devices.find((d) => d.name === device)?.online;

  const load = useCallback(async () => {
    if (!open) return;
    // An offline PC can't be browsed — the file is queued in the cloud instead.
    if (offline) {
      setFolders([]);
      setError(null);
      setBusy(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!device) {
        const r = await api<{ folders: { name: string }[] }>("ls", { path }, session);
        setFolders(r.folders.map((f) => f.name));
      } else {
        const r = await remoteCall<{ folders: { name: string }[] }>(session, device, "list", {
          path,
        });
        setFolders(r.folders.map((f) => f.name));
      }
    } catch (e) {
      setFolders([]);
      setError((e as Error).message);
    }
    setBusy(false);
  }, [open, device, path, session, offline]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (open) setPath("/");
  }, [open, device]);

  const crumbs = path.split("/").filter(Boolean);
  const targets = devices.filter((d) => d.name !== session.deviceName);
  const clean = extra.replace(/\\/g, "/").split("/").filter(Boolean).join("/");
  const finalPath = clean ? `${path === "/" ? "" : path}/${clean}` : path;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {allowDevicePick && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setDevice("")}
              className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs transition-colors ${
                device === ""
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <HardDrive className="size-4" /> Room
            </button>
            {targets.map((d) => (
              <button
                key={d.id}
                onClick={() => setDevice(d.name)}
                className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-xs transition-colors ${
                  device === d.name
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <Monitor className="size-4" /> {d.name}
                {!d.online && <span className="text-[10px] opacity-70">offline</span>}
              </button>
            ))}
          </div>
        )}

        {offline && (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            {device} is offline — the file is saved in the cloud and delivered automatically the
            moment it comes back online.
          </p>
        )}

        <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground">
          <button onClick={() => setPath("/")} className="shrink-0 hover:text-primary">
            {device || "room"}
          </button>
          {crumbs.map((c, i) => (
            <span key={i} className="flex shrink-0 items-center gap-1">
              <ChevronRight className="size-3" />
              <button
                onClick={() => setPath("/" + crumbs.slice(0, i + 1).join("/"))}
                className="hover:text-primary"
              >
                {c}
              </button>
            </span>
          ))}
        </div>

        <div className="max-h-64 min-h-32 overflow-y-auto rounded-md border border-border">
          {path !== "/" && (
            <button
              onClick={() => setPath(resolvePath(path, ".."))}
              className="flex min-h-11 w-full items-center gap-2 border-b border-border px-3 text-left text-sm text-muted-foreground hover:bg-muted/40"
            >
              <CornerLeftUp className="size-4" /> up one folder
            </button>
          )}
          {busy && (
            <p className="flex items-center gap-2 px-3 py-4 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> loading…
            </p>
          )}
          {error && <p className="px-3 py-4 text-sm text-destructive">{error}</p>}
          {!busy &&
            !error &&
            folders.map((name) => (
              <button
                key={name}
                onClick={() => setPath(resolvePath(path, name))}
                className="flex min-h-11 w-full items-center gap-2 border-b border-border px-3 text-left text-sm text-foreground last:border-0 hover:bg-muted/40"
              >
                <Folder className="size-4 text-warning" /> {name}
              </button>
            ))}
          {!busy && !error && !folders.length && path === "/" && (
            <p className="px-3 py-4 text-sm text-muted-foreground">No folders here yet</p>
          )}
        </div>

        <div>
          <label className="block text-[11px] uppercase tracking-widest text-muted-foreground">
            Or type a folder — it's created if it doesn't exist
          </label>
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="grade 9/homework"
            className="mt-2 h-11 w-full rounded-md border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <span className="min-w-0 truncate font-mono text-xs text-muted-foreground">
            {device ? `@${device}` : "room"}:{finalPath}
          </span>
          <Button onClick={() => onConfirm({ device, path: finalPath })}>{confirmLabel}</Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
