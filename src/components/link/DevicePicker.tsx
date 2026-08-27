import { useMemo, useState } from "react";
import { ChevronDown, Check, Monitor, Search, X } from "lucide-react";
import type { DeviceInfo } from "@/lib/linkClient";

function initials(name: string) {
  const parts = name.replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/);
  if (parts.length === 0) return "PC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function DevicePickerButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`ios-btn flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-medium text-foreground ${className}`}
    >
      <Monitor className="size-3.5 text-primary" />
      <span className="max-w-[8.5rem] truncate">{label}</span>
      <ChevronDown className="size-3 text-muted-foreground" />
    </button>
  );
}

export function DevicePickerDialog({
  open,
  onClose,
  devices,
  selected,
  onSelect,
  allowRoom = false,
  roomLabel = "Cloud room",
  onlineOnly = false,
  excludeName,
  multiple = false,
  selectedNames = [],
  onToggle,
  onSelectAll,
}: {
  open: boolean;
  onClose: () => void;
  devices: DeviceInfo[];
  selected: string;
  onSelect: (name: string) => void;
  allowRoom?: boolean;
  roomLabel?: string;
  onlineOnly?: boolean;
  excludeName?: string;
  /** Multi-select mode: clicking a row toggles it instead of closing the dialog. */
  multiple?: boolean;
  selectedNames?: string[];
  onToggle?: (name: string) => void;
  onSelectAll?: () => void;
}) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return devices
      .filter((d) => (onlineOnly ? d.online : true))
      .filter((d) => (excludeName ? d.name !== excludeName : true))
      .filter((d) => !term || d.name.toLowerCase().includes(term));
  }, [devices, q, onlineOnly, excludeName]);

  const allSelected = multiple && list.length > 0 && list.every((d) => selectedNames.includes(d.name));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-main-ui flex w-full max-w-md flex-col gap-4 rounded-[28px] border border-border bg-card p-6 shadow-terminal md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-foreground md:text-lg">
              {multiple ? "Select PCs" : "Select Target PC"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {multiple ? "Tap to select one or more" : "Choose from connected endpoints"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {multiple && (
              <button
                onClick={onSelectAll}
                className="ios-btn rounded-lg border border-border bg-cardhover px-2 py-1 text-[10px] font-semibold text-foreground hover:border-primary hover:text-primary"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close"
              className="ios-btn grid size-8 place-items-center rounded-full bg-border/60 text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search connected PCs by name..."
            className="w-full rounded-xl border border-border bg-cardhover px-4 py-3 pl-10 text-sm font-medium text-foreground outline-none focus:border-primary"
          />
        </div>

        <div className="no-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
          {allowRoom && !multiple && (
            <button
              onClick={() => {
                onSelect("");
                onClose();
              }}
              className={`ios-card-hover flex w-full items-center justify-between rounded-xl border p-4 text-left ${
                selected === "" ? "border-primary bg-primary/10" : "border-border/60 bg-cardhover/60"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-sm font-bold text-primary">
                  RM
                </div>
                <div className="min-w-0">
                  <span className="block truncate text-sm font-bold text-foreground">{roomLabel}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">Files stored in the cloud</span>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs text-primary">Select →</span>
            </button>
          )}

          {list.map((d) => {
            const isOn = multiple ? selectedNames.includes(d.name) : selected === d.name;
            return (
              <button
                key={d.id}
                onClick={() => {
                  if (multiple) {
                    onToggle?.(d.name);
                  } else {
                    onSelect(d.name);
                    onClose();
                  }
                }}
                className={`ios-card-hover flex w-full items-center justify-between rounded-xl border p-4 text-left ${
                  isOn ? "border-primary bg-primary/10" : "border-border/60 bg-cardhover/60"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                      d.online ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {initials(d.name)}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-bold text-foreground">{d.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {d.online ? "Connected" : "Offline"} · {d.osInfo || d.platform || "PC"}
                      {d.agent ? " · agent" : ""}
                    </span>
                  </div>
                </div>
                {multiple ? (
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                      isOn ? "border-primary bg-primary text-primary-foreground" : "border-border text-transparent"
                    }`}
                  >
                    <Check className="size-3.5" />
                  </span>
                ) : (
                  <span className="shrink-0 font-mono text-xs text-primary">Select →</span>
                )}
              </button>
            );
          })}

          {list.length === 0 && (
            <p className="rounded-xl border border-border/60 bg-cardhover/40 p-6 text-center text-sm text-muted-foreground">
              No matching devices.
            </p>
          )}
        </div>

        {multiple && (
          <button
            onClick={onClose}
            className="ios-btn w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground"
          >
            Done {selectedNames.length > 0 ? `(${selectedNames.length})` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

/** Horizontal strip of available devices, shown once a target is picked. */
export function AvailableDevicesBox({
  devices,
  selected,
  onSelect,
  allowRoom = false,
  roomLabel = "Cloud room",
}: {
  devices: DeviceInfo[];
  selected: string;
  onSelect: (name: string) => void;
  allowRoom?: boolean;
  roomLabel?: string;
}) {
  return (
    <div className="rounded-[20px] border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h4 className="text-xs font-semibold text-muted-foreground">Available devices</h4>
        <span className="font-mono text-[11px] text-muted-foreground">
          {devices.filter((d) => d.online).length} online
        </span>
      </div>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
        {allowRoom && (
          <button
            onClick={() => onSelect("")}
            className={`ios-btn flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
              selected === "" ? "border-primary bg-primary/15 text-primary" : "border-border bg-cardhover/60 text-foreground"
            }`}
          >
            {roomLabel}
          </button>
        )}
        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.name)}
            className={`ios-btn flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium ${
              selected === d.name
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-cardhover/60 text-foreground"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${d.online ? "bg-accent" : "bg-muted-foreground"}`}
            />
            {d.name}
          </button>
        ))}
        {devices.length === 0 && (
          <span className="px-2 py-1 text-xs text-muted-foreground">No other devices in this room yet.</span>
        )}
      </div>
    </div>
  );
}
