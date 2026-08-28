import { useState } from "react";
import { AlertTriangle, Check, Monitor, Pencil, Trash2, X } from "lucide-react";
import { deleteDevice, updateDevice, type DeviceInfo, type Session } from "@/lib/linkClient";

export function DevicesTab({
  session,
  devices,
  onChanged,
}: {
  session: Session;
  devices: DeviceInfo[];
  onChanged: (devices: DeviceInfo[]) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveRename(id: string) {
    const name = editValue.trim();
    if (!name) return;
    setBusyId(id);
    setError(null);
    try {
      const r = await updateDevice(session, id, name);
      onChanged(r.devices);
      setEditingId(null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  async function confirmDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const r = await deleteDevice(session, id);
      onChanged(r.devices);
      setConfirmId(null);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyId(null);
  }

  const target = devices.find((d) => d.id === confirmId);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h2 className="text-base font-bold leading-tight text-foreground md:text-2xl">Devices</h2>
        <span className="font-mono text-xs uppercase tracking-widest text-primary">
          {devices.length} in this room
        </span>
      </div>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {devices.map((d) => {
          const isSelf = d.id === session.deviceId;
          const editing = editingId === d.id;
          return (
            <div
              key={d.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  d.online ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Monitor className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                {editing ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveRename(d.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded-lg border border-primary bg-cardhover px-2 py-1 text-sm text-foreground outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-foreground">{d.name}</span>
                    {isSelf && (
                      <span className="shrink-0 rounded-full bg-cardhover px-2 py-0.5 text-[10px] text-muted-foreground">
                        this one
                      </span>
                    )}
                  </div>
                )}
                <span className="font-mono text-[11px] text-muted-foreground">
                  {d.online ? "Connected" : "Offline"} · {d.osInfo || d.platform || "PC"}
                  {d.agent ? " · background agent" : ""}
                </span>
              </div>

              {editing ? (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    disabled={busyId === d.id}
                    onClick={() => void saveRename(d.id)}
                    className="ios-btn grid size-8 place-items-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
                    aria-label="Save name"
                  >
                    <Check className="size-4" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground"
                    aria-label="Cancel"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => {
                      setEditingId(d.id);
                      setEditValue(d.name);
                    }}
                    className="ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground hover:text-primary"
                    aria-label={`Rename ${d.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  {!isSelf && (
                    <button
                      onClick={() => setConfirmId(d.id)}
                      className="ios-btn grid size-8 place-items-center rounded-full bg-cardhover text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${d.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {devices.length === 0 && (
          <p className="rounded-2xl border border-border/60 bg-cardhover/40 p-8 text-center text-sm text-muted-foreground">
            No devices in this room yet.
          </p>
        )}
      </div>

      {target && (
        <div className="fixed inset-0 z-[110] grid place-items-center bg-black/75 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-[28px] border border-border bg-card p-6 shadow-2xl">
            <AlertTriangle className="mx-auto size-9 text-destructive" />
            <h4 className="mt-3 text-center text-base font-bold text-foreground">Delete {target.name}?</h4>
            <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
              {target.online
                ? "It's currently online — the agent will be told to uninstall itself (removing filelink.mjs, its startup shortcut, and its data folder) before being removed from this room."
                : "It's offline right now, so it'll just be removed from this room's device list. If it reconnects later, it'll show up again as a new device."}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="ios-btn flex-1 rounded-xl border border-border bg-cardhover px-4 py-2.5 text-xs font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                disabled={busyId === target.id}
                onClick={() => void confirmDelete(target.id)}
                className="ios-btn flex-1 rounded-xl bg-destructive px-4 py-2.5 text-xs font-bold text-destructive-foreground disabled:opacity-40"
              >
                {busyId === target.id ? "Removing…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
