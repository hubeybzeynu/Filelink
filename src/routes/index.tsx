import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Terminal } from "@/components/link/Terminal";
import { SidePanel } from "@/components/link/SidePanel";
import { FileExplorerTab } from "@/components/link/FileExplorerTab";
import { TasksTab } from "@/components/link/TasksTab";
import { PcInfoTab } from "@/components/link/PcInfoTab";
import { ControlTab } from "@/components/link/ControlTab";
import { PcActionBar } from "@/components/link/PcActionBar";
import { BackgroundAgentDownload } from "@/components/link/BackgroundAgentDownload";
import { TransfersPanel } from "@/components/link/TransfersDialog";
import { DevicesTab } from "@/components/link/DevicesTab";
import { TransferManager } from "@/components/link/TransferManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Download,
  FolderOpen,
  Inbox,
  Laptop,
  Link as LinkIcon,
  LogOut,
  Menu,
  MonitorSmartphone,
  Plus,
  Power,
  RefreshCw,
  SendHorizontal,
  Settings,
  Terminal as TerminalIcon,
} from "lucide-react";

import {
  api,
  loadSession,
  saveSession,
  updateDevice,
  type DeviceInfo,
  type FileRow,
  type Session,
} from "@/lib/linkClient";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FileLink — Send files PC to PC from the command prompt" },
      {
        name: "description",
        content:
          "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud.",
      },
      { property: "og:title", content: "FileLink — Send files PC to PC from the command prompt" },
      {
        property: "og:description",
        content:
          "Connect two PCs with one link, then send and receive files from the command prompt. Online devices get files instantly, offline devices get them from the cloud.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type MainTab = "files" | "tasks" | "pcinfo" | "control" | "terminal" | "transfers" | "devices";

function loadSeenDeviceIds(roomCode: string): Set<string> {
  try {
    const raw = localStorage.getItem(`filelink:seen-devices:${roomCode}`);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}
function markDeviceSeen(roomCode: string, id: string) {
  try {
    const set = loadSeenDeviceIds(roomCode);
    set.add(id);
    localStorage.setItem(`filelink:seen-devices:${roomCode}`, JSON.stringify([...set]));
  } catch {
    /* best-effort — worst case the banner may reappear once more */
  }
}

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [cwd, setCwd] = useState("/");
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [sent, setSent] = useState<FileRow[]>([]);
  const [received, setReceived] = useState<FileRow[]>([]);
  const [source, setSource] = useState("");
  const [tab, setTab] = useState<MainTab>("files");
  const [transfersView, setTransfersView] = useState<"sent" | "received">("received");
  const [transferManagerHidden, setTransferManagerHidden] = useState(false);
  const [transferManagerCollapsed, setTransferManagerCollapsed] = useState(false);
  const [addDeviceOpen, setAddDeviceOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [newDevice, setNewDevice] = useState<DeviceInfo | null>(null);
  const [rename, setRename] = useState("");

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const refresh = useCallback(async () => {
    if (!session) return;
    try {
      const hb = await api<{ devices: DeviceInfo[] }>("heartbeat", {}, session);
      setDevices(hb.devices);
      const t = await api<{ sent: FileRow[]; received: FileRow[] }>("tasks", {}, session);
      setSent(t.sent);
      setReceived(t.received);
    } catch {
      /* transient */
    }
  }, [session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Detect newly connected devices and show a banner with inline rename.
  // Persisted to localStorage (per room) so a page refresh doesn't treat
  // devices you've already seen/dismissed as brand new again — before this,
  // the "seen" tracking only lived in memory and reset on every reload.
  useEffect(() => {
    if (!session) return;
    const seen = loadSeenDeviceIds(session.roomCode);
    const arrived = devices.find((d) => !seen.has(d.id) && d.id !== session.deviceId);
    if (arrived && !newDevice) {
      setNewDevice(arrived);
      setRename(arrived.name);
      markDeviceSeen(session.roomCode, arrived.id);
    }
  }, [devices, session, newDevice]);

  if (!session) return <Connect onConnected={setSession} />;

  const shareLink =
    typeof window !== "undefined" ? `${window.location.origin}/j/${session.roomCode}` : "";
  const queued = sent.filter((t) => t.status === "pending").length;
  const waiting = received.filter((t) => t.status === "pending").length;
  const onlineCount = devices.filter((d) => d.online).length;
  const backgroundCount = devices.filter((d) => d.online && d.agent).length;
  const inUseCount = onlineCount - backgroundCount;

  const terminalPanel = (
    <div className="h-full min-h-0 rounded-xl border border-border bg-card p-3">
      <Terminal session={session} cwd={cwd} setCwd={setCwd} onChanged={refresh} />
    </div>
  );

  const sidePanel = (
    <SidePanel
      session={session}
      devices={devices}
      sent={sent}
      received={received}
      onRefresh={refresh}
      onOpenDevice={(name) => {
        setSource(name);
        setTab("files");
      }}
    />
  );

  async function confirmRename() {
    if (!newDevice || !session) return;
    try {
      const r = await updateDevice(session, newDevice.id, rename.trim() || newDevice.name);
      setDevices(r.devices);
    } catch {}
    setNewDevice(null);
  }

  const panel = (
    <>
      {tab === "files" && (
        <FileExplorerTab
          session={session}
          devices={devices}
          source={source}
          setSource={setSource}
          onChanged={refresh}
        />
      )}
      {tab === "tasks" && <TasksTab session={session} devices={devices} />}
      {tab === "pcinfo" && <PcInfoTab session={session} devices={devices} />}
      {tab === "control" && <ControlTab session={session} devices={devices} />}
      {tab === "devices" && <DevicesTab session={session} devices={devices} onChanged={setDevices} />}
      {tab === "transfers" && (
        <TransfersPanel session={session} sent={sent} received={received} defaultView={transfersView} />
      )}
      {tab === "terminal" && terminalPanel}
    </>
  );

  const navItems = NAV_ITEMS;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <CursorGlow />
      <Splash />

      {/* Desktop sidebar */}
      <aside className="z-20 hidden h-full w-72 shrink-0 flex-col border-r border-border bg-card p-6 shadow-2xl md:flex">
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/20 text-primary">
            <SendHorizontal className="size-4" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">FileLink</h3>
        </div>

        <nav className="no-scrollbar flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {navItems.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                tab === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-cardhover hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {label}
              {key === "transfers" && waiting + queued > 0 && (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 font-mono text-[10px] ${
                    tab === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/20 text-primary"
                  }`}
                >
                  {waiting + queued}
                </span>
              )}
            </button>
          ))}
          <div className="my-2 w-full border-t border-border/50" />
          <button
            onClick={() => setAddDeviceOpen(true)}
            className="ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-cardhover hover:text-foreground"
          >
            <MonitorSmartphone className="size-4" />
            Add PC Target
          </button>
        </nav>

        <div className="shrink-0 space-y-3 border-t border-border/60 pt-4">
          <div className="flex items-center justify-center gap-1.5">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
              In use {inUseCount}
            </span>
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning">
              Background {backgroundCount}
            </span>
          </div>
          <button
            onClick={() => {
              saveSession(null);
              setSession(null);
            }}
            className="ios-btn flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 py-2.5 text-xs font-semibold text-destructive"
          >
            <LogOut className="size-4" /> Exit room
          </button>
          <p className="text-center font-mono text-[10px] text-muted-foreground">FileLink v2.5</p>
        </div>
      </aside>

      {/* Main area */}
      <div className="animate-main-ui relative flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 md:px-8 md:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="ios-btn grid size-10 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary md:hidden"
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight md:text-2xl">
                {session.roomName}
              </h1>
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Room: {session.roomCode}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden lg:block">
              <PcActionBar
                session={session}
                onSend={() => {
                  setTransfersView("sent");
                  setTab("transfers");
                }}
                onCopy={() => navigator.clipboard?.writeText(shareLink)}
                onShare={() => navigator.clipboard?.writeText(shareLink)}
                onUpload={() => window.dispatchEvent(new Event("filelink:upload"))}
              />
            </div>
            <div className="hidden lg:block">
              <BackgroundAgentDownload
                session={session}
                origin={shareLink.replace(/\/j\/[^/]+$/, "")}
              />
            </div>
            <button
              onClick={() => {
                setTransferManagerHidden(false);
                setTransferManagerCollapsed(false);
              }}
              aria-label="Transfers"
              className={`ios-btn relative grid size-10 place-items-center rounded-xl border ${
                !transferManagerHidden && !transferManagerCollapsed
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Download className="size-4" />
              {waiting + queued > 0 && (
                <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {waiting + queued}
                </span>
              )}
            </button>
            <button
              onClick={() => setAddDeviceOpen(true)}
              className="ios-btn grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Add a device"
            >
              <MonitorSmartphone className="size-4" />
            </button>
            <button
              onClick={() => void refresh()}
              className="ios-btn grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground"
              aria-label="Refresh"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>
        </header>

        {newDevice && (
          <div className="px-4 pt-3 md:px-8">
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm">
                <span className="font-semibold">New device connected!</span>{" "}
                <span className="text-muted-foreground">{newDevice.name}</span>
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={rename}
                  onChange={(e) => setRename(e.target.value)}
                  className="ios-btn rounded-xl border border-border bg-cardhover/60 px-3 py-1.5 font-mono text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={confirmRename}
                  className="ios-btn rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                >
                  Save
                </button>
                <button
                  onClick={() => setNewDevice(null)}
                  className="ios-btn rounded-xl border border-border px-3 py-1.5 text-sm"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex min-h-0 flex-1 gap-4 overflow-y-auto p-4 pb-24 md:overflow-hidden md:p-8 md:pb-8">
          <div className="no-scrollbar flex min-h-0 min-w-0 flex-1 flex-col gap-4 md:overflow-y-auto">
            <div className="flex min-h-[420px] shrink-0 flex-col">{panel}</div>
            <div className="hidden xl:block">
              <CliCard code={session.roomCode} />
            </div>
          </div>
          <div className="no-scrollbar hidden w-[340px] shrink-0 md:overflow-y-auto xl:block">{sidePanel}</div>
        </main>
      </div>

      {/* Mobile floating upload — only inside the File Explorer section */}
      {tab === "files" && (
        <button
          onClick={() => window.dispatchEvent(new Event("filelink:upload"))}
          className="ios-btn fixed bottom-24 right-5 z-30 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-terminal md:hidden"
          aria-label="Add files"
        >
          <Plus className="size-6" />
        </button>
      )}


      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-7 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {navItems.map(({ key, short, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
              tab === key ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <span
              className={`grid h-7 w-12 place-items-center rounded-full ${
                tab === key ? "bg-primary/15" : ""
              }`}
            >
              <Icon className="size-5" />
            </span>
            {short}
            {key === "transfers" && waiting + queued > 0 && (
              <span className="absolute right-3 top-2 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                {waiting + queued}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Mobile menu sheet */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="animate-sheet-up absolute inset-x-0 bottom-0 rounded-t-[28px] border-t border-border bg-card p-6 pb-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-border" />
            <div className="space-y-1.5">
              {navItems.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setMenuOpen(false);
                  }}
                  className={`ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
                    tab === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-cardhover"
                  }`}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
              <button
                onClick={() => {
                  setAddDeviceOpen(true);
                  setMenuOpen(false);
                }}
                className="ios-btn flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground"
              >
                <MonitorSmartphone className="size-4" /> Add PC Target
              </button>
              <button
                onClick={() => {
                  saveSession(null);
                  setSession(null);
                }}
                className="ios-btn flex w-full items-center gap-3 rounded-xl border border-destructive/50 px-4 py-3 text-sm font-semibold text-destructive"
              >
                <LogOut className="size-4" /> Exit room
              </button>
            </div>
          </div>
        </div>
      )}

      <AddDeviceDialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen} session={session} />
      <TransferManager
        hidden={transferManagerHidden}
        setHidden={setTransferManagerHidden}
        collapsed={transferManagerCollapsed}
        setCollapsed={setTransferManagerCollapsed}
      />
    </div>
  );
}

const NAV_ITEMS = [
  { key: "files", label: "File Explorer", short: "Files", Icon: FolderOpen },
  { key: "tasks", label: "Tasks", short: "Tasks", Icon: Inbox },
  { key: "pcinfo", label: "PC Setup", short: "PC", Icon: Settings },
  { key: "control", label: "Control Center", short: "Ctrl", Icon: Power },
  { key: "devices", label: "Devices", short: "Devices", Icon: Laptop },
  { key: "transfers", label: "Transfers", short: "Xfers", Icon: SendHorizontal },
  { key: "terminal", label: "Terminal", short: "Term", Icon: TerminalIcon },
] as const satisfies ReadonlyArray<{
  key: MainTab;
  label: string;
  short: string;
  Icon: typeof FolderOpen;
}>;

function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.opacity = "1";
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    const leave = () => {
      el.style.opacity = "0";
    };
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);
  return <div ref={ref} className="cursor-glow hidden opacity-0 md:block" aria-hidden />;
}

function Splash() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 2400);
    return () => clearTimeout(t);
  }, []);
  if (gone) return null;
  return (
    <div className="animate-splash pointer-events-none fixed inset-0 z-[80] flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center">
        <div className="absolute -inset-4 animate-pulse rounded-full bg-primary/25 blur-2xl" />
        <div className="animate-logo relative size-20 rounded-[22px] bg-gradient-to-tr from-primary via-blue-400 to-indigo-500 p-px shadow-2xl">
          <div className="grid size-full place-items-center rounded-[21px] bg-card">
            <SendHorizontal className="size-9 text-primary" />
          </div>
        </div>
        <h2 className="animate-logo mt-6 text-2xl font-semibold tracking-tight">FileLink</h2>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 animate-ping rounded-full bg-primary" />
          PC to PC Transfer
        </div>
      </div>
    </div>
  );
}


function AddDeviceDialog({
  open,
  onOpenChange,
  session,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  session: Session;
}) {
  const [deviceName, setDeviceName] = useState("My PC");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const name = deviceName.trim() || "My PC";
  // The old version of this command skipped the curl step entirely — as
  // written, "node filelink.mjs connect ..." on its own fails immediately
  // on a fresh PC, since filelink.mjs was never actually downloaded first.
  const command = `curl -O ${origin}/filelink.mjs\nnode filelink.mjs connect ${origin}/j/${session.roomCode} "${name}"`;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MonitorSmartphone className="size-5 text-primary" /> Add a device
          </DialogTitle>
          <DialogDescription>
            Run this on the PC you want to connect, or download the background agent installer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
              Name this PC
            </span>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="My PC"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </label>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-border bg-background p-4 font-mono text-[13px] text-primary">
            {command}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard?.writeText(command)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <LinkIcon className="size-4" /> copy command
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(`${origin}/j/${session.roomCode}`)}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              copy link
            </button>
          </div>
          <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Background agent installer</p>
              <p className="text-xs text-muted-foreground">
                Installs and runs permanently for this room, starting automatically with Windows.
              </p>
            </div>
            <BackgroundAgentDownload session={session} origin={origin} defaultName={name} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CliCard({ code }: { code: string }) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display text-lg font-semibold text-foreground">Use it from the command prompt</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Run these two lines on any PC (Node.js 18+). It stays connected, and files sent to it while it
        was offline download automatically the moment it reconnects.
      </p>
      <pre className="mt-3 overflow-x-auto rounded border border-border bg-background p-4 font-mono text-[13px] text-primary">
        {`curl -O ${origin}/filelink.mjs
node filelink.mjs connect ${origin}/j/${code} "Office PC"`}
      </pre>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        then: ls · cd grade 9 · send report.pdf --to Laptop in /homework · bundle notes · tasks
      </p>
    </section>
  );
}

function Connect({ onConnected }: { onConnected: (s: Session) => void }) {
  const [code, setCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const [deviceName, setDeviceName] = useState("My browser");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromPath = window.location.pathname.match(/^\/j\/([^/]+)/);
    const fromQuery = new URLSearchParams(window.location.search).get("code");
    const found = fromPath?.[1] ?? fromQuery;
    if (found) setCode(found.toUpperCase());
  }, []);

  async function join(joinCode: string) {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{
        room: { code: string; name: string };
        device: { id: string; name: string; token: string };
      }>("register", {
        code: joinCode,
        deviceName: deviceName || "browser",
        platform: "web browser",
      });
      const session: Session = {
        roomCode: r.room.code,
        roomName: r.room.name,
        deviceId: r.device.id,
        deviceToken: r.device.token,
        deviceName: r.device.name,
      };
      saveSession(session);
      onConnected(session);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ room: { code: string } }>("createRoom", {
        name: roomName || "Shared drive",
      });
      await join(r.room.code);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      <CursorGlow />
      <Splash />
      <div className="animate-main-ui w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="ios-btn mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-blue-400 shadow-lg shadow-primary/30">
            <SendHorizontal className="size-7 text-primary-foreground" />
          </div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            filelink
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">PC to PC Transfer</h1>
          <p className="mt-2 px-4 text-sm leading-relaxed text-muted-foreground">
            Connect devices instantly. Online gets files now, offline syncs via the cloud.
          </p>
        </div>

        <div className="ios-card-hover space-y-5 rounded-[24px] border border-border/65 bg-card/90 p-6 shadow-2xl backdrop-blur-xl">
          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Device Name
            </label>
            <input
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="ios-btn w-full rounded-xl border border-border bg-cardhover/60 px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="border-t border-border/50 pt-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Join with Code
            </label>
            <div className="flex gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ABC123"
                className="ios-btn w-full rounded-xl border border-border bg-cardhover/60 px-4 py-3 font-mono text-sm uppercase tracking-widest outline-none focus:border-primary"
              />
              <button
                disabled={busy || !code}
                onClick={() => join(code)}
                className="ios-btn shrink-0 rounded-xl bg-primary px-6 py-3 text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                Join
              </button>
            </div>
          </div>

          <div className="border-t border-border/50 pt-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Or New Room
            </label>
            <div className="flex gap-3">
              <input
                value={roomName}
                onChange={(e) => setRoomName(e.target.value.replace(/#/g, ""))}
                placeholder="Shared drive (optional)"
                className="ios-btn w-full rounded-xl border border-border bg-cardhover/60 px-4 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                disabled={busy}
                onClick={create}
                className="ios-btn shrink-0 rounded-xl border border-primary/30 bg-primary/15 px-6 py-3 text-xs font-semibold text-primary disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>

          {error && <p className="font-mono text-xs text-destructive">{error}</p>}
        </div>

        <ul className="mt-6 space-y-1 text-center font-mono text-xs text-muted-foreground">
          <li>› cd grade 9 · mkdir homework</li>
          <li>› send report.pdf --to Laptop · tasks</li>
        </ul>
      </div>
    </main>
  );
}

