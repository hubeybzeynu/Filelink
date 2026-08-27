import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ClipboardPaste,
  Copy,
  CornerLeftUp,
  Download,
  Eye,

  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  FolderPlus,
  FolderTree,

  HardDrive,
  Home,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Monitor,
  Package,
  PenLine,
  RefreshCw,
  Scissors,
  
  Send,
  Trash2,
  Upload,
  WifiOff,
  X,
} from "lucide-react";
import { DestinationDialog, type Destination } from "@/components/link/DestinationDialog";
import { DevicePickerButton, DevicePickerDialog, AvailableDevicesBox } from "@/components/link/DevicePicker";
import { UploadSheet } from "@/components/link/UploadSheet";
import { PasswordDialog } from "@/components/link/PasswordDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isUnlocked } from "@/lib/lock";

import { makeZip, saveBlob } from "@/lib/zip";

import {
  api,
  copyMoveItems,
  downloadTransfer,
  humanSize,
  readSnapshot,
  remoteCall,
  remoteDownload,
  remoteFetchBytes,
  remoteUploadFile,

  removeItems,
  renameItem,
  resolvePath,
  uploadFile,
  writeSnapshot,
  type DeviceInfo,
  type FileRow,
  type PickItem,
  type Session,
} from "@/lib/linkClient";

type Item = {
  kind: "folder" | "file";
  name: string;
  size: number;
  id?: string;
  meta?: string;
};

const EXT_ICON: { test: RegExp; icon: typeof FileIcon; tone: string }[] = [
  { test: /\.(png|jpe?g|gif|webp|svg|bmp|heic|avif|ico)$/i, icon: FileImage, tone: "text-accent" },
  { test: /\.(mp4|mov|mkv|avi|webm|m4v)$/i, icon: FileVideo, tone: "text-accent" },
  { test: /\.(mp3|wav|flac|ogg|m4a)$/i, icon: FileAudio, tone: "text-accent" },
  { test: /\.(zip|rar|7z|tar|gz|bz2|xz|apk|jar|iso)$/i, icon: FileArchive, tone: "text-warning" },
  { test: /\.(pdf|docx?|rtf|odt|txt|md|pages)$/i, icon: FileText, tone: "text-destructive" },
  { test: /\.(xlsx?|csv|numbers|ods|pptx?)$/i, icon: FileSpreadsheet, tone: "text-primary" },
  {
    test: /\.(js|mjs|ts|tsx|jsx|py|java|kt|c|h|cpp|cs|go|rs|rb|php|swift|html|css|json|yml|yaml|sh|bat|sql|exe|msi|dmg|app)$/i,
    icon: FileCode2,
    tone: "text-primary",
  },
];

function iconFor(item: Item) {
  if (item.kind === "folder") return { Icon: Folder, tone: "text-warning" };
  const hit = EXT_ICON.find((e) => e.test.test(item.name));
  return { Icon: hit?.icon ?? FileIcon, tone: hit?.tone ?? "text-muted-foreground" };
}

