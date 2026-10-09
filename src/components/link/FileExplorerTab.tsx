import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { FileBrowser } from "@/components/link/FileBrowser";
import type { Session, DeviceInfo } from "@/lib/linkClient";

export function FileExplorerTab({
  session,
  devices,
  source,
  setSource,
  onChanged,
}: {
  session: Session;
  devices: DeviceInfo[];
  source: string;
  setSource: (v: string) => void;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search files and folders…"
          className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 font-mono text-sm text-foreground outline-none focus:border-primary"
        />
      </div>
      <div className="min-h-0 flex-1">
        <FileBrowser
          session={session}
          devices={devices}
          source={source}
          setSource={setSource}
          onChanged={onChanged}
          searchQuery={query}
        />
      </div>
    </div>
  );
}
