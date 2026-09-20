// AI Tab Component - Main AI Assistant Tab for FileLink
// Integrates device selector, chat interface, and task management

import { useState } from "react";
import type { Session, DeviceInfo } from "@/lib/linkClient";
import { AIDeviceSelector } from "./AIDeviceSelector";
import { AIChat } from "./AIChat";

interface AITabProps {
  session: Session;
  devices: DeviceInfo[];
}

export function AITab({ session, devices }: AITabProps) {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card shadow-lg">
      {/* Header with Device Selector */}
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">AI Assistant</h2>
          <p className="text-[10px] text-muted-foreground">Powered by Claude</p>
        </div>

        <AIDeviceSelector
          devices={devices}
          selectedDevices={selectedDevices}
          onSelectionChange={setSelectedDevices}
        />
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <AIChat session={session} devices={devices} selectedDevices={selectedDevices} />
      </div>
    </div>
  );
}