export function FileBrowser({
  session,
  devices,
  source,
  setSource,
  onChanged,
  searchQuery = "",
}: {
  session: Session;
  devices: DeviceInfo[];
  /** "" = the shared room in the cloud, otherwise a device browsed live */
  source: string;
  setSource: (v: string) => void;
  onChanged: () => void;
  searchQuery?: string;
}) {

  const [path, setPath] = useState("/");
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState<number | null>(null);
  const [disk, setDisk] = useState<{ total: number; free: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [clipboard, setClipboard] = useState<{
    mode: "copy" | "move";
    items: PickItem[];
    /** "" when the items live in the cloud room, otherwise the device name */
    from: string;
    /** folder the items were picked from */
    base: string;
  } | null>(null);

  const [pasteOpen, setPasteOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [lockReason, setLockReason] = useState<string | null>(null);
  const pending = useRef<(() => void) | null>(null);

  const [preview, setPreview] = useState<{
    open: boolean;
    item: Item | null;
    url: string | null;
    text: string | null;
    kind: "image" | "text" | "pdf" | "audio" | "video" | "binary";
  }>({ open: false, item: null, url: null, text: null, kind: "binary" });

  const [deviceModal, setDeviceModal] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [treeEntries, setTreeEntries] = useState<{ path: string; dir: boolean }[]>([]);

  // The mobile floating button lives in the page shell and asks us to open the picker.
  useEffect(() => {
    const open = () => setUploadOpen(true);
    window.addEventListener("filelink:upload", open);
    return () => window.removeEventListener("filelink:upload", open);
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pullStart = useRef<number | null>(null);
  const [pull, setPull] = useState(0);

  /** Ask for the passcode once per browser session before sensitive actions. */
  function guarded(reason: string, run: () => void) {
    if (isUnlocked()) return run();
    pending.current = run;
    setLockReason(reason);
  }


  const isRoom = !source;
  const device = devices.find((d) => d.name === source);
  const deviceOnline = !!device?.online;

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    setCached(null);
    try {
      if (!source) {
        const r = await api<{ folders: { name: string }[]; files: FileRow[] }>(
          "ls",
          { path },
          session,
        );
        setItems([
          ...r.folders.map<Item>((f) => ({ kind: "folder", name: f.name, size: 0 })),
          ...r.files.map<Item>((f) => ({
            kind: "file",
            name: f.file_name,
            size: f.size_bytes,
            id: f.id,
            meta: `from ${f.from_name}${f.to_name ? ` → ${f.to_name}` : ""}`,
          })),
        ]);
        setDisk(null);
      } else {
        const r = await remoteCall<{
          folders: { name: string }[];
          files: { name: string; size: number }[];
        }>(session, source, "list", { path });
        const next: Item[] = [
          ...r.folders.map<Item>((f) => ({ kind: "folder", name: f.name, size: 0 })),
          ...r.files.map<Item>((f) => ({ kind: "file", name: f.name, size: f.size })),
        ];
        setItems(next);
        writeSnapshot(session.roomCode, source, path, next);
        try {
          const d = await remoteCall<{ total: number; free: number }>(session, source, "disk");
          setDisk(d);
        } catch {
          setDisk(null);
        }
      }
    } catch (e) {
      // Offline (or unreachable): fall back to the last snapshot we saved.
      const snap = source ? readSnapshot(session.roomCode, source, path) : null;
      if (snap) {
        setItems(snap.items);
        setCached(snap.at);
      } else {
        setItems([]);
        setError((e as Error).message);
      }
    }
    setBusy(false);
  }, [session, source, path]);

  useEffect(() => {
    setSelected([]);
    void load();
  }, [load]);

  // As soon as an offline device comes back, refresh the cached tree.
  const wasOnline = useRef(deviceOnline);
  useEffect(() => {
    if (source && deviceOnline && !wasOnline.current) void load();
    wasOnline.current = deviceOnline;
  }, [deviceOnline, source, load]);

  const crumbs = useMemo(() => path.split("/").filter(Boolean), [path]);
  const shown = useMemo(
    () =>
      searchQuery.trim()
        ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
        : items,
    [items, searchQuery],
  );

  const picked = items.filter((i) => selected.includes(i.name));
  const pickItems: PickItem[] = picked.map((i) => ({
    kind: i.kind,
    name: i.name,
    id: i.id,
    path: i.kind === "folder" ? resolvePath(path, i.name) : undefined,
  }));

  function toggle(item: Item) {
    setSelected((s) =>
      s.includes(item.name) ? s.filter((n) => n !== item.name) : [...s, item.name],
    );
  }

  async function act(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setStatus(label);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    }
    setStatus(null);
    setBusy(false);
  }

  const rel = (name: string) => `${path === "/" ? "" : path}/${name}`;

  const download = () =>
    act("downloading…", async () => {
      const hasFolder = picked.some((item) => item.kind === "folder");
      if (hasFolder) {
        // Folders can't be downloaded directly — bundle everything selected
        // (files + folders) into one zip instead of silently skipping them.
        await doBundle();
        return;
      }
      for (const item of picked) {
        if (isRoom) await downloadTransfer(session, item.id!);
        else await remoteDownload(session, source, rel(item.name));
      }
      onChanged();
    });

  /** One file's bytes, from the room or from a live PC. */
  async function fileBytes(item: { id?: string; name: string }, dir: string): Promise<Blob> {
    if (isRoom) {
      const { url } = await api<{ url: string }>("download", { transferId: item.id }, session);
      return await (await fetch(url)).blob();
    }
    return await remoteFetchBytes(session, source, `${dir === "/" ? "" : dir}/${item.name}`);
  }

  /** Walk a folder and collect every file inside it, keeping relative paths. */
  async function walkFolder(
    dir: string,
    prefix: string,
    out: { name: string; bytes: Uint8Array }[],
  ) {
    let folders: { name: string }[] = [];
    let files: { name: string; id?: string }[] = [];
    if (isRoom) {
      const r = await api<{ folders: { name: string }[]; files: FileRow[] }>(
        "ls",
        { path: dir },
        session,
      );
      folders = r.folders ?? [];
      files = (r.files ?? []).map((f) => ({ name: f.file_name, id: f.id }));
    } else {
      const r = await remoteCall<{
        folders: { name: string }[];
        files: { name: string; size: number }[];
      }>(session, source, "list", { path: dir });
      folders = r.folders ?? [];
      files = r.files ?? [];
    }
    for (const f of files) {
      const blob = await fileBytes(f, dir);
      out.push({ name: `${prefix}${f.name}`, bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    for (const sub of folders) {
      await walkFolder(
        `${dir === "/" ? "" : dir}/${sub.name}`,
        `${prefix}${sub.name}/`,
        out,
      );
    }
  }

  async function doBundle() {
    const entries: { name: string; bytes: Uint8Array }[] = [];
    for (const item of picked) {
      if (item.kind === "folder") {
        await walkFolder(resolvePath(path, item.name), `${item.name}/`, entries);
        continue;
      }
      const blob = await fileBytes(item, path);
      entries.push({ name: item.name, bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    if (!entries.length) throw new Error("Nothing to bundle — the selection is empty");
    const single = picked.length === 1 && picked[0]?.kind === "folder" ? picked[0].name : null;
    saveBlob(makeZip(entries), `${single ?? `filelink-bundle-${Date.now()}`}.zip`);
  }

  const bundle = () => act("packaging…", doBundle);

  const remove = () =>
    act("deleting…", async () => {
      if (!isRoom) throw new Error("Files on a PC can never be deleted from here");
      await removeItems(session, pickItems);
      setSelected([]);
      onChanged();
      await load();
    });

  const renameSelected = () => {
    const target = pickItems[0];
    if (!target) return;
    const next = window.prompt("New name", target.name);
    if (!next || next.trim() === target.name) return;
    void act("renaming…", async () => {
      await renameItem(session, target, next.trim());
      setSelected([]);
      onChanged();
      await load();
    });
  };

  /** Read one clipboard entry as bytes, wherever it currently lives. */
  async function grabBytes(from: string, base: string, name: string, id?: string) {
    if (!from) {
      const { url } = await api<{ url: string }>("download", { transferId: id }, session);
      return await (await fetch(url)).blob();
    }
    return await remoteFetchBytes(session, from, `${base === "/" ? "" : base}/${name}`);
  }

  const paste = (dest: Destination) =>
    act("pasting…", async () => {
      if (!clipboard) return;
      const { items: clip, mode, from, base } = clipboard;
      if (!from && !dest.device) {
        // Room → room: a real copy/move, folders included.
        await copyMoveItems(session, clip, dest.path, mode);
      } else {
        // Anything crossing a machine boundary travels as files.
        for (const it of clip) {
          if (it.kind === "folder") continue;
          const blob = await grabBytes(from, base, it.name, it.id);
          await uploadFile(session, new File([blob], it.name), dest.path, dest.device || null);
        }
        if (mode === "move" && !from) await removeItems(session, clip);
      }
      setClipboard(null);
      setPasteOpen(false);
      onChanged();
      await load();
    });


  const sendTo = (dest: Destination) =>
    act("sending…", async () => {
      const target = dest.device || null;
      for (const item of picked) {
        if (item.kind === "folder") continue;
        let blob: Blob;
        if (isRoom) {
          const { url } = await api<{ url: string }>("download", { transferId: item.id }, session);
          blob = await (await fetch(url)).blob();
        } else {
          blob = await remoteFetchBytes(session, source, rel(item.name));
        }
        await uploadFile(session, new File([blob], item.name), dest.path, target);
      }
      setSendOpen(false);
      setSelected([]);
      onChanged();
    });

  async function onUpload(files: File[]) {
    if (!files.length) return;
    const batch =
      files.length > 1 ? { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, total: files.length } : undefined;
    await act("uploading…", async () => {
      let i = 0;
      for (const file of files) {
        i++;
        setStatus(files.length > 1 ? `uploading ${i} of ${files.length}: ${file.name}` : `uploading ${file.name}…`);
        if (isRoom) await uploadFile(session, file, path, null, batch);
        // On a live PC the file is written straight into the folder you're in.
        else await remoteUploadFile(session, source, path, file, batch);
      }
      onChanged();
      await load();
    });
  }

  async function newFolder() {
    const name = window.prompt("Folder name");
    if (!name) return;
    await act(`creating ${name}…`, async () => {
      if (isRoom) await api("mkdir", { path, name }, session);
      else await remoteCall(session, source, "mkdir", { path: `${path === "/" ? "" : path}/${name}` });
      onChanged();
      await load();
    });
  }


  function isTextFile(name: string) {
    return /\.(txt|md|json|js|mjs|cjs|ts|tsx|jsx|py|java|kt|c|h|cpp|cs|go|rs|rb|php|swift|html|css|yml|yaml|sh|bat|sql|log|cfg|ini|xml|csv)$/i.test(
      name,
    );
  }

  function isImageFile(name: string) {
    return /\.(png|jpe?g|gif|webp|svg|bmp|heic|avif|ico)$/i.test(name);
  }

  async function previewItem(item: Item) {
    if (item.kind === "folder") return;
    await act("opening preview…", async () => {
      let blob: Blob;
      if (isRoom) {
        const { url } = await api<{ url: string }>("download", { transferId: item.id }, session);
        const res = await fetch(url);
        blob = await res.blob();
      } else {
        blob = await remoteFetchBytes(session, source, rel(item.name));
      }

      if (isImageFile(item.name)) {
        const url = URL.createObjectURL(blob);
        setPreview({ open: true, item, url, text: null, kind: "image" });
      } else if (/\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(item.name)) {
        const url = URL.createObjectURL(blob);
        setPreview({ open: true, item, url, text: null, kind: "audio" });
      } else if (/\.(mp4|webm|mov|m4v|ogv)$/i.test(item.name)) {
        const url = URL.createObjectURL(blob);
        setPreview({ open: true, item, url, text: null, kind: "video" });
      } else if (isTextFile(item.name) || blob.size < 256 * 1024) {
        const text = await blob.text();
        setPreview({ open: true, item, url: null, text, kind: "text" });
      } else if (/\.pdf$/i.test(item.name)) {
        const url = URL.createObjectURL(blob);
        setPreview({ open: true, item, url, text: null, kind: "pdf" });
      } else {
        setPreview({ open: true, item, url: null, text: null, kind: "binary" });
      }
    });
  }

  async function showTree() {
    await act("loading tree…", async () => {
      if (isRoom) {
        const r = await api<{ folders: { path: string; parent_path: string; name: string }[] }>(
          "tree",
          {},
          session,
        );
        setTreeEntries((r.folders ?? []).map((f) => ({ path: f.path, dir: true })));
      } else {
        const r = await remoteCall<{ entries: { path: string; dir: boolean }[] }>(
          session,
          source,
          "tree",
          { path },
        );
        setTreeEntries(r.entries ?? []);
      }
      setTreeOpen(true);
    });
  }

  return (

    <section
      className={
        fullscreen
          ? "fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden bg-card"
          : "flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card"
      }
    >
      {/* location bar */}
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1.5 font-mono text-[11px] whitespace-nowrap text-muted-foreground 2xl:flex">
              {isRoom ? <HardDrive className="size-3.5" /> : <Monitor className="size-3.5" />}
              {isRoom ? "cloud room" : deviceOnline ? "live PC" : "cached"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => showTree()}
              className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary"
              aria-label="Directory tree"
            >
              <FolderTree className="size-4" />
            </button>
            <button
              onClick={() => {
                const file = picked.find((i) => i.kind === "file");
                if (file) void previewItem(file);
              }}
              disabled={!picked.find((i) => i.kind === "file")}
              className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary disabled:opacity-30"
              aria-label="Preview selected file"
            >
              <Eye className="size-4" />
            </button>
            <button
              onClick={() => setView(view === "grid" ? "list" : "grid")}
              className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary"
              aria-label={view === "grid" ? "Show as a list" : "Show as a grid"}
            >
              {view === "grid" ? <List className="size-4" /> : <LayoutGrid className="size-4" />}
            </button>

            <button
              onClick={() =>
                fullscreen
                  ? setFullscreen(false)
                  : guarded("Enter the passcode to open fullscreen mode.", () =>
                      setFullscreen(true),
                    )
              }
              className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary"
              aria-label={fullscreen ? "Leave fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <DevicePickerButton
              label={source || `Room — ${session.roomName}`}
              onClick={() => setDeviceModal(true)}
            />
            <button
              onClick={() => void load()}
              className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary"
              aria-label="Refresh"
            >
              <RefreshCw className={`size-4 ${busy ? "animate-spin" : ""}`} />
            </button>

            {(isRoom || deviceOnline) && (
              <>
                <button
                  onClick={newFolder}
                  className="grid size-10 place-items-center rounded-md text-muted-foreground transition-colors hover:text-primary"
                  aria-label="New folder"
                >
                  <FolderPlus className="size-4" />
                </button>
                <button
                  onClick={() => setUploadOpen(true)}
                  className="flex h-10 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Upload className="size-4" /> <span className="hidden sm:inline">Upload</span>
                </button>
              </>
            )}

          </div>
        </div>

        {source && (
          <AvailableDevicesBox
            devices={devices.filter((d) => d.name !== session.deviceName)}
            selected={source}
            onSelect={(name) => {
              setSource(name);
              setPath("/");
            }}
            allowRoom
            roomLabel={`Room — ${session.roomName}`}
          />
        )}

        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setPath("/")}
            className="grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:text-primary"
            aria-label="Top folder"
          >
            <Home className="size-4" />
          </button>
          {path !== "/" && (
            <button
              onClick={() => setPath(resolvePath(path, ".."))}
              className="grid size-8 shrink-0 place-items-center rounded text-muted-foreground hover:text-primary"
              aria-label="Up one folder"
            >
              <CornerLeftUp className="size-4" />
            </button>
          )}
          <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto font-mono text-xs text-muted-foreground">
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
          </nav>
          {disk && (
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {humanSize(disk.free)} free / {humanSize(disk.total)}
            </span>
          )}
        </div>

      </div>

      {/* items — pull down on a phone to refresh */}
      <div
        ref={scrollRef}
        onTouchStart={(e) => {
          pullStart.current = scrollRef.current?.scrollTop === 0 ? e.touches[0].clientY : null;
        }}
        onTouchMove={(e) => {
          if (pullStart.current === null) return;
          setPull(Math.max(0, Math.min(70, e.touches[0].clientY - pullStart.current)));
        }}
        onTouchEnd={() => {
          if (pull > 55) void load();
          pullStart.current = null;
          setPull(0);
        }}
        className="min-h-0 flex-1 overflow-y-auto p-3 [-webkit-overflow-scrolling:touch]"
      >
        {pull > 0 && (
          <p
            className="mb-2 text-center font-mono text-[11px] text-primary"
            style={{ height: pull / 2 }}
          >
            {pull > 55 ? "release to refresh" : "pull to refresh"}
          </p>
        )}
        {cached && (
          <p className="mb-3 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 font-mono text-[11px] text-warning">
            <WifiOff className="size-3.5" /> {source} is offline — showing the last known files
          </p>
        )}
        {error && <p className="mb-3 font-mono text-xs text-destructive">{error}</p>}
        {status && <p className="mb-3 font-mono text-xs text-muted-foreground">{status}</p>}
        {!shown.length && !busy && (
          <p className="py-10 text-center text-sm text-muted-foreground">Nothing here</p>
        )}

        <div
          className={
            view === "grid"
              ? "grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[repeat(auto-fill,minmax(124px,1fr))]"
              : "flex flex-col gap-1"
          }
        >
          {shown.map((item) => {
            const { Icon, tone } = iconFor(item);
            const active = selected.includes(item.name);
            const open = () =>
              item.kind === "folder" ? setPath(resolvePath(path, item.name)) : toggle(item);

            if (view === "list") {
              return (
                <div
                  key={`${item.kind}-${item.name}`}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    active
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:bg-background"
                  }`}
                >
                  <button
                    onClick={() => toggle(item)}
                    aria-label={active ? `Unselect ${item.name}` : `Select ${item.name}`}
                    className={`grid size-7 shrink-0 place-items-center rounded-md border text-[10px] ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent"
                    }`}
                  >
                    ✓
                  </button>
                  <button onClick={open} className="flex min-w-0 items-center gap-2 text-left">
                    <Icon className={`size-5 shrink-0 ${tone}`} />
                    <span className="truncate font-mono text-xs text-foreground">{item.name}</span>
                  </button>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {item.kind === "folder" ? "folder" : humanSize(item.size)}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={`${item.kind}-${item.name}`}
                className={`relative rounded-xl border transition-colors ${
                  active ? "border-primary bg-primary/10" : "border-transparent hover:bg-background"
                }`}
              >
                <button
                  onClick={open}
                  className="flex w-full flex-col items-center gap-2 p-3 text-center"
                >
                  <Icon className={`size-9 ${tone}`} />
                  <span className="line-clamp-2 w-full break-words font-mono text-[11px] text-foreground">
                    {item.name}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {item.kind === "folder" ? "folder" : humanSize(item.size)}
                  </span>
                </button>
                <button
                  onClick={() => toggle(item)}
                  aria-label={active ? `Unselect ${item.name}` : `Select ${item.name}`}
                  className={`absolute left-1.5 top-1.5 grid size-7 place-items-center rounded-md border text-[10px] ${
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card/80 text-transparent"
                  }`}
                >
                  ✓
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* selection toolbar */}
      {(selected.length > 0 || clipboard) && (
        <div className="border-t border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
              {clipboard
                ? `${clipboard.items.length} item(s) ready to ${clipboard.mode}${
                    clipboard.from ? ` from ${clipboard.from}` : ""
                  }`
                : `${selected.length} selected`}
            </span>
            <button
              onClick={() => {
                setSelected([]);
                setClipboard(null);
              }}
              className="grid size-8 place-items-center rounded text-muted-foreground hover:text-foreground"
              aria-label="Clear selection"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {clipboard && (
              <ToolButton onClick={() => setPasteOpen(true)} icon={ClipboardPaste} primary>
                Choose target & paste
              </ToolButton>
            )}
            {selected.length > 0 && (
              <>
                <ToolButton onClick={download} icon={Download} disabled={busy}>
                  Download
                </ToolButton>
                <ToolButton onClick={() => setSendOpen(true)} icon={Send} disabled={busy}>
                  Send to device
                </ToolButton>
                <ToolButton onClick={bundle} icon={Package} disabled={busy}>
                  Bundle (.zip)
                </ToolButton>
                <ToolButton
                  onClick={() =>
                    setClipboard({ mode: "copy", items: pickItems, from: source, base: path })
                  }
                  icon={Copy}
                  disabled={busy}
                >
                  Copy
                </ToolButton>
                {isRoom && (
                  <>
                    <ToolButton
                      onClick={() =>
                        guarded("Enter the passcode to rename items in the room.", renameSelected)
                      }
                      icon={PenLine}
                      disabled={busy || selected.length !== 1}
                    >
                      Rename
                    </ToolButton>
                    <ToolButton
                      onClick={() =>
                        guarded("Enter the passcode to move files out of this folder.", () =>
                          setClipboard({ mode: "move", items: pickItems, from: "", base: path }),
                        )
                      }
                      icon={Scissors}
                      disabled={busy}
                    >
                      Move
                    </ToolButton>
                    <ToolButton
                      onClick={() =>
                        guarded("Enter the passcode to delete from the room.", () => void remove())
                      }
                      icon={Trash2}
                      disabled={busy}
                      danger
                    >
                      Delete
                    </ToolButton>
                  </>
                )}
              </>
            )}
          </div>
          {!isRoom && (
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
              Files on {source} can't be deleted or changed from here — copying them out is fine.
            </p>
          )}
        </div>
      )}


      <UploadSheet
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={(files) => void onUpload(files)}
        destination={isRoom ? `${session.roomName} · ${path}` : `${source} · ${path}`}
      />

      <DevicePickerDialog
        open={deviceModal}
        onClose={() => setDeviceModal(false)}
        devices={devices.filter((d) => d.name !== session.deviceName)}
        selected={source}
        onSelect={(name) => {
          setSource(name);
          setPath("/");
        }}
        allowRoom
        roomLabel={`Room — ${session.roomName}`}
      />

      <PasswordDialog
        open={!!lockReason}
        onOpenChange={(v) => !v && setLockReason(null)}
        reason={lockReason ?? ""}
        onUnlocked={() => {
          setLockReason(null);
          pending.current?.();
          pending.current = null;
        }}
      />

      <DestinationDialog
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        session={session}
        devices={devices}
        title={clipboard?.mode === "copy" ? "Copy to…" : "Move to…"}
        description="Pick the room or any device, open the folder, then paste. Missing folders are created for you."
        confirmLabel="Paste here"
        allowDevicePick
        onConfirm={paste}
      />

      <DestinationDialog
        open={sendOpen}
        onOpenChange={setSendOpen}
        session={session}
        devices={devices}
        title="Send to…"
        description="Pick the device and the folder it should land in."
        confirmLabel="Send here"
        allowDevicePick
        onConfirm={sendTo}
      />

      <Dialog open={preview.open} onOpenChange={(v) => !v && setPreview((p) => ({ ...p, open: false }))}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{preview.item?.name ?? "Preview"}</DialogTitle>
            <DialogDescription>
              {preview.item ? `${humanSize(preview.item.size)} · ${isRoom ? "room" : source}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border bg-background p-3">
            {preview.kind === "image" && preview.url && (
              <img src={preview.url} alt={preview.item?.name ?? "preview"} className="mx-auto max-h-full max-w-full" />
            )}
            {preview.kind === "text" && preview.text !== null && (
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-foreground">
                {preview.text}
              </pre>
            )}
            {preview.kind === "pdf" && preview.url && (
              <iframe src={preview.url} title={preview.item?.name ?? "pdf"} className="h-[50vh] w-full" />
            )}
            {preview.kind === "audio" && preview.url && (
              <audio src={preview.url} controls className="w-full" />
            )}
            {preview.kind === "video" && preview.url && (
              <video src={preview.url} controls className="mx-auto max-h-[55vh] w-full rounded-lg bg-black" />
            )}
            {preview.kind === "binary" && (
              <p className="text-center text-sm text-muted-foreground">
                Preview is not available for this file type. Use Download to open it locally.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={treeOpen} onOpenChange={setTreeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Directory tree</DialogTitle>
            <DialogDescription>
              {isRoom ? "Every folder in the room" : `Shared folders on ${source}`}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded-md border border-border bg-background p-2">
            {treeEntries.length === 0 ? (
              <p className="p-2 text-xs text-muted-foreground">No folders</p>
            ) : (
              <TreeView
                entries={treeEntries}
                onOpenPath={(p) => {
                  setPath(p);
                  setTreeOpen(false);
                }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/** Turns a flat {path,dir}[] list into a real collapsible tree, grouped by
 * path segments — the folder/room "tree" view used to just print every full
 * path as a flat, indented list of raw strings. This actually nests. */
function TreeView({ entries, onOpenPath }: { entries: { path: string; dir: boolean }[]; onOpenPath: (p: string) => void }) {
  type Node = { name: string; path: string; dir: boolean; children: Map<string, Node> };
  const root = useMemo(() => {
    const top: Node = { name: "", path: "/", dir: true, children: new Map() };
    for (const e of entries) {
      const parts = e.path.split("/").filter(Boolean);
      let cursor = top;
      let acc = "";
      parts.forEach((part, i) => {
        acc += `/${part}`;
        const isLast = i === parts.length - 1;
        let next = cursor.children.get(part);
        if (!next) {
          next = { name: part, path: acc, dir: isLast ? e.dir : true, children: new Map() };
          cursor.children.set(part, next);
        }
        cursor = next;
      });
    }
    return top;
  }, [entries]);

  return <TreeNode node={root} depth={0} onOpenPath={onOpenPath} />;
}

function TreeNode({
  node,
  depth,
  onOpenPath,
}: {
  node: { name: string; path: string; dir: boolean; children: Map<string, { name: string; path: string; dir: boolean; children: Map<string, unknown> }> };
  depth: number;
  onOpenPath: (p: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const children = Array.from(node.children.values()).sort((a, b) =>
    a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1,
  );

  if (depth === 0) {
    return (
      <div>
        {children.map((c) => (
          // @ts-expect-error — recursive Map-node typing, values are the same shape
          <TreeNode key={c.path} node={c} depth={1} onOpenPath={onOpenPath} />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => (node.dir ? setOpen((o) => !o) : undefined)}
        className="flex w-full items-center gap-1.5 rounded-md py-1 text-left font-mono text-xs hover:bg-cardhover"
        style={{ paddingLeft: `${(depth - 1) * 16 + 4}px` }}
      >
        {node.dir ? (
          <ChevronRight className={`size-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
        ) : (
          <span className="inline-block size-3.5 shrink-0" />
        )}
        {node.dir ? (
          <Folder className="size-3.5 shrink-0 text-primary" />
        ) : (
          <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-foreground">{node.name}</span>
        {node.dir && node.children.size > 0 && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPath(node.path);
            }}
            className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-primary"
          >
            open
          </span>
        )}
      </button>
      {node.dir && open && (
        <div>
          {children.map((c) => (
            // @ts-expect-error — recursive Map-node typing, values are the same shape
            <TreeNode key={c.path} node={c} depth={depth + 1} onOpenPath={onOpenPath} />
          ))}
        </div>
      )}
    </div>
  );
}


function ToolButton({
  onClick,
  icon: Icon,
  children,
  disabled,
  danger,
  primary,
}: {
  onClick: () => void;
  icon: typeof FileIcon;
  children: React.ReactNode;
  disabled?: boolean;
  danger?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 items-center gap-1.5 rounded-md border px-3 text-xs transition-colors disabled:opacity-40 ${
        primary
          ? "border-primary bg-primary text-primary-foreground"
          : danger
            ? "border-destructive/50 text-destructive hover:bg-destructive/10"
            : "border-border text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      <Icon className="size-4" /> {children}
    </button>
  );
}
