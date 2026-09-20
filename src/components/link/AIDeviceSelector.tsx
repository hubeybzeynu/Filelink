// Device Selector Component for AI Assistant
// Supports single selection, multiple selection, and "ALL DEVICES"

import { useState } from "react";
import { Check, ChevronDown, Laptop, MonitorSmartphone } from "lucide-react";
import type { DeviceInfo } from "@/lib/linkClient";

interface AIDeviceSelectorProps {
  devices: DeviceInfo[];
  selectedDevices: string[]; // device IDs or ["all"]
  onSelectionChange: (deviceIds: string[]) => void;
}

export function AIDeviceSelector({
  devices,
  selectedDevices,
  onSelectionChange,
}: AIDeviceSelectorProps) {
  const [open, setOpen] = useState(false);

  const isAllSelected = selectedDevices.includes("all");

  const toggleDevice = (deviceId: string) => {
    if (isAllSelected) {
      // If "all" was selected, switch to just this device
      onSelectionChange([deviceId]);
      return;
    }

    if (selectedDevices.includes(deviceId)) {
      // Unselect device (ensure at least one or none)
      const next = selectedDevices.filter((id) => id !== deviceId);
      onSelectionChange(next);
    } else {
      // Add device to selection
      onSelectionChange([...selectedDevices, deviceId]);
    }
  };

  const selectAll = () => {
    onSelectionChange(["all"]);
  };

  const onlineCount = devices.filter((d) => d.online).length;
  const totalCount = devices.length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="ios-btn flex items-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2 text-xs font-medium backdrop-blur hover:bg-cardhover"
      >
        <MonitorSmartphone className="size-4 text-primary" />
        <span>
          {isAllSelected
            ? `All Devices (${totalCount})`
            : selectedDevices.length === 0
              ? "Select Device"
              : selectedDevices.length === 1
                ? devices.find((d) => d.id === selectedDevices[0])?.name || "1 Device"
                : `${selectedDevices.length} Devices`}
        </span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between px-2 pb-2 border-b border-border/50 text-xs font-semibold text-muted-foreground">
              <span>Target Devices</span>
              <span className="text-[10px] text-primary">
                {onlineCount}/{totalCount} Online
              </span>
            </div>

            {/* Select All Option */}
            <button
              onClick={selectAll}
              className={`ios-btn flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                isAllSelected
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-cardhover text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <Laptop className="size-4" />
                <span>All Devices</span>
              </div>
              {isAllSelected && <Check className="size-4" />}
            </button>

            <div className="my-2 border-t border-border/30" />

            {/* Individual Devices */}
            <div className="max-h-60 space-y-1 overflow-y-auto no-scrollbar">
              {devices.map((device) => {
                const isSelected = !isAllSelected && selectedDevices.includes(device.id);

                return (
                  <button
                    key={device.id}
                    onClick={() => toggleDevice(device.id)}
                    className={`ios-btn flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "hover:bg-cardhover text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-2 rounded-full shrink-0 ${
                          device.online ? "bg-green-500" : "bg-muted-foreground/40"
                        }`}
                      />
                      <div className="flex flex-col items-start truncate">
                        <span className="truncate font-medium">{device.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {device.online ? "Online" : "Offline"} · {device.osInfo || "PC"}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
